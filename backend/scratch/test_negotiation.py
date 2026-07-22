import os
import sys
import django

# Setup Django environment
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.base')
django.setup()

from apps.negotiations.models import NegotiationThread, NegotiationOffer
from apps.supplies.models import Supply
from apps.products.models import Product
from apps.accounts.models import FarmerProfile
from django.contrib.auth import get_user_model
from rest_framework.test import APIRequestFactory, force_authenticate
from apps.negotiations.views import NegotiationThreadViewSet

User = get_user_model()

def run_test():
    try:
        # Create test users
        farmer_user, _ = User.objects.get_or_create(username='test_farmer', defaults={'email': 'farmer@test.com', 'role': 'farmer'})
        client_user, _ = User.objects.get_or_create(username='test_client', defaults={'email': 'client@test.com', 'role': 'client'})
        
        farmer_profile, _ = FarmerProfile.objects.get_or_create(user=farmer_user, defaults={'farm_name': 'Test Farm', 'location': 'Kigali'})
        product, _ = Product.objects.get_or_create(name='Test Tomato', defaults={'category': 'Vegetables', 'is_currently_needed': True, 'urgency': 'high', 'base_price': 2.00})
        
        supply = Supply.objects.create(
            farmer=farmer_profile,
            product=product,
            quantity=100,
            price=2.50,
            status='pending'
        )
        
        thread = NegotiationThread.objects.create(supply=supply)
        print("Created test thread ID:", thread.id)

        factory = APIRequestFactory()
        view = NegotiationThreadViewSet.as_view({'post': 'offer'})

        # Test sending message only
        request = factory.post(f'/api/negotiations/threads/{thread.id}/offer/', {'message': 'Hello from client'}, format='json')
        force_authenticate(request, user=client_user)
        response = view(request, pk=thread.id)
        print("Response status code for message only:", response.status_code)
        if response.status_code != 200:
            print("Error data:", response.data)
        else:
            print("Offers in thread after message:", len(response.data['offers']))
            print("Last offer message:", response.data['offers'][-1]['message'])

        # Test sending proposal terms
        request2 = factory.post(f'/api/negotiations/threads/{thread.id}/offer/', {'price': 2.20, 'quantity': 150, 'message': 'New terms from client'}, format='json')
        force_authenticate(request2, user=client_user)
        response2 = view(request2, pk=thread.id)
        print("Response status code for counter terms:", response2.status_code)
        if response2.status_code != 200:
            print("Error data:", response2.data)
        else:
            print("Offers in thread after counter terms:", len(response2.data['offers']))
            print("Last offer price & message:", response2.data['offers'][-1]['price'], response2.data['offers'][-1]['message'])

        # Cleanup
        thread.delete()
        supply.delete()

    except Exception as e:
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    run_test()
