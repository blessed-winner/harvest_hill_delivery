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

    VISIBILITY_CHOICES = [
        ('HARVEST_HILL_ONLY', 'Harvest Hill Delivery Only'),
        ('SPECIFIC_CLIENTS', 'Specific Chosen Clients'),
        ('REGISTERED_CLIENTS', 'All Registered Clients'),
        ('PUBLIC', 'Public Marketplace'),
        ('private_admin', 'Harvest Hill Delivery Only'),
        ('specific_clients', 'Specific Chosen Clients'),
        ('all_clients', 'All Registered Clients'),
        ('public', 'Public Marketplace'),
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
    visibility_scope = models.CharField(max_length=30, choices=VISIBILITY_CHOICES, default='PUBLIC')
    target_clients = models.ManyToManyField('accounts.ClientProfile', blank=True, related_name='exclusive_products')
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

    def is_visible_to_user(self, user=None):
        """Returns True if the MasterProduct itself is visible to the given user."""
        scope = self.visibility_scope

        # Admin retains access to all MasterProducts
        if user and hasattr(user, 'is_authenticated') and user.is_authenticated and getattr(user, 'role', '') == 'admin':
            return True

        if scope in ['HARVEST_HILL_ONLY', 'private_admin']:
            return False

        if scope in ['PUBLIC', 'public']:
            return True

        if scope in ['REGISTERED_CLIENTS', 'all_clients']:
            return bool(user and hasattr(user, 'is_authenticated') and user.is_authenticated)

        if scope in ['SPECIFIC_CLIENTS', 'specific_clients']:
            if not user or not hasattr(user, 'is_authenticated') or not user.is_authenticated:
                return False
            user_client_profile = getattr(user, 'client_profile', None)
            is_in_users = self.target_clients.filter(user=user).exists()
            is_in_profiles = self.target_clients.filter(pk=user_client_profile.pk).exists() if user_client_profile else False
            return is_in_users or is_in_profiles

        return False

    def get_available_quantity_for_user(self, user=None):
        """Calculates available quantity filtered strictly by user authorization and double-lock visibility."""
        if not self.is_visible_to_user(user):
            return 0.0

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
        if self.is_discounted and self.discount_price and float(self.discount_price) > 0 and float(self.discount_price) < self.price:
            return float(self.discount_price)
        return float(self.price)

    @property
    def discount_percentage(self):
        """Calculates actual discount percentage from Master Product original selling price and active discount price."""
        if not self.is_discounted or not self.discount_price:
            return 0.0
        orig = float(self.price)
        disc = float(self.discount_price)
        if orig <= 0 or disc >= orig:
            return 0.0
        pct = ((orig - disc) / orig) * 100.0
        return round(pct, 1) if (pct * 10) % 10 != 0 else round(pct)

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

