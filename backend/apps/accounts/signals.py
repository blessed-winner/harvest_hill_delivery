from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import User, FarmerProfile, ClientProfile, AdminProfile

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        if instance.role == 'admin':
            AdminProfile.objects.get_or_create(user=instance)
        elif instance.role == 'farmer':
            FarmerProfile.objects.get_or_create(user=instance)
        elif instance.role == 'client':
            ClientProfile.objects.get_or_create(user=instance)
