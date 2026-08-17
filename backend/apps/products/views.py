from rest_framework import viewsets, permissions, status
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from .models import Product, ProductRequest
from .serializers import ProductSerializer, ProductRequestSerializer
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

    def perform_create(self, serializer):
        product = serializer.save()
        from apps.common.utils import log_action
        log_action(self.request, actor=self.request.user, action="product_added", target_model="Product", target_id=product.id, target_name=product.name)

    def perform_update(self, serializer):
        # If a new image is being uploaded, delete the old one from Cloudinary
        if 'image' in self.request.FILES:
            instance = self.get_object()
            if instance.image:
                delete_cloudinary_image(instance.image)
            instance = serializer.save(image=self.request.FILES['image'])
        else:
            instance = serializer.save()

        # Update all active supplies under this product to match the new base_price!
        if instance.base_price and float(instance.base_price) > 0:
            new_price = instance.base_price
            instance.supplies.filter(is_archived=False).update(price=new_price, agreed_price=new_price)

    def perform_destroy(self, instance):
        prod_id = instance.id
        prod_name = instance.name
        from apps.common.utils import log_action
        instance.delete()
        log_action(self.request, actor=self.request.user, action="product_removed", target_model="Product", target_id=prod_id, target_name=prod_name)


class ProductRequestViewSet(viewsets.ModelViewSet):
    serializer_class = ProductRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return ProductRequest.objects.all().order_by('-created_at')
        elif user.role == 'farmer':
            return ProductRequest.objects.filter(status='approved').order_by('-created_at')
        elif user.role == 'client':
            return ProductRequest.objects.filter(client=user.client_profile).order_by('-created_at')
        return ProductRequest.objects.none()

    def perform_create(self, serializer):
        if self.request.user.role == 'client':
            instance = serializer.save(client=self.request.user.client_profile)

            # Check total pending product requests count
            pending_count = ProductRequest.objects.filter(status='pending').count()
            if pending_count >= 6:
                try:
                    from apps.notifications.utils import send_live_notification
                    from apps.accounts.models import User

                    admins = User.objects.filter(role='admin')
                    for admin in admins:
                        send_live_notification(
                            user=admin,
                            title="📋 Client Product Requests Need Attention",
                            message=f"There are currently {pending_count} pending client product requests requiring review and approval in the Product Catalog manager."
                        )
                except Exception as e:
                    print(f"Failed to send admin request threshold notification: {e}")
        else:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only clients can create product requests.")

    def perform_update(self, serializer):
        if self.request.user.role == 'client':
            serializer.save(status='pending')
        else:
            serializer.save()

