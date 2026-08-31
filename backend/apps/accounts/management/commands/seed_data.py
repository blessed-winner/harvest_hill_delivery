from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.accounts.models import AdminProfile, FarmerProfile
from apps.products.models import Product, ProductRequest
from apps.supplies.models import Supply
from apps.orders.models import Order
from apps.common.models import AuditLog

class Command(BaseCommand):
    help = 'Seeds master admin, partner farmers, product catalog templates with discounts, and accepted harvest supplies.'

    def handle(self, *args, **options):
        self.stdout.write("Wiping existing database records...")
        Order.objects.all().delete()
        Supply.objects.all().delete()
        ProductRequest.objects.all().delete()
        Product.objects.all().delete()
        AuditLog.objects.all().delete()

        User = get_user_model()
        User.objects.all().delete()

        # 1. Seed Master Admin
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
        self.stdout.write(self.style.SUCCESS(f"Seeded admin: {admin_user.email} (Password: adminpass123)"))

        # 2. Seed Partner Farmers
        farmers_data = [
            {
                "username": "virunga_farms",
                "email": "farmer.virunga@harvesthill.test",
                "farm_name": "Virunga Highland Organic Farm",
                "location": "Musanze, Northern Province",
                "phone": "+250 788 111 222",
                "certifications": "Organic Certified, RA Standard"
            },
            {
                "username": "kivu_orchards",
                "email": "farmer.kivu@harvesthill.test",
                "farm_name": "Kivu Lakeshore Orchards",
                "location": "Rubavu, Western Province",
                "phone": "+250 788 333 444",
                "certifications": "GAP Certified"
            },
            {
                "username": "akagera_coop",
                "email": "farmer.akagera@harvesthill.test",
                "farm_name": "Akagera Valley Agriculture Co-op",
                "location": "Kayonza, Eastern Province",
                "phone": "+250 788 555 666",
                "certifications": "FairTrade Certified"
            }
        ]

        farmer_profiles = []
        for fdata in farmers_data:
            fuser = User.objects.create_user(
                username=fdata["username"],
                email=fdata["email"],
                password="FarmerPass2026!",
                role="farmer",
                first_name=fdata["farm_name"].split()[0]
            )
            fprof, _ = FarmerProfile.objects.get_or_create(
                user=fuser,
                defaults={
                    "farm_name": fdata["farm_name"],
                    "location": fdata["location"],
                    "phone": fdata["phone"],
                    "certifications": fdata["certifications"],
                    "organic_certified": True
                }
            )
            farmer_profiles.append(fprof)
            self.stdout.write(self.style.SUCCESS(f"Seeded farmer: {fdata['farm_name']} ({fdata['email']})"))

        # 3. Seed Catalog Master Products with hosted image URLs & discounts
        products_data = [
            {
                "name": "Organic Hass Avocados",
                "category": "Fruits",
                "unit": "kg",
                "base_price": 1800,
                "is_discounted": False,
                "discount_price": None,
                "quantity_needed": 300,
                "image": "https://res.cloudinary.com/dygqfwbsu/image/upload/v1786901950/harvest_hill_products/y5h24za39d3bawj6oqit.jpg",
                "description": "Rich, creamy organic Hass avocados freshly picked from volcanic highland orchards in Musanze.",
                "farmer": farmer_profiles[0],
                "qty_batch1": 120,
                "qty_batch2": 180,
                "price_farmer1": 1400,
                "price_farmer2": 1450,
            },
            {
                "name": "Musanze Sweet Irish Potatoes",
                "category": "Vegetables",
                "unit": "kg",
                "base_price": 950,
                "is_discounted": True,
                "discount_price": 700,
                "quantity_needed": 500,
                "image": "https://res.cloudinary.com/dygqfwbsu/image/upload/v1786901952/harvest_hill_products/je3ul8dazchxyryv6xz0.jpg",
                "description": "Premium Kinigi red-skin Irish potatoes, ideal for roasting, fries, and hearty traditional stews.",
                "farmer": farmer_profiles[0],
                "qty_batch1": 250,
                "qty_batch2": 250,
                "price_farmer1": 700,
                "price_farmer2": 720,
            },
            {
                "name": "Fresh Nyagatare Whole Milk",
                "category": "Animal-Based",
                "unit": "litre",
                "base_price": 1200,
                "is_discounted": True,
                "discount_price": 950,
                "quantity_needed": 400,
                "image": "https://res.cloudinary.com/dygqfwbsu/image/upload/v1786901952/harvest_hill_products/evb7rx2qdrrm1w2tqdup.jpg",
                "description": "Pure pasteurized whole cow milk produced by grass-fed cattle in pasturages of Eastern Province.",
                "farmer": farmer_profiles[2],
                "qty_batch1": 200,
                "qty_batch2": 200,
                "price_farmer1": 900,
                "price_farmer2": 920,
            },
            {
                "name": "Handpicked Crisp Bell Peppers",
                "category": "Vegetables",
                "unit": "kg",
                "base_price": 2400,
                "is_discounted": True,
                "discount_price": 1900,
                "quantity_needed": 200,
                "image": "https://res.cloudinary.com/dygqfwbsu/image/upload/v1786901953/harvest_hill_products/ys38mphnzkwb6mu14wgk.jpg",
                "description": "Sweet, vibrant red, yellow, and green bell peppers cultivated in greenhouse climate controls.",
                "farmer": farmer_profiles[1],
                "qty_batch1": 100,
                "qty_batch2": 100,
                "price_farmer1": 1900,
                "price_farmer2": 1950,
            },
            {
                "name": "Gisenyi Golden Passion Fruit",
                "category": "Fruits",
                "unit": "kg",
                "base_price": 3100,
                "is_discounted": True,
                "discount_price": 2500,
                "quantity_needed": 250,
                "image": "https://res.cloudinary.com/dygqfwbsu/image/upload/v1786901954/harvest_hill_products/tjs9yo1dfrpgrucnjgll.jpg",
                "description": "Highly aromatic golden passion fruit with tangy juice sweet pulp grown along sunny Lake Kivu shores.",
                "farmer": farmer_profiles[1],
                "qty_batch1": 125,
                "qty_batch2": 125,
                "price_farmer1": 2500,
                "price_farmer2": 2550,
            },
            {
                "name": "Rwamagana Sweet Yellow Bananas",
                "category": "Fruits",
                "unit": "bunch",
                "base_price": 1400,
                "is_discounted": False,
                "discount_price": None,
                "quantity_needed": 300,
                "image": "https://res.cloudinary.com/dygqfwbsu/image/upload/v1786901955/harvest_hill_products/zvf1h9919o4msvwijt0c.jpg",
                "description": "Naturally tree-ripened sweet yellow bananas harvested in generous bunches for healthy snacking.",
                "farmer": farmer_profiles[2],
                "qty_batch1": 150,
                "qty_batch2": 150,
                "price_farmer1": 1000,
                "price_farmer2": 1050,
            },
            {
                "name": "Fresh Rosemary Herbs",
                "category": "Herbs",
                "unit": "bundle",
                "base_price": 850,
                "is_discounted": False,
                "discount_price": None,
                "quantity_needed": 150,
                "image": "https://res.cloudinary.com/dygqfwbsu/image/upload/v1786901955/harvest_hill_products/je6zwevjlwc7clyrwywx.jpg",
                "description": "Aromatic fresh organic rosemary sprigs harvested daily for roasting meats and gourmet culinary seasoning.",
                "farmer": farmer_profiles[0],
                "qty_batch1": 75,
                "qty_batch2": 75,
                "price_farmer1": 600,
                "price_farmer2": 620,
            },
            {
                "name": "Kayonza Organic Wildflower Honey",
                "category": "Animal-Based",
                "unit": "jar",
                "base_price": 4500,
                "is_discounted": False,
                "discount_price": None,
                "quantity_needed": 100,
                "image": "https://res.cloudinary.com/dygqfwbsu/image/upload/v1786901956/harvest_hill_products/rmzjdruoegyitljaxmsd.jpg",
                "description": "100% unfiltered raw wildflower honey harvested sustainably from natural forest bee hives.",
                "farmer": farmer_profiles[2],
                "qty_batch1": 50,
                "qty_batch2": 50,
                "price_farmer1": 3500,
                "price_farmer2": 3600,
            },
            {
                "name": "Premium Red Roma Tomatoes",
                "category": "Vegetables",
                "unit": "kg",
                "base_price": 1200,
                "is_discounted": True,
                "discount_price": 850,
                "quantity_needed": 400,
                "image": "https://res.cloudinary.com/dygqfwbsu/image/upload/v1786901957/harvest_hill_products/xzxthjsk5hdrljoaqcpf.jpg",
                "description": "Meaty, sun-ripened Roma tomatoes ideal for flavorful tomato paste, pasta sauces, and fresh salads.",
                "farmer": farmer_profiles[1],
                "qty_batch1": 200,
                "qty_batch2": 200,
                "price_farmer1": 850,
                "price_farmer2": 900,
            },
            {
                "name": "Highland Organic Green Peas",
                "category": "Vegetables",
                "unit": "kg",
                "base_price": 2200,
                "is_discounted": False,
                "discount_price": None,
                "quantity_needed": 200,
                "image": "https://res.cloudinary.com/dygqfwbsu/image/upload/v1786901958/harvest_hill_products/ryml5n0hbfzmehehvgfm.jpg",
                "description": "Tender, sweet green peas shelled fresh from high-altitude farm crops in Northern Rwanda.",
                "farmer": farmer_profiles[0],
                "qty_batch1": 100,
                "qty_batch2": 100,
                "price_farmer1": 1600,
                "price_farmer2": 1650,
            },
            {
                "name": "Gicumbi Fresh Farm Eggs",
                "category": "Animal-Based",
                "unit": "tray",
                "base_price": 4200,
                "is_discounted": False,
                "discount_price": None,
                "quantity_needed": 150,
                "image": "https://res.cloudinary.com/dygqfwbsu/image/upload/v1786901959/harvest_hill_products/l6av0l2i1vzzhgsvbcwu.jpg",
                "description": "Grade A fresh brown eggs laid by free-range, grain-fed hens in mountain farms of Gicumbi.",
                "farmer": farmer_profiles[0],
                "qty_batch1": 75,
                "qty_batch2": 75,
                "price_farmer1": 3200,
                "price_farmer2": 3300,
            },
            {
                "name": "Nyagatare Premium Short-Grain Rice",
                "category": "Grains",
                "unit": "kg",
                "base_price": 1600,
                "is_discounted": False,
                "discount_price": None,
                "quantity_needed": 500,
                "image": "https://res.cloudinary.com/dygqfwbsu/image/upload/v1786901960/harvest_hill_products/ggfecaryivdkw18aqibu.jpg",
                "description": "Double-polished white short-grain rice cultivated in fertile river valley marshlands.",
                "farmer": farmer_profiles[2],
                "qty_batch1": 250,
                "qty_batch2": 250,
                "price_farmer1": 1200,
                "price_farmer2": 1250,
            }
        ]

        for pitem in products_data:
            prod = Product.objects.create(
                name=pitem["name"],
                category=pitem["category"],
                unit=pitem["unit"],
                base_price=pitem["base_price"],
                is_discounted=pitem["is_discounted"],
                discount_price=pitem["discount_price"],
                quantity_needed=pitem["quantity_needed"],
                image=pitem["image"],
                description=pitem["description"],
                is_currently_needed=True,
                urgency="medium"
            )

            # Seed 2 accepted farmer supply batches per product (sums to live stock)
            Supply.objects.create(
                farmer=pitem["farmer"],
                product=prod,
                quantity=pitem["qty_batch1"] + 20,
                accepted_quantity=pitem["qty_batch1"],
                price=pitem["price_farmer1"],
                agreed_price=pitem["price_farmer1"],
                status='accepted',
                visibility_scope='public',
                is_discounted=pitem["is_discounted"],
                discount_price=pitem["discount_price"],
                photo=pitem["image"]
            )

            Supply.objects.create(
                farmer=farmer_profiles[1] if pitem["farmer"] != farmer_profiles[1] else farmer_profiles[2],
                product=prod,
                quantity=pitem["qty_batch2"] + 30,
                accepted_quantity=pitem["qty_batch2"],
                price=pitem["price_farmer2"],
                agreed_price=pitem["price_farmer2"],
                status='accepted',
                visibility_scope='public',
                is_discounted=pitem["is_discounted"],
                discount_price=pitem["discount_price"],
                photo=pitem["image"]
            )

            prod.refresh_from_db()
            disc_str = f" (Discounted: RWF {prod.discount_price})" if prod.is_discounted else ""
            self.stdout.write(self.style.SUCCESS(f"Seeded Product: {prod.name} (Live Stock: {prod.total_available_quantity} {prod.unit}){disc_str}"))

        self.stdout.write(self.style.SUCCESS("Database seeding completed successfully! All seeded products & live stock are active."))
