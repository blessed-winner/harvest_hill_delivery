from django.contrib.auth import get_user_model
from apps.accounts.models import FarmerProfile
from apps.products.models import Product
from apps.supplies.models import Supply
from apps.negotiations.models import NegotiationThread, NegotiationOffer
from apps.invoices.models import Invoice
from django.utils import timezone
from datetime import timedelta

User = get_user_model()

# 1. Create or get farmer user
email = "farmer@harvesthill.com"
user, created = User.objects.get_or_create(
    email=email,
    defaults={
        "role": "farmer",
        "is_active": True,
        "is_email_verified": True
    }
)
if created:
    user.set_password("farmerpass123")
    user.save()

profile, _ = FarmerProfile.objects.get_or_create(
    user=user,
    defaults={
        "farm_name": "Green Valley Farm",
        "location": "Green Valley",
        "organic_certified": True,
        "certification_number": "GV-ORG-992",
        "phone": "+250 781 234 567",
        "certifications": "USDA Organic, Fair Trade",
        "latitude": -1.944100,
        "longitude": 30.061900
    }
)

# Create admin user for offers
admin_email = "admin@harvesthill.com"
admin_user, _ = User.objects.get_or_create(
    email=admin_email,
    defaults={
        "role": "admin",
        "is_active": True,
        "is_staff": True
    }
)

# 2. Create products
roma, _ = Product.objects.get_or_create(
    name="Roma Tomatoes",
    defaults={
        "category": "Vegetables",
        "is_currently_needed": True,
        "urgency": "high",
        "unit": "kg",
        "base_price": 3.45,
        "image": "https://lh3.googleusercontent.com/aida-public/AB6AXuCDjW4LDDg9AP70u42NvTwegX0aSJNLRjt9qSwBllNwb_diw_nxtuUDtN-TcdUiA3ivCMjbYnGmgv5-wkvLzRGpmqY8xMZu-ylv5QfnxZlHwCRKBpiG5A8G9Ta0OiugntBsGuXZSmsbtb8KEUNEHV73RMwY1zZYbedheJuxMoFEmJpM5ARItKv04bj7gtmOHuBXHviExa4vDOX-yw21yRwq616WxnlapT2173nuHbJEKQ9VghPugmqtBg",
        "quantity_needed": 2500
    }
)

wheat, _ = Product.objects.get_or_create(
    name="Durum Wheat",
    defaults={
        "category": "Grains",
        "is_currently_needed": True,
        "urgency": "steady",
        "unit": "kg",
        "base_price": 0.85,
        "image": "https://lh3.googleusercontent.com/aida-public/AB6AXuBQYDniTVJvGnzcOZnyoyxdN10cAwuEDsM40zmbtxaMxe-Rvogvt5wvb9isBj_wDgTwDpTojDHf4_jCBFklPVWrjYvfN_P3fJ0uiFJJfs45K8-8K-IVMVCnt8QYgGExTonLEOjHe2AW3QDPkQksQZ3lZqYalgm1LOKScCsbjMko35cjhlcD8Gxb8Ro0-cQtY2h5VTWfYtT8iwBiVUlaDv-u8L-Bn2f_JBmIhRcuWdQUEjU8Qqkl6ZSA0w",
        "quantity_needed": 15000
    }
)

lettuce, _ = Product.objects.get_or_create(
    name="Iceberg Lettuce",
    defaults={
        "category": "Vegetables",
        "is_currently_needed": True,
        "urgency": "steady",
        "unit": "kg",
        "base_price": 1.20,
        "image": "https://lh3.googleusercontent.com/aida-public/AB6AXuBxaIEjUGtnGXLWgWM3dQ4i0tAvOfi7RKZLGu1fGEtWVK3e05aLGKP6QyWo87_ktHPD6eeGJE0IdMO3UIr8r1xbyzKJfapEyuokusuq4sIrAitDQp5plyNJ55e8qI6GFvfmkIu88U-hcSoIGPKI245Pcr01LUYzqaqmqv4UirXitG5XKKi07SQy_JyALKzIO_wYp8GWfZTo03pmxEI5swE3ZsUPP8o2M0LbY1lhw4Qlvi2itb3_dVKCxg",
        "quantity_needed": 1200
    }
)

potatoes, _ = Product.objects.get_or_create(
    name="Russet Potatoes",
    defaults={
        "category": "Vegetables",
        "is_currently_needed": True,
        "urgency": "steady",
        "unit": "kg",
        "base_price": 0.95,
        "image": "https://lh3.googleusercontent.com/aida-public/AB6AXuB41-Vuzo9PoiMU_6JQZOXCKOLW-1IS1IInscIbXRMORY7tTrv44rIvtwhrnsLhdCuonKVd7FwSgRhoTZC4E-PnVFrYOHSFAPKKBNcd8APsOv64N3UUjF53XLXomgCACC8eAwykUHfBJfNjc8JnaM4CdDIUrDyDqE3Cu4KSlEs-hs6Wza1utfBiwoQRKnhnotV-b6enuBmfjpUJYSxR-5Bb5guV7pLUip6Uo16gWDhndBPdCrBjHVsYSw",
        "quantity_needed": 4800
    }
)

# 3. Create supplies
# Clear existing to avoid duplicate conflicts for fresh seed
Supply.objects.filter(farmer=profile).delete()

s1 = Supply.objects.create(farmer=profile, product=roma, quantity=250, price=5.00, status='accepted')
s2 = Supply.objects.create(farmer=profile, product=lettuce, quantity=80, price=4.00, status='pending')
s3 = Supply.objects.create(farmer=profile, product=wheat, quantity=5000, price=0.85, status='delivered')
s4 = Supply.objects.create(farmer=profile, product=potatoes, quantity=1200, price=0.95, status='negotiating')

# Backdate supplies created dates to simulate volume
s1.created_at = timezone.now() - timedelta(days=5)
s1.save()
s2.created_at = timezone.now() - timedelta(days=12)
s2.save()
s3.created_at = timezone.now() - timedelta(days=20)
s3.save()
s4.created_at = timezone.now() - timedelta(days=25)
s4.save()

# 4. Create Negotiation Thread and Offers
t1 = NegotiationThread.objects.create(supply=s4)
NegotiationOffer.objects.create(thread=t1, sender=user, price=1.10, quantity=1200, message="First proposal")
NegotiationOffer.objects.create(thread=t1, sender=admin_user, price=0.90, quantity=1200, message="Counter offer")
NegotiationOffer.objects.create(thread=t1, sender=user, price=0.95, quantity=1200, message="Final compromise")

# 5. Create Invoices
Invoice.objects.create(supply=s1, status='paid', amount=1250.00)
Invoice.objects.create(supply=s3, status='paid', amount=4250.00)
Invoice.objects.create(supply=s2, status='pending', amount=320.00)

print("Seed completed successfully!")
