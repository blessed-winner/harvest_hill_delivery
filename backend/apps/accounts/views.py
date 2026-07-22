from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.utils import timezone
from django.conf import settings
from django.core.mail import send_mail
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions, viewsets
from rest_framework.throttling import ScopedRateThrottle
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView
from datetime import timedelta
from django.db.models import Q
from apps.common.permissions import IsAdmin

from .serializers import (
    UserSerializer,
    LoginSerializer,
    PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer,
    RegisterSerializer,
    CustomTokenRefreshSerializer,
    AdminUserSerializer
)
from apps.common.utils import log_action

User = get_user_model()


class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        log_action(request, actor=user, action="user_registration")
        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)

class CustomTokenRefreshView(TokenRefreshView):
    """
    Subclassed SimpleJWT TokenRefreshView to easily allow custom logging or overrides.
    """
    serializer_class = CustomTokenRefreshSerializer


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'login'

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        identifier = serializer.validated_data['username_or_email']
        password = serializer.validated_data['password']
        remember_me = serializer.validated_data.get('remember_me', False)

        # Try email first, then username
        user = None
        if '@' in identifier:
            user = User.objects.filter(email=identifier).first()
        if not user:
            user = User.objects.filter(username__iexact=identifier).first()
        if not user:
            # Timing attack mitigation
            User().set_password(password)
            log_action(request, actor=None, action="failed_login_nonexistent_user")
            return Response(
                {"errors": {"non_field_errors": ["No account found with that email or username."]}},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 1. Check account lockout state before password check
        if user.is_locked:
            minutes_left = int((user.locked_until - timezone.now()).total_seconds() / 60) + 1
            log_action(request, actor=user, action="failed_login_account_locked")
            return Response(
                {"errors": {"non_field_errors": [f"Account is locked. Try again in {minutes_left} minutes."]}},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 2. Check password
        if user.check_password(password):
            # Success: reset lockout state
            user.failed_login_attempts = 0
            user.locked_until = None
            user.save()

            # Generate tokens
            refresh = RefreshToken.for_user(user)
            if remember_me:
                refresh.set_exp(lifetime=timedelta(days=30))
                refresh.access_token.set_exp(lifetime=timedelta(minutes=30))
            else:
                refresh.set_exp(lifetime=timedelta(minutes=30))
                refresh.access_token.set_exp(lifetime=timedelta(minutes=30))

            log_action(request, actor=user, action="login_success")

            return Response({
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "user": UserSerializer(user).data
            }, status=status.HTTP_200_OK)
        else:
            # Failure: increment attempts
            user.failed_login_attempts += 1
            if user.failed_login_attempts >= 5:
                user.locked_until = timezone.now() + timedelta(minutes=15)
                log_action(request, actor=user, action="account_lockout_triggered")
            else:
                log_action(request, actor=user, action="failed_login_incorrect_password")
            
            user.save()

            return Response(
                {"errors": {"non_field_errors": ["Invalid credentials."]}},
                status=status.HTTP_400_BAD_REQUEST
            )


class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get("refresh")
            if not refresh_token:
                return Response(
                    {"errors": {"refresh": ["This field is required."]}},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            token = RefreshToken(refresh_token)
            token.blacklist()
            log_action(request, action="logout_success")
            return Response({"detail": "Successfully logged out."}, status=status.HTTP_200_OK)
        except Exception:
            return Response(
                {"errors": {"non_field_errors": ["Token is invalid or expired."]}},
                status=status.HTTP_400_BAD_REQUEST
            )


class PasswordResetRequestView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']

        try:
            user = User.objects.get(email=email)
            token = default_token_generator.make_token(user)
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            
            # Reset URL (simulation for email / logs)
            reset_url = f"http://localhost:3000/reset-password/{uid}/{token}/"
            
            # Send simulated email
            send_mail(
                subject="Harvest Hill Delivery - Password Reset",
                message=f"Please reset your password by clicking this link: {reset_url}",
                from_email=settings.DEFAULT_FROM_EMAIL or "noreply@harvesthill.test",
                recipient_list=[email],
                fail_silently=True
            )
            log_action(request, actor=user, action="password_reset_requested")
        except User.DoesNotExist:
            # Timing mitigation: always return success
            pass

        return Response(
            {"detail": "If the email exists, a password reset link has been sent."},
            status=status.HTTP_200_OK
        )


class PasswordResetConfirmView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        uidb64 = serializer.validated_data['uidb64']
        token = serializer.validated_data['token']
        new_password = serializer.validated_data['new_password']

        try:
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return Response(
                {"errors": {"non_field_errors": ["Invalid uid or user does not exist."]}},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not default_token_generator.check_token(user, token):
            return Response(
                {"errors": {"token": ["Token is invalid or has expired."]}},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Set new password
        user.set_password(new_password)
        # Clear lockout / attempts just in case
        user.failed_login_attempts = 0
        user.locked_until = None
        user.save()

        log_action(request, actor=user, action="password_reset_confirmed")

        return Response({"detail": "Password has been reset successfully."}, status=status.HTTP_200_OK)


class UserProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request):
        user = request.user
        
        # Update user basic fields if provided
        user_fields = ['first_name', 'last_name', 'email', 'username']
        for field in user_fields:
            if field in request.data:
                setattr(user, field, request.data[field])
        
        if user.role == 'farmer':
            try:
                profile = user.farmer_profile
            except AttributeError:
                return Response({"detail": "Farmer profile does not exist."}, status=status.HTTP_400_BAD_REQUEST)
            
            serializer = FarmerProfileSerializer(profile, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                user.save()  # Save user basic fields
                return Response(UserSerializer(user).data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        elif user.role == 'client':
            try:
                profile = user.client_profile
            except AttributeError:
                return Response({"detail": "Client profile does not exist."}, status=status.HTTP_400_BAD_REQUEST)
            
            # Handle business_title specially
            if 'business_title' in request.data:
                profile.business_title = request.data['business_title']
                
            serializer = ClientProfileSerializer(profile, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                user.save()  # Save user basic fields
                return Response(UserSerializer(user).data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        # For admin or other roles, just update user fields
        user.save()
        return Response(UserSerializer(user).data, status=status.HTTP_200_OK)


class AdminUserViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdmin]
    serializer_class = AdminUserSerializer
    queryset = User.objects.exclude(role='admin').order_by('-date_joined')

    def get_queryset(self):
        queryset = super().get_queryset()
        role = self.request.query_params.get('role', None)
        is_active = self.request.query_params.get('is_active', None)
        search = self.request.query_params.get('search', None)

        if role:
            queryset = queryset.filter(role=role)
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() in ['true', '1'])
        if search:
            queryset = queryset.filter(
                Q(email__icontains=search) |
                Q(username__icontains=search) |
                Q(farmer_profile__farm_name__icontains=search) |
                Q(client_profile__business_name__icontains=search)
            )
        return queryset

    def perform_create(self, serializer):
        user = serializer.save()
        log_action(self.request, actor=self.request.user, action="user_created", target_model="User", target_id=user.id)

    def perform_update(self, serializer):
        user = serializer.save()
        log_action(self.request, actor=self.request.user, action="user_updated", target_model="User", target_id=user.id)

    def perform_destroy(self, instance):
        user_id = instance.id
        instance.delete()
        log_action(self.request, actor=self.request.user, action="user_removed", target_model="User", target_id=user_id)


class AdminDashboardView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        from apps.orders.models import Order, OrderItem
        from apps.supplies.models import Supply
        from apps.invoices.models import Invoice
        from apps.delivery_notes.models import DeliveryNote
        from django.db.models import Sum, Count
        from django.utils import timezone
        from datetime import timedelta

        timeframe = request.query_params.get('timeframe', '7days')
        now = timezone.now()
        if timeframe == 'today':
            start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
        elif timeframe == '30days':
            start_date = now - timedelta(days=30)
        else: # '7days' default
            start_date = now - timedelta(days=7)

        # 1. KPIs
        active_orders = Order.objects.exclude(status__in=['delivered', 'cancelled']).filter(created_at__gte=start_date).count()
        deliveries = Order.objects.filter(status__in=['delivered', 'shipped'], created_at__gte=start_date).count()
        revenue = Invoice.objects.filter(status='paid', created_at__gte=start_date).aggregate(total=Sum('amount'))['total'] or 0.00
        pending_approvals = Supply.objects.filter(status='pending', created_at__gte=start_date).count()
        clients_count = User.objects.filter(role='client').count()

        # 2. Charts: Order volume over timeframe
        order_volume = []
        if timeframe == 'today':
            # Hourly volume for last 8 hours
            for i in range(7, -1, -1):
                hour = now - timedelta(hours=i)
                count = Order.objects.filter(created_at__hour=hour.hour, created_at__date=hour.date()).count()
                order_volume.append({"day": hour.strftime('%H:00'), "value": count})
        elif timeframe == '30days':
            # Daily volume for last 30 days
            for i in range(29, -1, -1):
                day = now - timedelta(days=i)
                count = Order.objects.filter(created_at__date=day.date()).count()
                order_volume.append({"day": day.strftime('%b %d'), "value": count})
        else: # '7days' default
            for i in range(6, -1, -1):
                day = now - timedelta(days=i)
                day_str = day.strftime('%a').upper()
                count = Order.objects.filter(created_at__date=day.date()).count()
                order_volume.append({"day": day_str, "value": count})

        # 3. Charts: Orders by status (shipped merged into delivered)
        status_colors = {
            'pending': '#9ed0ab',
            'processing': '#466551',
            'delivered': '#144227',
            'cancelled': '#ba1a1a'
        }
        status_data = []
        total_orders = Order.objects.filter(created_at__gte=start_date).count()
        if total_orders > 0:
            statuses_to_count = {
                'Pending': Order.objects.filter(status='pending', created_at__gte=start_date).count(),
                'Processing': Order.objects.filter(status='processing', created_at__gte=start_date).count(),
                'Delivered': Order.objects.filter(status__in=['delivered', 'shipped'], created_at__gte=start_date).count(),
                'Cancelled': Order.objects.filter(status='cancelled', created_at__gte=start_date).count(),
            }
            for label, count in statuses_to_count.items():
                if count > 0:
                    pct = round((count / total_orders) * 100, 1)
                    s_key = label.lower()
                    status_data.append({
                        "name": label,
                        "value": pct,
                        "color": status_colors.get(s_key, '#414942')
                    })

        # 4. Top products by volume (filtered by timeframe)
        top_products = []
        prod_volumes = OrderItem.objects.filter(order__created_at__gte=start_date).values('product__name').annotate(volume=Sum('quantity')).order_by('-volume')[:5]
        max_vol = max([float(item['volume']) for item in prod_volumes] or [1.0])
        for item in prod_volumes:
            vol = float(item['volume'])
            top_products.append({
                "name": item['product__name'],
                "volume": vol,
                "percent": int((vol / max_vol) * 100)
            })

        # 5. Needs Attention (up to 5 items)
        needs_attention = []
        # Pending orders
        for o in Order.objects.filter(status='pending')[:2]:
            total_amt = sum(float(item.price * item.quantity) for item in o.items.all())
            needs_attention.append({
                "type": "order",
                "id": o.id,
                "title": f"Pending Order Approval #ORD-{o.id}",
                "sub": f"Customer: {o.client.business_name or o.client.user.email} • ${total_amt:.2f}",
                "color": "text-red-500",
                "icon": "AlertCircle"
            })
        # Unconfirmed delivery notes
        for dn in DeliveryNote.objects.filter(status='pending')[:2]:
            needs_attention.append({
                "type": "delivery_note",
                "id": dn.id,
                "title": f"Unconfirmed Delivery Note #DLV-{dn.id}",
                "sub": f"Status: {dn.status} • {dn.details[:40]}...",
                "color": "text-emerald-600",
                "icon": "Truck"
            })
        # Pending supplies
        for s in Supply.objects.filter(status='pending')[:2]:
            needs_attention.append({
                "type": "supply",
                "id": s.id,
                "title": f"New Supply Submission: {s.product.name}",
                "sub": f"From: {s.farmer.farm_name or s.farmer.user.email} • {s.quantity} {s.product.unit}",
                "color": "text-primary",
                "icon": "Clock"
            })

        # 6. Recent Activity (up to 5 items from AuditLog for any accountable activity)
        # Exclude login/logout activities
        recent_activity = []
        from apps.common.models import AuditLog
        
        excluded_actions = ['login_success', 'logout_success']
        db_activities = AuditLog.objects.exclude(action__in=excluded_actions).order_by('-timestamp')[:5]
        action_map = {
            "user_registration": "New user registered",
            "user_created": "New user added by admin",
            "user_removed": "User removed from system",
            "product_added": "New product added to catalog",
            "product_removed": "Product removed from catalog",
            "password_reset_requested": "Password reset requested",
            "password_reset_confirmed": "Password reset confirmed",
            "supply_submitted": "New supply submitted",
            "negotiation_finalized": "Negotiation finalized",
        }
        for log in db_activities:
            title = action_map.get(log.action, log.action.replace('_', ' ').capitalize())
            if log.target_model and log.target_id:
                title += f" ({log.target_model} #{log.target_id})"
                
            color = "bg-primary"
            if "remove" in log.action or "delete" in log.action:
                color = "bg-red-500"
            elif "success" in log.action or "register" in log.action or "create" in log.action or "add" in log.action:
                color = "bg-emerald-600"
            elif "negotiation" in log.action:
                color = "bg-indigo-600"

            time_diff = timezone.now() - log.timestamp
            if time_diff.total_seconds() < 60:
                time_str = "Just now"
            elif time_diff.total_seconds() < 3600:
                time_str = f"{int(time_diff.total_seconds() / 60)} mins ago"
            else:
                time_str = f"{int(time_diff.total_seconds() / 3600)} hours ago"

            recent_activity.append({
                "t": title,
                "time": time_str,
                "color": color
            })

        return Response({
            "kpis": {
                "active_orders": active_orders,
                "deliveries": deliveries,
                "revenue": float(revenue),
                "pending_approvals": pending_approvals,
                "clients_count": clients_count,
                "total_orders": total_orders
            },
            "order_volume": order_volume,
            "status_data": status_data,
            "top_products": top_products,
            "needs_attention": needs_attention[:5],
            "recent_activity": recent_activity
        })


class AdminReportsView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def get(self, request):
        from apps.supplies.models import Supply
        from apps.orders.models import Order, OrderItem
        from apps.accounts.models import FarmerProfile, ClientProfile
        from apps.products.models import Product
        from django.db.models import Sum, Count, Q

        # 1. Farmer Performance (farmerData)
        farmerData = []
        farmers = FarmerProfile.objects.all()
        for farmer in farmers:
            supplies = Supply.objects.filter(farmer=farmer, status__in=['accepted', 'delivered', 'invoiced'])
            total_yield = float(supplies.aggregate(total=Sum('quantity'))['total'] or 0)
            
            total_count = supplies.count()
            high_quality_count = supplies.filter(quality_grade__in=['premium', 'standard']).count()
            quality_pct = int((high_quality_count / total_count * 100)) if total_count > 0 else 0
            
            if total_yield > 0:
                farmerData.append({
                    "name": farmer.farm_name or farmer.user.username or farmer.user.email,
                    "yield": total_yield,
                    "quality": quality_pct
                })
        
        if not farmerData:
            farmerData = [{"name": "No Suppliers yet", "yield": 0, "quality": 0}]

        # 1b. Supply Volume Report (supplyVolumeData - distinct from farmer performance)
        supplyVolumeData = []
        for product in Product.objects.all():
            supplies = Supply.objects.filter(product=product, status__in=['accepted', 'delivered', 'invoiced'])
            total_qty = float(supplies.aggregate(total=Sum('quantity'))['total'] or 0)
            if total_qty > 0:
                supplyVolumeData.append({
                    "name": product.name,
                    "yield": total_qty
                })
        if not supplyVolumeData:
            supplyVolumeData = [{"name": "No Supplies", "yield": 0}]

        # 2. Sales Analysis (Sales volume grouped by product category)
        salesData = []
        categories = ['Vegetables', 'Fruits', 'Animal-Based', 'Grains']
        for cat in categories:
            items = OrderItem.objects.filter(product__category=cat, order__status='delivered')
            total_sales = sum(float(x.price * x.quantity) for x in items)
            salesData.append({
                "name": cat,
                "value": total_sales
            })

        # 3. Supplier Rankings
        supplier_rankings = []
        for farmer in FarmerProfile.objects.all():
            supplies = Supply.objects.filter(farmer=farmer)
            total_yield = float(supplies.filter(status__in=['accepted', 'delivered', 'invoiced']).aggregate(total=Sum('quantity'))['total'] or 0)
            
            total_count = supplies.filter(status__in=['accepted', 'delivered', 'invoiced']).count()
            high_quality_count = supplies.filter(status__in=['accepted', 'delivered', 'invoiced'], quality_grade__in=['premium', 'standard']).count()
            quality_pct = (high_quality_count / total_count * 100) if total_count > 0 else 0.0
            
            if total_yield > 0 or total_count > 0:
                perf = int(70 + (quality_pct * 0.3))
                supplier_rankings.append({
                    "name": farmer.farm_name or farmer.user.username or farmer.user.email,
                    "region": farmer.location or "Unknown",
                    "yield": total_yield,
                    "quality": f"{quality_pct:.1f}%",
                    "class": "Class A" if quality_pct >= 90 else "Class B",
                    "perf": perf
                })
        supplier_rankings.sort(key=lambda x: x['perf'], reverse=True)
        
        # 4. Client Rankings
        client_rankings = []
        for client in ClientProfile.objects.all():
            orders = Order.objects.filter(client=client)
            total_orders_val = sum(sum(float(item.price * item.quantity) for item in o.items.all()) for o in orders.filter(status='delivered'))
            
            total_count = orders.count()
            delivered_count = orders.filter(status='delivered').count()
            completed_pct = (delivered_count / total_count * 100) if total_count > 0 else 0.0
            
            if total_orders_val > 0 or total_count > 0:
                perf = int(70 + (completed_pct * 0.3))
                client_rankings.append({
                    "name": client.business_name or client.user.username or client.user.email,
                    "region": client.delivery_address or "Unknown",
                    "yield": total_orders_val,
                    "quality": f"{completed_pct:.1f}%",
                    "class": "Class A" if completed_pct >= 90 else "Class B",
                    "perf": perf
                })
        client_rankings.sort(key=lambda x: x['perf'], reverse=True)

        # 5. Global Stats
        all_supplies = Supply.objects.filter(status__in=['accepted', 'delivered', 'invoiced'])
        total_supplies = all_supplies.count()
        premium_supplies = all_supplies.filter(quality_grade__in=['premium', 'standard']).count()
        global_avg_quality = f"{(premium_supplies / total_supplies * 100):.1f}%" if total_supplies > 0 else "0.0%"
        
        active_suppliers_count = FarmerProfile.objects.count()
        active_clients_count = ClientProfile.objects.count()

        return Response({
            "farmerData": farmerData,
            "supplyVolumeData": supplyVolumeData,
            "salesData": salesData,
            "supplier_rankings": supplier_rankings,
            "client_rankings": client_rankings,
            "global_stats": {
                "global_avg_quality": global_avg_quality,
                "active_suppliers_count": active_suppliers_count,
                "active_clients_count": active_clients_count
            }
        })
