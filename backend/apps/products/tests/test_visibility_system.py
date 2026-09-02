from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from apps.accounts.models import User, ClientProfile
from apps.products.models import Product

class MasterProductVisibilityTestCase(TestCase):
    def setUp(self):
        self.client_api = APIClient()

        # Users
        self.admin_user = User.objects.create_user(
            username='admin_user',
            email='admin@harvesthill.rw',
            password='Password123!',
            role='admin'
        )

        self.client_user_a = User.objects.create_user(
            username='client_a',
            email='clienta@example.com',
            password='Password123!',
            role='client'
        )
        self.client_profile_a, _ = ClientProfile.objects.get_or_create(
            user=self.client_user_a,
            defaults={'business_name': "Client Alpha Ltd"}
        )

        self.client_user_b = User.objects.create_user(
            username='client_b',
            email='clientb@example.com',
            password='Password123!',
            role='client'
        )
        self.client_profile_b, _ = ClientProfile.objects.get_or_create(
            user=self.client_user_b,
            defaults={'business_name': "Client Beta Ltd"}
        )

        # Master Products
        self.prod_harvest_hill_only = Product.objects.create(
            name="Harvest Hill Internal Crop",
            category="Vegetables",
            unit="kg",
            base_price=1000,
            quantity_needed=100,
            status='open',
            visibility_scope='HARVEST_HILL_ONLY'
        )

        self.prod_specific_clients = Product.objects.create(
            name="Exclusive VIP Crop",
            category="Fruits",
            unit="kg",
            base_price=2500,
            quantity_needed=50,
            status='open',
            visibility_scope='SPECIFIC_CLIENTS'
        )
        self.prod_specific_clients.target_clients.add(self.client_profile_a)

        self.prod_registered_clients = Product.objects.create(
            name="Wholesale Members Crop",
            category="Grains",
            unit="kg",
            base_price=800,
            quantity_needed=500,
            status='open',
            visibility_scope='REGISTERED_CLIENTS'
        )

        self.prod_public = Product.objects.create(
            name="Public Marketplace Crop",
            category="Vegetables",
            unit="kg",
            base_price=1200,
            quantity_needed=200,
            status='open',
            visibility_scope='PUBLIC'
        )

    def test_harvest_hill_only_visibility(self):
        # Guest
        res = self.client_api.get('/api/client/products/')
        ids = [p['id'] for p in res.data.get('results', [])]
        self.assertNotIn(str(self.prod_harvest_hill_only.id), ids)
        res_detail = self.client_api.get(f'/api/client/products/{self.prod_harvest_hill_only.id}/')
        self.assertEqual(res_detail.status_code, status.HTTP_404_NOT_FOUND)

        # Unselected Client B
        self.client_api.force_authenticate(user=self.client_user_b)
        res = self.client_api.get('/api/client/products/')
        ids = [p['id'] for p in res.data.get('results', [])]
        self.assertNotIn(str(self.prod_harvest_hill_only.id), ids)
        res_detail = self.client_api.get(f'/api/client/products/{self.prod_harvest_hill_only.id}/')
        self.assertEqual(res_detail.status_code, status.HTTP_404_NOT_FOUND)

        # Admin
        self.client_api.force_authenticate(user=self.admin_user)
        res_detail = self.client_api.get(f'/api/products/{self.prod_harvest_hill_only.id}/')
        self.assertEqual(res_detail.status_code, status.HTTP_200_OK)

    def test_specific_clients_visibility(self):
        # Guest
        self.client_api.logout()
        res = self.client_api.get('/api/client/products/')
        ids = [p['id'] for p in res.data.get('results', [])]
        self.assertNotIn(str(self.prod_specific_clients.id), ids)
        res_detail = self.client_api.get(f'/api/client/products/{self.prod_specific_clients.id}/')
        self.assertEqual(res_detail.status_code, status.HTTP_404_NOT_FOUND)

        # Unselected Client B -> Denied
        self.client_api.force_authenticate(user=self.client_user_b)
        res = self.client_api.get('/api/client/products/')
        ids = [p['id'] for p in res.data.get('results', [])]
        self.assertNotIn(str(self.prod_specific_clients.id), ids)
        res_detail = self.client_api.get(f'/api/client/products/{self.prod_specific_clients.id}/')
        self.assertEqual(res_detail.status_code, status.HTTP_404_NOT_FOUND)

        # Selected Client A -> Allowed
        self.client_api.force_authenticate(user=self.client_user_a)
        res = self.client_api.get('/api/client/products/')
        ids = [p['id'] for p in res.data.get('results', [])]
        self.assertIn(str(self.prod_specific_clients.id), ids)
        res_detail = self.client_api.get(f'/api/client/products/{self.prod_specific_clients.id}/')
        self.assertEqual(res_detail.status_code, status.HTTP_200_OK)

    def test_registered_clients_visibility(self):
        # Guest -> Denied
        self.client_api.logout()
        res = self.client_api.get('/api/client/products/')
        ids = [p['id'] for p in res.data.get('results', [])]
        self.assertNotIn(str(self.prod_registered_clients.id), ids)
        res_detail = self.client_api.get(f'/api/client/products/{self.prod_registered_clients.id}/')
        self.assertEqual(res_detail.status_code, status.HTTP_404_NOT_FOUND)

        # Authenticated Client B -> Allowed
        self.client_api.force_authenticate(user=self.client_user_b)
        res = self.client_api.get('/api/client/products/')
        ids = [p['id'] for p in res.data.get('results', [])]
        self.assertIn(str(self.prod_registered_clients.id), ids)
        res_detail = self.client_api.get(f'/api/client/products/{self.prod_registered_clients.id}/')
        self.assertEqual(res_detail.status_code, status.HTTP_200_OK)

    def test_public_visibility(self):
        # Guest -> Allowed
        self.client_api.logout()
        res = self.client_api.get('/api/client/products/')
        ids = [p['id'] for p in res.data.get('results', [])]
        self.assertIn(str(self.prod_public.id), ids)
        res_detail = self.client_api.get(f'/api/client/products/{self.prod_public.id}/')
        self.assertEqual(res_detail.status_code, status.HTTP_200_OK)

        # Authenticated Client -> Allowed
        self.client_api.force_authenticate(user=self.client_user_a)
        res = self.client_api.get('/api/client/products/')
        ids = [p['id'] for p in res.data.get('results', [])]
        self.assertIn(str(self.prod_public.id), ids)
        res_detail = self.client_api.get(f'/api/client/products/{self.prod_public.id}/')
        self.assertEqual(res_detail.status_code, status.HTTP_200_OK)

    def test_catalog_filtering_before_visibility(self):
        # A guest searches for "Crop" -> Should ONLY see Public Marketplace Crop
        self.client_api.logout()
        res = self.client_api.get('/api/client/products/?search=Crop')
        results = res.data.get('results', [])
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['id'], str(self.prod_public.id))

    def test_fresh_deals_visibility(self):
        from apps.products.models import FreshDeal

        # Create active fresh deals for HARVEST_HILL_ONLY and PUBLIC products
        deal_hh = FreshDeal.objects.create(
            master_product=self.prod_harvest_hill_only,
            discount_value=200,
            status='ACTIVE'
        )
        deal_pub = FreshDeal.objects.create(
            master_product=self.prod_public,
            discount_value=300,
            status='ACTIVE'
        )

        # Guest fetching fresh deals -> Should ONLY see deal_pub
        self.client_api.logout()
        res = self.client_api.get('/api/products/fresh-deals/')
        deal_ids = [d['id'] for d in res.data]
        self.assertIn(str(deal_pub.id), deal_ids)
        self.assertNotIn(str(deal_hh.id), deal_ids)
