from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.utils import timezone
from django.conf import settings
from django.core.mail import send_mail
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework.throttling import ScopedRateThrottle
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView
from datetime import timedelta

from .serializers import (
    UserSerializer,
    LoginSerializer,
    PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer,
    RegisterSerializer
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
    pass


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'login'

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data['email']
        password = serializer.validated_data['password']

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            # Timing attack mitigation: do dummy hash check
            User().set_password(password)
            log_action(request, actor=None, action="failed_login_nonexistent_user")
            return Response(
                {"errors": {"non_field_errors": ["Invalid credentials."]}},
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
