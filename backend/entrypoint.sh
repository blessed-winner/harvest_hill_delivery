#!/bin/sh

set -e

# Wait for DB if DB_HOST is set
if [ -n "$DB_HOST" ]; then
    echo "Waiting for PostgreSQL database at $DB_HOST:$DB_PORT..."
    while ! nc -z $DB_HOST ${DB_PORT:-5432}; do
      sleep 1
    done
    echo "PostgreSQL is ready!"
fi

# Run Django database migrations
echo "Applying database migrations..."
python manage.py migrate --noinput

exec "$@"
