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
        category = attrs.get('category', instance.category if instance else None)
        unit = attrs.get('unit', instance.unit if instance else 'kg')
        base_price = attrs.get('base_price', instance.base_price if instance else 0)
        quantity_needed = attrs.get('quantity_needed', instance.quantity_needed if instance else 0)
        is_currently_needed = attrs.get(
            'is_currently_needed',
            instance.is_currently_needed if instance else False,
        )
        urgency = attrs.get('urgency', instance.urgency if instance else 'low')

        if 'image' in attrs:
            has_image = _product_has_image(attrs.get('image'))
        elif instance:
            has_image = _product_has_image(instance.image)
        else:
            has_image = False

        duplicates = Product.objects.filter(
            name__iexact=name,
            category=category,
            unit=unit,
            base_price=base_price,
            quantity_needed=quantity_needed,
            is_currently_needed=is_currently_needed,
            urgency=urgency,
        )
        if instance:
            duplicates = duplicates.exclude(pk=instance.pk)

        if has_image:
            duplicates = duplicates.exclude(Q(image__isnull=True) | Q(image=''))
        else:
            duplicates = duplicates.filter(Q(image__isnull=True) | Q(image=''))

        if duplicates.exists():
            raise serializers.ValidationError(
                'This product already exists with the same details.'
            )

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
