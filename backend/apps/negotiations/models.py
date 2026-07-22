from django.db import models
from django.conf import settings
from apps.supplies.models import Supply

class NegotiationThread(models.Model):
    supply = models.ForeignKey(Supply, on_delete=models.CASCADE, related_name='negotiation_threads')
    buyer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='buyer_negotiations', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    deleted_by_farmer = models.BooleanField(default=False)
    deleted_by_client = models.BooleanField(default=False)
    status = models.CharField(max_length=20, default='open')

    def __str__(self):
        return f"Thread for Supply: {self.supply.id} - Buyer: {self.buyer.email if self.buyer else 'Admin'}"


class NegotiationOffer(models.Model):
    thread = models.ForeignKey(NegotiationThread, on_delete=models.CASCADE, related_name='offers')
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    message = models.TextField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Offer by {self.sender.email} - ${self.price}"
