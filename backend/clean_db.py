import os
import sys
import django

# Set up Django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.base')
django.setup()

from django.contrib.auth import get_user_model
from apps.products.models import Product, ProductRequest
from apps.supplies.models import Supply
from apps.negotiations.models import NegotiationThread, NegotiationOffer
from apps.orders.models import Order, OrderItem
from apps.delivery_notes.models import DeliveryNote
from apps.invoices.models import Invoice
from apps.notifications.models import Notification

def clean_database():
    print("Clearing all tables...")
    Notification.objects.all().delete()
    Invoice.objects.all().delete()
    DeliveryNote.objects.all().delete()
    OrderItem.objects.all().delete()
    Order.objects.all().delete()
    NegotiationOffer.objects.all().delete()
    NegotiationThread.objects.all().delete()
    Supply.objects.all().delete()
    ProductRequest.objects.all().delete()
    Product.objects.all().delete()

    User = get_user_model()
    User.objects.all().delete()

    print("Creating admin user...")
    admin_user = User.objects.create_superuser(
        username='admin',
        email='admin@harvesthill.test',
        password='adminpass123',
        role='admin'
    )

    print("Database cleared and admin@harvesthill.test recreated successfully!")

if __name__ == '__main__':
    clean_database()
