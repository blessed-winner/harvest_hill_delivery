import os
import sys
import django

# Setup Django environment
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.base')
django.setup()

from apps.negotiations.models import NegotiationThread, NegotiationOffer
from apps.supplies.models import Supply
from apps.products.models import Product
from apps.orders.models import Order
from apps.invoices.models import Invoice

def clear_all():
    try:
        print("Clearing offers...")
        NegotiationOffer.objects.all().delete()
        print("Clearing threads...")
        NegotiationThread.objects.all().delete()
        print("Clearing supplies...")
        Supply.objects.all().delete()
        print("Clearing products...")
        Product.objects.all().delete()
        print("Clearing orders...")
        Order.objects.all().delete()
        print("Clearing invoices...")
        Invoice.objects.all().delete()
        print("All seed data cleared successfully!")
    except Exception as e:
        print("Error during clear:", e)

if __name__ == '__main__':
    clear_all()
