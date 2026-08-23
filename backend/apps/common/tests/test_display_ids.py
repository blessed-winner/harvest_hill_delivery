import concurrent.futures
from django.db import connection, connections
from django.test import TransactionTestCase
from django.contrib.auth import get_user_model
from apps.products.models import Product
from apps.supplies.models import Supply
from apps.orders.models import Order
from apps.accounts.models import FarmerProfile, ClientProfile

User = get_user_model()

class PermanentDisplayIDTestCase(TransactionTestCase):
    reset_sequences = True

    def setUp(self):
        # Create test users (signals automatically create profiles)
        self.farmer_user = User.objects.create_user(username='farmer_test_1', email='farmer_test_1@test.com', password='password', role='farmer')
        self.farmer_profile, _ = FarmerProfile.objects.get_or_create(user=self.farmer_user, defaults={'farm_name': 'Test Farm'})

        self.client_user = User.objects.create_user(username='client_test_1', email='client_test_1@test.com', password='password', role='client')
        self.client_profile, _ = ClientProfile.objects.get_or_create(user=self.client_user, defaults={'business_name': 'Test Client'})

    def test_master_product_sequence_and_gaps(self):
        # 1. Create first MasterProduct -> MST-000001
        p1 = Product.objects.create(name='Tomato', category='Vegetables', base_price=100)
        self.assertEqual(p1.display_id, 'MST-000001')

        # 2. Create second MasterProduct -> MST-000002
        p2 = Product.objects.create(name='Potato', category='Vegetables', base_price=150)
        self.assertEqual(p2.display_id, 'MST-000002')

        # 3. Archive MST-000001 -> next is MST-000003
        p1.status = 'archived'
        p1.save()
        p3 = Product.objects.create(name='Onion', category='Vegetables', base_price=200)
        self.assertEqual(p3.display_id, 'MST-000003')

        # 4. Permanent delete p2 (MST-000002) -> next skips 000002 and produces MST-000004
        p2.delete()
        p4 = Product.objects.create(name='Garlic', category='Vegetables', base_price=250)
        self.assertEqual(p4.display_id, 'MST-000004')

        # Restore archived p1 -> retains original MST-000001
        p1.status = 'open'
        p1.save()
        self.assertEqual(p1.display_id, 'MST-000001')

    def test_independent_supply_and_order_sequences(self):
        # Create supplies independently -> SUP-000001, SUP-000002
        s1 = Supply.objects.create(farmer=self.farmer_profile, custom_product_name='Cabbage', quantity=50, price=500)
        s2 = Supply.objects.create(farmer=self.farmer_profile, custom_product_name='Carrot', quantity=30, price=600)
        self.assertEqual(s1.supply_number, 'SUP-000001')
        self.assertEqual(s2.supply_number, 'SUP-000002')

        # Permanent delete s1 -> next supply must be SUP-000003 (never reuses SUP-000001)
        s1.delete()
        s3 = Supply.objects.create(farmer=self.farmer_profile, custom_product_name='Beetroot', quantity=20, price=700)
        self.assertEqual(s3.supply_number, 'SUP-000003')

        # Create orders independently -> ORD-000001, ORD-000002
        o1 = Order.objects.create(client=self.client_profile, delivery_address='Kigali 1')
        o2 = Order.objects.create(client=self.client_profile, delivery_address='Kigali 2')
        self.assertEqual(o1.order_number, 'ORD-000001')
        self.assertEqual(o2.order_number, 'ORD-000002')

        # Permanent delete o1 -> next order must be ORD-000003
        o1.delete()
        o3 = Order.objects.create(client=self.client_profile, delivery_address='Kigali 3')
        self.assertEqual(o3.order_number, 'ORD-000003')

    def test_concurrent_creation_safety(self):
        def create_product(i):
            try:
                prod = Product.objects.create(name=f'Crop {i}', category='Vegetables', base_price=10)
                return prod.display_id
            finally:
                connections.close_all()

        with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
            futures = [executor.submit(create_product, i) for i in range(10)]
            results = [f.result() for f in futures]

        # Verify all 10 display IDs are unique and unique count equals 10
        self.assertEqual(len(results), 10)
        self.assertEqual(len(set(results)), 10)

        # Check that numbers generated are 1..10
        issued_nums = sorted([int(r.replace('MST-', '')) for r in results])
        self.assertEqual(issued_nums, list(range(1, 11)))
