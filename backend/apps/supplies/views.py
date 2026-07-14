from rest_framework import viewsets, serializers
from apps.common.mixins import RoleScopedQuerysetMixin
from .models import Supply

class SupplySerializer(serializers.ModelSerializer):
    class Meta:
        model = Supply
        fields = ['id', 'quantity', 'price', 'status']


class SupplyViewSet(RoleScopedQuerysetMixin, viewsets.ModelViewSet):
    queryset = Supply.objects.all()
    serializer_class = SupplySerializer
