import re
from django.db import migrations, models

def seed_sequence_counters(apps, schema_editor):
    DisplaySequenceCounter = apps.get_model('common', 'DisplaySequenceCounter')
    Product = apps.get_model('products', 'Product')
    Supply = apps.get_model('supplies', 'Supply')
    Order = apps.get_model('orders', 'Order')

    def get_max_num(model, field_name, prefix):
        max_num = 0
        try:
            for val in model.objects.exclude(**{f"{field_name}__isnull": True}).values_list(field_name, flat=True):
                if val and isinstance(val, str) and val.startswith(prefix):
                    match = re.search(r'\d+', val.replace(prefix, ''))
                    if match:
                        num = int(match.group(0))
                        if num > max_num:
                            max_num = num
        except Exception as e:
            print(f"Migration scan note for {prefix}: {e}")
        return max_num

    mst_max = get_max_num(Product, 'display_id', 'MST-')
    sup_max = get_max_num(Supply, 'supply_number', 'SUP-')
    ord_max = get_max_num(Order, 'order_number', 'ORD-')

    DisplaySequenceCounter.objects.update_or_create(
        key='master_product',
        defaults={'last_value': mst_max}
    )
    DisplaySequenceCounter.objects.update_or_create(
        key='farmer_supply',
        defaults={'last_value': sup_max}
    )
    DisplaySequenceCounter.objects.update_or_create(
        key='order',
        defaults={'last_value': ord_max}
    )

def rollback_sequence_counters(apps, schema_editor):
    DisplaySequenceCounter = apps.get_model('common', 'DisplaySequenceCounter')
    DisplaySequenceCounter.objects.filter(key__in=['master_product', 'farmer_supply', 'order']).delete()

class Migration(migrations.Migration):

    dependencies = [
        ('common', '0002_auditlog_target_name'),
        ('products', '0001_initial'),
        ('supplies', '0001_initial'),
        ('orders', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='DisplaySequenceCounter',
            fields=[
                ('key', models.CharField(max_length=50, primary_key=True, serialize=False)),
                ('last_value', models.BigIntegerField(default=0)),
            ],
        ),
        migrations.RunPython(seed_sequence_counters, reverse_code=rollback_sequence_counters),
    ]
