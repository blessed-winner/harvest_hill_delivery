from rest_framework import serializers
from .models import Product, ProductRequest


def _product_has_image(image):
    return bool(image and getattr(image, 'name', None))


class ProductSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()
    displayId = serializers.CharField(source='display_id', read_only=True)
    total_available_quantity = serializers.SerializerMethodField()
    supplier_count = serializers.IntegerField(read_only=True)
    effective_price = serializers.FloatField(read_only=True)
    discount_percentage = serializers.FloatField(read_only=True)
    sourcing_history_count = serializers.IntegerField(read_only=True)
    sourcing_supplies = serializers.SerializerMethodField()
    price = serializers.FloatField(read_only=True)
    submission_count = serializers.SerializerMethodField()

    def get_total_available_quantity(self, obj):
        request = self.context.get('request')
        user = request.user if request and hasattr(request, 'user') else None
        return obj.get_available_quantity_for_user(user)

    class Meta:
        model = Product
        fields = [
            'id', 'display_id', 'displayId', 'name', 'category', 'description', 'is_currently_needed', 'urgency', 'unit', 
            'pricing_mode', 'offered_price', 'base_price', 'price', 'effective_price', 'is_discounted', 'discount_price', 'discount_percentage', 'image', 'image_url', 'quantity_needed', 'total_available_quantity', 
            'supplier_count', 'sourcing_history_count', 'sourcing_supplies', 'created_at',
            'status', 'quality_requirements', 'submission_deadline', 'preferred_harvest_period', 'submission_count'
        ]
        extra_kwargs = {
            'image': {'required': False, 'allow_null': True},
        }

    def get_submission_count(self, obj):
        return obj.supplies.exclude(status='rejected').count()

    def get_sourcing_supplies(self, obj):
        request = self.context.get('request')
        # Only return detailed sourcing supplies for admin users
        if not request or not request.user or not request.user.is_authenticated or request.user.role != 'admin':
            return []
        
        supplies = obj.supplies.exclude(status='rejected').order_by('-created_at')
        res = []
        for s in supplies:
            photo_url = None
            if s.photo:
                try:
                    photo_url = s.photo.url
                except Exception:
                    photo_url = None
            res.append({
                'id': str(s.id),
                'farmer_name': s.farmer.farm_name or 'Harvest Hill Partner Farm',
                'farmer_email': s.farmer.user.email,
                'farmer_phone': s.farmer.phone,
                'submitted_quantity': float(s.quantity),
                'accepted_quantity': float(s.accepted_quantity) if s.accepted_quantity is not None else (float(s.quantity) if s.status == 'accepted' else 0.0),
                'unit': s.product.unit if s.product else (s.custom_unit or 'kg'),
                'proposed_price': float(s.price),
                'agreed_price': float(s.agreed_price) if s.agreed_price is not None else float(s.price),
                'status': s.status,
                'visibility_scope': s.visibility_scope,
                'photo_url': photo_url,
                'created_at': s.created_at
            })
        return res

    def validate(self, attrs):
        instance = getattr(self, 'instance', None)

        name = attrs.get('name', instance.name if instance else None)
        pricing_mode = attrs.get('pricing_mode', instance.pricing_mode if instance else 'harvest_hill_offers')
        offered_price = attrs.get('offered_price', instance.offered_price if instance else None)
        quantity_needed = attrs.get('quantity_needed', instance.quantity_needed if instance else 0)

        # 0. Prevent unsafe pricing_mode changes if submissions exist
        if instance and 'pricing_mode' in attrs and attrs['pricing_mode'] != instance.pricing_mode:
            if instance.supplies.exclude(status='rejected').exists():
                raise serializers.ValidationError({
                    "pricing_mode": f"Cannot change the pricing mode for '{instance.name}' because active harvest submissions exist. Please close or archive this requirement and create a new requirement instead."
                })

        # 1. Pricing Mode vs Offered Price Validation
        if pricing_mode == 'harvest_hill_offers':
            if offered_price is None or float(offered_price) <= 0:
                raise serializers.ValidationError({
                    "offered_price": "An offered price greater than zero is required when Harvest Hill offers the price."
                })
            attrs['base_price'] = offered_price
        elif pricing_mode == 'farmer_proposes':
            if offered_price is not None:
                raise serializers.ValidationError({
                    "offered_price": "Offered price must be null/absent when the pricing mode is 'Farmer proposes the price'."
                })
            attrs['offered_price'] = None
            attrs['base_price'] = 0.00

        # 2. Dynamic unit-based quantity check
        unit = attrs.get('unit', instance.unit if instance else 'kg').lower()
        min_qty = 1
        min_msg = "Quantity needed must be greater than zero."
        
        if 'kg' in unit:
            min_qty = 10
            min_msg = "Quantity needed must be at least 10 kg."
        elif 'litre' in unit or 'liter' in unit or unit == 'l':
            min_qty = 10
            min_msg = "Quantity needed must be at least 10 litres."
        elif 'crate' in unit:
            min_qty = 5
            min_msg = "Quantity needed must be at least 5 crates."
        elif 'jar' in unit:
            min_qty = 5
            min_msg = "Quantity needed must be at least 5 jars."
        elif 'bundle' in unit:
            min_qty = 5
            min_msg = "Quantity needed must be at least 5 bundles."

        if float(quantity_needed) < min_qty:
            raise serializers.ValidationError({"quantity_needed": min_msg})

        # 3. Submission deadline validation for OPEN status
        status_val = attrs.get('status', instance.status if instance else 'open')
        deadline = attrs.get('submission_deadline', instance.submission_deadline if instance else None)
        from django.utils import timezone
        today = timezone.now().date()

        if status_val == 'open' and deadline and deadline < today:
            formatted_dl = deadline.strftime('%B %d, %Y') if hasattr(deadline, 'strftime') else str(deadline)
            raise serializers.ValidationError({
                "submission_deadline": f"Cannot activate or set a requirement to OPEN when its submission deadline ({formatted_dl}) has passed. Please update the submission deadline to today or a future date first."
            })

        # 4. Duplicate product name check (case-insensitive)
        name_duplicates = Product.objects.filter(name__iexact=name)
        if instance:
            name_duplicates = name_duplicates.exclude(pk=instance.pk)
        if name_duplicates.exists():
            raise serializers.ValidationError({"name": "A product with this name already exists in the catalog."})

        return attrs

    def get_image_url(self, obj):
        if not obj.image:
            return None
        try:
            name = obj.image.name if hasattr(obj.image, 'name') else str(obj.image)
            if name.startswith('http://') or name.startswith('https://'):
                return name
            url = obj.image.url
            if 'localhost' in url or '127.0.0.1' in url:
                return None
            return url
        except Exception:
            return None


class ProductShortSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()
    displayId = serializers.CharField(source='display_id', read_only=True)
    price = serializers.FloatField(read_only=True)
    effective_price = serializers.FloatField(read_only=True)
    discount_percentage = serializers.FloatField(read_only=True)

    class Meta:
        model = Product
        fields = [
            'id', 'display_id', 'displayId', 'name', 'category', 'unit', 'image', 'image_url',
            'pricing_mode', 'offered_price', 'base_price', 'price', 'effective_price', 'is_discounted', 'discount_price', 'discount_percentage',
            'quantity_needed', 'status', 'quality_requirements', 
            'submission_deadline', 'preferred_harvest_period', 'description'
        ]

    def get_image_url(self, obj):
        if not obj.image:
            return None
        try:
            name = obj.image.name if hasattr(obj.image, 'name') else str(obj.image)
            if name.startswith('http://') or name.startswith('https://'):
                return name
            url = obj.image.url
            if 'localhost' in url or '127.0.0.1' in url:
                return None
            return url
        except Exception:
            return None


class ProductRequestSerializer(serializers.ModelSerializer):
    client_name = serializers.CharField(source='client.business_name', read_only=True)

    class Meta:
        model = ProductRequest
        fields = [
            'id', 'client', 'client_name', 'product_name', 'category',
            'quantity_needed', 'unit', 'preferred_price', 'notes',
            'status', 'created_at', 'linked_product'
        ]
        read_only_fields = ['client', 'created_at', 'linked_product']

    def validate(self, attrs):
        instance = getattr(self, 'instance', None)
        product_name = attrs.get('product_name', instance.product_name if instance else '').strip()
        
        request_obj = self.context.get('request')
        if request_obj and hasattr(request_obj.user, 'client_profile'):
            client_profile = request_obj.user.client_profile
            
            # Check for existing non-rejected request for the same product by this client
            existing_active = ProductRequest.objects.filter(
                client=client_profile,
                product_name__iexact=product_name
            ).exclude(status='rejected')

            if instance:
                existing_active = existing_active.exclude(pk=instance.pk)

            if existing_active.exists():
                active_status = existing_active.first().status
                raise serializers.ValidationError({
                    "product_name": f"You have already requested '{product_name}' and it is currently {active_status}. You can resubmit if an admin rejects your previous request."
                })

        return attrs

