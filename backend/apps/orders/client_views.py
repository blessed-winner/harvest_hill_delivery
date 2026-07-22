"""
Client Portal API Views
Provides endpoints for client dashboard, orders, favorites, and product browsing
"""
from decimal import Decimal
from django.db.models import Sum, Count, Q, F
from django.utils import timezone
from datetime import timedelta
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiExample
from drf_spectacular.types import OpenApiTypes

from .models import Order, OrderItem
from .serializers import OrderSerializer, OrderItemSerializer
from apps.products.models import Product
from apps.products.serializers import ProductSerializer
from apps.supplies.models import Supply
from apps.supplies.views import SupplySerializer


class IsClient(IsAuthenticated):
    """Permission class to ensure user is a client"""
    def has_permission(self, request, view):
        return super().has_permission(request, view) and request.user.role == 'client'


class ClientDashboardViewSet(viewsets.ViewSet):
    """
    Client Dashboard API
    Provides dashboard statistics, recent orders, and recommendations
    """
    permission_classes = [IsClient]

    @extend_schema(
        summary="Get client dashboard summary",
        description="Returns dashboard statistics including monthly spend, total deliveries, savings, and recent orders",
        responses={
            200: {
                "type": "object",
                "properties": {
                    "monthly_spend": {"type": "number", "example": 1240.50},
                    "total_orders": {"type": "integer", "example": 18},
                    "next_delivery": {"type": "string", "example": "Tomorrow, 9AM"},
                    "savings": {"type": "number", "example": 142.20},
                    "spend_trend": {"type": "number", "example": 12},
                    "recent_orders": {"type": "array"},
                    "urgent_products": {"type": "array"}
                }
            }
        },
        tags=['Client Portal']
    )
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get dashboard summary statistics"""
        client = request.user.client_profile
        
        # Calculate date ranges
        now = timezone.now()
        current_month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        last_month_start = (current_month_start - timedelta(days=1)).replace(day=1)
        
        # Current month stats
        current_month_orders = Order.objects.filter(
            client=client,
            created_at__gte=current_month_start
        )
        
        # Calculate monthly spend
        monthly_spend = OrderItem.objects.filter(
            order__in=current_month_orders
        ).aggregate(
            total=Sum(F('quantity') * F('price'))
        )['total'] or Decimal('0.00')
        
        # Last month spend for trend calculation
        last_month_orders = Order.objects.filter(
            client=client,
            created_at__gte=last_month_start,
            created_at__lt=current_month_start
        )
        last_month_spend = OrderItem.objects.filter(
            order__in=last_month_orders
        ).aggregate(
            total=Sum(F('quantity') * F('price'))
        )['total'] or Decimal('0.00')
        
        # Calculate trend percentage
        if last_month_spend > 0:
            spend_trend = float(((monthly_spend - last_month_spend) / last_month_spend) * 100)
        else:
            spend_trend = 0.0
        
        # Total orders count
        total_orders = current_month_orders.count()
        
        # Next delivery (get the next pending/processing order)
        next_order = Order.objects.filter(
            client=client,
            status__in=['pending', 'processing']
        ).order_by('created_at').first()
        
        next_delivery = "No pending deliveries"
        if next_order:
            delivery_date = next_order.created_at + timedelta(days=1)
            if delivery_date.date() == (now + timedelta(days=1)).date():
                next_delivery = f"Tomorrow, {delivery_date.strftime('%I%p')}"
            else:
                next_delivery = delivery_date.strftime('%B %d, %I%p')
        
        # Calculate savings (mock for now - could be based on bulk discounts)
        savings = float(monthly_spend) * 0.05  # 5% savings rate
        
        # Recent orders
        recent_orders = Order.objects.filter(client=client).order_by('-created_at')[:5]
        recent_orders_data = OrderSerializer(recent_orders, many=True).data
        
        # Urgent products (high urgency needed products)
        urgent_products = Product.objects.filter(
            is_currently_needed=True,
            urgency='high'
        )[:5]
        urgent_products_data = ProductSerializer(urgent_products, many=True).data
        
        # Active orders count (pending, processing, shipped)
        active_orders_count = Order.objects.filter(
            client=client,
            is_deleted_by_client=False,
            status__in=['pending', 'processing', 'shipped']
        ).count()

        # Completed orders count (delivered)
        completed_orders_count = Order.objects.filter(
            client=client,
            is_deleted_by_client=False,
            status='delivered'
        ).count()

        # Total spend overall
        total_spent = OrderItem.objects.filter(
            order__client=client,
            order__is_deleted_by_client=False
        ).aggregate(
            total=Sum(F('quantity') * F('price'))
        )['total'] or Decimal('0.00')

        # Delivery notes count
        from apps.delivery_notes.models import DeliveryNote
        delivery_notes_count = DeliveryNote.objects.filter(
            order__client=client,
            is_deleted_by_client=False
        ).count()

        return Response({
            'monthly_spend': float(monthly_spend),
            'total_spent': float(total_spent),
            'active_orders_count': active_orders_count,
            'completed_orders_count': completed_orders_count,
            'delivery_notes_count': delivery_notes_count,
            'total_orders': total_orders,
            'next_delivery': next_delivery,
            'savings': round(savings, 2),
            'spend_trend': round(spend_trend, 1),
            'recent_orders': recent_orders_data,
            'urgent_products': urgent_products_data
        })

    @extend_schema(
        summary="Get volume by category",
        description="Returns order volume breakdown by product category for charts",
        responses={
            200: {
                "type": "object",
                "properties": {
                    "categories": {"type": "array", "items": {
                        "type": "object",
                        "properties": {
                            "label": {"type": "string"},
                            "value": {"type": "number"},
                            "percentage": {"type": "number"}
                        }
                    }}
                }
            }
        },
        tags=['Client Portal']
    )
    @action(detail=False, methods=['get'])
    def volume_by_category(self, request):
        """Get order volume breakdown by category"""
        client = request.user.client_profile
        
        # Get orders from last 6 months
        six_months_ago = timezone.now() - timedelta(days=180)
        orders = Order.objects.filter(client=client, created_at__gte=six_months_ago)
        
        # Aggregate by category
        category_volumes = OrderItem.objects.filter(
            order__in=orders
        ).values('product__category').annotate(
            total_quantity=Sum('quantity')
        ).order_by('-total_quantity')
        
        # Calculate total for percentages
        total_volume = sum(item['total_quantity'] or 0 for item in category_volumes)
        
        # Format response
        categories = []
        for item in category_volumes:
            quantity = float(item['total_quantity'] or 0)
            percentage = (quantity / float(total_volume) * 100) if total_volume > 0 else 0
            categories.append({
                'label': item['product__category'] or 'Other',
                'value': quantity,
                'percentage': round(percentage, 1)
            })
        
        return Response({'categories': categories})

    @extend_schema(
        summary="Get top farmer of the month",
        description="Returns the #1 supplier by performance for the Farmer of the Month card",
        tags=['Client Portal']
    )
    @action(detail=False, methods=['get'])
    def top_farmer(self, request):
        """Get the top-ranked farmer based on supply performance"""
        from apps.accounts.models import FarmerProfile
        from apps.supplies.models import Supply

        top = None
        best_perf = -1

        for farmer in FarmerProfile.objects.all():
            supplies = Supply.objects.filter(
                farmer=farmer,
                status__in=['accepted', 'delivered', 'invoiced']
            )
            total_count = supplies.count()
            total_yield = float(supplies.aggregate(total=Sum('quantity'))['total'] or 0)
            high_quality_count = supplies.filter(quality_grade__in=['premium', 'standard']).count()
            quality_pct = (high_quality_count / total_count * 100) if total_count > 0 else 0.0
            perf = int(70 + (quality_pct * 0.3)) if (total_yield > 0 or total_count > 0) else 0

            if perf > best_perf:
                best_perf = perf
                top = {
                    'name': farmer.farm_name or farmer.user.username or farmer.user.email,
                    'location': farmer.location or 'Local Region',
                    'perf': perf,
                    'farmer_id': farmer.id,
                    'farmer_name': farmer.farm_name or farmer.user.username or farmer.user.email,
                }

        if not top:
            return Response({'farmer': None})

        return Response({'farmer': top})


class ClientOrderViewSet(viewsets.ModelViewSet):
    """
    Client Order Management API
    CRUD operations for client orders
    """
    serializer_class = OrderSerializer
    permission_classes = [IsClient]

    def get_queryset(self):
        """Filter orders to only show client's own non-deleted orders"""
        return Order.objects.filter(
            client=self.request.user.client_profile,
            is_deleted_by_client=False
        ).order_by('-created_at')

    @extend_schema(
        summary="List client orders",
        description="Get all orders for the authenticated client with optional status filtering",
        parameters=[
            OpenApiParameter(
                name='status',
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description='Filter by order status',
                enum=['pending', 'processing', 'shipped', 'delivered', 'cancelled']
            )
        ],
        tags=['Client Portal']
    )
    def list(self, request, *args, **kwargs):
        status_filter = request.query_params.get('status')
        queryset = self.get_queryset()
        
        if status_filter:
            if status_filter == 'delivered':
                queryset = queryset.filter(Q(status='delivered') | Q(status='shipped'))
            else:
                queryset = queryset.filter(status=status_filter)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @extend_schema(
        summary="Create a new order",
        description="Create a new order with items",
        request={
            "type": "object",
            "properties": {
                "delivery_address": {"type": "string"},
                "items": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "product_id": {"type": "integer"},
                            "quantity": {"type": "number"}
                        }
                    }
                }
            }
        },
        examples=[
            OpenApiExample(
                'Order Creation Example',
                value={
                    "delivery_address": "123 Main St, City, State 12345",
                    "items": [
                        {"product_id": 1, "quantity": 10.5},
                        {"product_id": 2, "quantity": 5.0}
                    ]
                }
            )
        ],
        tags=['Client Portal']
    )
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        """Automatically set the client when creating an order"""
        serializer.save(client=self.request.user.client_profile)


class ClientProductViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Client Product Browsing API
    Browse and search available products from farmer supplies
    """
    serializer_class = SupplySerializer
    permission_classes = [IsClient]

    def get_queryset(self):
        # Only show accepted supplies that are not archived and have quantity
        qs = Supply.objects.filter(
            status='accepted',
            is_archived=False,
            quantity__gt=0
        ).select_related('product', 'farmer')
        
        # Fallback: if no supplies with quantity, show accepted supplies even with 0 quantity
        if not qs.exists():
            qs = Supply.objects.filter(
                status='accepted',
                is_archived=False
            ).select_related('product', 'farmer')
        
        return qs.order_by('-created_at')

    @extend_schema(
        summary="Browse available products",
        description="Get list of products currently available for ordering from farmer supplies",
        parameters=[
            OpenApiParameter(
                name='category',
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description='Filter by product category'
            ),
            OpenApiParameter(
                name='search',
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description='Search products by name'
            ),
            OpenApiParameter(
                name='urgency',
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description='Filter by urgency level',
                enum=['low', 'medium', 'high', 'steady']
            ),
            OpenApiParameter(
                name='farmer',
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description='Filter by farmer name or farm name'
            )
        ],
        tags=['Client Portal']
    )
    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        
        # Apply filters
        category = request.query_params.get('category')
        search = request.query_params.get('search')
        urgency = request.query_params.get('urgency')
        farmer = request.query_params.get('farmer')
        
        if category:
            queryset = queryset.filter(product__category__iexact=category)
        if search:
            queryset = queryset.filter(product__name__icontains=search)
        if urgency:
            queryset = queryset.filter(product__urgency__iexact=urgency)
        if farmer:
            # Filter by farmer's farm name or username
            queryset = queryset.filter(
                Q(farmer__farm_name__icontains=farmer) | 
                Q(farmer__user__username__icontains=farmer) |
                Q(farmer__user__email__icontains=farmer)
            )
        
        serializer = self.get_serializer(queryset, many=True)
        # Return data in paginated format for frontend compatibility
        return Response({
            'results': serializer.data,
            'count': len(serializer.data)
        })

    @extend_schema(
        summary="Get product details",
        description="Retrieve detailed information about a specific farmer supply",
        tags=['Client Portal']
    )
    def retrieve(self, request, *args, **kwargs):
        """Get a single supply by ID"""
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    @extend_schema(
        summary="Get product details",
        description="Get detailed information about a specific product",
        tags=['Client Portal']
    )
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)
