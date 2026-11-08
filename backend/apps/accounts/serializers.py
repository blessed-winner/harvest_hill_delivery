from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework_simplejwt.serializers import TokenRefreshSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from .models import FarmerProfile, ClientProfile, AdminProfile, FarmerApplication

User = get_user_model()

def check_phone_unique(phone, exclude_user=None):
    if not phone or not str(phone).strip():
        return
    clean_phone = str(phone).strip().replace(" ", "").replace("-", "")
    exclude_id = exclude_user.id if (exclude_user and hasattr(exclude_user, 'id')) else None

    # Check FarmerProfile
    for fp in FarmerProfile.objects.all():
        if exclude_id and fp.user_id == exclude_id:
            continue
        if fp.phone and str(fp.phone).strip().replace(" ", "").replace("-", "") == clean_phone:
            raise serializers.ValidationError("This phone number is already in use by another user.")
    
    # Check ClientProfile
    for cp in ClientProfile.objects.all():
        if exclude_id and cp.user_id == exclude_id:
            continue
        if cp.phone and str(cp.phone).strip().replace(" ", "").replace("-", "") == clean_phone:
            raise serializers.ValidationError("This phone number is already in use by another user.")

class FarmerProfileSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source='user.email', read_only=True)

    class Meta:
        model = FarmerProfile
        fields = ['id', 'user_email', 'farm_name', 'location', 'organic_certified', 'certification_number', 'phone', 'certifications', 'payment_method', 'payment_account_number', 'latitude', 'longitude', 'notify_new_demand', 'notify_negotiation_update', 'notify_payment_received', 'avatar']

    def validate_phone(self, value):
        if not value:
            return ''
        clean_value = str(value).strip()
        user = None
        if self.instance:
            if hasattr(self.instance, 'user') and self.instance.user:
                user = self.instance.user
            current_phone = str(self.instance.phone or '').strip().replace(" ", "").replace("-", "")
            incoming_phone = clean_value.replace(" ", "").replace("-", "")
            if current_phone and current_phone == incoming_phone:
                return clean_value

        check_phone_unique(clean_value, exclude_user=user)
        return clean_value


class ClientProfileSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source='user.email', read_only=True)

    class Meta:
        model = ClientProfile
        fields = ['id', 'user_email', 'business_name', 'delivery_address', 'phone', 'business_title', 'avatar', 'signature_data']

    def validate_phone(self, value):
        if not value:
            return ''
        clean_value = str(value).strip()
        user = None
        if self.instance:
            if hasattr(self.instance, 'user') and self.instance.user:
                user = self.instance.user
            current_phone = str(self.instance.phone or '').strip().replace(" ", "").replace("-", "")
            incoming_phone = clean_value.replace(" ", "").replace("-", "")
            if current_phone and current_phone == incoming_phone:
                return clean_value

        check_phone_unique(clean_value, exclude_user=user)
        return clean_value


class AdminProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = AdminProfile
        fields = ['department', 'avatar']


class UserSerializer(serializers.ModelSerializer):
    profile = serializers.SerializerMethodField()
    avatar = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role', 'first_name', 'last_name', 'date_joined', 'is_active', 'profile', 'avatar']

    def get_avatar(self, obj):
        try:
            profile = None
            if obj.role == 'farmer' and hasattr(obj, 'farmer_profile'):
                profile = obj.farmer_profile
            elif obj.role == 'client' and hasattr(obj, 'client_profile'):
                profile = obj.client_profile
            elif obj.role == 'admin' and hasattr(obj, 'admin_profile'):
                profile = obj.admin_profile
            
            if profile and profile.avatar:
                request = self.context.get('request')
                if request:
                    return request.build_absolute_uri(profile.avatar.url)
                return profile.avatar.url
        except Exception:
            pass
        return None

    def get_profile(self, obj):
        if obj.role == 'farmer':
            try:
                return FarmerProfileSerializer(obj.farmer_profile, context=self.context).data
            except Exception:
                return None
        elif obj.role == 'client':
            try:
                return ClientProfileSerializer(obj.client_profile, context=self.context).data
            except Exception:
                return None
        elif obj.role == 'admin':
            try:
                return AdminProfileSerializer(obj.admin_profile, context=self.context).data
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
    role = serializers.ChoiceField(choices=[('client', 'Client'), ('farmer', 'Farmer')], default='client')
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

        # Create specific profile or update existing
        if role == 'farmer':
            profile, _ = FarmerProfile.objects.get_or_create(user=user)
            profile.farm_name = farm_name
            profile.location = location
            profile.phone = phone
            profile.save()
        elif role == 'client':
            profile, _ = ClientProfile.objects.get_or_create(user=user)
            profile.business_name = business_name
            profile.delivery_address = delivery_address
            profile.phone = phone
            profile.save()
        elif role == 'admin':
            AdminProfile.objects.get_or_create(user=user)

        return user


from datetime import timedelta

class CustomTokenRefreshSerializer(TokenRefreshSerializer):
    def validate(self, attrs):
        old_refresh = RefreshToken(attrs['refresh'])
        is_remember_me = old_refresh.get('is_remember_me', False)
        
        data = super().validate(attrs)
        
        if 'refresh' in data:
            new_refresh = RefreshToken(data['refresh'])
            new_refresh['is_remember_me'] = is_remember_me
            if is_remember_me:
                new_refresh.set_exp(lifetime=timedelta(days=30))
            else:
                new_refresh.set_exp(lifetime=timedelta(days=7))
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
            profile, _ = FarmerProfile.objects.get_or_create(user=user)
            for attr, value in f_profile_data.items():
                setattr(profile, attr, value)
            profile.save()
        elif role == 'client':
            c_profile_data = client_data or {}
            profile, _ = ClientProfile.objects.get_or_create(user=user)
            for attr, value in c_profile_data.items():
                setattr(profile, attr, value)
            profile.save()
        elif role == 'admin':
            AdminProfile.objects.get_or_create(user=user)

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


class FarmerApplicationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False, allow_blank=True)
    description = serializers.CharField(required=False, allow_blank=True, default='')
    crops = serializers.CharField(required=False, allow_blank=True, default='')
    certifications = serializers.CharField(required=False, allow_blank=True, default='')

    class Meta:
        model = FarmerApplication
        fields = ['id', 'full_name', 'email', 'phone', 'farm_name', 'location', 'crops', 'certifications', 'description', 'password', 'status', 'created_at', 'updated_at']
        read_only_fields = ['id', 'status', 'created_at', 'updated_at']


DEFAULT_HOMEPAGE_FEATURE_CARDS = [
    {
        "id": "card-peak-season",
        "title": "Peak Season",
        "description": "This week's best",
        "eyebrow": "IN HARVEST",
        "link": "Vegetables",
        "image": "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=300&auto=format&fit=crop&q=80",
        "order": 1,
        "is_active": True,
    },
    {
        "id": "card-new-season",
        "title": "New This Season",
        "description": "Just arrived",
        "eyebrow": "FRESH ARRIVAL",
        "link": "Fruits",
        "image": "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=300&auto=format&fit=crop&q=80",
        "order": 2,
        "is_active": True,
    },
    {
        "id": "card-flash-deals",
        "title": "Flash Deals",
        "description": "Limited time",
        "eyebrow": "UP TO 35% OFF",
        "link": "Deals",
        "image": "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=300&auto=format&fit=crop&q=80",
        "order": 3,
        "is_active": True,
    },
    {
        "id": "card-fresh-vegetables",
        "title": "Fresh Vegetables",
        "description": "Wholesale harvest",
        "eyebrow": "CRATE RATES",
        "link": "Vegetables",
        "image": "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=300&auto=format&fit=crop&q=80",
        "order": 4,
        "is_active": True,
    },
    {
        "id": "card-ready-to-ship",
        "title": "Ready to Ship",
        "description": "Fastest delivery",
        "eyebrow": "SAME-DAY DISPATCH",
        "link": "Seasonal",
        "image": "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=300&auto=format&fit=crop&q=80",
        "order": 5,
        "is_active": True,
    },
]


class HomepageFeatureCardSerializer(serializers.Serializer):
    id = serializers.CharField(required=False, allow_blank=True, default='')
    title = serializers.CharField(required=True, allow_blank=False, max_length=150, error_messages={'blank': 'Card title is required.'})
    eyebrow = serializers.CharField(required=False, allow_blank=True, max_length=100, default='')
    description = serializers.CharField(required=False, allow_blank=True, max_length=250, default='')
    image = serializers.CharField(required=True, allow_blank=False, error_messages={'blank': 'Card image is required.'})
    link = serializers.CharField(required=False, allow_blank=True, max_length=255, default='')
    order = serializers.IntegerField(required=False, default=1)
    is_active = serializers.BooleanField(required=False, default=True)

    def to_internal_value(self, data):
        # Support aliases
        if isinstance(data, dict):
            mapped = dict(data)
            if 'label' in mapped and 'title' not in mapped:
                mapped['title'] = mapped['label']
            if 'tag' in mapped and 'eyebrow' not in mapped:
                mapped['eyebrow'] = mapped['tag']
            if 'subtext' in mapped and 'description' not in mapped:
                mapped['description'] = mapped['subtext']
            if 'category' in mapped and 'link' not in mapped:
                mapped['link'] = mapped['category']
            if 'enabled' in mapped and 'is_active' not in mapped:
                mapped['is_active'] = mapped['enabled']
            return super().to_internal_value(mapped)
        return super().to_internal_value(data)

