from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import NegotiationThread, NegotiationOffer
from .serializers import NegotiationThreadSerializer
from apps.supplies.models import Supply

class NegotiationThreadViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = NegotiationThreadSerializer
    queryset = NegotiationThread.objects.all()

    def get_queryset(self):
        queryset = super().get_queryset()
        if self.request.user.role == 'farmer':
            try:
                profile = self.request.user.farmer_profile
                queryset = queryset.filter(supply__farmer=profile)
            except AttributeError:
                queryset = queryset.none()
        return queryset

    @action(detail=True, methods=['post'])
    def offer(self, request, pk=None):
        thread = self.get_object()
        if thread.supply.status in ['accepted', 'delivered', 'invoiced']:
            return Response({"error": "Negotiation is already finalized"}, status=status.HTTP_400_BAD_REQUEST)
        
        price = request.data.get('price')
        quantity = request.data.get('quantity')
        
        if price is None or quantity is None:
            return Response({"error": "Price and quantity are required"}, status=status.HTTP_400_BAD_REQUEST)

        # Create counter offer
        offer = NegotiationOffer.objects.create(
            thread=thread,
            sender=request.user,
            price=price,
            quantity=quantity
        )
        
        # Update supply price/quantity
        thread.supply.status = 'negotiating'
        thread.supply.price = price
        thread.supply.quantity = quantity
        thread.supply.save()

        # Send live notification
        from apps.notifications.utils import send_live_notification
        send_live_notification(
            user=request.user,
            title="Counter Offer Sent",
            message=f"Your offer of ${price} for {quantity} of {thread.supply.product.name} has been submitted."
        )

        return Response(NegotiationThreadSerializer(thread).data)

    @action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        thread = self.get_object()
        if thread.supply.status in ['accepted', 'delivered', 'invoiced']:
            return Response({"error": "Negotiation is already finalized"}, status=status.HTTP_400_BAD_REQUEST)

        thread.supply.status = 'accepted'
        thread.supply.save()

        # Automatically generate a pending invoice upon acceptance
        from apps.invoices.models import Invoice
        Invoice.objects.get_or_create(
            supply=thread.supply,
            defaults={
                'status': 'pending',
                'amount': thread.supply.price * thread.supply.quantity,
                'sync_status': 'synced'
            }
        )

        # Send live notification to the farmer
        from apps.notifications.utils import send_live_notification
        send_live_notification(
            user=thread.supply.farmer.user,
            title="Agreement Reached",
            message=f"Negotiation finalized for supply #{thread.supply.id} ({thread.supply.product.name})."
        )

        # Send live notification to all admins (admin role in approving bypassed, they are just notified)
        from django.contrib.auth import get_user_model
        User = get_user_model()
        admins = User.objects.filter(role='admin')
        for admin in admins:
            send_live_notification(
                user=admin,
                title="Negotiation Finalized",
                message=f"Negotiation for supply #{thread.supply.id} ({thread.supply.product.name}) has been finalized at ${thread.supply.price}/kg for {thread.supply.quantity} kg."
            )

        # Log action to AuditLog
        from apps.common.utils import log_action
        log_action(request, actor=request.user, action="negotiation_finalized", target_model="Supply", target_id=thread.supply.id)

        return Response(NegotiationThreadSerializer(thread).data)
