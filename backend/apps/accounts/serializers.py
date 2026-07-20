from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework_simplejwt.serializers import TokenRefreshSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from .models import FarmerProfile, ClientProfile, AdminProfile

User = get_user_model()

def check_phone_unique(phone, exclude_user=None):
    if not phone:
        return
    # Check FarmerProfile
    qs_farmer = FarmerProfile.objects.filter(phone=phone)
    if exclude_user:
        qs_farmer = qs_farmer.exclude(user=exclude_user)
    if qs_farmer.exists():
        raise serializers.ValidationError("This phone number is already in use by another user.")
    
    # Check ClientProfile
    qs_client = ClientProfile.objects.filter(phone=phone)
    if exclude_user:
        qs_client = qs_client.exclude(user=exclude_user)
    if qs_client.exists():
        raise serializers.ValidationError("This phone number is already in use by another user.")

class FarmerProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = FarmerProfile
        fields = ['farm_name', 'location', 'organic_certified', 'certification_number', 'phone', 'certifications', 'latitude', 'longitude', 'notify_new_demand', 'notify_negotiation_update', 'notify_payment_received']

    def validate_phone(self, value):
        user = None
        if self.instance and self.instance.user:
            user = self.instance.user
        check_phone_unique(value, exclude_user=user)
        return value


class ClientProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClientProfile
        fields = ['business_name', 'delivery_address', 'phone']

    def validate_phone(self, value):
        user = None
        if self.instance and self.instance.user:
            user = self.instance.user
        check_phone_unique(value, exclude_user=user)
        return value


class AdminProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = AdminProfile
        fields = ['department']


class UserSerializer(serializers.ModelSerializer):
    profile = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role', 'first_name', 'last_name', 'date_joined', 'is_active', 'profile']

    def get_profile(self, obj):
        if obj.role == 'farmer':
            try:
                return FarmerProfileSerializer(obj.farmer_profile).data
            except Exception:
                return None
        elif obj.role == 'client':
            try:
                return ClientProfileSerializer(obj.client_profile).data
            except Exception:
                return None
        elif obj.role == 'admin':
            try:
                return AdminProfileSerializer(obj.admin_profile).data
            except Exception:
                return None
        return None


class LoginSerializer(serializers.Serializer):
    username_or_email = serializers.CharField()
    password = serializers.CharField(write_only=True)
    remember_me = serializers.BooleanField(required=False, default=False)


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()


class PasswordResetConfirmSerializer(serializers.Serializer):
    uidb64 = serializers.CharField()
    token = serializers.CharField()
    new_password = serializers.CharField(write_only=True)

    def validate_new_password(self, value):
        validate_password(value)
        return value


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})
    role = serializers.ChoiceField(choices=User.ROLE_CHOICES, default='client')
    business_name = serializers.CharField(required=False, allow_blank=True)
    farm_name = serializers.CharField(required=False, allow_blank=True)
    delivery_address = serializers.CharField(required=False, allow_blank=True)
    location = serializers.CharField(required=False, allow_blank=True)
    phone = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'role', 'business_name', 'farm_name', 'delivery_address', 'location', 'phone']

    def validate_phone(self, value):
        check_phone_unique(value)
        return value

    def create(self, validated_data):
        role = validated_data.get('role', 'client')
        username = validated_data.get('username')
        email = validated_data.get('email')
        password = validated_data.get('password')

        # Pop profile-specific fields
        business_name = validated_data.pop('business_name', '')
        farm_name = validated_data.pop('farm_name', '')
        delivery_address = validated_data.pop('delivery_address', '')
        location = validated_data.pop('location', '')
        phone = validated_data.pop('phone', '')

        # Create user
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            role=role
        )

        # Create specific profile
        if role == 'farmer':
            FarmerProfile.objects.create(
                user=user,
                farm_name=farm_name,
                location=location,
                phone=phone
            )
        elif role == 'client':
            ClientProfile.objects.create(
                user=user,
                business_name=business_name,
                delivery_address=delivery_address,
                phone=phone
            )
        elif role == 'admin':
            AdminProfile.objects.create(user=user)

        return user


class CustomTokenRefreshSerializer(TokenRefreshSerializer):
    def validate(self, attrs):
        old_refresh = RefreshToken(attrs['refresh'])
        old_exp = old_refresh['exp']
        
        data = super().validate(attrs)
        
        if 'refresh' in data:
            new_refresh = RefreshToken(data['refresh'])
            new_refresh['exp'] = old_exp
            data['refresh'] = str(new_refresh)
            
        return data


class AdminUserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False, style={'input_type': 'password'})
    farmer_profile = FarmerProfileSerializer(required=False)
    client_profile = ClientProfileSerializer(required=False)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role', 'is_active', 'date_joined', 'password', 'farmer_profile', 'client_profile']
        read_only_fields = ['id', 'date_joined']

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        farmer_data = validated_data.pop('farmer_profile', None)
        client_data = validated_data.pop('client_profile', None)
        role = validated_data.get('role', 'client')

        user = User(**validated_data)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save()

        # Handle Profile creation
        if role == 'farmer':
            f_profile_data = farmer_data or {}
            FarmerProfile.objects.create(user=user, **f_profile_data)
        elif role == 'client':
            c_profile_data = client_data or {}
            ClientProfile.objects.create(user=user, **c_profile_data)
        elif role == 'admin':
            AdminProfile.objects.create(user=user)

        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        farmer_data = validated_data.pop('farmer_profile', None)
        client_data = validated_data.pop('client_profile', None)

        # Update basic user fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        if password:
            instance.set_password(password)
        instance.save()

        # Update profile fields
        if instance.role == 'farmer' and farmer_data:
            profile, _ = FarmerProfile.objects.get_or_create(user=instance)
            for attr, value in farmer_data.items():
                setattr(profile, attr, value)
            profile.save()
        elif instance.role == 'client' and client_data:
            profile, _ = ClientProfile.objects.get_or_create(user=instance)
            for attr, value in client_data.items():
                setattr(profile, attr, value)
            profile.save()

        return instance
