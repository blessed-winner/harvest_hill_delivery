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
            order = serializer.save(client=self.request.user.client_profile)
        else:
            order = serializer.save()
        from apps.common.utils import log_action
        log_action(self.request, actor=self.request.user, action="order_placed", target_model="Order", target_id=order.id, target_name=f"Order #{order.order_number}")

    def perform_update(self, serializer):
        old_status = self.get_object().status
        order = serializer.save()
        if order.status == 'delivered' and old_status != 'delivered':
            from apps.common.utils import log_action
            log_action(self.request, actor=self.request.user, action="order_delivered", target_model="Order", target_id=order.id, target_name=f"Order #{order.order_number}")

    def perform_destroy(self, instance):
        """Soft-delete (cancel / archive) Order instead of permanent deletion."""
        instance.status = 'cancelled'
        instance.is_archived = True
        instance.save(update_fields=['status', 'is_archived'])
        from apps.common.utils import log_action
        log_action(self.request, actor=self.request.user, action="order_cancelled", target_model="Order", target_id=instance.id, target_name=f"Order #{instance.order_number}")
