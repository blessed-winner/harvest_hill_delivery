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

    class Meta:
        model = Invoice
        fields = ['id', 'bikanawe_invoice_id', 'supply_detail', 'issue_date', 'amount', 'status', 'supply']

    def get_bikanawe_invoice_id(self, obj):
        return f"HH-INV-{obj.id:06d}"
