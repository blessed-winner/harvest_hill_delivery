from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    LoginView,
    CustomTokenRefreshView,
    LogoutView,
    PasswordResetRequestView,
    PasswordResetConfirmView,
    UserProfileView,
    RegisterView,
    GoogleOAuthView,
    AdminUserViewSet,
    AdminDashboardView,
    AdminReportsView,
    ChangePasswordView,
    FarmerApplicationSubmitView,
    AdminFarmerApplicationViewSet,
    SystemSettingsView
)

router = DefaultRouter()
router.register('admin/users', AdminUserViewSet, basename='admin-users')
router.register('admin/farmer-applications', AdminFarmerApplicationViewSet, basename='admin-farmer-applications')

urlpatterns = [
    path('', include(router.urls)),
    path('admin/dashboard/', AdminDashboardView.as_view(), name='admin-dashboard'),
    path('admin/reports/', AdminReportsView.as_view(), name='admin-reports'),
    path('system-settings/', SystemSettingsView.as_view(), name='system-settings'),
    path('login/', LoginView.as_view(), name='login'),
    path('google-login/', GoogleOAuthView.as_view(), name='google_login'),
    path('register/', RegisterView.as_view(), name='register'),
    path('farmer-applications/apply/', FarmerApplicationSubmitView.as_view(), name='farmer_application_apply'),
    path('token/refresh/', CustomTokenRefreshView.as_view(), name='token_refresh'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('me/', UserProfileView.as_view(), name='user_profile'),
    path('change-password/', ChangePasswordView.as_view(), name='change_password'),
    path('password-reset/', PasswordResetRequestView.as_view(), name='password_reset_request'),
    path('password-reset/confirm/', PasswordResetConfirmView.as_view(), name='password_reset_confirm'),
]
