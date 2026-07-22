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
    base_price = serializers.DecimalField(source='product.base_price', max_digits=10, decimal_places=2, read_only=True)
    product_detail = ProductShortSerializer(source='product', read_only=True)
    farmer_name = serializers.CharField(source='farmer.farm_name', read_only=True)
    farmer_location = serializers.CharField(source='farmer.location', read_only=True)
    unit = serializers.CharField(source='product.unit', read_only=True)
    images = SupplyImageSerializer(many=True, read_only=True)

    class Meta:
        model = Supply
        fields = [
            'id', 'product', 'product_detail', 'quantity', 'unit', 'price', 'proposed_price', 'base_price', 
            'status', 'available_date', 'quality_grade', 'notes', 'photo', 'images', 'created_at',
            'farmer_name', 'farmer_location', 'is_archived'
        ]
        read_only_fields = ['created_at']

    def validate(self, attrs):
        # Only validate fields if they are provided (handles partial updates/PATCH cleanly)
        if 'price' in attrs:
            price = attrs['price']
            if float(price) <= 0:
                raise serializers.ValidationError({"price": "Price must be greater than zero."})
        elif not self.instance:
            raise serializers.ValidationError({"price": "Price is required."})

        if 'quantity' in attrs:
            quantity = attrs['quantity']
            # Get the product to check its unit
            product = attrs.get('product') or (self.instance.product if self.instance else None)
            
            if product and product.unit.lower() == 'kg':
                # Only enforce 20kg minimum for kg units
                if float(quantity) < 20:
                    raise serializers.ValidationError({"quantity": "Quantity must be at least 20 kg."})
            else:
                # For non-kg units, just ensure quantity is positive
                if float(quantity) <= 0:
                    raise serializers.ValidationError({"quantity": "Quantity must be greater than zero."})
        elif not self.instance:
            raise serializers.ValidationError({"quantity": "Quantity is required."})

        return attrs

class SupplyViewSet(RoleScopedQuerysetMixin, viewsets.ModelViewSet):
    queryset = Supply.objects.all()
    serializer_class = SupplySerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        # Extract files from request
        images = self.request.FILES.getlist('images')
        photo_file = self.request.FILES.get('photo')
        
        # If no photo but images are uploaded, use the first image as photo
        if not photo_file and images:
            photo_file = images[0]

        instance = serializer.save(farmer=self.request.user.farmer_profile, photo=photo_file)
        
        # Create related SupplyImage instances
        for img in images:
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

        # Create additional SupplyImage objects if any are uploaded in the bulk field
        for img in images:
            SupplyImage.objects.create(supply=instance, image=img)

        new_status = instance.status
        
        # Send notification to farmer when admin updates their harvest
        if self.request.user.role == 'admin':
            from apps.notifications.models import Notification
            Notification.objects.create(
                user=instance.farmer.user,
                title="Harvest Updated",
                message=f"Your harvest submission for {instance.product.name} has been updated by admin.",
                notification_type="supply_updated"
            )
        
        # When supply is accepted, subtract quantity from demand quantity_needed
        if old_status != 'accepted' and new_status == 'accepted':
            product = instance.product
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

