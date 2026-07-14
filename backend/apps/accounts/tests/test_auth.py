from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase
from datetime import timedelta, timezone as datetime_timezone
from rest_framework_simplejwt.tokens import RefreshToken

from apps.products.models import Product
from apps.supplies.models import Supply

User = get_user_model()

class AuthenticationTestCase(APITestCase):

    def setUp(self):
        # Create users
        self.farmer1 = User.objects.create_user(
            email='farmer1@test.com',
            password='Password123!',
            role='farmer'
        )
        self.farmer2 = User.objects.create_user(
            email='farmer2@test.com',
            password='Password123!',
            role='farmer'
        )
        self.client_user = User.objects.create_user(
            email='client@test.com',
            password='Password123!',
            role='client'
        )
        
        # Create a product and supplies
        self.product = Product.objects.create(name='Organic Strawberries', category='Fruits')
        self.supply1 = Supply.objects.create(
            farmer=self.farmer1.farmer_profile,
            product=self.product,
            quantity=100.0,
            price=3.50,
            status='pending'
        )
        self.supply2 = Supply.objects.create(
            farmer=self.farmer2.farmer_profile,
            product=self.product,
            quantity=200.0,
            price=4.00,
            status='pending'
        )

    def test_login_success(self):
        url = reverse('login')
        data = {'username_or_email': 'farmer1@test.com', 'password': 'Password123!'}
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        self.assertEqual(response.data['user']['email'], 'farmer1@test.com')

    def test_login_failed(self):
        url = reverse('login')
        data = {'username_or_email': 'farmer1@test.com', 'password': 'WrongPassword!'}
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('errors', response.data)

    def test_account_lockout_after_5_attempts(self):
        url = reverse('login')
        data = {'username_or_email': 'farmer1@test.com', 'password': 'WrongPassword!'}
        
        # 5 failed attempts
        for _ in range(5):
            response = self.client.post(url, data, format='json')
            self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
            
        # 6th attempt should return account locked error
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('errors', response.data)
        self.assertIn('locked', response.data['errors']['non_field_errors'][0])

    def test_token_refresh(self):
        # First log in to get a refresh token
        url_login = reverse('login')
        data_login = {'username_or_email': 'farmer1@test.com', 'password': 'Password123!'}
        response_login = self.client.post(url_login, data_login, format='json')
        refresh_token = response_login.data['refresh']
        
        # Perform refresh
        url_refresh = reverse('token_refresh')
        data_refresh = {'refresh': refresh_token}
        response_refresh = self.client.post(url_refresh, data_refresh, format='json')
        
        self.assertEqual(response_refresh.status_code, status.HTTP_200_OK)
        self.assertIn('access', response_refresh.data)

    def test_token_blacklist_on_logout(self):
        # Log in
        url_login = reverse('login')
        data_login = {'username_or_email': 'farmer1@test.com', 'password': 'Password123!'}
        response_login = self.client.post(url_login, data_login, format='json')
        access_token = response_login.data['access']
        refresh_token = response_login.data['refresh']
        
        # Log out
        url_logout = reverse('logout')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        response_logout = self.client.post(url_logout, {'refresh': refresh_token}, format='json')
        self.assertEqual(response_logout.status_code, status.HTTP_200_OK)
        
        # Attempt to use blacklisted refresh token
        url_refresh = reverse('token_refresh')
        response_refresh = self.client.post(url_refresh, {'refresh': refresh_token}, format='json')
        self.assertEqual(response_refresh.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_queryset_scoping_prevent_leakage(self):
        # Log in as farmer1
        url_login = reverse('login')
        data_login = {'username_or_email': 'farmer1@test.com', 'password': 'Password123!'}
        response_login = self.client.post(url_login, data_login, format='json')
        access_token = response_login.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        
        # Retrieve supply1 (should succeed as owner)
        url_detail_self = reverse('supply-detail', kwargs={'pk': self.supply1.id})
        response_self = self.client.get(url_detail_self)
        self.assertEqual(response_self.status_code, status.HTTP_200_OK)
        
        # Retrieve supply2 (owned by farmer2, should return 404 Not Found due to queryset scoping)
        url_detail_other = reverse('supply-detail', kwargs={'pk': self.supply2.id})
        response_other = self.client.get(url_detail_other)
        self.assertEqual(response_other.status_code, status.HTTP_404_NOT_FOUND)

    def test_remember_me_dynamic_lifetimes(self):
        url_login = reverse('login')
        
        # Test 1: login with remember_me=True
        data_remember = {
            'username_or_email': 'farmer1@test.com',
            'password': 'Password123!',
            'remember_me': True
        }
        res_remember = self.client.post(url_login, data_remember, format='json')
        self.assertEqual(res_remember.status_code, status.HTTP_200_OK)
        
        refresh_remember = RefreshToken(res_remember.data['refresh'])
        # Refresh token expiration should be around 30 days from now
        exp_remember = refresh_remember['exp']
        expected_days = (timezone.datetime.fromtimestamp(exp_remember, tz=datetime_timezone.utc) - timezone.now()).days
        self.assertTrue(29 <= expected_days <= 31)

        # Test 2: login with remember_me=False
        data_no_remember = {
            'username_or_email': 'farmer1@test.com',
            'password': 'Password123!',
            'remember_me': False
        }
        res_no_remember = self.client.post(url_login, data_no_remember, format='json')
        self.assertEqual(res_no_remember.status_code, status.HTTP_200_OK)
        
        refresh_no_remember = RefreshToken(res_no_remember.data['refresh'])
        # Refresh token expiration should be around 30 minutes from now (0 days difference)
        exp_no_remember = refresh_no_remember['exp']
        expected_minutes = int((timezone.datetime.fromtimestamp(exp_no_remember, tz=datetime_timezone.utc) - timezone.now()).total_seconds() / 60)
        self.assertTrue(25 <= expected_minutes <= 35)

        # Test 3: refresh token rotation preserves expiration
        url_refresh = reverse('token_refresh')
        res_refresh = self.client.post(url_refresh, {'refresh': str(refresh_remember)}, format='json')
        self.assertEqual(res_refresh.status_code, status.HTTP_200_OK)
        self.assertIn('refresh', res_refresh.data)
        
        new_refresh = RefreshToken(res_refresh.data['refresh'])
        # Expiration must match the original one exactly
        self.assertEqual(new_refresh['exp'], exp_remember)
