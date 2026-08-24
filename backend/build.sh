#!/usr/bin/env bash
# exit on error
set -o errexit

pip install --upgrade pip
pip install -r requirements.txt

python manage.py collectstatic --no-input

# Auto-repair inconsistent migration history entries in django_migrations if present
python manage.py shell -c "
from django.db import connection
try:
    with connection.cursor() as cursor:
        cursor.execute(\"SELECT name FROM django_migrations WHERE app='products'\")
        applied = {row[0] for row in cursor.fetchall()}
        if '0003_alter_product_image' in applied and '0002_product_created_at_product_description' not in applied:
            cursor.execute(\"INSERT INTO django_migrations (app, name, applied) VALUES ('products', '0002_product_created_at_product_description', NOW())\")
            print('Auto-repaired products 0002 migration history in django_migrations!')
except Exception as e:
    print('Migration history check:', e)
" || true

python manage.py migrate --no-input
