from django.db.models.signals import post_save, pre_delete
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from .models import Product
from .utils import delete_cloudinary_image
from apps.notifications.utils import send_live_notification

User = get_user_model()

@receiver(pre_delete, sender=Product)
def delete_product_image(sender, instance, **kwargs):
    delete_cloudinary_image(instance.image)


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
