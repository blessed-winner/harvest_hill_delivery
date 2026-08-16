from django.core.management import call_command
from django.core.management.base import BaseCommand

class Command(BaseCommand):
    help = 'Seeds admin, farmer accounts, product catalog templates, and live harvest stock.'

    def handle(self, *args, **options):
        call_command('seed_data', *args, **options)
