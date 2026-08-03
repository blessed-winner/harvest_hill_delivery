from rest_framework.routers import DefaultRouter
from .views import ProductViewSet, ProductRequestViewSet

router = DefaultRouter()
router.register(r'requests', ProductRequestViewSet, basename='productrequest')
router.register(r'', ProductViewSet, basename='product')

urlpatterns = router.urls
