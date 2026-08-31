from django.db.models.signals import post_save, pre_save, pre_delete
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from .models import Product
from .utils import delete_image_file
from apps.notifications.utils import send_live_notification

User = get_user_model()

@receiver(pre_delete, sender=Product)
def delete_product_image(sender, instance, **kwargs):
    delete_image_file(instance.image)


@receiver(pre_save, sender=Product)
def product_pre_save(sender, instance, **kwargs):
    if instance.pk:
        try:
            old_obj = Product.objects.get(pk=instance.pk)
            instance._old_submission_deadline = old_obj.submission_deadline
            instance._old_status = old_obj.status
        except Product.DoesNotExist:
            instance._old_submission_deadline = None
            instance._old_status = None
    else:
        instance._old_submission_deadline = None
        instance._old_status = None


@receiver(post_save, sender=Product)
def product_needed_notification(sender, instance, created, **kwargs):
    # Strictly send notifications ONLY when the requirement is OPEN and currently needed!
    if instance.status == 'open' and instance.is_currently_needed:
        farmers = User.objects.filter(role='farmer', is_active=True)
        old_deadline = getattr(instance, '_old_submission_deadline', None)
        deadline_changed = not created and old_deadline != instance.submission_deadline and instance.submission_deadline is not None

        if created:
            title = "New Harvest Demand"
            message = f"Harvest Hill now needs: {instance.name} ({instance.urgency} urgency)."
        elif deadline_changed:
            formatted_date = instance.submission_deadline.strftime('%B %d, %Y') if hasattr(instance.submission_deadline, 'strftime') else str(instance.submission_deadline)
            title = "Harvest Submission Deadline Updated"
            message = f"The submission deadline for Harvest Hill's requirement '{instance.name}' has been updated to {formatted_date}."
        else:
            title = "Harvest Demand Updated"
            message = f"Harvest Hill requirement for '{instance.name}' has been updated."

        for farmer in farmers:
            try:
                send_live_notification(
                    user=farmer,
                    title=title,
                    message=message
                )
            except Exception as e:
                print(f"Failed to trigger signal notification for user {farmer.email}: {e}")
