from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum
from .models import Invoice
from .serializers import InvoiceSerializer

class InvoiceViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = InvoiceSerializer
    queryset = Invoice.objects.all()

    def get_queryset(self):
        queryset = super().get_queryset()
        if self.request.user.role == 'farmer':
            try:
                profile = self.request.user.farmer_profile
                queryset = queryset.filter(supply__farmer=profile)
            except AttributeError:
                queryset = queryset.none()
        return queryset


class InvoiceSummaryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            profile = request.user.farmer_profile
        except AttributeError:
            return Response({"error": "User does not have a farmer profile"}, status=status.HTTP_400_BAD_REQUEST)

        invoices = Invoice.objects.filter(supply__farmer=profile)

        total_earned = invoices.filter(status='paid').aggregate(total=Sum('amount'))['total'] or 0.00
        pending = invoices.filter(status='pending').aggregate(total=Sum('amount'))['total'] or 0.00
        
        last_paid_invoice = invoices.filter(status='paid').order_by('-created_at').first()
        last_payment = last_paid_invoice.amount if last_paid_invoice else 0.00

        return Response({
            "total_earned": float(total_earned),
            "pending": float(pending),
            "last_payment": float(last_payment)
        })
