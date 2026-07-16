"""
Client Portal URL Configuration
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .client_views import ClientDashboardViewSet, ClientOrderViewSet, ClientProductViewSet

router = DefaultRouter()
router.register(r'dashboard', ClientDashboardViewSet, basename='client-dashboard')
router.register(r'orders', ClientOrderViewSet, basename='client-orders')
router.register(r'products', ClientProductViewSet, basename='client-products')

urlpatterns = [
    path('', include(router.urls)),
]
