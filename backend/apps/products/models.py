import uuid
from django.db import models
from django.utils import timezone

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
    archived_at = models.DateTimeField(null=True, blank=True)
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
            if (not self.base_price or float(self.base_price) <= 0) and self.offered_price is not None and float(self.offered_price) > 0:
                self.base_price = self.offered_price
        elif self.pricing_mode == 'farmer_proposes':
            self.offered_price = None
            if not self.base_price or float(self.base_price) <= 0:
                if self.pk:
                    latest_supply = self.supplies.filter(is_archived=False).exclude(status='rejected').order_by('-created_at').first()
                    if latest_supply and (latest_supply.agreed_price or latest_supply.price):
                        self.base_price = latest_supply.agreed_price or latest_supply.price

        if not self.image and self.pk:
            admin_supply = self.supplies.filter(
                farmer__user__role='admin'
            ).exclude(photo='').exclude(photo__isnull=True).first()
            if admin_supply and admin_supply.photo:
                self.image = admin_supply.photo

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

        if self.status == 'archived':
            return False

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

    def sync_deal_statuses(self):
        """Automatically updates EXPIRED deals whose ends_at date/time has passed."""
        from django.utils import timezone
        now = timezone.now()
        active_deals = self.fresh_deals.filter(status='ACTIVE')
        for deal in active_deals:
            if deal.ends_at and deal.ends_at < now:
                deal.status = 'EXPIRED'
                deal.save(update_fields=['status'])

    @property
    def active_deal(self):
        """Returns currently active valid FreshDeal for this MasterProduct, if any."""
        self.sync_deal_statuses()
        deal = self.fresh_deals.filter(status='ACTIVE').order_by('-created_at').first()
        if deal and deal.is_currently_valid():
            return deal
        return None

    @property
    def has_active_discount(self):
        deal = self.active_deal
        if deal:
            return True
        base = float(self.price)
        if self.is_discounted and self.discount_price and float(self.discount_price) > 0 and float(self.discount_price) < base:
            return True
        disc_supply = self.supplies.filter(is_archived=False, status='accepted', is_discounted=True, discount_price__gt=0).first()
        if disc_supply and float(disc_supply.discount_price) < base:
            return True
        return False

    @property
    def effective_price(self):
        """Calculates current client price from MasterProduct base price + active FreshDeal or underlying supply discount."""
        base = float(self.price)
        deal = self.active_deal
        if deal:
            val = float(deal.discount_value)
            if deal.discount_type == 'PERCENTAGE':
                discounted = base * (1.0 - (val / 100.0))
            else:
                discounted = base - val
            return max(0.0, float(discounted))
        
        # Fallback to legacy is_discounted if set on MasterProduct
        if self.is_discounted and self.discount_price and float(self.discount_price) > 0 and float(self.discount_price) < base:
            return float(self.discount_price)

        # Fallback to underlying accepted supply discount if set
        disc_supply = self.supplies.filter(is_archived=False, status='accepted', is_discounted=True, discount_price__gt=0).first()
        if disc_supply and float(disc_supply.discount_price) < base:
            return float(disc_supply.discount_price)

        return base

    @property
    def discount_percentage(self):
        """Calculates actual discount percentage from MasterProduct original selling price and effective price."""
        orig = float(self.price)
        eff = float(self.effective_price)
        if orig <= 0 or eff >= orig:
            return 0.0
        pct = ((orig - eff) / orig) * 100.0
        return round(pct, 1) if (pct * 10) % 10 != 0 else round(pct)

    @property
    def price(self):
        """Returns official Harvest Hill Master Product selling price (from base_price, admin harvest submission, or offered_price)."""
        if self.base_price and float(self.base_price) > 0:
            return float(self.base_price)
        
        # Check if an Admin (Harvest Hill) harvest submission exists with a set price
        admin_supply = self.supplies.filter(
            farmer__user__role='admin',
            is_archived=False
        ).exclude(status='rejected').order_by('-created_at').first()
        if admin_supply:
            if admin_supply.agreed_price and float(admin_supply.agreed_price) > 0:
                return float(admin_supply.agreed_price)
            if admin_supply.price and float(admin_supply.price) > 0:
                return float(admin_supply.price)

        if self.offered_price and float(self.offered_price) > 0:
            return float(self.offered_price)

        return 0.0

    @property
    def sourcing_history_count(self):
        return self.supplies.exclude(status='rejected').count()

    def __str__(self):
        return self.name


class ProductImage(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='gallery_images')
    image = models.ImageField(upload_to='products/gallery/', max_length=500)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Gallery image for {self.product.name}"


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


class FreshDeal(models.Model):
    DISCOUNT_TYPE_CHOICES = [
        ('FIXED', 'Fixed Amount Off'),
        ('PERCENTAGE', 'Percentage Off'),
    ]
    STATUS_CHOICES = [
        ('ACTIVE', 'Active'),
        ('EXPIRED', 'Expired'),
        ('ABORTED', 'Aborted'),
        ('ARCHIVED', 'Archived'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    master_product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='fresh_deals')
    discount_type = models.CharField(max_length=20, choices=DISCOUNT_TYPE_CHOICES, default='FIXED')
    discount_value = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ACTIVE')
    starts_at = models.DateTimeField(default=timezone.now)
    ends_at = models.DateTimeField(null=True, blank=True)
    archived_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def is_currently_valid(self):
        now = timezone.now()
        if self.status != 'ACTIVE':
            return False
        if self.starts_at and self.starts_at > now:
            return False
        if self.ends_at and self.ends_at < now:
            self.status = 'EXPIRED'
            self.save(update_fields=['status'])
            return False
        return True

    def __str__(self):
        return f"{self.master_product.name} - {self.discount_type} {self.discount_value} ({self.status})"

