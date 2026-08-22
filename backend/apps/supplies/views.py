from rest_framework import viewsets, serializers, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from apps.common.mixins import RoleScopedQuerysetMixin
from apps.products.serializers import ProductShortSerializer
from .models import Supply, SupplyImage

class SupplyImageSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = SupplyImage
        fields = ['id', 'image', 'image_url']

    def get_image_url(self, obj):
        if obj.image:
            return obj.image.url
        return None

class TargetClientSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source='user.email', read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)
    name = serializers.SerializerMethodField()

    class Meta:
        from apps.accounts.models import ClientProfile
        model = ClientProfile
        fields = ['id', 'email', 'username', 'name']

    def get_name(self, obj):
        return obj.business_name or (obj.user.username if obj.user else '') or (obj.user.email if obj.user else '')

class SupplySerializer(serializers.ModelSerializer):
    proposed_price = serializers.DecimalField(source='price', max_digits=10, decimal_places=2, read_only=True)
    base_price = serializers.SerializerMethodField()
    product_detail = ProductShortSerializer(source='product', read_only=True)
    farmer_name = serializers.SerializerMethodField()
    farmer_location = serializers.SerializerMethodField()
    unit = serializers.SerializerMethodField()
    images = SupplyImageSerializer(many=True, read_only=True)
    effective_quantity = serializers.FloatField(read_only=True)
    photo = serializers.SerializerMethodField()

    from apps.accounts.models import ClientProfile
    target_clients_detail = TargetClientSerializer(source='target_clients', many=True, read_only=True)
    target_clients = serializers.PrimaryKeyRelatedField(
        queryset=ClientProfile.objects.all(),
        many=True,
        required=False
    )

    def get_photo(self, obj):
        if not obj.photo:
            return None
        try:
            name = obj.photo.name if hasattr(obj.photo, 'name') else str(obj.photo)
            if name.startswith('http://') or name.startswith('https://'):
                return name
            url = obj.photo.url
            if 'localhost' in url or '127.0.0.1' in url:
                return None
            return url
        except Exception:
            return None

    supply_number = serializers.CharField(read_only=True)
    supplyNumber = serializers.CharField(source='supply_number', read_only=True)
    latest_offer = serializers.SerializerMethodField()
    has_admin_negotiation = serializers.SerializerMethodField()

    class Meta:
        model = Supply
        fields = [
            'id', 'supply_number', 'supplyNumber', 'product', 'product_detail', 'quantity', 'accepted_quantity', 'effective_quantity', 'unit', 
            'price', 'proposed_price', 'agreed_price', 'base_price', 
            'status', 'visibility_scope', 'target_clients', 'target_clients_detail', 'is_suggested_product', 'suggested_product_name', 'disclose_farmer_name',
            'available_date', 'quality_grade', 'notes', 'photo', 'images', 'created_at',
            'farmer_name', 'farmer_location', 'is_archived', 'is_discounted', 'discount_price', 
            'bulk_min_qty', 'bulk_price', 'rating', 'rating_count',
            'custom_product_name', 'custom_category', 'custom_unit', 'latest_offer', 'has_admin_negotiation'
        ]
        read_only_fields = ['created_at']
        extra_kwargs = {
            'price': {'required': False, 'allow_null': True},
            'photo': {'required': False, 'allow_null': True},
        }



    def to_representation(self, instance):
        data = super().to_representation(instance)
        notes_val = data.get('notes')
        if notes_val and '[Admin Terms]:' in str(notes_val):
            clean_notes = str(notes_val).split('[Admin Terms]:')[0].strip()
            data['notes'] = clean_notes if clean_notes else ""
        return data

    def get_has_admin_negotiation(self, obj):
        return obj.negotiation_threads.exists()

    def get_latest_offer(self, obj):
        thread = obj.negotiation_threads.all().order_by('created_at').last()
        if not thread:
            return None
        last_offer = thread.offers.all().order_by('timestamp').last()
        if not last_offer:
            return None
        return {
            'id': str(last_offer.id),
            'sender_role': getattr(last_offer.sender, 'role', 'user'),
            'price': float(last_offer.price),
            'quantity': float(last_offer.quantity),
            'message': last_offer.message,
            'created_at': last_offer.timestamp
        }

    def get_farmer_name(self, obj):
        request = self.context.get('request')

        # Admin or owner farmer always sees actual farm name
        if request and request.user and request.user.is_authenticated and request.user.role in ['admin', 'farmer']:
            return obj.farmer.farm_name or 'Harvest Hill Partner Farm'
        
        # Check supply-level disclosure toggle or system setting
        from apps.accounts.models import SystemSetting
        setting = SystemSetting.objects.filter(key='show_farmer_names_to_clients').first()
        global_override = (setting.value.lower() == 'true') if setting else False

        if getattr(obj, 'disclose_farmer_name', False) or global_override:
            return obj.farmer.farm_name or 'Harvest Hill Partner Farm'

        return "Harvest Hill Delivery"

    def get_farmer_location(self, obj):
        request = self.context.get('request')

        if request and request.user and request.user.is_authenticated and request.user.role in ['admin', 'farmer']:
            return obj.farmer.location or 'Rwanda'
        
        from apps.accounts.models import SystemSetting
        setting = SystemSetting.objects.filter(key='show_farmer_names_to_clients').first()
        global_override = (setting.value.lower() == 'true') if setting else False

        if getattr(obj, 'disclose_farmer_name', False) or global_override:
            return obj.farmer.location or 'Rwanda'

        return "Kigali, Rwanda"

    def get_base_price(self, obj):
        if obj.agreed_price and float(obj.agreed_price) > 0:
            return float(obj.agreed_price)
        if obj.price and float(obj.price) > 0:
            return float(obj.price)
        if obj.product:
            if obj.product.base_price and float(obj.product.base_price) > 0:
                return float(obj.product.base_price)
            if obj.product.offered_price and float(obj.product.offered_price) > 0:
                return float(obj.product.offered_price)
            if obj.product.price and float(obj.product.price) > 0:
                return float(obj.product.price)
        return 0.0

    def get_unit(self, obj):
        if obj.product:
            return obj.product.unit
        return obj.custom_unit or 'kg'

    def validate(self, attrs):
        request = self.context.get('request')

        # 1. Marketplace Visibility Scope Validation
        v_scope = attrs.get('visibility_scope')
        if v_scope is None and self.instance:
            v_scope = self.instance.visibility_scope

        if v_scope in ['SPECIFIC_CLIENTS', 'specific_clients']:
            if 'target_clients' in attrs:
                target_clients = attrs['target_clients']
            elif self.instance:
                target_clients = list(self.instance.target_clients.all())
            else:
                target_clients = []

            if not target_clients:
                raise serializers.ValidationError({
                    "target_clients": "Select at least one client for this visibility option."
                })

        # 2. Product and Custom Product Validation
        product = attrs.get('product') or (self.instance.product if self.instance else None)
        custom_product = attrs.get('custom_product_name') or (self.instance.custom_product_name if self.instance else '')

        if not product and not custom_product:
            raise serializers.ValidationError({"product": "Either product requirement template or custom product name is required."})

        # Validate pricing based on Product pricing_mode
        if product:
            if product.pricing_mode == 'farmer_proposes':
                price = attrs.get('price') or (self.instance.price if self.instance else None)
                if price is None or float(price) <= 0:
                    raise serializers.ValidationError({"price": f"Asking price is required when submitting a harvest for '{product.name}'."})
            elif product.pricing_mode == 'harvest_hill_offers':
                if 'price' not in attrs and not self.instance:
                    attrs['price'] = product.offered_price or product.base_price
                elif 'price' in attrs:
                    if float(attrs['price']) <= 0:
                        raise serializers.ValidationError({"price": "Price must be greater than zero."})
        else:
            if 'price' in attrs:
                if float(attrs['price']) <= 0:
                    raise serializers.ValidationError({"price": "Price must be greater than zero."})
            elif not self.instance:
                raise serializers.ValidationError({"price": "Price is required."})

        if 'quantity' in attrs:
            quantity = attrs['quantity']
            if float(quantity) <= 0:
                raise serializers.ValidationError({"quantity": "Quantity must be greater than zero."})
        elif not self.instance:
            raise serializers.ValidationError({"quantity": "Quantity is required."})

        # Validate bulk deal fields if provided
        bulk_min = attrs.get('bulk_min_qty')
        bulk_p = attrs.get('bulk_price')
        if bulk_min is not None and float(bulk_min) <= 0:
            raise serializers.ValidationError({"bulk_min_qty": "Bulk minimum quantity must be greater than zero."})
        if bulk_p is not None and float(bulk_p) <= 0:
            raise serializers.ValidationError({"bulk_price": "Bulk special price must be greater than zero."})

        # Farmers cannot delegate or set discount fields; only Harvest Hill Delivery Admin can
        if request and hasattr(request, 'user') and getattr(request.user, 'role', '') == 'farmer':
            attrs.pop('is_discounted', None)
            attrs.pop('discount_price', None)

        # Validate that farmers can only submit against OPEN templates before the submission deadline
        if not self.instance and request and hasattr(request, 'user') and getattr(request.user, 'role', '') == 'farmer':
            if product:
                from django.utils import timezone
                product.check_and_update_status()
                if product.status != 'open':
                    raise serializers.ValidationError({"product": f"Harvest submissions for '{product.name}' are currently closed ({product.get_status_display().upper()})."})
                if product.submission_deadline and product.submission_deadline < timezone.now().date():
                    raise serializers.ValidationError({"product": f"The submission deadline for '{product.name}' has passed."})

        return attrs

class SupplyViewSet(RoleScopedQuerysetMixin, viewsets.ModelViewSet):
    queryset = Supply.objects.all()
    serializer_class = SupplySerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        queryset = super().get_queryset()
        search = self.request.query_params.get('search', None)
        category = self.request.query_params.get('category', None)

        if category and category.lower() != 'all':
            cat_lower = category.lower()
            from django.db.models import Q
            if cat_lower in ['dairy', 'animal', 'animal-based']:
                queryset = queryset.filter(Q(product__category__icontains='dairy') | Q(product__category__icontains='animal') | Q(custom_category__icontains='dairy') | Q(custom_category__icontains='animal'))
            elif cat_lower in ['deals', 'flash deals']:
                queryset = queryset.filter(Q(is_discounted=True) | Q(product__is_discounted=True) | Q(product__fresh_deals__status='ACTIVE')).distinct()
            else:
                queryset = queryset.filter(Q(product__category__icontains=category) | Q(custom_category__icontains=category))

        if search:
            search_str = search.strip()
            from django.db.models import Q
            queryset = queryset.filter(
                Q(product__name__icontains=search_str) |
                Q(product__display_id__icontains=search_str) |
                Q(custom_product_name__icontains=search_str) |
                Q(suggested_product_name__icontains=search_str)
            )
        return queryset

    def perform_destroy(self, instance):
        """Permanently delete Supply record from database."""
        instance.delete()

    @action(detail=True, methods=['post'])
    def restore(self, request, pk=None):
        """Restore an archived supply back to active inventory."""
        supply = self.get_object()
        supply.is_archived = False
        supply.archived_at = None
        supply.save(update_fields=['is_archived', 'archived_at'])
        return Response({"detail": f"Supply '{supply.supply_number or supply.id}' restored successfully."}, status=200)

    def perform_create(self, serializer):
        # Extract files from request
        images = self.request.FILES.getlist('images')
        photo_file = self.request.FILES.get('photo')
        
        # If no photo but images are uploaded, use the first image as photo
        if not photo_file and images:
            photo_file = images[0]

        # If user is admin or farmer, ensure farmer_profile exists
        farmer_profile = getattr(self.request.user, 'farmer_profile', None)
        if not farmer_profile:
            from apps.accounts.models import FarmerProfile
            farm_title = "Harvest Hill"
            farmer_profile, _ = FarmerProfile.objects.get_or_create(
                user=self.request.user,
                defaults={'farm_name': farm_title, 'location': 'Kigali, Rwanda'}
            )
        elif self.request.user.role == 'admin':
            farmer_profile.farm_name = "Harvest Hill"
            farmer_profile.save(update_fields=['farm_name'])

        # Admin submissions are auto-accepted immediately; farmer submissions start as pending
        initial_status = 'accepted' if self.request.user.role == 'admin' else 'pending'
        
        if 'visibility_scope' not in serializer.validated_data or not serializer.validated_data['visibility_scope']:
            serializer.validated_data['visibility_scope'] = 'PUBLIC' if self.request.user.role == 'admin' else 'HARVEST_HILL_ONLY'

        # Bulk deal offers & Fresh deal discounts are solely delegated by Harvest Hill Admin, not by farmers
        if self.request.user.role != 'admin':
            serializer.validated_data['bulk_min_qty'] = None
            serializer.validated_data['bulk_price'] = None
            serializer.validated_data['is_discounted'] = False
            serializer.validated_data['discount_price'] = None

        instance = serializer.save(farmer=farmer_profile, photo=photo_file, status=initial_status)

        # Propagate submitted price to product base_price and agreed_price
        if instance.price and float(instance.price) > 0:
            if not instance.agreed_price:
                instance.agreed_price = instance.price
                instance.save(update_fields=['agreed_price'])
            if instance.product and (not instance.product.base_price or float(instance.product.base_price) <= 0 or instance.product.pricing_mode == 'farmer_proposes'):
                instance.product.base_price = instance.price
                instance.product.save(update_fields=['base_price'])
        
        # Create related SupplyImage instances only for extra gallery images
        # If only 1 image was uploaded, it is already saved as instance.photo, so do not create a duplicate SupplyImage
        if len(images) > 1:
            for img in images[1:]:
                SupplyImage.objects.create(supply=instance, image=img)

        # Log supply submission in AuditLog
        from apps.common.utils import log_action
        status_val = instance.status
        action_name = "supply_draft_saved" if status_val == 'draft' else "supply_submitted"
        log_action(self.request, actor=self.request.user, action=action_name, target_model="Supply", target_id=instance.id, target_name=instance.product.name if instance.product else (instance.suggested_product_name or "Harvest Supply"))

        # Dispatch live notification to all admins for farmer harvest submissions
        if self.request.user.role != 'admin':
            from django.contrib.auth import get_user_model
            from apps.notifications.utils import send_live_notification
            User = get_user_model()
            admins = User.objects.filter(role='admin')
            crop_title = instance.product.name if instance.product else (instance.suggested_product_name or instance.custom_product_name or "Crop Harvest")
            farmer_title = farmer_profile.farm_name or getattr(self.request.user, 'username', 'Farmer')
            sup_num = instance.supply_number or f"SUP-{str(instance.id)[:6].upper()}"
            notif_title = f"🌾 New Harvest Submission ({sup_num})"
            notif_msg = f"{farmer_title} submitted {instance.quantity} {instance.unit} of '{crop_title}' @ RWF {instance.price}/{instance.unit} for review."
            for adm in admins:
                send_live_notification(adm, notif_title, notif_msg)

    def perform_update(self, serializer):
        obj = self.get_object()
        old_status = obj.status
        
        # Admin cannot directly edit raw farmer harvest specs (quantity, asking price, quality_grade, notes, photo) of other farmers.
        # But Admin CAN update administrative settings: visibility_scope, disclose_farmer_name, target_clients, is_discounted, discount_price, is_archived, status, product, accepted_quantity, agreed_price.
        if self.request.user.role == 'admin':
            is_harvest_hill = (
                not obj.farmer or 
                (obj.farmer.user and obj.farmer.user.role == 'admin') or 
                (obj.farmer.farm_name and 'harvest hill' in obj.farmer.farm_name.lower())
            )
            if not is_harvest_hill:
                farmer_spec_fields = {'quantity', 'price', 'quality_grade', 'notes', 'photo', 'available_date', 'custom_product_name'}
                attempted_spec_changes = set(serializer.validated_data.keys()).intersection(farmer_spec_fields)
                if attempted_spec_changes:
                    raise serializers.ValidationError(f"Harvest Hill Delivery cannot directly edit raw farmer harvest specifications ({', '.join(attempted_spec_changes)}). Use negotiation proposals to adjust price and accepted quantity.")

            # Auto-promote visibility scope to PUBLIC if activating a Fresh Deal discount on an internal supply
            if serializer.validated_data.get('is_discounted') is True:
                current_scope = serializer.validated_data.get('visibility_scope') or obj.visibility_scope
                if current_scope in ['HARVEST_HILL_ONLY', 'private_admin']:
                    serializer.validated_data['visibility_scope'] = 'PUBLIC'

        # Farmers can only update pending harvest submissions
        if self.request.user.role == 'farmer' and old_status != 'pending':
            raise serializers.ValidationError("Farmers can only update pending harvest submissions. Accepted or negotiated harvests cannot be edited.")

        # Non-admin farmers cannot modify Fresh Deal discounts or Bulk Deal parameters
        if self.request.user.role != 'admin':
            serializer.validated_data.pop('is_discounted', None)
            serializer.validated_data.pop('discount_price', None)
            serializer.validated_data.pop('bulk_min_qty', None)
            serializer.validated_data.pop('bulk_price', None)

        # If a farmer updates their harvest, reset the status to pending
        if self.request.user.role == 'farmer':
            serializer.validated_data['status'] = 'pending'

        images = self.request.FILES.getlist('images')
        photo_file = self.request.FILES.get('photo')
        
        if not photo_file and images:
            photo_file = images[0]

        if photo_file:
            instance = serializer.save(photo=photo_file)
        else:
            instance = serializer.save()

        # Create additional SupplyImage objects if multiple images are uploaded
        if len(images) > 1:
            for img in images[1:]:
                SupplyImage.objects.create(supply=instance, image=img)

        new_status = instance.status
        
        # Send notification to farmer when admin updates their harvest (only if farmer is not an admin and not the acting user)
        if self.request.user.role == 'admin' and instance.farmer and instance.farmer.user:
            target_user = instance.farmer.user
            if target_user != self.request.user and target_user.role != 'admin':
                from apps.notifications.models import Notification
                prod_name = instance.product.name if instance.product else (instance.custom_product_name or "Harvest Produce")
                Notification.objects.create(
                    user=target_user,
                    title="Harvest Updated",
                    message=f"Your harvest submission for {prod_name} has been updated by admin."
                )
        
        # When supply is accepted, subtract quantity from demand quantity_needed
        if old_status != 'accepted' and new_status == 'accepted':
            product = instance.product
            if product:
                # Subtract the supply quantity from the product's quantity_needed
                product.quantity_needed = max(0, product.quantity_needed - instance.quantity)
                
                # If the remaining quantity required becomes <= 0, the demand is met (hide from farmer)
                if product.quantity_needed <= 0:
                    product.is_currently_needed = False
                else:
                    product.is_currently_needed = True
                
                product.save()
        
        # When supply is delivered or archived, check if product should still be visible in client catalog
        # Note: We exclude 'rejected' from here to keep the demand active on farmers' screens as per requirements.
        if new_status in ['delivered'] or instance.is_archived:
            product = instance.product
            if product:
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

    @action(detail=True, methods=['post'], url_path='upload-image')
    def upload_image(self, request, pk=None):
        supply = self.get_object()
        image_file = request.FILES.get('image')
        if not image_file:
            return Response({"error": "No image provided"}, status=400)
        img_obj = SupplyImage.objects.create(supply=supply, image=image_file)
        
        # Also update main supply photo if it is empty
        if not supply.photo:
            supply.photo = img_obj.image
            supply.save()

        return Response({
            "id": img_obj.id, 
            "image": img_obj.image.url,
            "image_url": img_obj.image.url
        })

    @action(detail=True, methods=['post'], url_path='delete-image')
    def delete_image(self, request, pk=None):
        supply = self.get_object()
        image_id = request.data.get('image_id')
        if not image_id:
            return Response({"error": "No image_id provided"}, status=400)
        try:
            img_obj = SupplyImage.objects.get(id=image_id, supply=supply)
            is_main = (supply.photo and (supply.photo.name == img_obj.image.name))
            
            # Permanently delete file from Cloudinary / media storage
            try:
                if img_obj.image:
                    img_obj.image.delete(save=False)
            except Exception as storage_err:
                print("Cloudinary storage delete note:", storage_err)

            img_obj.delete()
            if is_main:
                next_img = supply.images.first()
                supply.photo = next_img.image if next_img else None
                supply.save()
            return Response({"status": "success"})
        except SupplyImage.DoesNotExist:
            return Response({"error": "Image not found"}, status=404)

    @action(detail=True, methods=['post'], permission_classes=[permissions.AllowAny], url_path='rate')
    def rate(self, request, pk=None):
        supply = self.get_object()
        user_rating = float(request.data.get('rating', 5))
        if user_rating < 1 or user_rating > 5:
            return Response({"error": "Rating must be between 1 and 5"}, status=400)
        
        current_total = float(supply.rating) * supply.rating_count
        new_count = supply.rating_count + 1
        new_avg = round((current_total + user_rating) / new_count, 2)
        
        supply.rating = new_avg
        supply.rating_count = new_count
        supply.save()
        
        return Response({
            "status": "success",
            "rating": supply.rating,
            "rating_count": supply.rating_count
        })

    @action(detail=True, methods=['post'], url_path='counter-supply')
    def counter_supply(self, request, pk=None):
        if not request.user or not request.user.is_authenticated or request.user.role != 'admin':
            return Response({"error": "Only Harvest Hill Delivery (admin) can send counter-terms to farmers."}, status=403)
        
        supply = self.get_object()
        accepted_qty = request.data.get('accepted_quantity')
        agreed_p = request.data.get('agreed_price')
        target_product_id = request.data.get('product_id')
        admin_notes = request.data.get('admin_notes') or request.data.get('notes') or ''

        if accepted_qty is not None:
            try:
                acc_val = float(accepted_qty)
                if acc_val <= 0:
                    return Response({"error": "Accepted quantity must be greater than zero."}, status=400)
                if acc_val > float(supply.quantity):
                    return Response({"error": f"Accepted quantity cannot exceed submitted quantity ({supply.quantity:g})."}, status=400)
                supply.accepted_quantity = acc_val
            except (ValueError, TypeError):
                return Response({"error": "Invalid accepted quantity format."}, status=400)
        else:
            return Response({"error": "Accepted quantity is required and must be greater than zero."}, status=400)

        if agreed_p is not None:
            try:
                p_val = float(agreed_p)
                if p_val <= 0:
                    return Response({"error": "Agreed farmer price must be greater than zero."}, status=400)
                supply.agreed_price = p_val
            except (ValueError, TypeError):
                return Response({"error": "Invalid agreed price format."}, status=400)
        else:
            return Response({"error": "Agreed farmer price is required and must be greater than zero."}, status=400)

        # Handle master product mapping if provided
        if target_product_id:
            from apps.products.models import Product
            try:
                master_prod = Product.objects.get(id=target_product_id)
                supply.product = master_prod
            except Product.DoesNotExist:
                pass

        supply.save()

        # Create or update NegotiationThread and record NegotiationOffer
        from apps.negotiations.models import NegotiationThread, NegotiationOffer
        thread, _ = NegotiationThread.objects.get_or_create(supply=supply, buyer=None)
        unit_str = supply.unit
        NegotiationOffer.objects.create(
            thread=thread,
            sender=request.user,
            price=supply.agreed_price,
            quantity=supply.accepted_quantity,
            message=str(admin_notes).strip() if admin_notes else f"Harvest Hill counter-offered: {supply.accepted_quantity:g} {unit_str} @ RWF {supply.agreed_price:g}/{unit_str}"
        )

        # Send live real-time notification to the Farmer if farmer exists
        if supply.farmer and getattr(supply.farmer, 'user', None):
            from apps.notifications.utils import send_live_notification
            prod_name = supply.product.name if supply.product else (supply.suggested_product_name or supply.custom_product_name or "Harvest Batch")
            clean_notes = str(admin_notes).strip() if admin_notes else ''
            terms_summary = f". Terms: {clean_notes[:45]}..." if len(clean_notes) > 45 else (f". Terms: {clean_notes}" if clean_notes else "")
            send_live_notification(
                user=supply.farmer.user,
                title="Counter-Offer Received",
                message=f"Harvest Hill Delivery proposed counter-terms for {supply.supply_number or supply.id} ({prod_name}): {supply.accepted_quantity:g} {unit_str} @ RWF {supply.agreed_price:g}/{unit_str}{terms_summary}"
            )

        serializer = self.get_serializer(supply)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='agree-supply')
    def agree_supply(self, request, pk=None):
        if not request.user or not request.user.is_authenticated or request.user.role != 'admin':
            return Response({"error": "Only Harvest Hill Delivery (admin) can agree and accept supply terms."}, status=403)
        
        supply = self.get_object()
        accepted_qty = request.data.get('accepted_quantity')
        agreed_p = request.data.get('agreed_price')
        target_product_id = request.data.get('product_id')
        approve_suggested = request.data.get('approve_suggested', False)

        if accepted_qty is not None:
            try:
                acc_val = float(accepted_qty)
                if acc_val <= 0:
                    return Response({"error": "Accepted quantity must be greater than zero."}, status=400)
                if acc_val > float(supply.quantity):
                    return Response({"error": f"Accepted quantity cannot exceed submitted quantity ({supply.quantity:g})."}, status=400)
                supply.accepted_quantity = acc_val
            except (ValueError, TypeError):
                return Response({"error": "Invalid accepted quantity format."}, status=400)
        else:
            return Response({"error": "Accepted quantity is required and must be greater than zero."}, status=400)

        if agreed_p is not None:
            try:
                p_val = float(agreed_p)
                if p_val <= 0:
                    return Response({"error": "Agreed farmer price must be greater than zero."}, status=400)
                supply.agreed_price = p_val
            except (ValueError, TypeError):
                return Response({"error": "Invalid agreed price format."}, status=400)
        else:
            return Response({"error": "Agreed farmer price is required and must be greater than zero."}, status=400)

        # Handle master product mapping
        if target_product_id:
            from apps.products.models import Product
            try:
                master_prod = Product.objects.get(id=target_product_id)
                supply.product = master_prod
            except Product.DoesNotExist:
                return Response({"error": "Target master product not found."}, status=404)
        elif (supply.is_suggested_product or not supply.product) and approve_suggested:
            from apps.products.models import Product
            p_name = supply.suggested_product_name or supply.custom_product_name or "New Product"
            p_cat = supply.custom_category or "Vegetables"
            p_unit = supply.custom_unit or "kg"
            p_price = supply.agreed_price or supply.price
            
            existing = Product.objects.filter(name__iexact=p_name).first()
            if existing:
                master_prod = existing
            else:
                master_prod = Product.objects.create(
                    name=p_name,
                    category=p_cat,
                    unit=p_unit,
                    base_price=p_price,
                    image=supply.photo if supply.photo else None
                )
            supply.product = master_prod

        if not supply.product:
            return Response({"error": "A master product template must be selected or approved to accept this supply into system inventory."}, status=400)

        supply.status = 'accepted'
        supply.save()

        # Send notification to farmer if farmer exists
        if supply.farmer and getattr(supply.farmer, 'user', None):
            from apps.notifications.models import Notification
            prod_name = supply.product.name
            Notification.objects.create(
                user=supply.farmer.user,
                title="Harvest Agreed & Accepted",
                message=f"Harvest Hill Delivery has agreed and accepted {supply.effective_quantity:g} {supply.product.unit} of your {prod_name} harvest submission."
            )

        serializer = self.get_serializer(supply)
        return Response(serializer.data)

