from django.db import models
from apps.orders.models import Order
from apps.supplies.models import Supply

class Invoice(models.Model):
    STATUS_CHOICES = [
        ('paid', 'Paid'),
        ('pending', 'Pending')
    ]
    SYNC_STATUS_CHOICES = [
        ('synced', 'Synced'),
        ('failed', 'Failed')
    ]
    order = models.ForeignKey(Order, on_delete=models.CASCADE, null=True, blank=True, related_name='invoices')
    supply = models.ForeignKey(Supply, on_delete=models.CASCADE, null=True, blank=True, related_name='invoices')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    sync_status = models.CharField(max_length=20, choices=SYNC_STATUS_CHOICES, default='synced')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Invoice #{self.id} - ${self.amount} ({self.status})"
