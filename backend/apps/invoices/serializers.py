from rest_framework import serializers
from .models import Invoice
from apps.supplies.models import Supply
from apps.products.serializers import ProductShortSerializer


class SupplyShortSerializer(serializers.ModelSerializer):
    product_detail = ProductShortSerializer(source='product', read_only=True)
    class Meta:
        model = Supply
        fields = ['id', 'quantity', 'status', 'product_detail']


class InvoiceSerializer(serializers.ModelSerializer):
    bikanawe_invoice_id = serializers.SerializerMethodField()
    supply_detail = SupplyShortSerializer(source='supply', read_only=True)
    issue_date = serializers.DateTimeField(source='created_at', format='%Y-%m-%d', read_only=True)
    party_name = serializers.SerializerMethodField()
    items_breakdown = serializers.SerializerMethodField()

    class Meta:
        model = Invoice
        fields = [
            'id', 'bikanawe_invoice_id', 'supply_detail', 'issue_date', 
            'amount', 'status', 'sync_status', 'supply', 'party_name', 'items_breakdown'
        ]

    def get_bikanawe_invoice_id(self, obj):
        return f"HH-INV-{obj.id:06d}"

    def get_party_name(self, obj):
        if obj.order and obj.order.client_detail:
            return obj.order.client_detail.business_name
        if obj.supply and obj.supply.farmer:
            return obj.supply.farmer.business_name
        return "Unknown Party"

    def get_items_breakdown(self, obj):
        if obj.order:
            return [
                {
                    "description": item.product.name if item.product else "Crop",
                    "quantity": f"{item.quantity} {item.product.unit if item.product else ''}",
                    "total": float(item.price * item.quantity)
                }
                for item in obj.order.items.all()
            ]
        if obj.supply:
            return [
                {
                    "description": obj.supply.product.name if obj.supply.product else "Crop",
                    "quantity": f"{obj.supply.quantity} {obj.supply.product.unit if obj.supply.product else ''}",
                    "total": float(obj.amount)
                }
            ]
        return []
