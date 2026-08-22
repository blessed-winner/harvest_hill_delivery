from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
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
        # Auto-close open templates whose submission deadline has passed
        from django.utils import timezone
        today = timezone.now().date()
        Product.objects.filter(status='open', submission_deadline__lt=today).update(status='closed')
        # Auto-reopen closed templates whose submission deadline has been extended/updated to today or a future date
        Product.objects.filter(status='closed', submission_deadline__gte=today).update(status='open')

        queryset = super().get_queryset()
        status_param = self.request.query_params.get('status', None)
        search = self.request.query_params.get('search', None)
        is_currently_needed = self.request.query_params.get('is_currently_needed', None)

        # For farmers/non-admins, strictly show OPEN requirements
        if not self.request.user.is_authenticated or getattr(self.request.user, 'role', '') != 'admin':
            queryset = queryset.filter(status='open')
        elif status_param and status_param != 'all':
            queryset = queryset.filter(status=status_param)

        if is_currently_needed is not None:
            val = is_currently_needed.lower() in ['true', '1']
            queryset = queryset.filter(is_currently_needed=val)

        if search:
            queryset = queryset.filter(name__icontains=search)

        return queryset.order_by('-created_at')

    def perform_create(self, serializer):
        from django.utils import timezone
        today = timezone.now().date()
        product = serializer.save()
        if product.submission_deadline and product.submission_deadline >= today and product.status == 'closed':
            product.status = 'open'
            product.save(update_fields=['status'])
        from apps.common.utils import log_action
        log_action(self.request, actor=self.request.user, action="product_added", target_model="Product", target_id=product.id, target_name=product.name)

    def perform_update(self, serializer):
        from django.utils import timezone
        today = timezone.now().date()

        # If a new image is being uploaded, delete the old one from Cloudinary
        if 'image' in self.request.FILES:
            instance = self.get_object()
            if instance.image:
                delete_cloudinary_image(instance.image)
            instance = serializer.save(image=self.request.FILES['image'])
        else:
            instance = serializer.save()

        # Auto-reopen requirement status to 'open' if submission_deadline is updated to today or a future date
        if instance.submission_deadline and instance.submission_deadline >= today and instance.status == 'closed':
            instance.status = 'open'
            instance.save(update_fields=['status'])

    def perform_destroy(self, instance):
        """Soft-delete (archive) MasterProduct / Product Requirement instead of permanent deletion."""
        from django.utils import timezone
        prod_id = instance.id
        prod_name = instance.name
        instance.status = 'archived'
        instance.archived_at = timezone.now()
        instance.save(update_fields=['status', 'archived_at'])
        from apps.common.utils import log_action
        log_action(self.request, actor=self.request.user, action="product_archived", target_model="Product", target_id=prod_id, target_name=prod_name)

    from rest_framework.decorators import action
    @action(detail=True, methods=['post'])
    def restore(self, request, pk=None):
        """Restore an archived product back to open/draft status."""
        instance = self.get_object()
        instance.status = 'open'
        instance.archived_at = None
        instance.save(update_fields=['status', 'archived_at'])
        from apps.common.utils import log_action
        log_action(request, actor=request.user, action="product_restored", target_model="Product", target_id=instance.id, target_name=instance.name)
        return Response({"detail": f"Product '{instance.name}' restored successfully."}, status=status.HTTP_200_OK)


class FreshDealViewSet(viewsets.ModelViewSet):
    from .models import FreshDeal
    from .serializers import FreshDealSerializer
    queryset = FreshDeal.objects.all().order_by('-created_at')
    serializer_class = FreshDealSerializer
    permission_classes = [IsAdminOrReadOnly]

    def get_queryset(self):
        queryset = super().get_queryset()
        master_product_id = self.request.query_params.get('master_product', None)
        status_param = self.request.query_params.get('status', None)
        if master_product_id:
            queryset = queryset.filter(master_product_id=master_product_id)
        if status_param:
            queryset = queryset.filter(status=status_param)
        return queryset

    def perform_create(self, serializer):
        # Abort any currently ACTIVE fresh deal for this master product before creating new active one
        master_product = serializer.validated_data.get('master_product')
        status_val = serializer.validated_data.get('status', 'ACTIVE')
        if master_product and status_val == 'ACTIVE':
            from django.utils import timezone
            FreshDeal.objects.filter(master_product=master_product, status='ACTIVE').update(status='ABORTED', ends_at=timezone.now())
            # Also update legacy is_discounted fields on MasterProduct
            master_product.is_discounted = True
            disc_val = serializer.validated_data.get('discount_value', 0)
            disc_type = serializer.validated_data.get('discount_type', 'FIXED')
            base = float(master_product.price)
            if disc_type == 'PERCENTAGE':
                master_product.discount_price = base * (1.0 - (float(disc_val) / 100.0))
            else:
                master_product.discount_price = max(0.0, base - float(disc_val))
            master_product.save(update_fields=['is_discounted', 'discount_price'])
        serializer.save()

    @action(detail=True, methods=['post'])
    def abort(self, request, pk=None):
        """End/Abort active deal immediately."""
        deal = self.get_object()
        from django.utils import timezone
        deal.status = 'ABORTED'
        deal.ends_at = timezone.now()
        deal.save(update_fields=['status', 'ends_at'])
        master_prod = deal.master_product
        if master_prod:
            master_prod.is_discounted = False
            master_prod.save(update_fields=['is_discounted'])
        return Response({"detail": "Fresh deal aborted successfully. Normal pricing restored."}, status=status.HTTP_200_OK)

    def perform_destroy(self, instance):
        """Soft-delete (archive) FreshDeal instead of permanent deletion."""
        from django.utils import timezone
        instance.status = 'ARCHIVED'
        instance.archived_at = timezone.now()
        instance.save(update_fields=['status', 'archived_at'])


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
                            title="Client Product Requests Need Attention",
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

