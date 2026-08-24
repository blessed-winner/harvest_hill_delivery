import re
from django.db import migrations, models

def seed_sequence_counters(apps, schema_editor):
    DisplaySequenceCounter = apps.get_model('common', 'DisplaySequenceCounter')

    def safe_get_max(app_name, model_name, field_name, prefix):
        max_num = 0
        try:
            model = apps.get_model(app_name, model_name)
            table_name = model._meta.db_table
            with schema_editor.connection.cursor() as cursor:
                cursor.execute("""
                    SELECT column_name FROM information_schema.columns 
                    WHERE table_name = %s AND column_name = %s;
                """, [table_name, field_name])
                if not cursor.fetchone():
                    return 0

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

    mst_max = safe_get_max('products', 'Product', 'display_id', 'MST-')
    sup_max = safe_get_max('supplies', 'Supply', 'supply_number', 'SUP-')
    ord_max = safe_get_max('orders', 'Order', 'order_number', 'ORD-')

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
