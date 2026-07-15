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
            email='admin@harvesthill.test',
            password='Adminpass123!',
            role='admin',
            is_staff=True,
            is_superuser=True
        )
        self.farmer = User.objects.create_user(
            email='farmer@farms.test',
            password='Farmerpass123!',
            role='farmer'
        )
        self.client_user = User.objects.create_user(
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
            'base_price': '1.50'
        }
        res = self.client.post(url_list, data, format='json')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
        
        # Test 2: Admin succeeds
        self.client.force_authenticate(user=self.admin)
        res = self.client.post(url_list, data, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Product.objects.count(), 1)
