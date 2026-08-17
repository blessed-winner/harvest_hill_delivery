from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.accounts.models import AdminProfile
from apps.products.models import Product, ProductRequest
from apps.supplies.models import Supply
from apps.orders.models import Order
from apps.delivery_notes.models import DeliveryNote
from apps.invoices.models import Invoice
from apps.negotiations.models import NegotiationThread, NegotiationOffer
from apps.notifications.models import Notification
from apps.common.models import AuditLog

class Command(BaseCommand):
    help = 'Wipes all database records cleanly except the master admin superuser.'

    def handle(self, *args, **options):
        self.stdout.write("Wiping all database records...")
        DeliveryNote.objects.all().delete()
        Invoice.objects.all().delete()
        NegotiationOffer.objects.all().delete()
        NegotiationThread.objects.all().delete()
        Order.objects.all().delete()
        Supply.objects.all().delete()
        ProductRequest.objects.all().delete()
        Product.objects.all().delete()
        Notification.objects.all().delete()
        AuditLog.objects.all().delete()

        User = get_user_model()
        User.objects.all().delete()

        admin_user = User.objects.create_superuser(
            username='admin',
            email='admin@harvesthill.test',
            password='adminpass123',
            role='admin',
            first_name='Harvest Hill',
            last_name='Admin'
        )
        AdminProfile.objects.get_or_create(
            user=admin_user,
            defaults={'department': 'Operations'}
        )
        self.stdout.write(self.style.SUCCESS("Database wiped clean! Only Master Admin exists: admin@harvesthill.test (Password: adminpass123)"))
