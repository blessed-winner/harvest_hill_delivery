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
            'items', 'total_price', 'total_amount', 'is_archived', 'is_deleted_by_client', 'created_at'
        ]
        read_only_fields = ['client']

    def get_total_price(self, obj):
        return sum(float(item.price * item.quantity) for item in obj.items.all())

    def get_total_amount(self, obj):
        return sum(float(item.price * item.quantity) for item in obj.items.all())

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        order = Order.objects.create(**validated_data)
        
        from apps.supplies.models import Supply
        from apps.notifications.models import Notification
        from apps.accounts.models import User

        for item_data in items_data:
            OrderItem.objects.create(order=order, **item_data)
            product = item_data.get('product')
            purchased_qty = float(item_data.get('quantity', 0))

            if product and purchased_qty > 0:
                # Deduct quantity from matching active farmer supplies
                supplies = Supply.objects.filter(
                    product=product,
                    status='accepted',
                    is_archived=False,
                    quantity__gt=0
                ).order_by('created_at')

                remaining_to_deduct = purchased_qty
                for supply in supplies:
                    if remaining_to_deduct <= 0:
                        break
                    
                    current_qty = float(supply.quantity)
                    if current_qty >= remaining_to_deduct:
                        supply.quantity = current_qty - remaining_to_deduct
                        remaining_to_deduct = 0
                    else:
                        remaining_to_deduct -= current_qty
                        supply.quantity = 0

                    supply.save()

                    # Trigger admin notification if supply reaches 10kg threshold or lower
                    if float(supply.quantity) <= 10:
                        admin_users = User.objects.filter(role='admin')
                        for admin in admin_users:
                            Notification.objects.create(
                                user=admin,
                                title="Inventory Threshold Reached",
                                message=f"Product '{product.name}' (Supply #{supply.id}) from supplier '{supply.farmer.user.email}' has reached low stock ({supply.quantity} kg remaining)."
                            )
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
