from django.urls import path
from .farmer_views import (
    FarmerDashboardSummaryView,
    FarmerDashboardSupplyVolumeView,
    FarmerDashboardEarningsView
)

urlpatterns = [
    path('dashboard/summary/', FarmerDashboardSummaryView.as_view(), name='farmer_dashboard_summary'),
    path('dashboard/supply-volume/', FarmerDashboardSupplyVolumeView.as_view(), name='farmer_dashboard_supply_volume'),
    path('dashboard/earnings-by-category/', FarmerDashboardEarningsView.as_view(), name='farmer_dashboard_earnings'),
]
