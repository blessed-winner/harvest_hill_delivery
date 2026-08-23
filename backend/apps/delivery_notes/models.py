import uuid
from django.db import models
from apps.orders.models import Order
from apps.supplies.models import Supply

class DeliveryNote(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('discrepancy', 'Discrepancy')
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    display_id = models.CharField(max_length=30, unique=True, null=True, blank=True, editable=False)
    order = models.ForeignKey(Order, on_delete=models.CASCADE, null=True, blank=True, related_name='delivery_notes')
    supply = models.ForeignKey(Supply, on_delete=models.CASCADE, null=True, blank=True, related_name='delivery_notes')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    details = models.TextField()
    signed_by = models.CharField(max_length=255, blank=True, null=True)
    signature_data = models.TextField(blank=True, null=True)
    dispute_reason = models.TextField(blank=True, null=True)
    is_archived = models.BooleanField(default=False)
    is_deleted_by_client = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.display_id:
            from apps.common.utils import generate_next_display_id
            self.display_id = generate_next_display_id('delivery_note', 'DLV', 6)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Delivery Note {self.display_id or self.id} ({self.status})"
