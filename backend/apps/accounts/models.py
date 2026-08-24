import uuid
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone

class User(AbstractUser):
    ROLE_CHOICES = (
        ('admin', 'Admin'),
        ('farmer', 'Farmer'),
        ('client', 'Client'),
    )
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='client')
    failed_login_attempts = models.IntegerField(default=0)
    locked_until = models.DateTimeField(null=True, blank=True)
    scheduled_deletion_date = models.DateTimeField(null=True, blank=True)
    archived_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, default='active')

    @property
    def is_locked(self):
        if self.locked_until and self.locked_until > timezone.now():
            return True
        return False


class FarmerProfile(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="farmer_profile")
    farm_name = models.CharField(max_length=255, blank=True)
    location = models.CharField(max_length=255, blank=True)
    organic_certified = models.BooleanField(default=False)
    certification_number = models.CharField(max_length=100, blank=True)
    phone = models.CharField(max_length=50, blank=True, default='')
    certifications = models.TextField(blank=True, default='')
    payment_method = models.CharField(max_length=100, blank=True, default='MTN Mobile Money (MoMo)')
    payment_account_number = models.CharField(max_length=100, blank=True, default='')
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    notify_new_demand = models.BooleanField(default=True)
    notify_negotiation_update = models.BooleanField(default=True)
    notify_payment_received = models.BooleanField(default=True)
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)

    def __str__(self):
        return f"{self.farm_name or self.user.email}"


class ClientProfile(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="client_profile")
    business_name = models.CharField(max_length=255, blank=True)
    business_title = models.CharField(max_length=255, blank=True)  # Job title/position
    delivery_address = models.TextField(blank=True)
    phone = models.CharField(max_length=50, blank=True)
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    signature_data = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.business_name or self.user.email}"


class AdminProfile(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="admin_profile")
    department = models.CharField(max_length=100, blank=True)
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)

    def __str__(self):
        return f"Admin Profile: {self.user.email}"


class FarmerApplication(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    )
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    full_name = models.CharField(max_length=255)
    email = models.EmailField()
    phone = models.CharField(max_length=50)
    farm_name = models.CharField(max_length=255)
    location = models.CharField(max_length=255)
    crops = models.TextField(blank=True, default='')
    certifications = models.TextField(blank=True, default='')
    description = models.TextField()
    password = models.CharField(max_length=255, blank=True, default='')  # Store password from application
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.farm_name} ({self.full_name}) - {self.status}"


class SystemSetting(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    key = models.CharField(max_length=100, unique=True)
    value = models.TextField(blank=True, default='')

    def __str__(self):
        return f"{self.key}={self.value}"

