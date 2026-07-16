from rest_framework import viewsets, permissions
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from .models import Product
from .serializers import ProductSerializer

class IsAdminOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.is_authenticated and request.user.role == 'admin'

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [IsAdminOrReadOnly]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        queryset = super().get_queryset()
        search = self.request.query_params.get('search', None)
        is_currently_needed = self.request.query_params.get('is_currently_needed', None)
        if is_currently_needed is not None:
            val = is_currently_needed.lower() in ['true', '1']
            queryset = queryset.filter(is_currently_needed=val)
        if search:
            queryset = queryset.filter(name__icontains=search)
        return queryset

    def perform_update(self, serializer):
        # If no new image file was uploaded, don't overwrite the existing image
        if 'image' not in self.request.FILES:
            serializer.save()
        else:
            serializer.save(image=self.request.FILES['image'])
