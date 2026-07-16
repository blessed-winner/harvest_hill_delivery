from rest_framework import viewsets, permissions
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from .models import Product
from .serializers import ProductSerializer
from .utils import delete_cloudinary_image

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
        # If a new image is being uploaded, delete the old one from Cloudinary
        if 'image' in self.request.FILES:
            instance = self.get_object()
            if instance.image:
                delete_cloudinary_image(instance.image)
            serializer.save(image=self.request.FILES['image'])
        else:
            # If no new image file was uploaded, don't overwrite the existing image
            serializer.save()
