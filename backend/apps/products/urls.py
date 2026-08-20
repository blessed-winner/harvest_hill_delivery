from rest_framework.routers import DefaultRouter
from .views import ProductViewSet, ProductRequestViewSet, FreshDealViewSet

router = DefaultRouter()
router.register(r'requests', ProductRequestViewSet, basename='productrequest')
router.register(r'fresh-deals', FreshDealViewSet, basename='freshdeal')
router.register(r'', ProductViewSet, basename='product')

urlpatterns = router.urls
