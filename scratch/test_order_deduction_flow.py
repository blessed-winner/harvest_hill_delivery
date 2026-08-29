import os
import sys
import django

sys.path.insert(0, os.path.abspath('backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.base')
django.setup()

from apps.products.models import Product
from apps.supplies.models import Supply
from apps.orders.models import Order, OrderItem
from apps.accounts.models import ClientProfile
from apps.orders.serializers import deduct_inventory_for_order

print("=== VERIFYING END-TO-END STOCK DEDUCTION ===")
gala_apple = Product.objects.filter(name__icontains='Red Gala Apples').first()
client = ClientProfile.objects.first()

if gala_apple and client:
    print(f"Product: {gala_apple.name}")
    print(f"Initial available stock for user: {gala_apple.get_available_quantity_for_user()}")
    
    # Create test order for 10 kg
    order = Order.objects.create(
        client=client,
        delivery_address="Test Address | Delivery: 8:00 AM"
    )
    OrderItem.objects.create(order=order, product=gala_apple, quantity=10.0, price=1500.0)
    
    # Run deduction
    deduct_inventory_for_order(order)
    
    gala_apple.refresh_from_db()
    print(f"Stock after ordering 10 kg: {gala_apple.get_available_quantity_for_user()}")
    
    # Cancel test order to restore stock
    from apps.orders.serializers import OrderSerializer
    serializer = OrderSerializer(order, data={'status': 'cancelled'}, partial=True)
    if serializer.is_valid():
        serializer.save()
    
    gala_apple.refresh_from_db()
    print(f"Stock after cancelling test order: {gala_apple.get_available_quantity_for_user()}")
    order.delete()
