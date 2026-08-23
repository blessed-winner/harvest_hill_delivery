import uuid
from django.db import models
from apps.accounts.models import FarmerProfile
from apps.products.models import Product

class Supply(models.Model):
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
        ('invoiced', 'Invoiced')
    ]
    QUALITY_CHOICES = [
        ('premium', 'Premium'),
        ('standard', 'Standard'),
        ('economy', 'Economy')
    ]
    VISIBILITY_CHOICES = [
        ('HARVEST_HILL_ONLY', 'Harvest Hill Delivery Only'),
        ('SPECIFIC_CLIENTS', 'Specific Chosen Clients'),
        ('REGISTERED_CLIENTS', 'All Registered Clients'),
        ('PUBLIC', 'Public Marketplace'),
        # Backward-compatible choice aliases
        ('private_admin', 'Harvest Hill Delivery Only'),
        ('specific_clients', 'Specific Chosen Clients'),
        ('all_clients', 'All Registered Clients'),
        ('public', 'Public Marketplace'),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    farmer = models.ForeignKey(FarmerProfile, on_delete=models.CASCADE, related_name='supplies')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='supplies', null=True, blank=True)
    custom_product_name = models.CharField(max_length=255, blank=True, default='')
    custom_category = models.CharField(max_length=100, blank=True, default='')
    custom_unit = models.CharField(max_length=20, blank=True, default='kg')
    quantity = models.DecimalField(max_digits=10, decimal_places=2) # Submitted harvest quantity (e.g. 40 kg)
    accepted_quantity = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True) # Agreed quantity (e.g. 30 kg)
    price = models.DecimalField(max_digits=10, decimal_places=2) # Farmer's initial proposed price
    agreed_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True) # Agreed price negotiated with Harvest Hill
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    visibility_scope = models.CharField(max_length=30, choices=VISIBILITY_CHOICES, default='HARVEST_HILL_ONLY')
    target_clients = models.ManyToManyField('accounts.ClientProfile', blank=True, related_name='exclusive_supplies')

    def is_visible_to_user(self, user):
        """
        Evaluates strict authorization for a given user instance (or None for unauthenticated guests).
        Enforces status='accepted' and non-archived state for non-admin viewers.
        """
        if self.is_archived:
            return bool(user and user.is_authenticated and getattr(user, 'role', '') == 'admin')

        if user and user.is_authenticated and getattr(user, 'role', '') == 'admin':
            return True

        if user and user.is_authenticated and getattr(user, 'role', '') == 'farmer':
            if hasattr(user, 'farmer_profile') and self.farmer_id == user.farmer_profile.id:
                return True

        # Non-admin and non-owner MUST be accepted
        if self.status != 'accepted':
            return False

        scope = self.visibility_scope

        if scope in ['HARVEST_HILL_ONLY', 'private_admin']:
            return False

        if scope in ['PUBLIC', 'public']:
            return True

        if scope in ['REGISTERED_CLIENTS', 'all_clients']:
            return bool(user and user.is_authenticated and getattr(user, 'role', '') == 'client')

        if scope in ['SPECIFIC_CLIENTS', 'specific_clients']:
            if not user or not user.is_authenticated or getattr(user, 'role', '') != 'client':
                return False
            user_client_profile = getattr(user, 'client_profile', None)
            if user_client_profile and self.target_clients.filter(id=user_client_profile.id).exists():
                return True
            if self.target_clients.filter(user=user).exists():
                return True
            return False

        return False
    is_suggested_product = models.BooleanField(default=False)
    suggested_product_name = models.CharField(max_length=255, blank=True, default='')
    disclose_farmer_name = models.BooleanField(default=False)
    available_date = models.DateField(null=True, blank=True)
    quality_grade = models.CharField(max_length=20, choices=QUALITY_CHOICES, default='standard', blank=True, null=True)
    notes = models.TextField(blank=True, default='')
    photo = models.ImageField(upload_to='supplies/', max_length=500, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_discounted = models.BooleanField(default=False)
    discount_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    bulk_min_qty = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    bulk_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=5.00)
    rating_count = models.IntegerField(default=1)
    supply_number = models.CharField(max_length=30, unique=True, null=True, blank=True, editable=False)
    is_archived = models.BooleanField(default=False)

    def save(self, *args, **kwargs):
        if not self.supply_number:
            from apps.common.utils import generate_next_display_id
            self.supply_number = generate_next_display_id('farmer_supply', 'SUP', 6)
        super().save(*args, **kwargs)

    @property
    def effective_quantity(self):
        """Returns the accepted quantity if agreed upon, otherwise the submitted quantity."""
        if self.accepted_quantity is not None:
            return float(self.accepted_quantity)
        return float(self.quantity)

    @property
    def unit(self):
        """Returns the master product unit or custom unit."""
        if self.product and hasattr(self.product, 'unit'):
            return self.product.unit
        return self.custom_unit or "kg"

    @property
    def submission_type(self):
        """
        Returns 'REQUIREMENT_BASED' if this harvest submission was originally submitted against an existing Product Requirement template.
        Returns 'CUSTOM' if it was submitted independently by the farmer without a requirement template.
        Note: Assigning a MasterProduct upon approval does not retroactively change a CUSTOM submission type.
        """
        if self.custom_product_name or self.is_suggested_product or self.suggested_product_name or not self.product_id:
            return 'CUSTOM'
        return 'REQUIREMENT_BASED'

    @property
    def negotiation_status(self):
        """
        Derives the explicit negotiation state of this harvest submission:
        - 'FINALIZED': An offer in negotiation thread has offer_status == 'ACCEPTED' or thread status is 'accepted'.
        - 'IN_PROGRESS': An active negotiation thread with pending/countered offers exists.
        - 'DECLINED': Thread status is 'DECLINED'.
        - 'NO_NEGOTIATION': No negotiation thread exists or thread is bypassed.
        """
        thread = self.negotiation_threads.all().order_by('created_at').last()
        if not thread or thread.status in ['bypassed', 'BYPASSED']:
            return 'NO_NEGOTIATION'
        if thread.status == 'accepted' or thread.offers.filter(offer_status='ACCEPTED').exists():
            return 'FINALIZED'
        if thread.status == 'DECLINED':
            return 'DECLINED'
        if thread.offers.exists():
            return 'IN_PROGRESS'
        return 'NO_NEGOTIATION'

    def __str__(self):
        name = self.product.name if self.product else (self.suggested_product_name or self.custom_product_name)
        return f"{self.supply_number or self.id} - {name} - {self.effective_quantity} ({self.status})"


class SupplyImage(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    supply = models.ForeignKey(Supply, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='supplies/')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Image for Supply: {self.supply.id}"

