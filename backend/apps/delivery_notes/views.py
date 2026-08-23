from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import DeliveryNote
from .serializers import DeliveryNoteSerializer

class DeliveryNoteViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = DeliveryNoteSerializer
    queryset = DeliveryNote.objects.all().order_by('-created_at')

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        
        search_str = self.request.query_params.get('search', '').strip()
        if search_str:
            from django.db.models import Q
            queryset = queryset.filter(
                Q(display_id__icontains=search_str) |
                Q(order__order_number__icontains=search_str) |
                Q(details__icontains=search_str) |
                Q(signed_by__icontains=search_str)
            )

        if user.role == 'admin':
            return queryset
        elif user.role == 'farmer':
            try:
                profile = user.farmer_profile
                return queryset.filter(supply__farmer=profile)
            except AttributeError:
                return queryset.none()
        elif user.role == 'client':
            try:
                profile = user.client_profile
                return queryset.filter(order__client=profile, is_deleted_by_client=False)
            except AttributeError:
                return queryset.none()
                
        return queryset.none()
