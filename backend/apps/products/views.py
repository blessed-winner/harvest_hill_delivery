from django.conf import settings
from django.db import models
from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from apps.common.permissions import IsAdmin
from .models import Product, ProductRequest, MediaAsset
from .serializers import ProductSerializer, ProductRequestSerializer, MediaAssetSerializer, _product_has_image
from .utils import delete_image_file


def _stored_image_name(image_url):
    """Resolve a public media URL to the file name stored on the ImageField.

    e.g. 'https://host/media/products/gallery/milk.webp' -> 'products/gallery/milk.webp'
    The extension is preserved so same-named files such as milk.png and
    milk.webp can never be confused with each other.
    """
    if not image_url:
        return ""
    clean = str(image_url).split('?')[0].split('#')[0].strip()
    media_url = getattr(settings, 'MEDIA_URL', '') or '/media/'
    if not media_url.endswith('/'):
        media_url += '/'
    if media_url in clean:
        return clean.split(media_url, 1)[1].lstrip('/')
    if '/media/' in clean:
        return clean.rsplit('/media/', 1)[1].lstrip('/')
    return clean.lstrip('/')


def _get_list_from_data(data, key):
    if not data:
        return []
    if hasattr(data, 'getlist'):
        res = data.getlist(key) or data.getlist(f'{key}[]')
        if res:
            return [x for x in res if x]
    val = data.get(key) if hasattr(data, 'get') else None
    if not val and hasattr(data, 'get'):
        val = data.get(f'{key}[]')
    if val is None:
        return []
    if isinstance(val, (list, tuple)):
        return [x for x in val if x]
    return [val] if val else []


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

        # For non-admins, strictly show OPEN requirements that pass MasterProduct visibility checks
        if not self.request.user.is_authenticated or getattr(self.request.user, 'role', '') != 'admin':
            queryset = Product.objects.visible_to_user(self.request.user)
        elif status_param and status_param != 'all':
            queryset = queryset.filter(status=status_param)

        if is_currently_needed is not None:
            val = is_currently_needed.lower() in ['true', '1']
            queryset = queryset.filter(is_currently_needed=val)

        if search:
            queryset = queryset.filter(name__icontains=search)

        return queryset.order_by('-created_at')

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        user = request.user
        if not user or not user.is_authenticated or getattr(user, 'role', '') != 'admin':
            if not instance.is_visible_to_user(user):
                return Response({"detail": "Not found or unauthorized access to this product."}, status=status.HTTP_404_NOT_FOUND)
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    def perform_create(self, serializer):
        from django.utils import timezone
        from rest_framework.exceptions import ValidationError
        today = timezone.now().date()

        MAX_IMAGE_SIZE = 3 * 1024 * 1024
        raw_files = self.request.FILES.getlist('images') or self.request.FILES.getlist('image')
        for f in raw_files:
            if f and getattr(f, 'size', 0) > MAX_IMAGE_SIZE:
                raise ValidationError({"image": f"Image '{f.name}' exceeds the maximum allowed size of 3 MB."})

        files = [f for f in raw_files if f and getattr(f, 'size', 0) > 0]

        # Library images selected from Media Library
        library_images = _get_list_from_data(self.request.data, 'library_images')

        total_req_images = len(files) + len(library_images)
        if total_req_images > 3:
            raise ValidationError({"images": "A product cannot have more than 3 images in total."})
        image_url = self.request.data.get('image_url', None) or self.request.data.get('image', None)

        if files or library_images:
            product = serializer.save()
            from .models import ProductImage, MediaAsset
            import os
            created_pi_list = []
            for file in files:
                try:
                    pi = ProductImage.objects.create(product=product, image=file)
                    created_pi_list.append(pi)
                    if pi.image and pi.image.name:
                        MediaAsset.objects.get_or_create(
                            file=pi.image.name,
                            defaults={
                                'original_filename': getattr(file, 'name', '') or os.path.basename(pi.image.name),
                                'file_size': getattr(file, 'size', 0)
                            }
                        )
                except Exception as img_err:
                    print(f"Failed to create ProductImage during create: {img_err}")

            for lib_img in library_images:
                clean_lib = _stored_image_name(lib_img)
                if clean_lib and not product.gallery_images.filter(image=clean_lib).exists():
                    try:
                        pi = ProductImage.objects.create(product=product, image=clean_lib)
                        created_pi_list.append(pi)
                    except Exception as lib_err:
                        print(f"Failed to link library image during create: {lib_err}")

            if created_pi_list and not product.image:
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

        self._auto_publish_supply_batch(product, self.request.data)

        from apps.common.utils import log_action
        log_action(self.request, actor=self.request.user, action="product_added", target_model="Product", target_id=product.id, target_name=product.name)

    def _auto_publish_supply_batch(self, product, request_data):
        publish_supply = request_data.get('publish_supply') or request_data.get('is_direct_publish')
        initial_qty = request_data.get('supply_quantity') or request_data.get('initial_stock')
        if (str(publish_supply).lower() == 'true' or publish_supply is True) and initial_qty:
            try:
                qty_val = float(initial_qty)
                if qty_val > 0:
                    from apps.supplies.models import Supply, SupplyImage
                    from apps.accounts.models import FarmerProfile
                    from django.utils import timezone
                    today = timezone.now().date()

                    farmer_profile = None
                    if self.request.user and self.request.user.is_authenticated:
                        farmer_profile = getattr(self.request.user, 'farmer_profile', None)
                        if not farmer_profile:
                            farmer_profile, _ = FarmerProfile.objects.get_or_create(
                                user=self.request.user,
                                defaults={'farm_name': 'Harvest Hill', 'location': 'Kigali, Rwanda'}
                            )
                        if getattr(self.request.user, 'role', '') == 'admin' and farmer_profile.farm_name != 'Harvest Hill':
                            farmer_profile.farm_name = 'Harvest Hill'
                            farmer_profile.save(update_fields=['farm_name'])
                    
                    if not farmer_profile:
                        farmer_profile, _ = FarmerProfile.objects.get_or_create(
                            farm_name='Harvest Hill',
                            defaults={'location': 'Kigali, Rwanda'}
                        )
                    
                    if farmer_profile:
                        price_val = float(product.price or product.base_price or product.offered_price or 0)
                        avail_date = request_data.get('supply_available_date') or today
                        notes_val = request_data.get('supply_notes') or 'Direct published harvest stock by Admin.'
                        
                        supply = Supply.objects.create(
                            product=product,
                            farmer=farmer_profile,
                            quantity=qty_val,
                            accepted_quantity=qty_val,
                            price=price_val,
                            agreed_price=price_val,
                            available_date=avail_date,
                            notes=notes_val,
                            status='accepted',
                            photo=product.image
                        )
                        for pi in product.gallery_images.all():
                            if pi.image:
                                try:
                                    SupplyImage.objects.create(supply=supply, image=pi.image)
                                except Exception:
                                    pass
            except Exception as e:
                print(f"Failed to auto-publish supply batch: {e}")

    def perform_update(self, serializer):
        from django.utils import timezone
        from rest_framework.exceptions import ValidationError
        from .models import ProductImage, MediaAsset
        import os
        today = timezone.now().date()
        instance = self.get_object()

        MAX_IMAGE_SIZE = 3 * 1024 * 1024
        raw_files = self.request.FILES.getlist('images') or self.request.FILES.getlist('image')
        for f in raw_files:
            if f and getattr(f, 'size', 0) > MAX_IMAGE_SIZE:
                raise ValidationError({"images": f"Image '{f.name}' exceeds the maximum allowed size of 3 MB."})

        files = [f for f in raw_files if f and getattr(f, 'size', 0) > 0]
        image_url = self.request.data.get('image_url', None) or self.request.data.get('image', None)

        # 1. Process explicit deletions (deleted_images)
        # Note: ONLY remove association from this product. Never delete the physical file from Media Library!
        deleted_raw = _get_list_from_data(self.request.data, 'deleted_images')

        for del_item in deleted_raw:
            if not del_item:
                continue
            del_target = _stored_image_name(del_item)
            del_base = del_target.rsplit('/', 1)[-1].lower() if del_target else str(del_item).rsplit('/', 1)[-1].lower()

            for img in list(instance.gallery_images.all()):
                if img.image:
                    img_name = img.image.name
                    img_base = img_name.rsplit('/', 1)[-1].lower()
                    if img_name == del_target or img_base == del_base or str(img.id) == str(del_item):
                        img.delete()

            if instance.image:
                c_name = instance.image.name
                c_base = c_name.rsplit('/', 1)[-1].lower()
                if c_name == del_target or c_base == del_base:
                    instance.image = None
                    instance.save(update_fields=['image'])

        # 2. Process retained images if explicitly supplied (remove un-retained images from this product)
        retained_raw = _get_list_from_data(self.request.data, 'retained_images')

        if retained_raw:
            retained_targets = set()
            for r in retained_raw:
                if not r:
                    continue
                t = _stored_image_name(r)
                if t:
                    retained_targets.add(t)
                    retained_targets.add(t.rsplit('/', 1)[-1].lower())
                retained_targets.add(str(r).rsplit('/', 1)[-1].lower())

            for img in list(instance.gallery_images.all()):
                if img.image:
                    name = img.image.name
                    base = name.rsplit('/', 1)[-1].lower()
                    if name not in retained_targets and base not in retained_targets and str(img.id) not in retained_targets:
                        img.delete()

            if instance.image:
                c_name = instance.image.name
                c_base = c_name.rsplit('/', 1)[-1].lower()
                if c_name not in retained_targets and c_base not in retained_targets:
                    instance.image = None
                    instance.save(update_fields=['image'])

        # Library images selected from Media Library
        library_images = _get_list_from_data(self.request.data, 'library_images')

        # 3. Calculate current unique existing images count (retained)
        existing_names = set()
        for gi in instance.gallery_images.all():
            if gi.image and gi.image.name:
                existing_names.add(gi.image.name)
        if instance.image and instance.image.name and instance.image.name not in existing_names:
            existing_names.add(instance.image.name)

        current_count = len(existing_names)
        total_count = current_count + len(files) + len(library_images)

        # 4. Strict enforcement of 3-image limit on backend
        if total_count > 3:
            raise ValidationError({
                "images": f"A product cannot have more than 3 images in total. This product currently has {current_count} image(s), and you attempted to add {len(files) + len(library_images)} image(s)."
            })

        # 5. Save other fields through serializer
        instance = serializer.save()

        # 6. Incrementally add newly uploaded files (never wiping existing ones!)
        for file in files:
            try:
                pi = ProductImage.objects.create(product=instance, image=file)
                if pi.image and pi.image.name:
                    MediaAsset.objects.get_or_create(
                        file=pi.image.name,
                        defaults={
                            'original_filename': getattr(file, 'name', '') or os.path.basename(pi.image.name),
                            'file_size': getattr(file, 'size', 0)
                        }
                    )
            except Exception as img_err:
                print(f"Failed to create ProductImage during update: {img_err}")

        # 7. Incrementally link library images without duplicating files
        for lib_img in library_images:
            clean_lib = _stored_image_name(lib_img)
            if clean_lib and not instance.gallery_images.filter(image=clean_lib).exists():
                try:
                    ProductImage.objects.create(product=instance, image=clean_lib)
                except Exception as lib_err:
                    print(f"Failed to link library image during update: {lib_err}")

        # If a single image_url string was provided without files and gallery is empty
        if not files and not library_images and image_url and isinstance(image_url, str) and not instance.gallery_images.exists():
            clean_path = image_url
            if '/media/' in clean_path:
                clean_path = clean_path.split('/media/')[-1]
            try:
                ProductImage.objects.create(product=instance, image=clean_path)
            except Exception as img_err:
                print(f"Failed to create ProductImage from url: {img_err}")

        # 8. Ensure cover image is set and valid
        if not instance.image or not _product_has_image(instance.image):
            first_img = instance.gallery_images.exclude(image='').first()
            if first_img and first_img.image:
                instance.image = first_img.image
                instance.save(update_fields=['image'])
        else:
            # If instance.image was set but not in gallery_images, ensure it is added
            if not instance.gallery_images.filter(image=instance.image.name).exists():
                try:
                    ProductImage.objects.create(product=instance, image=instance.image)
                except Exception:
                    pass

        if instance.submission_deadline and instance.submission_deadline >= today and instance.status == 'closed':
            instance.status = 'open'
            instance.save(update_fields=['status'])

        self._auto_publish_supply_batch(instance, self.request.data)

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
                        img_obj.delete()
                        deleted = True
                except (ValueError, TypeError, Exception):
                    pass

            if not deleted and image_url:
                target_name = _stored_image_name(image_url)
                if target_name:
                    target_base = target_name.rsplit('/', 1)[-1]
                    gallery_imgs = list(ProductImage.objects.filter(product=product))

                    matched = [img for img in gallery_imgs if img.image and img.image.name == target_name]
                    if not matched:
                        matched = [
                            img for img in gallery_imgs
                            if img.image and img.image.name.rsplit('/', 1)[-1] == target_base
                        ][:1]

                    cover_matches = bool(
                        product.image
                        and (
                            product.image.name == target_name
                            or product.image.name.rsplit('/', 1)[-1] == target_base
                        )
                    )

                    for img in matched:
                        img.delete()
                        deleted = True

                    if cover_matches:
                        next_img = product.gallery_images.exclude(image='').first()
                        product.image = next_img.image if (next_img and next_img.image) else None
                        product.save(update_fields=['image'])
                        deleted = True

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
        MAX_IMAGE_SIZE = 3 * 1024 * 1024
        raw_files = request.FILES.getlist('images') or request.FILES.getlist('image')
        for f in raw_files:
            if f and getattr(f, 'size', 0) > MAX_IMAGE_SIZE:
                return Response({"detail": f"Image '{f.name}' exceeds the maximum allowed size of 3 MB."}, status=status.HTTP_400_BAD_REQUEST)

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

        user = self.request.user
        if not user or not user.is_authenticated or getattr(user, 'role', '') != 'admin':
            visible_prod_ids = Product.objects.visible_to_user(user).values_list('id', flat=True)
            queryset = queryset.filter(master_product_id__in=visible_prod_ids)

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


class MediaAssetViewSet(viewsets.ModelViewSet):
    """
    Centralized Media Library API for administrators.
    Provides browsing, uploading, reusing, and deleting of media files.
    """
    from .models import MediaAsset
    queryset = MediaAsset.objects.all()
    serializer_class = MediaAssetSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_permissions(self):
        return [permissions.IsAuthenticated(), IsAdmin()]

    def get_queryset(self):
        from .models import MediaAsset
        from .media_utils import sync_existing_media

        # Initial auto-sync if empty
        if not MediaAsset.objects.exists():
            try:
                sync_existing_media()
            except Exception:
                pass

        from django.db import models
        qs = MediaAsset.objects.all()

        search = self.request.query_params.get('search', '').strip()
        if search:
            qs = qs.filter(
                models.Q(original_filename__icontains=search) |
                models.Q(file__icontains=search)
            )

        filter_type = self.request.query_params.get('filter', '').strip().lower()
        if filter_type in ['in_use', 'unused']:
            from .models import Product
            active_prods = Product.objects.exclude(status='archived')
            used_cover = set(active_prods.exclude(image='').values_list('image', flat=True))
            used_gallery = set(active_prods.filter(gallery_images__isnull=False).values_list('gallery_images__image', flat=True))
            all_used_names = used_cover | used_gallery

            all_used_bases = set()
            for u in all_used_names:
                if u:
                    all_used_bases.add(str(u).rsplit('/', 1)[-1].lower())

            in_use_ids = []
            for asset in qs:
                if asset.file and asset.file.name:
                    aname = asset.file.name
                    abase = aname.rsplit('/', 1)[-1].lower()
                    if aname in all_used_names or abase in all_used_bases:
                        in_use_ids.append(asset.id)

            if filter_type == 'in_use':
                qs = qs.filter(id__in=in_use_ids)
            else:
                qs = qs.exclude(id__in=in_use_ids)

        ordering = self.request.query_params.get('ordering', '-created_at')
        if ordering in ['-created_at', 'created_at', 'original_filename', '-original_filename', 'file_size', '-file_size']:
            qs = qs.order_by(ordering)
        else:
            qs = qs.order_by('-created_at')

        return qs

    def create(self, request, *args, **kwargs):
        """Allows direct uploading of 1 or more images to the media library."""
        MAX_IMAGE_SIZE = 3 * 1024 * 1024
        raw_files = request.FILES.getlist('files') or request.FILES.getlist('file') or request.FILES.getlist('images') or request.FILES.getlist('image')
        if not raw_files:
            return Response({"error": "No image files provided for upload."}, status=status.HTTP_400_BAD_REQUEST)

        from .models import MediaAsset
        created_assets = []
        errors = []
        for f in raw_files:
            if not f or getattr(f, 'size', 0) <= 0:
                continue
            if getattr(f, 'size', 0) > MAX_IMAGE_SIZE:
                errors.append(f"Image '{f.name}' exceeds the maximum allowed size of 3 MB.")
                continue

            try:
                asset = MediaAsset.objects.create(
                    file=f,
                    original_filename=getattr(f, 'name', '') or 'uploaded_image',
                    file_size=getattr(f, 'size', 0)
                )
                created_assets.append(asset)
            except Exception as err:
                errors.append(f"Failed to upload '{f.name}': {str(err)}")

        if errors and not created_assets:
            return Response({"error": "Upload failed", "details": errors}, status=status.HTTP_400_BAD_REQUEST)

        serializer = self.get_serializer(created_assets, many=True)
        return Response({
            "message": f"Successfully uploaded {len(created_assets)} image(s) to Media Library.",
            "assets": serializer.data,
            "errors": errors if errors else None
        }, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get'])
    def usage(self, request, pk=None):
        asset = self.get_object()
        from .media_utils import get_media_asset_usage
        prods = get_media_asset_usage(asset)
        return Response({
            "id": str(asset.id),
            "filename": asset.original_filename or asset.file.name,
            "usage_count": len(prods),
            "products": [{'id': str(p.id), 'name': p.name, 'display_id': p.display_id} for p in prods]
        })

    def destroy(self, request, *args, **kwargs):
        asset = self.get_object()
        from .media_utils import get_media_asset_usage
        from .utils import delete_image_file
        prods = get_media_asset_usage(asset)
        force = (
            str(request.query_params.get('force', '')).lower() in ['true', '1'] or
            str(request.data.get('force', '')).lower() in ['true', '1']
        )

        if prods and not force:
            prod_names = [p.name for p in prods]
            return Response({
                "can_delete": False,
                "error": "Image is currently in use",
                "message": f"This image is currently used by {len(prods)} product(s): {', '.join(prod_names[:3])}{'...' if len(prods) > 3 else ''}. Confirm deletion with force=true to remove it from these products and delete the file.",
                "products": [{'id': str(p.id), 'name': p.name} for p in prods]
            }, status=status.HTTP_409_CONFLICT)

        # If forced or not in use, remove references from products first
        if prods:
            rel_name = asset.file.name.replace('\\', '/')
            base_name = rel_name.rsplit('/', 1)[-1].lower()
            from .models import Product, ProductImage
            ProductImage.objects.filter(
                models.Q(image=rel_name) | models.Q(image__endswith=base_name)
            ).delete()

            for p in prods:
                if p.image and (p.image.name == rel_name or p.image.name.rsplit('/', 1)[-1].lower() == base_name):
                    next_img = p.gallery_images.exclude(image='').first()
                    p.image = next_img.image if next_img else None
                    p.save(update_fields=['image'])

        # Delete physical file from disk
        delete_image_file(asset.file)
        # Delete MediaAsset record
        asset.delete()
        return Response({"message": "Image deleted successfully from Media Library."}, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'])
    def bulk_delete(self, request):
        ids = request.data.get('ids', [])
        if not ids or not isinstance(ids, list):
            return Response({"error": "A list of asset IDs is required."}, status=status.HTTP_400_BAD_REQUEST)

        force = str(request.data.get('force', '')).lower() in ['true', '1']
        from .models import MediaAsset, Product, ProductImage
        from .media_utils import get_media_asset_usage
        from .utils import delete_image_file
        from django.db import models

        assets = MediaAsset.objects.filter(id__in=ids)
        in_use_summary = []

        for asset in assets:
            prods = get_media_asset_usage(asset)
            if prods:
                in_use_summary.append({
                    "id": str(asset.id),
                    "filename": asset.original_filename or asset.file.name,
                    "products": [{'id': str(p.id), 'name': p.name} for p in prods]
                })

        if in_use_summary and not force:
            return Response({
                "can_delete": False,
                "error": "One or more selected images are currently in use",
                "message": f"{len(in_use_summary)} of the selected image(s) are currently in use by active products. Please confirm force delete if you wish to proceed.",
                "in_use": in_use_summary
            }, status=status.HTTP_409_CONFLICT)

        deleted_count = 0
        for asset in assets:
            prods = get_media_asset_usage(asset)
            if prods:
                rel_name = asset.file.name.replace('\\', '/')
                base_name = rel_name.rsplit('/', 1)[-1].lower()
                ProductImage.objects.filter(
                    models.Q(image=rel_name) | models.Q(image__endswith=base_name)
                ).delete()

                for p in prods:
                    if p.image and (p.image.name == rel_name or p.image.name.rsplit('/', 1)[-1].lower() == base_name):
                        next_img = p.gallery_images.exclude(image='').first()
                        p.image = next_img.image if next_img else None
                        p.save(update_fields=['image'])

            delete_image_file(asset.file)
            asset.delete()
            deleted_count += 1

        return Response({
            "message": f"Successfully deleted {deleted_count} image(s) from Media Library."
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'])
    def sync(self, request):
        from .media_utils import sync_existing_media
        added, total = sync_existing_media()
        return Response({
            "message": f"Media library synchronized. Added {added} new item(s). Total: {total}.",
            "added_count": added,
            "total_count": total
        }, status=status.HTTP_200_OK)


