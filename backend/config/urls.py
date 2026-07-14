from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/accounts/', include('apps.accounts.urls')),
    path('api/farmer/', include('apps.accounts.farmer_urls')),
    path('api/negotiations/', include('apps.negotiations.urls')),
    path('api/products/', include('apps.products.urls')),
    path('api/supplies/', include('apps.supplies.urls')),
    path('api/', include('apps.invoices.urls')),
    path('api/notifications/', include('apps.notifications.urls')),
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/schema/swagger-ui/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
]
