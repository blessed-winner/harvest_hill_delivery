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

class SupplySerializer(serializers.ModelSerializer):
    proposed_price = serializers.DecimalField(source='price', max_digits=10, decimal_places=2, read_only=True)
    base_price = serializers.SerializerMethodField()
    product_detail = ProductShortSerializer(source='product', read_only=True)
    farmer_name = serializers.SerializerMethodField()
    farmer_location = serializers.SerializerMethodField()
    unit = serializers.SerializerMethodField()
    images = SupplyImageSerializer(many=True, read_only=True)
    effective_quantity = serializers.FloatField(read_only=True)

    class Meta:
        model = Supply
        fields = [
            'id', 'product', 'product_detail', 'quantity', 'accepted_quantity', 'effective_quantity', 'unit', 
            'price', 'proposed_price', 'agreed_price', 'base_price', 
            'status', 'visibility_scope', 'is_suggested_product', 'suggested_product_name', 'disclose_farmer_name',
            'available_date', 'quality_grade', 'notes', 'photo', 'images', 'created_at',
            'farmer_name', 'farmer_location', 'is_archived', 'is_discounted', 'discount_price', 
            'bulk_min_qty', 'bulk_price', 'rating', 'rating_count',
            'custom_product_name', 'custom_category', 'custom_unit'
        ]
        read_only_fields = ['created_at']

    def get_farmer_name(self, obj):
        request = self.context.get('request')
        from apps.accounts.models import SystemSetting
        setting = SystemSetting.objects.filter(key='show_farmer_names_to_clients').first()
        show_names = (setting.value.lower() == 'true') if setting else False

        # If user is admin or farmer inspecting their dashboard, show real farm name
        if request and request.user and request.user.is_authenticated and request.user.role in ['admin', 'farmer']:
            return obj.farmer.farm_name or 'Harvest Hill Partner Farm'
        
        if show_names:
            return obj.farmer.farm_name or 'Harvest Hill Partner Farm'

        return "Harvest Hill Delivery"

    def get_farmer_location(self, obj):
        request = self.context.get('request')
        from apps.accounts.models import SystemSetting
        setting = SystemSetting.objects.filter(key='show_farmer_names_to_clients').first()
        show_names = (setting.value.lower() == 'true') if setting else False

        if request and request.user and request.user.is_authenticated and request.user.role in ['admin', 'farmer']:
            return obj.farmer.location or 'Rwanda'
        
        if show_names:
            return obj.farmer.location or 'Rwanda'

        return "Kigali, Rwanda"

    def get_base_price(self, obj):
        if obj.product:
            return obj.product.base_price
        return None

    def get_unit(self, obj):
        if obj.product:
            return obj.product.unit
        return obj.custom_unit or 'kg'

    def validate(self, attrs):
        # Only validate fields if they are provided (handles partial updates/PATCH cleanly)
        if 'price' in attrs:
            price = attrs['price']
            if float(price) <= 0:
                raise serializers.ValidationError({"price": "Price must be greater than zero."})
        elif not self.instance:
            raise serializers.ValidationError({"price": "Price is required."})

        product = attrs.get('product') or (self.instance.product if self.instance else None)
        custom_product = attrs.get('custom_product_name') or (self.instance.custom_product_name if self.instance else '')
        if not product and not custom_product:
            raise serializers.ValidationError({"product": "Either product template or custom product name is required."})

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

        return attrs

class SupplyViewSet(RoleScopedQuerysetMixin, viewsets.ModelViewSet):
    queryset = Supply.objects.all()
    serializer_class = SupplySerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

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
        instance = serializer.save(farmer=farmer_profile, photo=photo_file, status=initial_status)
        
        # Create related SupplyImage instances only for extra gallery images
        # If only 1 image was uploaded, it is already saved as instance.photo, so do not create a duplicate SupplyImage
        if len(images) > 1:
            for img in images[1:]:
                SupplyImage.objects.create(supply=instance, image=img)

        # Log supply submission in AuditLog
        from apps.common.utils import log_action
        status_val = instance.status
        action_name = "supply_draft_saved" if status_val == 'draft' else "supply_submitted"
        log_action(self.request, actor=self.request.user, action=action_name, target_model="Supply", target_id=instance.id)

    def perform_update(self, serializer):
        old_status = self.get_object().status
        
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
        
        # Send notification to farmer when admin updates their harvest
        if self.request.user.role == 'admin':
            from apps.notifications.models import Notification
            prod_name = instance.product.name if instance.product else instance.custom_product_name
            Notification.objects.create(
                user=instance.farmer.user,
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
                
                # Update the product image if supply has a photo and product doesn't
                if instance.photo and not product.image:
                    product.image = instance.photo
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
            # If deleting the main supply photo, reset it or point to next image
            is_main = (supply.photo and (supply.photo.name == img_obj.image.name))
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
                if acc_val <= 0 or acc_val > float(supply.quantity):
                    return Response({"error": f"Accepted quantity must be between 1 and submitted quantity ({supply.quantity:g})."}, status=400)
                supply.accepted_quantity = acc_val
            except (ValueError, TypeError):
                return Response({"error": "Invalid accepted quantity format."}, status=400)

        if agreed_p is not None:
            try:
                p_val = float(agreed_p)
                if p_val <= 0:
                    return Response({"error": "Agreed price must be greater than zero."}, status=400)
                supply.agreed_price = p_val
            except (ValueError, TypeError):
                return Response({"error": "Invalid agreed price format."}, status=400)

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

        # Send notification to farmer
        from apps.notifications.models import Notification
        prod_name = supply.product.name
        Notification.objects.create(
            user=supply.farmer.user,
            title="Harvest Agreed & Accepted",
            message=f"Harvest Hill Delivery has agreed and accepted {supply.effective_quantity:g} {supply.product.unit} of your {prod_name} harvest submission."
        )

        serializer = self.get_serializer(supply)
        return Response(serializer.data)

