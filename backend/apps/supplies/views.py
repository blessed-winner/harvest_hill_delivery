from rest_framework import viewsets, serializers, permissions
from apps.common.mixins import RoleScopedQuerysetMixin
from apps.products.serializers import ProductShortSerializer
from .models import Supply

class SupplySerializer(serializers.ModelSerializer):
    proposed_price = serializers.DecimalField(source='price', max_digits=10, decimal_places=2, read_only=True)
    base_price = serializers.DecimalField(source='product.base_price', max_digits=10, decimal_places=2, read_only=True)
    product_detail = ProductShortSerializer(source='product', read_only=True)
    farmer_name = serializers.CharField(source='farmer.farm_name', read_only=True)
    farmer_location = serializers.CharField(source='farmer.location', read_only=True)
    unit = serializers.CharField(source='product.unit', read_only=True)

    class Meta:
        model = Supply
        fields = [
            'id', 'product', 'product_detail', 'quantity', 'unit', 'price', 'proposed_price', 'base_price', 
            'status', 'available_date', 'quality_grade', 'notes', 'photo', 'created_at',
            'farmer_name', 'farmer_location', 'is_archived'
        ]
        read_only_fields = ['created_at']

    def validate(self, attrs):
        # Only validate fields if they are provided (handles partial updates/PATCH cleanly)
        if 'price' in attrs:
            price = attrs['price']
            if float(price) <= 0:
                raise serializers.ValidationError({"price": "Price must be greater than zero."})
        elif not self.instance:
            raise serializers.ValidationError({"price": "Price is required."})

        if 'quantity' in attrs:
            quantity = attrs['quantity']
            if float(quantity) < 50:
                raise serializers.ValidationError({"quantity": "Quantity must be at least 50 kg."})
        elif not self.instance:
            raise serializers.ValidationError({"quantity": "Quantity is required."})

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

    def perform_update(self, serializer):
        old_status = self.get_object().status
        instance = serializer.save()
        new_status = instance.status
        
        # When supply is accepted, make the product visible in customer catalog
        if old_status != 'accepted' and new_status == 'accepted':
            product = instance.product
            product.is_currently_needed = True
            # Update the product image if supply has a photo and product doesn't
            if instance.photo and not product.image:
                product.image = instance.photo
            product.save()
        
        # When supply is rejected or archived, check if product should still be visible
        if new_status in ['rejected', 'delivered'] or instance.is_archived:
            product = instance.product
            # Check if there are other accepted, non-archived supplies for this product
            has_other_accepted = Supply.objects.filter(
                product=product,
                status='accepted',
                is_archived=False
            ).exclude(id=instance.id).exists()
            
            # If no other accepted supplies, hide the product from customer catalog
            if not has_other_accepted:
                product.is_currently_needed = False
                product.save()
