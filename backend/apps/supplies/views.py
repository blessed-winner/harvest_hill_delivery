from rest_framework import viewsets, serializers, permissions
from apps.common.mixins import RoleScopedQuerysetMixin
from apps.products.serializers import ProductShortSerializer
from .models import Supply

class SupplySerializer(serializers.ModelSerializer):
    proposed_price = serializers.DecimalField(source='price', max_digits=10, decimal_places=2, read_only=True)
    base_price = serializers.DecimalField(source='product.base_price', max_digits=10, decimal_places=2, read_only=True)
    product_detail = ProductShortSerializer(source='product', read_only=True)

    class Meta:
        model = Supply
        fields = [
            'id', 'product', 'product_detail', 'quantity', 'price', 'proposed_price', 'base_price', 
            'status', 'available_date', 'quality_grade', 'notes', 'photo', 'created_at'
        ]
        read_only_fields = ['created_at']

    def validate(self, attrs):
        quantity = attrs.get('quantity', 0)
        price = attrs.get('price', 0)
        if float(price) <= 0:
            raise serializers.ValidationError({"price": "Price must be greater than zero."})
        if float(quantity) < 50:
            raise serializers.ValidationError({"quantity": "Quantity must be at least 50 kg."})
        return attrs

class SupplyViewSet(RoleScopedQuerysetMixin, viewsets.ModelViewSet):
    queryset = Supply.objects.all()
    serializer_class = SupplySerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(farmer=self.request.user.farmer_profile)
        # Log supply submission in AuditLog
        from apps.common.utils import log_action
        status_val = serializer.instance.status
        action_name = "supply_draft_saved" if status_val == 'draft' else "supply_submitted"
        log_action(self.request, actor=self.request.user, action=action_name, target_model="Supply", target_id=serializer.instance.id)
