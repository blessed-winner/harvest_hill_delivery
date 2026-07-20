from django.db.models import Q
from rest_framework import serializers
from .models import Product


def _product_has_image(image):
    return bool(image and getattr(image, 'name', None))


class ProductSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = ['id', 'name', 'category', 'is_currently_needed', 'urgency', 'unit', 'base_price', 'image', 'image_url', 'quantity_needed']
        extra_kwargs = {
            'image': {'required': False, 'allow_null': True},
        }

    def validate(self, attrs):
        instance = getattr(self, 'instance', None)

        name = attrs.get('name', instance.name if instance else None)
        base_price = attrs.get('base_price', instance.base_price if instance else 0)
        quantity_needed = attrs.get('quantity_needed', instance.quantity_needed if instance else 0)

        # 1. Base price check (> 0)
        if float(base_price) <= 0:
            raise serializers.ValidationError({"base_price": "Base price must be greater than zero."})

        # 2. Quantity check (>= 50 kg)
        if float(quantity_needed) < 50:
            raise serializers.ValidationError({"quantity_needed": "Quantity needed must be at least 50 kg."})

        # 3. Duplicate product name check (case-insensitive)
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
            # If it's already a Cloudinary URL, return it directly
            name = obj.image.name if hasattr(obj.image, 'name') else str(obj.image)
            if name.startswith('http://') or name.startswith('https://'):
                return name
            # For ImageField backed by MediaCloudinaryStorage, .url gives the Cloudinary URL
            url = obj.image.url
            # Strip any localhost/media prefix leftover from old local storage
            if 'localhost' in url or '127.0.0.1' in url:
                return None  # Image was stored locally; no valid Cloudinary URL
            return url
        except Exception:
            return None


class ProductShortSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = ['id', 'name', 'category', 'unit', 'image', 'image_url']

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
