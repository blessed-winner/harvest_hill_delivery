from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

def root_health_check(request):
    return JsonResponse({
        "message": "Harvest Hill API is running",
        "status": "ok"
    })

from django.conf import settings
from django.views.static import serve
from django.urls import re_path

urlpatterns = [
    path('', root_health_check, name='root_health_check'),
    path('admin/', admin.site.urls),
    path('api/accounts/', include('apps.accounts.urls')),
    path('api/farmer/', include('apps.accounts.farmer_urls')),
    path('api/client/', include('apps.orders.client_urls')),
    path('api/negotiations/', include('apps.negotiations.urls')),
    path('api/products/', include('apps.products.urls')),
    path('api/supplies/', include('apps.supplies.urls')),
    path('api/orders/', include('apps.orders.urls')),
    path('api/delivery-notes/', include('apps.delivery_notes.urls')),
    path('api/', include('apps.invoices.urls')),
    path('api/notifications/', include('apps.notifications.urls')),
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/schema/swagger-ui/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    re_path(r'^media/(?P<path>.*)$', serve, {'document_root': settings.MEDIA_ROOT}),
]
