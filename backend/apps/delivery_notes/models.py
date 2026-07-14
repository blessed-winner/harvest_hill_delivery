from django.db import models
from apps.orders.models import Order
from apps.supplies.models import Supply

class DeliveryNote(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('discrepancy', 'Discrepancy')
    ]
    order = models.ForeignKey(Order, on_delete=models.CASCADE, null=True, blank=True, related_name='delivery_notes')
    supply = models.ForeignKey(Supply, on_delete=models.CASCADE, null=True, blank=True, related_name='delivery_notes')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    details = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Delivery Note #{self.id} ({self.status})"
