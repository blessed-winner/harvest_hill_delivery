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
        supply_id = self.request.query_params.get('supply_id') or self.request.query_params.get('supply') or self.request.query_params.get('product_id') or self.request.query_params.get('product')
        if supply_id:
            from apps.supplies.models import Supply
            s_obj = Supply.objects.filter(id=supply_id).first()
            if s_obj:
                queryset = queryset.filter(supply=s_obj)
            else:
                queryset = queryset.filter(supply__product_id=supply_id)

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
        supply_param = request.data.get('supply') or request.data.get('product')
        if not supply_param:
            return Response({"error": "Supply ID or Product ID is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        target_supply = Supply.objects.filter(id=supply_param).first()
        if not target_supply:
            from apps.products.models import Product
            prod = Product.objects.filter(id=supply_param).first()
            if prod:
                target_supply = Supply.objects.filter(product=prod, status='accepted').first()
                if not target_supply:
                    target_supply = Supply.objects.filter(product=prod).first()
                if not target_supply:
                    from apps.accounts.models import FarmerProfile
                    admin_profile = FarmerProfile.objects.filter(user__role='admin').first()
                    if not admin_profile:
                        admin_profile = FarmerProfile.objects.first()
                    target_supply = Supply.objects.create(
                        farmer=admin_profile,
                        product=prod,
                        quantity=1000,
                        price=prod.base_price or 0,
                        status='accepted'
                    )

        if not target_supply:
            return Response({"error": "Target produce supply not found"}, status=status.HTTP_404_NOT_FOUND)

        # Get or create thread specifically for THIS buyer user and THIS supply
        thread, created = NegotiationThread.objects.get_or_create(
            supply=target_supply,
            buyer=request.user
        )
        if not created:
            if thread.deleted_by_client or thread.deleted_by_farmer:
                thread.deleted_by_client = False
                thread.deleted_by_farmer = False
                thread.save()
        else:
            from apps.notifications.utils import send_live_notification
            from apps.accounts.models import User
            from django.db.models import Q

            prod_name = thread.supply.product.name if thread.supply.product else (thread.supply.suggested_product_name or thread.supply.custom_product_name or "Harvest Produce")

            if request.user.role == 'client':
                # Notify Harvest Hill Admins of new client negotiation deal
                client_name = getattr(request.user, 'get_full_name', lambda: '')() or request.user.username or request.user.email
                if hasattr(request.user, 'client_profile') and getattr(request.user.client_profile, 'business_name', None):
                    client_name = f"{client_name} ({request.user.client_profile.business_name})"

                admins = User.objects.filter(Q(role='admin') | Q(is_staff=True)).distinct()
                for admin_user in admins:
                    send_live_notification(
                        user=admin_user,
                        title="New Client Negotiation Deal",
                        message=f"Client {client_name} initiated price deal proposal for: {prod_name}."
                    )
            elif request.user.role == 'farmer' and thread.supply.farmer and getattr(thread.supply.farmer, 'user', None):
                send_live_notification(
                    user=thread.supply.farmer.user,
                    title="New Negotiation Started",
                    message=f"A user ({request.user.email}) initiated price negotiation for your supply: {prod_name}."
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
        clean_msg = str(message or terms).strip()

        sender_role = getattr(request.user, 'role', '')
        if sender_role == 'farmer':
            farmer_name = request.user.farmer_profile.farm_name if hasattr(request.user, 'farmer_profile') and request.user.farmer_profile.farm_name else (request.user.get_full_name() or request.user.username or "Farmer")
            terms_summary = f". Terms: {clean_msg[:45]}..." if len(clean_msg) > 45 else (f". Terms: {clean_msg}" if clean_msg else "")
            
            admins = User.objects.filter(Q(role='admin') | Q(is_staff=True)).distinct()
            for admin_user in admins:
                send_live_notification(
                    user=admin_user,
                    title="Farmer Counter-Terms Submitted",
                    message=f"{farmer_name} submitted counter-terms for {supply_num} ({prod_name}): {float(quantity):g} {unit_str} @ RWF {float(price):g}/{unit_str}{terms_summary}"
                )
        elif sender_role == 'client':
            # Client submitting counter-offer -> Notify Harvest Hill Admins
            client_name = request.user.get_full_name() or request.user.username or request.user.email
            if hasattr(request.user, 'client_profile') and getattr(request.user.client_profile, 'business_name', None):
                client_name = f"{client_name} ({request.user.client_profile.business_name})"

            title_text = "Client Counter-Offer Received" if is_offer else "Client Negotiation Message"
            msg_summary = f": \"{clean_msg}\"" if clean_msg else ""
            
            admins = User.objects.filter(Q(role='admin') | Q(is_staff=True)).distinct()
            for admin_user in admins:
                send_live_notification(
                    user=admin_user,
                    title=title_text,
                    message=f"{client_name} submitted proposal for {prod_name}: {float(quantity):g} {unit_str} @ RWF {float(price):g}/{unit_str}{msg_summary}"
                )
        else:
            # Harvest Hill Admin submitting counter-offer -> Notify Client buyer or Farmer
            if thread.buyer and thread.buyer != request.user:
                title_text = "Harvest Hill Counter-Offer" if is_offer else "Harvest Hill Negotiation Message"
                msg_text = (
                    f"Harvest Hill Delivery submitted a counter-offer for {prod_name}: {float(quantity):g} {unit_str} @ RWF {float(price):g}/{unit_str}."
                    if is_offer
                    else f"New message from Harvest Hill Delivery for {prod_name}: \"{clean_msg}\"."
                )
                send_live_notification(
                    user=thread.buyer,
                    title=title_text,
                    message=msg_text
                )
            elif thread.supply.farmer and getattr(thread.supply.farmer, 'user', None):
                title_text = "Counter-Offer Received" if is_offer else "New Negotiation Message"
                msg_text = (
                    f"Counter-offer received for {supply_num} ({prod_name}): {float(quantity):g} {unit_str} @ RWF {float(price):g}/{unit_str}."
                    if is_offer
                    else f"New negotiation message for {supply_num} ({prod_name}): \"{clean_msg}\"."
                )
                send_live_notification(
                    user=thread.supply.farmer.user,
                    title=title_text,
                    message=msg_text
                )

        return Response(NegotiationThreadSerializer(thread, context={'request': request}).data)

    @action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        thread = self.get_object()
        if thread.status in ['accepted', 'bypassed', 'BYPASSED']:
            return Response({"error": "Negotiation is already finalized or bypassed."}, status=status.HTTP_400_BAD_REQUEST)
        if thread.buyer and getattr(thread.buyer, 'role', '') == 'farmer' and thread.supply and thread.supply.status == 'accepted':
            return Response({"error": "Cannot finalize a negotiation for a harvest submission that has already been approved or bypassed."}, status=status.HTTP_400_BAD_REQUEST)

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
        if thread.supply.visibility_scope in ['HARVEST_HILL_ONLY', 'private_admin']:
            thread.supply.visibility_scope = 'PUBLIC'
        thread.supply.save()

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

        acceptor_role = getattr(request.user, 'role', '')
        if acceptor_role == 'farmer':
            farmer_name = request.user.farmer_profile.farm_name if hasattr(request.user, 'farmer_profile') and request.user.farmer_profile.farm_name else (request.user.get_full_name() or request.user.username or "Farmer")
            admins = User.objects.filter(Q(role='admin') | Q(is_staff=True)).distinct()
            for admin_user in admins:
                send_live_notification(
                    user=admin_user,
                    title="Farmer Agreed & Accepted Terms",
                    message=f"{farmer_name} accepted negotiation terms for {supply_num} ({prod_name}): {float(quantity):g} {unit_str} @ RWF {float(price):g}/{unit_str}. Harvest is finalized into master stock."
                )
        elif acceptor_role == 'client':
            client_name = request.user.get_full_name() or request.user.username or request.user.email
            if hasattr(request.user, 'client_profile') and getattr(request.user.client_profile, 'business_name', None):
                client_name = f"{client_name} ({request.user.client_profile.business_name})"

            admins = User.objects.filter(Q(role='admin') | Q(is_staff=True)).distinct()
            for admin_user in admins:
                send_live_notification(
                    user=admin_user,
                    title="Client Agreed & Accepted Deal",
                    message=f"{client_name} accepted negotiation deal terms for {prod_name}: {float(quantity):g} {unit_str} @ RWF {float(price):g}/{unit_str}. Deal agreement finalized!"
                )
        else:
            if thread.buyer:
                send_live_notification(
                    user=thread.buyer,
                    title="Deal Agreement Finalized",
                    message=f"Harvest Hill Delivery accepted your negotiation terms for {prod_name}: {float(quantity):g} {unit_str} @ RWF {float(price):g}/{unit_str}."
                )
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

        from apps.notifications.utils import send_live_notification
        from apps.accounts.models import User
        from django.db.models import Q

        prod_name = thread.supply.product.name if thread.supply.product else (thread.supply.custom_product_name or "Harvest Produce")
        decliner_role = getattr(request.user, 'role', '')
        if decliner_role == 'client':
            client_name = request.user.get_full_name() or request.user.username or request.user.email
            admins = User.objects.filter(Q(role='admin') | Q(is_staff=True)).distinct()
            for admin_user in admins:
                send_live_notification(
                    user=admin_user,
                    title="Client Declined Proposal",
                    message=f"Client {client_name} declined the price negotiation for {prod_name}."
                )
        else:
            if thread.buyer:
                send_live_notification(
                    user=thread.buyer,
                    title="Negotiation Declined",
                    message=f"Harvest Hill Delivery declined the price negotiation for {prod_name}."
                )

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
