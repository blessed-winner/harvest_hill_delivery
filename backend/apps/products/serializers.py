from rest_framework import serializers
from .models import Product

class ProductSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = ['id', 'name', 'category', 'is_currently_needed', 'urgency', 'unit', 'base_price', 'image', 'image_url', 'quantity_needed']
        extra_kwargs = {
            'image': {'write_only': True, 'required': False, 'allow_null': True},
        }

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
        fields = ['id', 'name', 'category', 'unit', 'image_url']

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
