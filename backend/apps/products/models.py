import uuid
from django.db import models

class Product(models.Model):
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('open', 'Open'),
        ('closed', 'Closed'),
        ('archived', 'Archived'),
    ]

    PRICING_MODE_CHOICES = [
        ('harvest_hill_offers', 'Harvest Hill Offers'),
        ('farmer_proposes', 'Farmer Proposes'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    display_id = models.CharField(max_length=30, unique=True, null=True, blank=True, editable=False)
    name = models.CharField(max_length=255)
    category = models.CharField(max_length=100) # e.g. Fruits, Vegetables, Grains, Animal-Based
    description = models.TextField(blank=True, default='')
    is_currently_needed = models.BooleanField(default=False)
    urgency = models.CharField(max_length=20, default='low') # low, medium, high
    unit = models.CharField(max_length=10, default='kg')
    pricing_mode = models.CharField(max_length=30, choices=PRICING_MODE_CHOICES, default='harvest_hill_offers')
    offered_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    base_price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    image = models.ImageField(upload_to='products/', max_length=500, null=True, blank=True)
    quantity_needed = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    is_discounted = models.BooleanField(default=False)
    discount_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)

    # Product Template / Requirement specific fields
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='open')
    quality_requirements = models.TextField(blank=True, default='')
    submission_deadline = models.DateField(null=True, blank=True)
    preferred_harvest_period = models.CharField(max_length=255, blank=True, default='')

    def check_and_update_status(self):
        from django.utils import timezone
        if self.status == 'open' and self.submission_deadline and self.submission_deadline < timezone.now().date():
            self.status = 'closed'
            self.save(update_fields=['status'])
        return self.status

    def save(self, *args, **kwargs):
        if not self.display_id:
            existing_count = Product.objects.count() + 1
            num_str = f"{existing_count:06d}"
            self.display_id = f"MST-{num_str}"
            while Product.objects.filter(display_id=self.display_id).exclude(pk=self.pk).exists():
                existing_count += 1
                num_str = f"{existing_count:06d}"
                self.display_id = f"MST-{num_str}"

        if self.pricing_mode == 'harvest_hill_offers':
            if self.offered_price is not None:
                self.base_price = self.offered_price
        elif self.pricing_mode == 'farmer_proposes':
            self.offered_price = None
            self.base_price = 0.00
        super().save(*args, **kwargs)

    @property
    def total_available_quantity(self):
        """Calculates total aggregated quantity ONLY from accepted active farmer supplies."""
        accepted_supplies = self.supplies.filter(is_archived=False, status='accepted')
        total = 0.0
        for s in accepted_supplies:
            if s.accepted_quantity is not None:
                total += float(s.accepted_quantity)
            else:
                total += float(s.quantity)
        return total

    def get_available_quantity_for_user(self, user=None):
        """Calculates available quantity filtered strictly by user authorization and visibility scope."""
        accepted_supplies = self.supplies.filter(is_archived=False, status='accepted')
        total = 0.0
        for s in accepted_supplies:
            if s.is_visible_to_user(user):
                if s.accepted_quantity is not None:
                    total += float(s.accepted_quantity)
                else:
                    total += float(s.quantity)
        return total

    @property
    def supplier_count(self):
        """Calculates count of distinct farmers providing accepted active supplies."""
        return self.supplies.filter(is_archived=False, status='accepted').values('farmer').distinct().count()

    @property
    def effective_price(self):
        """Returns discount_price if is_discounted and valid, else normal price/base_price."""
        if self.is_discounted and self.discount_price and float(self.discount_price) > 0:
            return float(self.discount_price)
        return float(self.price)

    @property
    def price(self):
        """Returns offered_price if pricing_mode is harvest_hill_offers, or falls back to latest accepted supply price."""
        if self.pricing_mode == 'harvest_hill_offers' and self.offered_price and float(self.offered_price) > 0:
            return float(self.offered_price)
        if self.base_price and float(self.base_price) > 0:
            return float(self.base_price)
        latest_supply = self.supplies.filter(is_archived=False, status='accepted').order_by('-created_at').first()
        if latest_supply:
            if latest_supply.agreed_price and float(latest_supply.agreed_price) > 0:
                return float(latest_supply.agreed_price)
            if latest_supply.price and float(latest_supply.price) > 0:
                return float(latest_supply.price)
        return 0.0

    @property
    def sourcing_history_count(self):
        return self.supplies.exclude(status='rejected').count()

    def __str__(self):
        return self.name


class ProductRequest(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('fulfilled', 'Fulfilled'),
        ('rejected', 'Rejected'),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    client = models.ForeignKey('accounts.ClientProfile', on_delete=models.CASCADE, related_name='product_requests')
    product_name = models.CharField(max_length=255)
    category = models.CharField(max_length=100, blank=True, default='')
    quantity_needed = models.DecimalField(max_digits=10, decimal_places=2)
    unit = models.CharField(max_length=20, default='kg')
    preferred_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    notes = models.TextField(blank=True, default='')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    linked_product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        return f"{self.product_name} - {self.status}"

