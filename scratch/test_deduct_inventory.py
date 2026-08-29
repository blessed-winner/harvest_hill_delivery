import os
import sys
import django

sys.path.insert(0, os.path.abspath('backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.base')
django.setup()

from apps.products.models import Product
from apps.supplies.models import Supply
from apps.orders.models import Order, OrderItem
from apps.orders.serializers import deduct_inventory_for_order

print("=== TESTING INVENTORY DEDUCTION ===")
products = Product.objects.all()
print(f"Total Products in DB: {products.count()}")
for p in products:
    print(f"Product: {p.id} | Name: {p.name} | Price: {p.price} | Quantity Needed: {p.quantity_needed} | Total Available: {p.total_available_quantity}")
    supplies = Supply.objects.filter(product=p, is_archived=False)
    print(f"   Supplies linked: {supplies.count()}")
    for s in supplies:
        print(f"      Supply {s.id}: Qty={s.quantity}, Status={s.status}")

supplies_no_prod = Supply.objects.filter(product__isnull=True, is_archived=False)
print(f"\nTotal Supplies without linked Product: {supplies_no_prod.count()}")
for s in supplies_no_prod:
    print(f"   Custom Supply {s.id}: Name={s.custom_product_name}, Qty={s.quantity}, Status={s.status}")
