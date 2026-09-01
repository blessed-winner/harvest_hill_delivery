from django.test import TestCase
from rest_framework.exceptions import ValidationError
from apps.accounts.models import User, FarmerProfile, ClientProfile
from apps.products.models import Product
from apps.supplies.models import Supply
from apps.orders.models import Order
from apps.orders.serializers import OrderSerializer, deduct_inventory_for_order

class InventoryDeductionTestCase(TestCase):
    def setUp(self):
        # Create test users
        self.farmer_user = User.objects.create_user(
            username='farmer_test',
            email='farmer_test@harvesthill.test',
            password='Password123!',
            role='farmer'
        )
        self.farmer, _ = FarmerProfile.objects.get_or_create(
            user=self.farmer_user,
            defaults={'farm_name': 'Test Farm', 'phone': '+250788000111'}
        )
        
        self.client_user = User.objects.create_user(
            username='client_test',
            email='client_test@harvesthill.test',
            password='Password123!',
            role='client'
        )
        self.client, _ = ClientProfile.objects.get_or_create(
            user=self.client_user,
            defaults={'business_name': 'Test Buyer', 'phone': '+250788000222'}
        )
        
        self.product = Product.objects.create(
            name='Test Hass Avocados',
            category='Fruits',
            unit='kg',
            base_price=1500,
            quantity_needed=300
        )

    def test_scenario_1_order_exact_total_accepted_stock(self):
        """TEST 1: 95 raw / 75 accepted + 105 raw / 75 accepted -> Order 150 -> A acc=0, B acc=0, Product available=0."""
        supply_a = Supply.objects.create(
            farmer=self.farmer,
            product=self.product,
            quantity=95,
            accepted_quantity=75,
            price=1000,
            agreed_price=1000,
            status='accepted'
        )
        supply_b = Supply.objects.create(
            farmer=self.farmer,
            product=self.product,
            quantity=105,
            accepted_quantity=75,
            price=1000,
            agreed_price=1000,
            status='accepted'
        )

        self.assertEqual(self.product.total_available_quantity, 150.0)

        # Place order for 150 kg
        order = Order.objects.create(
            client=self.client,
            delivery_address='Test Address'
        )
        order.items.create(product=self.product, quantity=150, price=1500)
        deduct_inventory_for_order(order)

        supply_a.refresh_from_db()
        supply_b.refresh_from_db()
        self.product.refresh_from_db()

        self.assertEqual(float(supply_a.accepted_quantity), 0.0)
        self.assertEqual(float(supply_b.accepted_quantity), 0.0)
        self.assertEqual(self.product.total_available_quantity, 0.0)
        # Raw quantities must remain completely untouched
        self.assertEqual(float(supply_a.quantity), 95.0)
        self.assertEqual(float(supply_b.quantity), 105.0)

    def test_scenario_2_partial_order_deduction(self):
        """TEST 2: 95 raw / 75 accepted + 105 raw / 75 accepted -> Order 100 -> A acc=0, B acc=50, Product available=50."""
        supply_a = Supply.objects.create(
            farmer=self.farmer,
            product=self.product,
            quantity=95,
            accepted_quantity=75,
            price=1000,
            agreed_price=1000,
            status='accepted'
        )
        supply_b = Supply.objects.create(
            farmer=self.farmer,
            product=self.product,
            quantity=105,
            accepted_quantity=75,
            price=1000,
            agreed_price=1000,
            status='accepted'
        )

        order = Order.objects.create(
            client=self.client,
            delivery_address='Test Address'
        )
        order.items.create(product=self.product, quantity=100, price=1500)
        deduct_inventory_for_order(order)

        supply_a.refresh_from_db()
        supply_b.refresh_from_db()
        self.product.refresh_from_db()

        self.assertEqual(float(supply_a.accepted_quantity), 0.0)
        self.assertEqual(float(supply_b.accepted_quantity), 50.0)
        self.assertEqual(self.product.total_available_quantity, 50.0)
        # Raw quantities must remain completely untouched
        self.assertEqual(float(supply_a.quantity), 95.0)
        self.assertEqual(float(supply_b.quantity), 105.0)

    def test_scenario_3_raw_quantity_remains_untouched(self):
        """TEST 3: 95 raw / 75 accepted -> Order 75 -> raw quantity remains 95, accepted_quantity becomes 0."""
        supply_a = Supply.objects.create(
            farmer=self.farmer,
            product=self.product,
            quantity=95,
            accepted_quantity=75,
            price=1000,
            agreed_price=1000,
            status='accepted'
        )

        order = Order.objects.create(
            client=self.client,
            delivery_address='Test Address'
        )
        order.items.create(product=self.product, quantity=75, price=1500)
        deduct_inventory_for_order(order)

        supply_a.refresh_from_db()

        self.assertEqual(float(supply_a.quantity), 95.0, "Raw farmer quantity MUST remain 95")
        self.assertEqual(float(supply_a.accepted_quantity), 0.0, "Accepted sellable quantity MUST become 0")

    def test_scenario_4_prevent_over_ordering(self):
        """TEST 4: Total accepted stock = 150 -> Order 151 -> Rejected, A & B accepted quantities unchanged."""
        supply_a = Supply.objects.create(
            farmer=self.farmer,
            product=self.product,
            quantity=95,
            accepted_quantity=75,
            price=1000,
            agreed_price=1000,
            status='accepted'
        )
        supply_b = Supply.objects.create(
            farmer=self.farmer,
            product=self.product,
            quantity=105,
            accepted_quantity=75,
            price=1000,
            agreed_price=1000,
            status='accepted'
        )

        serializer = OrderSerializer(data={
            'delivery_address': 'Test Address',
            'items': [{'product': self.product.id, 'quantity': 151, 'price': 1500}]
        })

        with self.assertRaises(ValidationError):
            serializer.is_valid(raise_exception=True)

        supply_a.refresh_from_db()
        supply_b.refresh_from_db()
        self.assertEqual(float(supply_a.accepted_quantity), 75.0)
        self.assertEqual(float(supply_b.accepted_quantity), 75.0)

    def test_scenario_5_multiple_supplies_exclusive_accepted_deduction(self):
        """TEST 5: Verify deductions are based exclusively on accepted quantities across 3 supplies."""
        supply_1 = Supply.objects.create(
            farmer=self.farmer,
            product=self.product,
            quantity=200,
            accepted_quantity=50,
            price=1000,
            agreed_price=1000,
            status='accepted'
        )
        supply_2 = Supply.objects.create(
            farmer=self.farmer,
            product=self.product,
            quantity=300,
            accepted_quantity=80,
            price=1000,
            agreed_price=1000,
            status='accepted'
        )
        supply_3 = Supply.objects.create(
            farmer=self.farmer,
            product=self.product,
            quantity=150,
            accepted_quantity=40,
            price=1000,
            agreed_price=1000,
            status='accepted'
        )

        # Total accepted = 50 + 80 + 40 = 170
        self.assertEqual(self.product.total_available_quantity, 170.0)

        # Order 100 kg
        order = Order.objects.create(
            client=self.client,
            delivery_address='Test Address'
        )
        order.items.create(product=self.product, quantity=100, price=1500)
        deduct_inventory_for_order(order)

        supply_1.refresh_from_db()
        supply_2.refresh_from_db()
        supply_3.refresh_from_db()
        self.product.refresh_from_db()

        self.assertEqual(float(supply_1.accepted_quantity), 0.0)  # 50 - 50 = 0
        self.assertEqual(float(supply_2.accepted_quantity), 30.0) # 80 - 50 = 30
        self.assertEqual(float(supply_3.accepted_quantity), 40.0) # 40 - 0 = 40
        self.assertEqual(self.product.total_available_quantity, 70.0)

        # Verify raw quantities remain unchanged
        self.assertEqual(float(supply_1.quantity), 200.0)
        self.assertEqual(float(supply_2.quantity), 300.0)
        self.assertEqual(float(supply_3.quantity), 150.0)
