from rest_framework.routers import DefaultRouter
from .views import NegotiationThreadViewSet

router = DefaultRouter()
router.register(r'threads', NegotiationThreadViewSet, basename='negotiation-thread')

urlpatterns = router.urls
