from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from .models import Product, ProductRequest
from .serializers import ProductSerializer, ProductRequestSerializer
from .utils import delete_image_file

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

        raw_files = self.request.FILES.getlist('images') or self.request.FILES.getlist('image')
        files = [f for f in raw_files if f and getattr(f, 'size', 0) > 0]
        image_url = self.request.data.get('image_url', None) or self.request.data.get('image', None)

        if files:
            product = serializer.save()
            from .models import ProductImage
            created_pi_list = []
            for file in files:
                try:
                    pi = ProductImage.objects.create(product=product, image=file)
                    created_pi_list.append(pi)
                except Exception as img_err:
                    print(f"Failed to create ProductImage during create: {img_err}")
            if created_pi_list and created_pi_list[0].image:
                product.image = created_pi_list[0].image
                product.save(update_fields=['image'])
        elif image_url and isinstance(image_url, str):
            clean_path = image_url
            if '/media/' in clean_path:
                clean_path = clean_path.split('/media/')[-1]
            product = serializer.save(image=clean_path)
            from .models import ProductImage
            if not product.gallery_images.exists():
                try:
                    ProductImage.objects.create(product=product, image=clean_path)
                except Exception as img_err:
                    print(f"Failed to create ProductImage from url: {img_err}")
        else:
            product = serializer.save()

        if product.submission_deadline and product.submission_deadline >= today and product.status == 'closed':
            product.status = 'open'
            product.save(update_fields=['status'])
        from apps.common.utils import log_action
        log_action(self.request, actor=self.request.user, action="product_added", target_model="Product", target_id=product.id, target_name=product.name)

    def perform_update(self, serializer):
        from django.utils import timezone
        today = timezone.now().date()
        instance = self.get_object()

        raw_files = self.request.FILES.getlist('images') or self.request.FILES.getlist('image')
        files = [f for f in raw_files if f and getattr(f, 'size', 0) > 0]
        image_url = self.request.data.get('image_url', None) or self.request.data.get('image', None)

        if files:
            if instance.image:
                try:
                    delete_image_file(instance.image)
                except Exception:
                    pass
            instance = serializer.save()
            from .models import ProductImage
            instance.gallery_images.all().delete()
            created_pi_list = []
            for file in files:
                try:
                    pi = ProductImage.objects.create(product=instance, image=file)
                    created_pi_list.append(pi)
                except Exception as img_err:
                    print(f"Failed to create ProductImage during update: {img_err}")
            if created_pi_list and created_pi_list[0].image:
                instance.image = created_pi_list[0].image
                instance.save(update_fields=['image'])
        elif image_url and isinstance(image_url, str):
            clean_path = image_url
            if '/media/' in clean_path:
                clean_path = clean_path.split('/media/')[-1]
            instance = serializer.save(image=clean_path)
            from .models import ProductImage
            if not instance.gallery_images.exists():
                try:
                    ProductImage.objects.create(product=instance, image=clean_path)
                except Exception as img_err:
                    print(f"Failed to create ProductImage from url: {img_err}")
        else:
            instance = serializer.save()

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
        from rest_framework.response import Response
        return Response({"detail": f"Product '{instance.name}' restored successfully."}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], parser_classes=[JSONParser, MultiPartParser, FormParser])
    def delete_image(self, request, pk=None):
        """Deletes a MasterProduct gallery image or cover image from DB and Cloudinary storage."""
        try:
            product = self.get_object()
            image_id = request.data.get('image_id')
            image_url = request.data.get('image_url')

            from .models import ProductImage
            from .utils import delete_image_file
            from rest_framework.response import Response
            import uuid

            deleted = False

            if image_id and not str(image_id).startswith('img-'):
                try:
                    uuid_val = uuid.UUID(str(image_id))
                    img_obj = ProductImage.objects.filter(id=uuid_val, product=product).first()
                    if img_obj:
                        if img_obj.image:
                            try:
                                delete_image_file(img_obj.image)
                            except Exception:
                                pass
                        img_obj.delete()
                        deleted = True
                except (ValueError, TypeError, Exception):
                    pass

            if not deleted and image_url:
                clean_url = str(image_url).split('?')[0].replace('http://', '').replace('https://', '')
                url_key = clean_url.split('/')[-1].split('.')[0].lower() if '/' in clean_url else clean_url.lower()

                gallery_matches = ProductImage.objects.filter(product=product)
                for img in gallery_matches:
                    if img.image:
                        try:
                            g_url = str(img.image.url).split('?')[0].replace('http://', '').replace('https://', '')
                            g_key = g_url.split('/')[-1].split('.')[0].lower() if '/' in g_url else g_url.lower()
                            if (url_key and g_key and (g_key == url_key or g_key in url_key or url_key in g_key)) or img.image.name in clean_url or clean_url in g_url:
                                delete_image_file(img.image)
                                img.delete()
                                deleted = True
                                break
                        except Exception:
                            pass

                if product.image:
                    try:
                        c_url = str(product.image.url).split('?')[0].replace('http://', '').replace('https://', '')
                        c_key = c_url.split('/')[-1].split('.')[0].lower() if '/' in c_url else c_url.lower()
                        if (url_key and c_key and (c_key == url_key or c_key in url_key or url_key in c_key)) or product.image.name in clean_url or clean_url in c_url:
                            delete_image_file(product.image)
                            next_img = product.gallery_images.first()
                            if next_img:
                                product.image = next_img.image
                            else:
                                product.image = None
                            product.save(update_fields=['image'])
                            deleted = True
                    except Exception:
                        pass

            from .serializers import ProductSerializer
            return Response(ProductSerializer(product, context={'request': request}).data, status=status.HTTP_200_OK)
        except Exception as err:
            print("Failed to delete_image:", err)
            from rest_framework.response import Response
            return Response({"detail": str(err)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], parser_classes=[MultiPartParser, FormParser])
    def upload_images(self, request, pk=None):
        """Uploads new MasterProduct gallery images and updates cover image if not set."""
        product = self.get_object()
        raw_files = request.FILES.getlist('images') or request.FILES.getlist('image')
        files = [f for f in raw_files if f and getattr(f, 'size', 0) > 0]

        from .models import ProductImage
        from rest_framework.response import Response

        for file in files:
            try:
                ProductImage.objects.create(product=product, image=file)
            except Exception as e:
                print(f"Failed to create ProductImage during upload_images: {e}")

        if not product.image and files:
            first_img = product.gallery_images.first()
            if first_img:
                product.image = first_img.image
                product.save(update_fields=['image'])

        from .serializers import ProductSerializer
        return Response(ProductSerializer(product, context={'request': request}).data, status=status.HTTP_200_OK)


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

