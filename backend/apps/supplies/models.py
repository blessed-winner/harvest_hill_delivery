from django.db import models
from apps.accounts.models import FarmerProfile
from apps.products.models import Product

class Supply(models.Model):
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('pending', 'Pending'),
        ('negotiating', 'Negotiating'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
        ('delivered', 'Delivered'),
        ('invoiced', 'Invoiced')
    ]
    farmer = models.ForeignKey(FarmerProfile, on_delete=models.CASCADE, related_name='supplies')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='supplies')
    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.product.name} - {self.quantity} ({self.status})"
