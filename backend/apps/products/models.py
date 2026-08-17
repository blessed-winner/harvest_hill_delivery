import uuid
from django.db import models

class Product(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    category = models.CharField(max_length=100) # e.g. Fruits, Vegetables, Grains, Animal-Based
    description = models.TextField(blank=True, default='')
    is_currently_needed = models.BooleanField(default=False)
    urgency = models.CharField(max_length=20, default='low') # low, medium, high
    unit = models.CharField(max_length=10, default='kg')
    base_price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    image = models.ImageField(upload_to='products/', max_length=500, null=True, blank=True)
    quantity_needed = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    is_discounted = models.BooleanField(default=False)
    discount_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)

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

    @property
    def price(self):
        """Returns active master base_price if > 0, or falls back to latest accepted supply price."""
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

