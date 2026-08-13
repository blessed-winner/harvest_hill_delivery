from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.accounts.models import AdminProfile

class Command(BaseCommand):
    help = 'Seeds the primary admin user and clears non-admin users.'

    def handle(self, *args, **options):
        User = get_user_model()
        User.objects.all().delete()
        self.stdout.write(self.style.SUCCESS("Cleared all existing user accounts."))

        admin_user = User.objects.create_superuser(
            username='admin',
            email='admin@harvesthill.rw',
            password='AdminPass123!',
            role='admin'
        )
        AdminProfile.objects.get_or_create(
            user=admin_user,
            defaults={'department': 'Operations'}
        )

        self.stdout.write(self.style.SUCCESS(f"Successfully seeded admin user: {admin_user.email} (ID: {admin_user.id})"))
