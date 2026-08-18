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
        
        is_offer = request.data.get('is_offer', True)
        price = request.data.get('price')
        quantity = request.data.get('quantity')
        message = request.data.get('message', '')
        terms = request.data.get('terms', '')
        parent_offer_id = request.data.get('parent_offer_id')

        parent_offer = None
        if parent_offer_id:
            parent_offer = thread.offers.filter(id=parent_offer_id).first()
            if parent_offer and parent_offer.offer_status == 'PENDING':
                parent_offer.offer_status = 'COUNTERED'
                parent_offer.save()
        else:
            # Mark previous pending offers in thread as COUNTERED if submitting a new structured offer
            if is_offer:
                thread.offers.filter(offer_status='PENDING').update(offer_status='COUNTERED')
        
        # If price/quantity are omitted, use current/last offer values or supply defaults
        last_offer = thread.offers.filter(is_offer=True).order_by('timestamp').last()
        if price is None:
            price = last_offer.price if last_offer else thread.supply.price
        if quantity is None:
            quantity = last_offer.quantity if last_offer else thread.supply.quantity

        offer = NegotiationOffer.objects.create(
            thread=thread,
            sender=request.user,
            price=price,
            quantity=quantity,
            message=message,
            terms=terms,
            is_offer=is_offer,
            offer_status='PENDING' if is_offer else 'PENDING',
            parent_offer=parent_offer
        )

        # Send live notification to counter-party / admins
        from apps.notifications.utils import send_live_notification
        from apps.accounts.models import User
        from django.db.models import Q

        prod_name = thread.supply.product.name if thread.supply.product else (thread.supply.custom_product_name or "Harvest Batch")
        supply_num = thread.supply.supply_number or f"SUP-{thread.supply.id}"
        unit_str = thread.supply.unit or 'kg'

        if request.user.role == 'farmer':
            farmer_name = request.user.farmer_profile.farm_name if hasattr(request.user, 'farmer_profile') and request.user.farmer_profile.farm_name else (request.user.get_full_name() or request.user.username or "Farmer")
            clean_notes = str(terms or message).strip() if (terms or message) else ''
            terms_summary = f". Terms: {clean_notes[:45]}..." if len(clean_notes) > 45 else (f". Terms: {clean_notes}" if clean_notes else "")
            
            admins = User.objects.filter(Q(role='admin') | Q(is_staff=True)).distinct()
            for admin_user in admins:
                send_live_notification(
                    user=admin_user,
                    title="Farmer Counter-Terms Submitted",
                    message=f"{farmer_name} submitted counter-terms for {supply_num} ({prod_name}): {float(quantity):g} {unit_str} @ RWF {float(price):g}/{unit_str}{terms_summary}"
                )
        else:
            recipient = thread.supply.farmer.user if (thread.supply.farmer and getattr(thread.supply.farmer, 'user', None)) else (thread.buyer if thread.buyer and thread.buyer != request.user else None)
            if recipient and recipient != request.user:
                title_text = "New Counter-Offer" if is_offer else "New Negotiation Message"
                send_live_notification(
                    user=recipient,
                    title=title_text,
                    message=f"New {title_text.lower()} received for {supply_num} ({prod_name}): {float(quantity):g} {unit_str} @ RWF {float(price):g}/{unit_str}."
                )

        return Response(NegotiationThreadSerializer(thread, context={'request': request}).data)

    @action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        thread = self.get_object()
        if thread.status == 'accepted':
            return Response({"error": "Negotiation is already finalized"}, status=status.HTTP_400_BAD_REQUEST)

        offer_id = request.data.get('offer_id')
        target_offer = None
        if offer_id:
            target_offer = thread.offers.filter(id=offer_id).first()
        if not target_offer:
            target_offer = thread.offers.filter(is_offer=True).order_by('timestamp').last()

        price = target_offer.price if target_offer else thread.supply.price
        quantity = target_offer.quantity if target_offer else thread.supply.quantity

        if target_offer:
            target_offer.offer_status = 'ACCEPTED'
            target_offer.save()
            # Mark other pending offers in thread as COUNTERED/WITHDRAWN
            thread.offers.exclude(id=target_offer.id).filter(offer_status='PENDING').update(offer_status='WITHDRAWN')

        thread.status = 'accepted'
        thread.save()

        # Update Supply model status and finalized accepted terms
        thread.supply.status = 'accepted'
        thread.supply.accepted_quantity = quantity
        thread.supply.agreed_price = price
        if target_offer and target_offer.terms:
            clean_terms = str(target_offer.terms).strip()
            if thread.supply.notes and '[Agreed Terms]:' not in thread.supply.notes:
                thread.supply.notes = f"{thread.supply.notes}\n\n[Agreed Terms]: {clean_terms}"
            else:
                thread.supply.notes = f"[Agreed Terms]: {clean_terms}"
        thread.supply.save()

        # Synchronize linked Product base_price with accepted negotiated price
        if thread.supply.product and price and float(price) > 0:
            thread.supply.product.base_price = price
            thread.supply.product.save()

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

        # Dispatch live notifications to recipient
        from apps.notifications.utils import send_live_notification
        from apps.accounts.models import User
        from django.db.models import Q
        prod_name = thread.supply.product.name if thread.supply.product else (thread.supply.custom_product_name or "Harvest Batch")
        supply_num = thread.supply.supply_number or f"SUP-{thread.supply.id}"
        unit_str = thread.supply.unit or 'kg'

        if request.user.role == 'farmer':
            farmer_name = request.user.farmer_profile.farm_name if hasattr(request.user, 'farmer_profile') and request.user.farmer_profile.farm_name else (request.user.get_full_name() or request.user.username or "Farmer")
            admins = User.objects.filter(Q(role='admin') | Q(is_staff=True)).distinct()
            for admin_user in admins:
                send_live_notification(
                    user=admin_user,
                    title="Farmer Agreed & Accepted Terms",
                    message=f"{farmer_name} accepted negotiation terms for {supply_num} ({prod_name}): {float(quantity):g} {unit_str} @ RWF {float(price):g}/{unit_str}. Harvest is finalized into master stock."
                )
        else:
            if thread.supply.farmer and getattr(thread.supply.farmer, 'user', None):
                send_live_notification(
                    user=thread.supply.farmer.user,
                    title="Agreement Reached",
                    message=f"Harvest Hill Delivery accepted negotiation terms for {supply_num} ({prod_name}): {float(quantity):g} {unit_str} @ RWF {float(price):g}/{unit_str}."
                )

        return Response(NegotiationThreadSerializer(thread, context={'request': request}).data)

    @action(detail=True, methods=['post'])
    def decline(self, request, pk=None):
        thread = self.get_object()
        offer_id = request.data.get('offer_id')
        target_offer = None
        if offer_id:
            target_offer = thread.offers.filter(id=offer_id).first()
        if not target_offer:
            target_offer = thread.offers.filter(is_offer=True, offer_status='PENDING').order_by('timestamp').last()

        if target_offer:
            target_offer.offer_status = 'DECLINED'
            target_offer.save()

        thread.status = 'DECLINED'
        thread.save()

        return Response(NegotiationThreadSerializer(thread, context={'request': request}).data)

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

    @action(detail=True, methods=['post'], url_path='delete-offer')
    def delete_offer(self, request, pk=None):
        thread = self.get_object()
        offer_id = request.data.get('offer_id')
        
        try:
            offer = thread.offers.get(id=offer_id)
        except NegotiationOffer.DoesNotExist:
            return Response({"error": "Offer term not found"}, status=status.HTTP_404_NOT_FOUND)
        
        # Check if the requesting user IS the sender of this offer term
        if offer.sender == request.user:
            # Own term: Delete for EVERYONE permanently
            offer.delete()
        else:
            # Other party's term: Delete ONLY for the requesting user's pane
            if request.user.role == 'farmer':
                offer.deleted_by_farmer = True
            elif request.user.role == 'admin':
                offer.deleted_by_admin = True
            elif request.user.role == 'client':
                offer.deleted_by_client = True
            offer.save()

        serializer = self.get_serializer(thread, context={'request': request})
        return Response(serializer.data)
