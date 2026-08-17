from rest_framework import serializers
from .models import Order, OrderItem
from apps.products.serializers import ProductShortSerializer
from apps.accounts.serializers import ClientProfileSerializer

class OrderItemSerializer(serializers.ModelSerializer):
    product_detail = ProductShortSerializer(source='product', read_only=True)

    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'product_detail', 'quantity', 'price']


def deduct_inventory_for_order(order):
    if order.is_quantity_deducted:
        return
    from apps.supplies.models import Supply
    from apps.notifications.models import Notification
    from apps.accounts.models import User

    for item in order.items.all():
        product = item.product
        purchased_qty = float(item.quantity or 0)
        if not product or purchased_qty <= 0:
            continue

        # Look up matching active accepted farmer supplies for this product
        supplies = Supply.objects.filter(
            product=product,
            status='accepted',
            is_archived=False,
            quantity__gt=0
        ).order_by('created_at')

        if not supplies.exists():
            supplies = Supply.objects.filter(
                product=product,
                status='accepted',
                is_archived=False
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

            if float(supply.quantity) <= 10:
                admin_users = User.objects.filter(role='admin')
                for admin in admin_users:
                    Notification.objects.create(
                        user=admin,
                        title="Inventory Threshold Reached",
                        message=f"Product '{product.name}' ({supply.supply_number or supply.id}) from supplier '{supply.farmer.user.email}' has reached low stock ({supply.quantity} kg remaining)."
                    )

    order.is_quantity_deducted = True
    order.save(update_fields=['is_quantity_deducted'])


class OrderSerializer(serializers.ModelSerializer):
    client_detail = ClientProfileSerializer(source='client', read_only=True)
    items = OrderItemSerializer(many=True, required=False)
    order_number = serializers.CharField(source='formatted_order_number', read_only=True)
    orderNumber = serializers.CharField(source='formatted_order_number', read_only=True)
    total_amount = serializers.SerializerMethodField()
    subtotal = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'orderNumber', 'client', 'client_detail', 'status', 'delivery_address', 
            'transport_fee', 'tax_amount', 'is_assessed',
            'items', 'total_amount', 'subtotal', 'is_archived', 'is_deleted_by_client', 'is_quantity_deducted', 'created_at'
        ]
        read_only_fields = ['created_at', 'client', 'order_number', 'orderNumber']

    def get_total_amount(self, obj):
        items_total = sum(float(item.price * item.quantity) for item in obj.items.all())
        transport = float(obj.transport_fee or 0)
        tax = float(obj.tax_amount or 0)
        return items_total + transport + tax

    def get_subtotal(self, obj):
        return sum(float(item.price * item.quantity) for item in obj.items.all())

    def validate_items(self, value):
        if not value:
            raise serializers.ValidationError("Order must contain at least one item.")
        
        from apps.supplies.models import Supply
        from django.db.models import Sum

        for item in value:
            product = item.get('product')
            qty = float(item.get('quantity') or 0)
            if not product or qty <= 0:
                continue

            # Calculate total available stock across active accepted supplies for this product
            total_available = float(
                Supply.objects.filter(product=product, status='accepted', is_archived=False)
                .aggregate(total=Sum('quantity'))['total'] or 0
            )

            product_name = getattr(product, 'name', f"Product #{product.id}")
            unit = getattr(product, 'unit', 'kg')

            if total_available <= 0:
                raise serializers.ValidationError(
                    f"'{product_name}' is currently out of stock."
                )
            if qty > total_available:
                raise serializers.ValidationError(
                    f"Requested quantity for '{product_name}' ({qty:g} {unit}) exceeds total available stock ({total_available:g} {unit})."
                )

        return value

    def validate(self, attrs):
        target_status = attrs.get('status', self.instance.status if self.instance else 'pending')
        
        t_fee = float(attrs.get('transport_fee', self.instance.transport_fee if self.instance else 0) or 0)
        t_tax = float(attrs.get('tax_amount', self.instance.tax_amount if self.instance else 0) or 0)
        is_assessed = attrs.get('is_assessed', self.instance.is_assessed if self.instance else False) or (t_fee > 0 and t_tax > 0)

        # Enforce that transport fee and tax amount must be provided before approving an order
        if target_status in ['delivered', 'confirmed', 'processing', 'shipped']:
            if not is_assessed or t_fee <= 0 or t_tax <= 0:
                raise serializers.ValidationError(
                    "An order cannot be approved until both transport fee and tax amount have been determined and attached."
                )
        return attrs

    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        order = Order.objects.create(**validated_data)

        for item_data in items_data:
            OrderItem.objects.create(order=order, **item_data)
        
        # Deduct inventory immediately for the created order
        deduct_inventory_for_order(order)
        return order

    def update(self, instance, validated_data):
        items_data = validated_data.pop('items', None)
        old_status = instance.status
        new_status = validated_data.get('status', instance.status)

        t_fee = float(validated_data.get('transport_fee', instance.transport_fee) or 0)
        t_tax = float(validated_data.get('tax_amount', instance.tax_amount) or 0)

        # Enforce that transport fee and tax amount must be provided before approving an order
        if new_status in ['delivered', 'confirmed', 'processing', 'shipped']:
            if t_fee <= 0 or t_tax <= 0:
                raise serializers.ValidationError(
                    "An order cannot be approved until both transport fee and tax amount have been determined and attached."
                )

        is_assessed = validated_data.get('is_assessed', instance.is_assessed)
        if t_fee > 0 and t_tax > 0:
            is_assessed = True

        instance.status = new_status
        instance.delivery_address = validated_data.get('delivery_address', instance.delivery_address)
        instance.transport_fee = t_fee
        instance.tax_amount = t_tax
        instance.is_assessed = is_assessed
        instance.is_archived = validated_data.get('is_archived', instance.is_archived)
        instance.is_deleted_by_client = validated_data.get('is_deleted_by_client', instance.is_deleted_by_client)
        instance.save()

        # Deduct inventory if status becomes delivered / confirmed / processing / shipped
        if new_status in ['delivered', 'confirmed', 'processing', 'shipped']:
            deduct_inventory_for_order(instance)

        # Restore supply quantities when an order is cancelled
        if new_status == 'cancelled' and old_status != 'cancelled' and instance.is_quantity_deducted:
            from apps.supplies.models import Supply

            for item in instance.items.all():
                product = item.product
                restore_qty = float(item.quantity)

                supply = Supply.objects.filter(
                    product=product,
                    is_archived=False,
                ).order_by('created_at').first()

                if supply:
                    supply.quantity = float(supply.quantity) + restore_qty
                    supply.save()

            instance.is_quantity_deducted = False
            instance.save(update_fields=['is_quantity_deducted'])

        if items_data is not None:
            instance.items.all().delete()
            for item_data in items_data:
                OrderItem.objects.create(order=instance, **item_data)
        return instance
