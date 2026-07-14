from rest_framework import serializers
from .models import NegotiationThread, NegotiationOffer
from apps.supplies.models import Supply
from apps.products.serializers import ProductShortSerializer

class NegotiationOfferSerializer(serializers.ModelSerializer):
    sender = serializers.SerializerMethodField()
    created_at = serializers.SerializerMethodField()

    class Meta:
        model = NegotiationOffer
        fields = ['id', 'sender', 'price', 'quantity', 'message', 'created_at']

    def get_sender(self, obj):
        return 'farmer' if obj.sender.role == 'farmer' else 'admin'

    def get_created_at(self, obj):
        return obj.timestamp.strftime('%Y-%m-%dT%H:%M:%SZ')


class SupplyDetailSerializer(serializers.ModelSerializer):
    product_detail = ProductShortSerializer(source='product', read_only=True)
    proposed_price = serializers.DecimalField(source='price', max_digits=10, decimal_places=2)
    unit = serializers.CharField(source='product.unit', read_only=True)

    class Meta:
        model = Supply
        fields = ['id', 'quantity', 'unit', 'proposed_price', 'status', 'product_detail']


class NegotiationThreadSerializer(serializers.ModelSerializer):
    supply_detail = SupplyDetailSerializer(source='supply', read_only=True)
    offers = NegotiationOfferSerializer(many=True, read_only=True)
    status = serializers.SerializerMethodField()
    price = serializers.SerializerMethodField()

    class Meta:
        model = NegotiationThread
        fields = ['id', 'status', 'price', 'supply_detail', 'offers']

    def get_status(self, obj):
        if obj.supply.status in ['accepted', 'delivered', 'invoiced']:
            return 'accepted'
        return 'open'

    def get_price(self, obj):
        last_offer = obj.offers.all().order_by('timestamp').last()
        if last_offer:
            return last_offer.price
        return obj.supply.price
