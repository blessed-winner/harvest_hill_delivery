from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, Count
from django.utils import timezone
from datetime import timedelta
from apps.supplies.models import Supply
from apps.negotiations.models import NegotiationThread
from apps.invoices.models import Invoice

class FarmerDashboardSummaryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            profile = request.user.farmer_profile
        except AttributeError:
            return Response({"error": "User does not have a farmer profile"}, status=400)

        now = timezone.now()
        start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        # 1. Supplies this month
        supplies_this_month = Supply.objects.filter(
            farmer=profile,
            created_at__gte=start_of_month
        ).count()

        # 2. Pending negotiations
        pending_negs = NegotiationThread.objects.filter(
            supply__farmer=profile,
            supply__status='negotiating'
        ).count()

        # 3. Acceptance rate calculation
        total_supplies = Supply.objects.filter(farmer=profile).count()
        accepted_supplies = Supply.objects.filter(farmer=profile, status='accepted').count()
        
        acceptance_rate = "100%"
        if total_supplies > 0:
            rate = int((accepted_supplies / total_supplies) * 100)
            acceptance_rate = f"{rate}%"

        # 4. Total earnings this month (paid invoices)
        earnings = Invoice.objects.filter(
            supply__farmer=profile,
            status='paid',
            created_at__gte=start_of_month
        ).aggregate(total=Sum('amount'))['total'] or 0.00

        return Response({
            "supplies_this_month": supplies_this_month,
            "pending_negotiations": pending_negs,
            "acceptance_rate": acceptance_rate,
            "total_earnings": f"${earnings:,.2f}"
        })


class FarmerDashboardSupplyVolumeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            profile = request.user.farmer_profile
        except AttributeError:
            return Response({"error": "User does not have a farmer profile"}, status=400)

        time_range = request.query_params.get('range', '6months')
        months_count = 12 if time_range == 'year' else 6

        now = timezone.now()
        chart_data = []

        # Generate list of last N months dynamically
        for i in range(months_count - 1, -1, -1):
            # Calculate year and month offsets
            month_offset = now.month - i
            year_offset = now.year
            while month_offset <= 0:
                month_offset += 12
                year_offset -= 1
            
            month_start = timezone.datetime(year_offset, month_offset, 1, tzinfo=timezone.utc)
            if month_offset == 12:
                month_end = timezone.datetime(year_offset + 1, 1, 1, tzinfo=timezone.utc) - timedelta(seconds=1)
            else:
                month_end = timezone.datetime(year_offset, month_offset + 1, 1, tzinfo=timezone.utc) - timedelta(seconds=1)

            volume = Supply.objects.filter(
                farmer=profile,
                created_at__range=(month_start, month_end)
            ).aggregate(total=Sum('quantity'))['total'] or 0

            month_name = month_start.strftime('%b')
            chart_data.append({
                "name": month_name,
                "volume": float(volume)
            })

        return Response(chart_data)


class FarmerDashboardEarningsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            profile = request.user.farmer_profile
        except AttributeError:
            return Response({"error": "User does not have a farmer profile"}, status=400)

        # Aggregate earnings by product category
        invoices = Invoice.objects.filter(
            supply__farmer=profile,
            status='paid'
        )

        total_earnings = invoices.aggregate(total=Sum('amount'))['total'] or 0

        # Group by supply__product__category
        categories = invoices.values('supply__product__category').annotate(
            amount_sum=Sum('amount')
        )

        data = []
        colors = ['#144227', '#376847', '#563113', '#7a4f27', '#8c9c8e']

        for index, cat in enumerate(categories):
            cat_name = cat['supply__product__category'] or "Other"
            sum_val = cat['amount_sum'] or 0
            percentage = 0
            if total_earnings > 0:
                percentage = int((sum_val / total_earnings) * 100)

            data.append({
                "name": cat_name,
                "value": percentage,
                "color": colors[index % len(colors)]
            })

        # Fallback if no data
        if not data:
            data = [
                { "name": "Vegetables", "value": 0, "color": "#144227" },
                { "name": "Fruits", "value": 0, "color": "#376847" },
                { "name": "Grains", "value": 0, "color": "#563113" }
            ]

        return Response(data)
