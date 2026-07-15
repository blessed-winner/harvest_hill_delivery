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

        # Calculate current month vs last month paid invoices
        from django.utils import timezone
        import datetime

        now = timezone.now()
        current_month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        last_month_end = current_month_start
        if current_month_start.month == 1:
            last_month_start = current_month_start.replace(year=current_month_start.year - 1, month=12)
        else:
            last_month_start = current_month_start.replace(month=current_month_start.month - 1)

        this_month_earned = invoices.filter(status='paid', created_at__gte=current_month_start).aggregate(total=Sum('amount'))['total'] or 0.00
        last_month_earned = invoices.filter(status='paid', created_at__gte=last_month_start, created_at__lt=last_month_end).aggregate(total=Sum('amount'))['total'] or 0.00

        this_month_earned = float(this_month_earned)
        last_month_earned = float(last_month_earned)

        if last_month_earned > 0:
            change_pct = round(((this_month_earned - last_month_earned) / last_month_earned) * 100, 1)
        elif last_month_earned == 0 and this_month_earned > 0:
            change_pct = 100.0
        else:
            change_pct = 0.0

        return Response({
            "total_earned": float(total_earned),
            "pending": float(pending),
            "last_payment": float(last_payment),
            "earned_change_percentage": change_pct
        })
