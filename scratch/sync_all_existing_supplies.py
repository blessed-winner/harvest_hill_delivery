import os
import sys
import django

sys.path.insert(0, os.path.abspath('backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.base')
django.setup()

from apps.supplies.models import Supply

print("=== SYNCING ALL ACCEPTED QUANTITIES WITH QUANTITY ===")
supplies = Supply.objects.filter(is_archived=False)
updated_count = 0
for s in supplies:
    if s.accepted_quantity is not None and float(s.accepted_quantity) > float(s.quantity):
        print(f"Syncing Supply {s.id} ({s.product.name if s.product else s.custom_product_name}): accepted_quantity was {s.accepted_quantity}, setting to {s.quantity}")
        s.accepted_quantity = s.quantity
        s.save(update_fields=['accepted_quantity'])
        updated_count += 1

print(f"Total supplies synced: {updated_count}")
