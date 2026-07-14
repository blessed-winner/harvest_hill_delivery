from rest_framework import viewsets
from .models import Product
from .serializers import ProductSerializer

class ProductViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        is_currently_needed = self.request.query_params.get('is_currently_needed', None)
        if is_currently_needed is not None:
            val = is_currently_needed.lower() in ['true', '1']
            queryset = queryset.filter(is_currently_needed=val)
        return queryset
