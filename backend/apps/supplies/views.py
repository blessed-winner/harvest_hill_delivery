from rest_framework import viewsets, serializers
from apps.common.mixins import RoleScopedQuerysetMixin
from apps.products.serializers import ProductShortSerializer
from .models import Supply

class SupplySerializer(serializers.ModelSerializer):
    proposed_price = serializers.DecimalField(source='price', max_digits=10, decimal_places=2)
    product_detail = ProductShortSerializer(source='product', read_only=True)

    class Meta:
        model = Supply
        fields = [
            'id', 'product', 'product_detail', 'quantity', 'proposed_price', 
            'status', 'available_date', 'quality_grade', 'notes', 'photo', 'created_at'
        ]
        read_only_fields = ['status', 'created_at']


class SupplyViewSet(RoleScopedQuerysetMixin, viewsets.ModelViewSet):
    queryset = Supply.objects.all()
    serializer_class = SupplySerializer

    def perform_create(self, serializer):
        serializer.save(farmer=self.request.user.farmer_profile)
