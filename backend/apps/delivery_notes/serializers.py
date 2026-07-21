from rest_framework import serializers
from .models import DeliveryNote
from apps.orders.serializers import OrderSerializer

class DeliveryNoteSerializer(serializers.ModelSerializer):
    order_detail = OrderSerializer(source='order', read_only=True)

    class Meta:
        model = DeliveryNote
        fields = [
            'id', 'order', 'order_detail', 'supply', 'status', 
            'details', 'signed_by', 'signature_data', 'dispute_reason', 'is_archived', 'is_deleted_by_client', 'created_at'
        ]
