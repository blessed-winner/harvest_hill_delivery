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
                queryset = queryset.filter(supply__farmer=profile, deleted_by_farmer=False)
            except AttributeError:
                queryset = queryset.none()
        elif self.request.user.role == 'client':
            queryset = queryset.filter(buyer=self.request.user, deleted_by_client=False)
        return queryset

    def create(self, request, *args, **kwargs):
        supply_id = request.data.get('supply')
        if not supply_id:
            return Response({"error": "Supply ID is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Get or create thread specifically for THIS buyer user and THIS supply
        thread, created = NegotiationThread.objects.get_or_create(
            supply_id=supply_id,
            buyer=request.user
        )
        if not created:
            if thread.deleted_by_client or thread.deleted_by_farmer:
                thread.deleted_by_client = False
                thread.deleted_by_farmer = False
                thread.save()
        else:
            from apps.notifications.utils import send_live_notification
            prod_name = thread.supply.product.name if thread.supply.product else thread.supply.custom_product_name
            send_live_notification(
                user=thread.supply.farmer.user,
                title="New Negotiation Started",
                message=f"A buyer ({request.user.email}) has initiated a price negotiation for your supply: {prod_name}."
            )
        serializer = self.get_serializer(thread)
        return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

    def destroy(self, request, *args, **kwargs):
        thread = self.get_object()
        user_role = request.user.role
        
        if user_role == 'farmer':
            thread.deleted_by_farmer = True
        elif user_role == 'client':
            thread.deleted_by_client = True
        else:
            thread.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
            
        thread.save()
        
        if thread.deleted_by_farmer and thread.deleted_by_client:
            thread.delete()
            
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['post'])
    def offer(self, request, pk=None):
        thread = self.get_object()
        if thread.status == 'accepted':
            return Response({"error": "Negotiation is already finalized"}, status=status.HTTP_400_BAD_REQUEST)
        
        price = request.data.get('price')
        quantity = request.data.get('quantity')
        message = request.data.get('message', '')
        
        # If price/quantity are omitted, use current/last offer values
        if price is None:
            last_offer = thread.offers.all().order_by('timestamp').last()
            price = last_offer.price if last_offer else thread.supply.price
        if quantity is None:
            last_offer = thread.offers.all().order_by('timestamp').last()
            quantity = last_offer.quantity if last_offer else thread.supply.quantity

        # Create counter offer
        offer = NegotiationOffer.objects.create(
            thread=thread,
            sender=request.user,
            price=price,
            quantity=quantity,
            message=message
        )

        # Send live notification to counter-party
        from apps.notifications.utils import send_live_notification
        recipient = thread.supply.farmer.user if request.user == thread.buyer else thread.buyer
        if recipient:
            prod_name = thread.supply.product.name if thread.supply.product else thread.supply.custom_product_name
            send_live_notification(
                user=recipient,
                title="Negotiation Update",
                message=f"New message/offer sent for {prod_name}."
            )

        return Response(NegotiationThreadSerializer(thread).data)

    @action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        thread = self.get_object()
        if thread.status == 'accepted':
            return Response({"error": "Negotiation is already finalized"}, status=status.HTTP_400_BAD_REQUEST)

        last_offer = thread.offers.all().order_by('timestamp').last()
        price = last_offer.price if last_offer else thread.supply.price
        quantity = last_offer.quantity if last_offer else thread.supply.quantity

        thread.status = 'accepted'
        thread.save()

        # Automatically generate a pending invoice upon acceptance for this buyer
        from apps.invoices.models import Invoice
        Invoice.objects.get_or_create(
            supply=thread.supply,
            defaults={
                'status': 'pending',
                'amount': price * quantity,
                'sync_status': 'synced'
            }
        )

        # Send live notification to the farmer
        from apps.notifications.utils import send_live_notification
        prod_name = thread.supply.product.name if thread.supply.product else thread.supply.custom_product_name
        send_live_notification(
            user=thread.supply.farmer.user,
            title="Agreement Reached",
            message=f"Negotiation finalized with buyer {thread.buyer.email if thread.buyer else 'Client'} for supply #{thread.supply.id} ({prod_name})."
        )

        # Send live notification to all admins
        from django.contrib.auth import get_user_model
        User = get_user_model()
        admins = User.objects.filter(role='admin')
        for admin in admins:
            send_live_notification(
                user=admin,
                title="Negotiation Finalized",
                message=f"Negotiation for supply #{thread.supply.id} ({prod_name}) has been finalized."
            )

        # Log action to AuditLog
        from apps.common.utils import log_action
        log_action(request, actor=request.user, action="negotiation_finalized", target_model="Supply", target_id=thread.supply.id, target_name=prod_name)

        return Response(NegotiationThreadSerializer(thread).data)

    @action(detail=True, methods=['post'])
    def edit_offer(self, request, pk=None):
        thread = self.get_object()
        offer_id = request.data.get('offer_id')
        price = request.data.get('price')
        quantity = request.data.get('quantity')
        message = request.data.get('message')
        
        try:
            offer = thread.offers.get(id=offer_id, sender=request.user)
        except NegotiationOffer.DoesNotExist:
            return Response({"error": "Offer not found or permission denied"}, status=status.HTTP_404_NOT_FOUND)
        
        if price is not None:
            offer.price = price
        if quantity is not None:
            offer.quantity = quantity
        if message is not None:
            offer.message = message
        offer.save()
            
        return Response(NegotiationThreadSerializer(thread).data)
