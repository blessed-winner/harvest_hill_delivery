from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DeliveryNoteViewSet

router = DefaultRouter()
router.register('', DeliveryNoteViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
