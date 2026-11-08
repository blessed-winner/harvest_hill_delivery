from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase
from apps.products.models import Product

User = get_user_model()

class AdminAPITestCase(APITestCase):
    def setUp(self):
        # Create users
        self.admin = User.objects.create_user(
            username='admin_test',
            email='admin@harvesthill.test',
            password='Adminpass123!',
            role='admin',
            is_staff=True,
            is_superuser=True
        )
        self.farmer = User.objects.create_user(
            username='farmer_test',
            email='farmer@farms.test',
            password='Farmerpass123!',
            role='farmer'
        )
        self.client_user = User.objects.create_user(
            username='client_test',
            email='client@greens.test',
            password='Clientpass123!',
            role='client'
        )

    def test_admin_user_management_permissions(self):
        url = reverse('admin-users-list')
        
        # Test 1: Anonymous fails
        res = self.client.get(url)
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)
        
        # Test 2: Farmer fails
        self.client.force_authenticate(user=self.farmer)
        res = self.client.get(url)
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
        
        # Test 3: Admin succeeds
        self.client.force_authenticate(user=self.admin)
        res = self.client.get(url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 2) # farmer, client (admin excluded)

    def test_admin_user_deactivation(self):
        url_detail = reverse('admin-users-detail', kwargs={'pk': self.farmer.id})
        self.client.force_authenticate(user=self.admin)
        
        # Suspend farmer
        res = self.client.patch(url_detail, {'is_active': False}, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        
        self.farmer.refresh_from_db()
        self.assertFalse(self.farmer.is_active)

    def test_admin_dashboard_summary(self):
        url = reverse('admin-dashboard')
        self.client.force_authenticate(user=self.admin)
        res = self.client.get(url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('kpis', res.data)
        self.assertIn('order_volume', res.data)
        self.assertIn('status_data', res.data)
        self.assertIn('top_products', res.data)

    def test_admin_product_crud_permissions(self):
        url_list = reverse('product-list')
        
        # Test 1: Farmer fails to create product
        self.client.force_authenticate(user=self.farmer)
        data = {
            'name': 'Gala Apples',
            'category': 'Fruits',
            'unit': 'lbs',
            'base_price': '1.50',
            'offered_price': '1.50',
            'quantity_needed': 10
        }
        res = self.client.post(url_list, data, format='json')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
        
        # Test 2: Admin succeeds
        self.client.force_authenticate(user=self.admin)
        res = self.client.post(url_list, data, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Product.objects.count(), 1)

    def test_homepage_feature_cards_defaults_and_public_retrieval(self):
        url = reverse('homepage-feature-cards')
        # Public unauthenticated GET
        res = self.client.get(url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIsInstance(res.data, list)
        self.assertEqual(len(res.data), 5)
        self.assertEqual(res.data[0]['title'], "Peak Season")
        self.assertEqual(res.data[0]['eyebrow'], "IN HARVEST")

        # Also via system-settings
        settings_url = reverse('system-settings')
        res_settings = self.client.get(settings_url)
        self.assertEqual(res_settings.status_code, status.HTTP_200_OK)
        self.assertIn('homepage_feature_cards', res_settings.data)
        self.assertEqual(len(res_settings.data['homepage_feature_cards']), 5)

    def test_admin_can_update_homepage_feature_cards(self):
        url = reverse('homepage-feature-cards')
        new_cards = [
            {
                "id": "card-1",
                "title": "Fresh Strawberries",
                "eyebrow": "SWEET PICK",
                "description": "Picked this morning",
                "link": "Fruits",
                "image": "https://images.unsplash.com/photo-1464965911861-746a04b4bca6",
                "order": 1,
                "is_active": True,
            },
            {
                "id": "card-2",
                "title": "Farm Potatoes",
                "eyebrow": "STAPLES",
                "description": "Best wholesale bulk rate",
                "link": "Vegetables",
                "image": "https://images.unsplash.com/photo-1518977676601-b53f82aba655",
                "order": 2,
                "is_active": False,
            }
        ]

        # Farmer cannot update
        self.client.force_authenticate(user=self.farmer)
        res_farmer = self.client.post(url, {"cards": new_cards}, format='json')
        self.assertEqual(res_farmer.status_code, status.HTTP_403_FORBIDDEN)

        # Admin can update
        self.client.force_authenticate(user=self.admin)
        res_admin = self.client.post(url, {"cards": new_cards}, format='json')
        self.assertEqual(res_admin.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res_admin.data['cards']), 2)

        # Anonymous gets only active cards when active_only=true
        self.client.force_authenticate(user=None)
        res_active = self.client.get(f"{url}?active_only=true")
        self.assertEqual(res_active.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res_active.data), 1)
        self.assertEqual(res_active.data[0]['title'], "Fresh Strawberries")

    def test_homepage_feature_cards_validation_rejects_missing_title_or_image(self):
        url = reverse('homepage-feature-cards')
        self.client.force_authenticate(user=self.admin)

        # Missing title
        res_missing_title = self.client.post(url, {"cards": [{"title": "", "image": "http://img.jpg"}]}, format='json')
        self.assertEqual(res_missing_title.status_code, status.HTTP_400_BAD_REQUEST)

        # Missing image
        res_missing_image = self.client.post(url, {"cards": [{"title": "Valid Title", "image": ""}]}, format='json')
        self.assertEqual(res_missing_image.status_code, status.HTTP_400_BAD_REQUEST)

