from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import FarmerProfile, ClientProfile, AdminProfile

User = get_user_model()

class FarmerProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = FarmerProfile
        fields = ['farm_name', 'location', 'organic_certified', 'certification_number', 'phone', 'certifications', 'latitude', 'longitude']


class ClientProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClientProfile
        fields = ['business_name', 'delivery_address', 'phone']


class AdminProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = AdminProfile
        fields = ['department']


class UserSerializer(serializers.ModelSerializer):
    profile = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'email', 'role', 'is_email_verified', 'date_joined', 'profile']
        read_only_fields = ['id', 'email', 'role', 'is_email_verified', 'date_joined']

    def get_profile(self, obj):
        if obj.role == 'farmer' and hasattr(obj, 'farmer_profile'):
            return FarmerProfileSerializer(obj.farmer_profile).data
        elif obj.role == 'client' and hasattr(obj, 'client_profile'):
            return ClientProfileSerializer(obj.client_profile).data
        elif obj.role == 'admin' and hasattr(obj, 'admin_profile'):
            return AdminProfileSerializer(obj.admin_profile).data
        return None


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()


class PasswordResetConfirmSerializer(serializers.Serializer):
    uidb64 = serializers.CharField()
    token = serializers.CharField()
    new_password = serializers.CharField(write_only=True, min_length=10)


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=10)
    full_name = serializers.CharField(required=True)
    phone = serializers.CharField(required=False, allow_blank=True, default='')

    class Meta:
        model = User
        fields = ['email', 'password', 'role', 'full_name', 'phone']

    def create(self, validated_data):
        full_name = validated_data.pop('full_name')
        phone = validated_data.pop('phone', '')
        
        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            role=validated_data['role']
        )
        
        # Update profile properties based on role
        if user.role == 'farmer':
            profile = user.farmer_profile
            profile.farm_name = full_name
            profile.save()
        elif user.role == 'client':
            profile = user.client_profile
            profile.business_name = full_name
            profile.phone = phone
            profile.save()
            
        return user
