from rest_framework.routers import DefaultRouter
from .views import SupplyViewSet

router = DefaultRouter()
router.register(r'', SupplyViewSet, basename='supply')

urlpatterns = router.urls
