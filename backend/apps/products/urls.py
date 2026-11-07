from rest_framework.routers import DefaultRouter
from .views import ProductViewSet, ProductRequestViewSet, FreshDealViewSet, MediaAssetViewSet

router = DefaultRouter()
router.register(r'requests', ProductRequestViewSet, basename='productrequest')
router.register(r'fresh-deals', FreshDealViewSet, basename='freshdeal')
router.register(r'media', MediaAssetViewSet, basename='media')
router.register(r'', ProductViewSet, basename='product')

urlpatterns = router.urls
