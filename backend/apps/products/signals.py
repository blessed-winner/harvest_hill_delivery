from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from .models import Product
from apps.notifications.utils import send_live_notification

User = get_user_model()

@receiver(post_save, sender=Product)
def product_needed_notification(sender, instance, created, **kwargs):
    if instance.is_currently_needed:
        # Send notification to all active farmers
        farmers = User.objects.filter(role='farmer', is_active=True)
        for farmer in farmers:
            try:
                send_live_notification(
                    user=farmer,
                    title="New Harvest Demand",
                    message=f"Harvest Hill now needs: {instance.name} ({instance.urgency} urgency)."
                )
            except Exception as e:
                print(f"Failed to trigger signal notification for user {farmer.email}: {e}")
