import uuid
from django.db import models
from django.conf import settings
from apps.supplies.models import Supply

class NegotiationThread(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    supply = models.ForeignKey(Supply, on_delete=models.CASCADE, related_name='negotiation_threads')
    buyer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='buyer_negotiations', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    deleted_by_farmer = models.BooleanField(default=False)
    deleted_by_client = models.BooleanField(default=False)
    status = models.CharField(max_length=20, default='open')

    def __str__(self):
        return f"Thread for Supply: {self.supply.id} - Buyer: {self.buyer.email if self.buyer else 'Admin'}"


class NegotiationOffer(models.Model):
    OFFER_STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('ACCEPTED', 'Accepted'),
        ('DECLINED', 'Declined'),
        ('COUNTERED', 'Countered'),
        ('WITHDRAWN', 'Withdrawn'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    thread = models.ForeignKey(NegotiationThread, on_delete=models.CASCADE, related_name='offers')
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0.0)
    quantity = models.DecimalField(max_digits=10, decimal_places=2, default=0.0)
    message = models.TextField(blank=True)
    terms = models.TextField(blank=True)
    is_offer = models.BooleanField(default=True)
    offer_status = models.CharField(max_length=20, choices=OFFER_STATUS_CHOICES, default='PENDING')
    parent_offer = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='child_counter_offers')
    timestamp = models.DateTimeField(auto_now_add=True)
    deleted_by_farmer = models.BooleanField(default=False)
    deleted_by_admin = models.BooleanField(default=False)
    deleted_by_client = models.BooleanField(default=False)

    def __str__(self):
        return f"Offer by {self.sender.email} - ${self.price}"
