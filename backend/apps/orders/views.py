from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from apps.common.mixins import RoleScopedQuerysetMixin
from .models import Order
from .serializers import OrderSerializer

class OrderViewSet(RoleScopedQuerysetMixin, viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = OrderSerializer
    queryset = Order.objects.all().order_by('-created_at')

    def perform_create(self, serializer):
        if self.request.user.role == 'client':
            serializer.save(client=self.request.user.client_profile)
        else:
            serializer.save()
