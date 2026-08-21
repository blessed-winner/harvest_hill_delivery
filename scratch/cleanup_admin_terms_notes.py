import os
import sys
import django

sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.supplies.models import Supply

print("Cleaning up legacy [Admin Terms]: text from Supply.notes in DB...")
count = 0
for s in Supply.objects.filter(notes__contains='[Admin Terms]:'):
    original_notes = s.notes
    clean_notes = original_notes.split('[Admin Terms]:')[0].strip()
    s.notes = clean_notes if clean_notes else None
    s.save(update_fields=['notes'])
    print(f"Updated Supply #{s.id} ({s.supply_number}): Was '{original_notes}' -> Now '{s.notes}'")
    count += 1

print(f"Cleanup complete! Updated {count} supply records.")
