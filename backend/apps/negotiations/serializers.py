from rest_framework import serializers
from .models import NegotiationThread, NegotiationOffer
from apps.supplies.models import Supply
from apps.products.serializers import ProductShortSerializer

class NegotiationOfferSerializer(serializers.ModelSerializer):
    sender = serializers.SerializerMethodField()
    sender_name = serializers.SerializerMethodField()
    created_at = serializers.SerializerMethodField()
    total = serializers.SerializerMethodField()

    class Meta:
        model = NegotiationOffer
        fields = [
            'id', 'sender', 'sender_name', 'price', 'quantity', 'total', 
            'message', 'terms', 'is_offer', 'offer_status', 'parent_offer', 'created_at'
        ]

    def get_sender(self, obj):
        if obj.sender.role == 'farmer':
            return 'farmer'
        elif obj.sender.role == 'client':
            return 'client'
        return 'admin'

    def get_sender_name(self, obj):
        if hasattr(obj.sender, 'farmer_profile') and obj.sender.farmer_profile and obj.sender.farmer_profile.farm_name:
            return obj.sender.farmer_profile.farm_name
        return obj.sender.get_full_name() or obj.sender.username or obj.sender.email

    def get_total(self, obj):
        return float(obj.price * obj.quantity)

    def get_created_at(self, obj):
        return obj.timestamp.strftime('%Y-%m-%dT%H:%M:%SZ')


class SupplyDetailSerializer(serializers.ModelSerializer):
    product_detail = ProductShortSerializer(source='product', read_only=True)
    proposed_price = serializers.DecimalField(source='price', max_digits=10, decimal_places=2)
    unit = serializers.CharField(source='product.unit', read_only=True)
    base_price = serializers.DecimalField(source='product.base_price', max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = Supply
        fields = ['id', 'quantity', 'unit', 'proposed_price', 'status', 'product_detail', 'base_price']


class NegotiationThreadSerializer(serializers.ModelSerializer):
    supply_detail = SupplyDetailSerializer(source='supply', read_only=True)
    offers = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()
    price = serializers.SerializerMethodField()

    class Meta:
        model = NegotiationThread
        fields = ['id', 'status', 'price', 'supply_detail', 'offers', 'supply']

    def get_offers(self, obj):
        request = self.context.get('request')
        qs = obj.offers.all().order_by('timestamp')
        if request and request.user and request.user.is_authenticated:
            if request.user.role == 'farmer':
                qs = qs.filter(deleted_by_farmer=False)
            elif request.user.role == 'admin':
                qs = qs.filter(deleted_by_admin=False)
            elif request.user.role == 'client':
                qs = qs.filter(deleted_by_client=False)
        return NegotiationOfferSerializer(qs, many=True, context=self.context).data

    def get_status(self, obj):
        return obj.status

    def get_price(self, obj):
        request = self.context.get('request')
        qs = obj.offers.all().order_by('timestamp')
        if request and request.user and request.user.is_authenticated:
            if request.user.role == 'farmer':
                qs = qs.filter(deleted_by_farmer=False)
            elif request.user.role == 'admin':
                qs = qs.filter(deleted_by_admin=False)
            elif request.user.role == 'client':
                qs = qs.filter(deleted_by_client=False)
        last_offer = qs.last()
        if last_offer:
            return last_offer.price
        return obj.supply.price
