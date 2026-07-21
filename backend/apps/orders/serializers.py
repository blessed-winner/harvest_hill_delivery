from rest_framework import serializers
from .models import Order, OrderItem
from apps.products.serializers import ProductShortSerializer
from apps.accounts.serializers import ClientProfileSerializer

class OrderItemSerializer(serializers.ModelSerializer):
    product_detail = ProductShortSerializer(source='product', read_only=True)

    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'product_detail', 'quantity', 'price']


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True)
    client_detail = ClientProfileSerializer(source='client', read_only=True)
    total_price = serializers.SerializerMethodField()
    total_amount = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            'id', 'client', 'client_detail', 'status', 'delivery_address', 
            'items', 'total_price', 'total_amount', 'is_archived', 'created_at'
        ]
        read_only_fields = ['client']

    def get_total_price(self, obj):
        return sum(float(item.price * item.quantity) for item in obj.items.all())

    def get_total_amount(self, obj):
        return sum(float(item.price * item.quantity) for item in obj.items.all())

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        order = Order.objects.create(**validated_data)
        for item_data in items_data:
            OrderItem.objects.create(order=order, **item_data)
        return order

    def update(self, instance, validated_data):
        items_data = validated_data.pop('items', None)
        instance.status = validated_data.get('status', instance.status)
        instance.delivery_address = validated_data.get('delivery_address', instance.delivery_address)
        instance.save()

        if items_data is not None:
            instance.items.all().delete()
            for item_data in items_data:
                OrderItem.objects.create(order=instance, **item_data)
        return instance
