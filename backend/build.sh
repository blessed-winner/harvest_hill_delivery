#!/usr/bin/env bash
# exit on error
set -o errexit

pip install --upgrade pip
pip install -r requirements.txt

python manage.py collectstatic --no-input

# Direct DB repair for django_migrations history before running Django manage.py migrate
python fix_migrations_psycopg.py || true

python manage.py migrate --no-input
