from rest_framework import serializers
from .models import DeliveryNote

class DeliveryNoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = DeliveryNote
        fields = ['id', 'order', 'supply', 'status', 'details', 'created_at']
