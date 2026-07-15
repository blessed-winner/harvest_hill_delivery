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
        if user.role == 'farmer':
            try:
                profile = user.farmer_profile
            except AttributeError:
                return Response({"detail": "Farmer profile does not exist."}, status=status.HTTP_400_BAD_REQUEST)
            
            serializer = FarmerProfileSerializer(profile, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(UserSerializer(user).data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        elif user.role == 'client':
            try:
                profile = user.client_profile
            except AttributeError:
                return Response({"detail": "Client profile does not exist."}, status=status.HTTP_400_BAD_REQUEST)
                
            serializer = ClientProfileSerializer(profile, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(UserSerializer(user).data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AdminUserViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdmin]
    serializer_class = AdminUserSerializer
    queryset = User.objects.all().order_by('-date_joined')

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


class AdminDashboardView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        from apps.orders.models import Order, OrderItem
        from apps.supplies.models import Supply
        from apps.invoices.models import Invoice
        from apps.delivery_notes.models import DeliveryNote
        from django.db.models import Sum, Count

        # 1. KPIs
        active_orders = Order.objects.exclude(status__in=['delivered', 'cancelled']).count()
        deliveries = Order.objects.filter(status='delivered').count()
        revenue = Invoice.objects.filter(status='paid').aggregate(total=Sum('amount'))['total'] or 0.00
        pending_approvals = Supply.objects.filter(status='pending').count()
        clients_count = User.objects.filter(role='client').count()

        # 2. Charts: Order volume over last 7 days
        order_volume = []
        for i in range(6, -1, -1):
            day = timezone.now() - timedelta(days=i)
            day_str = day.strftime('%a').upper()
            count = Order.objects.filter(created_at__date=day.date()).count()
            order_volume.append({"day": day_str, "value": count})

        # 3. Charts: Orders by status
        status_colors = {
            'pending': '#9ed0ab',
            'processing': '#466551',
            'shipped': '#144227',
            'delivered': '#144227',
            'cancelled': '#ba1a1a'
        }
        status_data = []
        total_orders = Order.objects.count()
        if total_orders > 0:
            for s_choice, s_label in Order.STATUS_CHOICES:
                count = Order.objects.filter(status=s_choice).count()
                if count > 0:
                    pct = round((count / total_orders) * 100, 1)
                    status_data.append({
                        "name": s_label,
                        "value": pct,
                        "color": status_colors.get(s_choice, '#414942')
                    })

        # 4. Top products by volume
        top_products = []
        prod_volumes = OrderItem.objects.values('product__name').annotate(volume=Sum('quantity')).order_by('-volume')[:5]
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

        # 6. Recent Activity (up to 5 items)
        recent_activity = []
        # Let's pull recently created orders, supplies, and delivery notes
        activities = []
        for o in Order.objects.order_by('-created_at')[:3]:
            activities.append({
                "t": f"Order #{o.id} Created",
                "time": o.created_at,
                "color": "bg-primary"
            })
        for s in Supply.objects.order_by('-created_at')[:3]:
            activities.append({
                "t": f"Supply: {s.product.name} submitted",
                "time": s.created_at,
                "color": "bg-emerald-600"
            })
        for dn in DeliveryNote.objects.order_by('-created_at')[:3]:
            activities.append({
                "t": f"Delivery Note #{dn.id} update",
                "time": dn.created_at,
                "color": "bg-outline-variant"
            })
        
        # Sort activities by time desc
        activities.sort(key=lambda x: x['time'], reverse=True)
        for act in activities[:5]:
            time_diff = timezone.now() - act['time']
            if time_diff.total_seconds() < 60:
                time_str = "Just now"
            elif time_diff.total_seconds() < 3600:
                time_str = f"{int(time_diff.total_seconds() / 60)} mins ago"
            else:
                time_str = f"{int(time_diff.total_seconds() / 3600)} hours ago"

            recent_activity.append({
                "t": act['t'],
                "time": time_str,
                "color": act['color']
            })

        return Response({
            "kpis": {
                "active_orders": active_orders,
                "deliveries": deliveries,
                "revenue": float(revenue),
                "pending_approvals": pending_approvals,
                "clients_count": clients_count
            },
            "order_volume": order_volume,
            "status_data": status_data,
            "top_products": top_products,
            "needs_attention": needs_attention[:5],
            "recent_activity": recent_activity
        })
