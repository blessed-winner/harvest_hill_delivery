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
        ('private_admin', 'Harvest Hill Delivery Only'),
        ('specific_clients', 'Specific Chosen Clients'),
        ('all_clients', 'All Registered Clients'),
        ('public', 'Public (All Visitors)'),
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
    visibility_scope = models.CharField(max_length=30, choices=VISIBILITY_CHOICES, default='private_admin')
    target_clients = models.ManyToManyField('accounts.ClientProfile', blank=True, related_name='exclusive_supplies')
    is_suggested_product = models.BooleanField(default=False)
    suggested_product_name = models.CharField(max_length=255, blank=True, default='')
    disclose_farmer_name = models.BooleanField(default=False)
    available_date = models.DateField(null=True, blank=True)
    quality_grade = models.CharField(max_length=20, choices=QUALITY_CHOICES, default='standard')
    notes = models.TextField(blank=True, default='')
    photo = models.ImageField(upload_to='supplies/', max_length=500, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_discounted = models.BooleanField(default=False)
    discount_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    bulk_min_qty = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    bulk_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=5.00)
    rating_count = models.IntegerField(default=1)
    is_archived = models.BooleanField(default=False)

    @property
    def effective_quantity(self):
        """Returns the accepted quantity if agreed upon, otherwise the submitted quantity."""
        if self.accepted_quantity is not None:
            return float(self.accepted_quantity)
        return float(self.quantity)

    def __str__(self):
        name = self.product.name if self.product else (self.suggested_product_name or self.custom_product_name)
        return f"{name} - {self.effective_quantity} ({self.status})"


class SupplyImage(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    supply = models.ForeignKey(Supply, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='supplies/')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Image for Supply: {self.supply.id}"

