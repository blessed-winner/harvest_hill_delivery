import os
import sys
import re
import django

sys.path.insert(0, os.path.abspath('backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.base')
django.setup()

from apps.delivery_notes.models import DeliveryNote

print("=== FIXING DELIVERY NOTE DETAILS WITH DISPLAY ORDER IDs ===")
notes = DeliveryNote.objects.all()
updated_count = 0

for note in notes:
    if note.order:
        order_display_id = note.order.formatted_order_number
        # Check if details contains a UUID order reference like #<uuid>
        match = re.search(r'Order #([a-f0-9\-]{32,36})', note.details, re.IGNORECASE)
        if match:
            old_str = match.group(0)
            new_str = f"Order #{order_display_id}"
            note.details = note.details.replace(old_str, new_str)
            note.save(update_fields=['details'])
            print(f"Updated Delivery Note {note.display_id}: '{old_str}' -> '{new_str}'")
            updated_count += 1
        elif f"Order #{order_display_id}" not in note.details and "Order #" in note.details:
            # Replace any other raw ID after Order #
            note.details = re.sub(r'Order #\S+', f'Order #{order_display_id}', note.details)
            note.save(update_fields=['details'])
            print(f"Updated Delivery Note {note.display_id} details: {note.details}")
            updated_count += 1

print(f"Total delivery notes updated: {updated_count}")
