from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from decimal import Decimal
import random

from apps.accounts.models import FarmerProfile, ClientProfile, AdminProfile
from apps.products.models import Product
from apps.supplies.models import Supply
from apps.negotiations.models import NegotiationThread, NegotiationOffer
from apps.orders.models import Order, OrderItem
from apps.delivery_notes.models import DeliveryNote
from apps.invoices.models import Invoice
from apps.notifications.models import Notification

User = get_user_model()

class Command(BaseCommand):
    help = 'Seeds initial data for Harvest Hill Delivery'

    def handle(self, *args, **options):
        self.stdout.write('Seeding database...')

        # 1. Admin
        admin_user, created = User.objects.get_or_create(
            email='admin@harvesthill.test',
            defaults={
                'role': 'admin',
                'is_staff': True,
                'is_superuser': True,
                'is_email_verified': True
            }
        )
        if created:
            admin_user.set_password('adminpass123')
            admin_user.save()

        # 2. Clients (5)
        clients_data = [
            {'email': 'chef.arthur@kitchens.test', 'business': 'Grand View Kitchen', 'address': '124 Summit Rd, SF, CA', 'phone': '555-0100'},
            {'email': 'bakery.mary@grain.test', 'business': 'Golden Wheat Bakery', 'address': '55 Baker St, Oakland, CA', 'phone': '555-0200'},
            {'email': 'cafe.dan@greens.test', 'business': 'Downtown Greens Cafe', 'address': '789 Garden Ave, San Jose, CA', 'phone': '555-0300'},
            {'email': 'hotel.elena@palace.test', 'business': 'Palace Hotel Dining', 'address': '10 Pine St, SF, CA', 'phone': '555-0400'},
            {'email': 'market.sam@organic.test', 'business': 'Sam\'s Fresh Market', 'address': '404 Farmway, Berkeley, CA', 'phone': '555-0500'},
        ]
        clients = []
        for c in clients_data:
            user, u_created = User.objects.get_or_create(
                email=c['email'],
                defaults={'role': 'client', 'is_email_verified': True}
            )
            if u_created:
                user.set_password('clientpass123')
                user.save()
            
            # Update profile fields
            profile = user.client_profile
            profile.business_name = c['business']
            profile.delivery_address = c['address']
            profile.phone = c['phone']
            profile.save()
            clients.append(profile)

        # 3. Farmers (5)
        farmers_data = [
            {'email': 'oakgrove@farms.test', 'farm': 'Oak Grove Farms', 'loc': 'Sonoma Valley, CA', 'org': True, 'cert': 'ORG-12345'},
            {'email': 'hillside@farms.test', 'farm': 'Hillside Orchards', 'loc': 'Napa Valley, CA', 'org': False, 'cert': ''},
            {'email': 'riverbend@farms.test', 'farm': 'River Bend Farms', 'loc': 'Sacramento, CA', 'org': False, 'cert': ''},
            {'email': 'berrypatch@farms.test', 'farm': 'Berry Patch Co.', 'loc': 'Watsonville, CA', 'org': True, 'cert': 'ORG-54321'},
            {'email': 'rootstem@farms.test', 'farm': 'Root & Stem Farms', 'loc': 'Salinas, CA', 'org': False, 'cert': ''},
        ]
        farmers = []
        for f in farmers_data:
            user, u_created = User.objects.get_or_create(
                email=f['email'],
                defaults={'role': 'farmer', 'is_email_verified': True}
            )
            if u_created:
                user.set_password('farmerpass123')
                user.save()
            
            profile = user.farmer_profile
            profile.farm_name = f['farm']
            profile.location = f['loc']
            profile.organic_certified = f['org']
            profile.certification_number = f['cert']
            profile.save()
            farmers.append(profile)

        # 4. Products (~20)
        products_data = [
            # Fruits
            ('Organic Bing Cherries', 'Fruits', True, 'high'),
            ('Sun-Ripened Apricots', 'Fruits', False, 'low'),
            ('Concord Table Grapes', 'Fruits', False, 'low'),
            ('Honeycrisp Apples', 'Fruits', True, 'medium'),
            ('Mixed Berry Basket', 'Fruits', False, 'low'),
            ('Heritage Anjou Pears', 'Fruits', False, 'low'),
            ('Heirloom Strawberries', 'Fruits', True, 'high'),
            # Vegetables
            ('Premium Baby Spinach', 'Vegetables', True, 'medium'),
            ('Rainbow Carrot Mix', 'Vegetables', False, 'low'),
            ('Organic Roma Tomatoes', 'Vegetables', True, 'high'),
            ('Red Ember Shallots', 'Vegetables', False, 'low'),
            ('Crisp Iceberg Lettuce', 'Vegetables', False, 'low'),
            # Dairy
            ('Grass-fed Whole Milk', 'Dairy', True, 'high'),
            ('Aged Sharp Cheddar', 'Dairy', False, 'low'),
            ('Grass-fed Salted Butter', 'Dairy', False, 'low'),
            # Grains
            ('Red Winter Wheat Bulk', 'Grains', True, 'medium'),
            ('Organic Rolled Oats', 'Grains', False, 'low'),
            ('Rustic Sourdough Loaves', 'Grains', False, 'low'),
            # Herbs
            ('Fresh Sweet Basil', 'Herbs', True, 'high'),
            ('Organic Rosemary Sprigs', 'Herbs', False, 'low'),
        ]
        products = []
        for name, cat, needed, urg in products_data:
            prod, p_created = Product.objects.get_or_create(
                name=name,
                defaults={'category': cat, 'is_currently_needed': needed, 'urgency': urg}
            )
            products.append(prod)

        # 5. Supplies (~15)
        # We need a supply in each status: draft, pending, negotiating, accepted, rejected, delivered, invoiced
        statuses = ['draft', 'pending', 'negotiating', 'accepted', 'rejected', 'delivered', 'invoiced']
        supplies = []
        
        # Ensure we have at least one supply per status
        for idx, status in enumerate(statuses):
            farmer = farmers[idx % len(farmers)]
            product = products[idx % len(products)]
            supply, s_created = Supply.objects.get_or_create(
                farmer=farmer,
                product=product,
                defaults={
                    'quantity': Decimal('150.00'),
                    'price': Decimal('5.50') + idx,
                    'status': status
                }
            )
            supplies.append(supply)

        # Add remaining supplies to reach ~15
        for i in range(8):
            farmer = random.choice(farmers)
            product = random.choice(products)
            status = random.choice(statuses)
            supply, s_created = Supply.objects.get_or_create(
                farmer=farmer,
                product=product,
                defaults={
                    'quantity': Decimal(random.randint(50, 500)),
                    'price': Decimal(round(random.uniform(2.5, 15.0), 2)),
                    'status': status
                }
            )
            supplies.append(supply)

        # 6. Negotiation Threads & Offers
        # Filter accepted/negotiating supplies
        negotiating_supplies = [s for s in supplies if s.status in ['negotiating', 'accepted']]
        for s in negotiating_supplies:
            thread, t_created = NegotiationThread.objects.get_or_create(supply=s)
            
            # Create alternating offers (farmer, admin)
            farmer_user = s.farmer.user
            # First offer
            NegotiationOffer.objects.get_or_create(
                thread=thread,
                sender=farmer_user,
                price=s.price + Decimal('1.00'),
                quantity=s.quantity,
                defaults={'message': 'Initial asking price based on organic soil yields.'}
            )
            # Counter offer by admin
            NegotiationOffer.objects.get_or_create(
                thread=thread,
                sender=admin_user,
                price=s.price,
                quantity=s.quantity,
                defaults={'message': 'We can accept if we lock in this price for the next two months.'}
            )
            if s.status == 'accepted':
                # Final agreement offer by farmer
                NegotiationOffer.objects.get_or_create(
                    thread=thread,
                    sender=farmer_user,
                    price=s.price,
                    quantity=s.quantity,
                    defaults={'message': 'Agreed. Proceeding with acceptance.'}
                )

        # 7. Client Orders (~10)
        order_statuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled']
        orders = []
        for i in range(10):
            client = random.choice(clients)
            status = order_statuses[i % len(order_statuses)]
            order, o_created = Order.objects.get_or_create(
                client=client,
                status=status,
                defaults={'delivery_address': client.delivery_address}
            )
            orders.append(order)

            # Order items
            num_items = random.randint(1, 4)
            selected_products = random.sample(products, num_items)
            for prod in selected_products:
                OrderItem.objects.get_or_create(
                    order=order,
                    product=prod,
                    defaults={
                        'quantity': Decimal(random.randint(10, 100)),
                        'price': Decimal(round(random.uniform(3.0, 12.0), 2))
                    }
                )

        # 8. Delivery Notes
        # at least one confirmed, one pending, one discrepancy
        delivered_orders = [o for o in orders if o.status == 'delivered']
        delivered_supplies = [s for s in supplies if s.status == 'delivered']
        
        # Delivery note for order (confirmed)
        if delivered_orders:
            DeliveryNote.objects.get_or_create(
                order=delivered_orders[0],
                status='confirmed',
                defaults={'details': 'All 4 boxes received in perfect cold chain condition.'}
            )
        # Delivery note for supply (pending)
        if delivered_supplies:
            DeliveryNote.objects.get_or_create(
                supply=delivered_supplies[0],
                status='pending',
                defaults={'details': 'Awaiting gate warehouse verification check.'}
            )
        # Discrepancy delivery note
        if len(delivered_orders) > 1:
            DeliveryNote.objects.get_or_create(
                order=delivered_orders[1],
                status='discrepancy',
                defaults={'details': 'Damaged boxes reported. 10 lbs of roma tomatoes bruised.'}
            )

        # 9. Invoices
        # Delivered/invoiced supplies and orders. paid/pending. One failed sync
        invoiced_supplies = [s for s in supplies if s.status == 'invoiced']
        for s in invoiced_supplies:
            Invoice.objects.get_or_create(
                supply=s,
                status='pending',
                defaults={
                    'amount': s.price * s.quantity,
                    'sync_status': 'synced'
                }
            )
        
        # Invoice for completed orders
        for idx, o in enumerate(delivered_orders):
            total_amount = sum(item.price * item.quantity for item in o.items.all())
            sync_status = 'failed' if idx == 0 else 'synced' # Make one sync fail
            Invoice.objects.get_or_create(
                order=o,
                defaults={
                    'status': 'paid' if idx % 2 == 0 else 'pending',
                    'amount': total_amount if total_amount > 0 else Decimal('250.00'),
                    'sync_status': sync_status
                }
            )

        # 10. Notifications per user
        all_users = list(User.objects.all())
        for u in all_users:
            Notification.objects.get_or_create(
                user=u,
                message=f"Welcome to Harvest Hill Delivery, {u.email}! Your portal is active.",
                defaults={'is_read': False}
            )
            Notification.objects.get_or_create(
                user=u,
                message="Please review your account profile information.",
                defaults={'is_read': True}
            )

        # Print summary
        self.stdout.write(self.style.SUCCESS(
            f"Successfully seeded database:\n"
            f"- Users: {User.objects.count()}\n"
            f"- Products: {Product.objects.count()}\n"
            f"- Supplies: {Supply.objects.count()}\n"
            f"- Client Orders: {Order.objects.count()}\n"
            f"- Invoices: {Invoice.objects.count()}\n"
            f"- Delivery Notes: {DeliveryNote.objects.count()}\n"
            f"- Notifications: {Notification.objects.count()}"
        ))
