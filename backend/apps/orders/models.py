import uuid
from django.db import models
from apps.accounts.models import ClientProfile
from apps.products.models import Product

class Order(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('shipped', 'Shipped'),
        ('delivered', 'Delivered'),
        ('cancelled', 'Cancelled')
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    client = models.ForeignKey(ClientProfile, on_delete=models.CASCADE, related_name='orders')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    delivery_address = models.TextField()
    transport_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    tax_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    is_assessed = models.BooleanField(default=False)
    is_archived = models.BooleanField(default=False)
    is_deleted_by_client = models.BooleanField(default=False)
    is_quantity_deducted = models.BooleanField(default=False)
    order_number = models.CharField(max_length=50, unique=True, blank=True, null=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)

    @property
    def formatted_order_number(self):
        if self.order_number:
            return self.order_number
        return ""

    def save(self, *args, **kwargs):
        if not self.order_number:
            max_num = 0
            for o in Order.objects.exclude(order_number__isnull=True).values_list('order_number', flat=True):
                if o and o.startswith('ORD-'):
                    try:
                        num = int(o.replace('ORD-', ''))
                        if num > max_num:
                            max_num = num
                    except ValueError:
                        pass
            next_num = max_num + 1
            self.order_number = f"ORD-{next_num:06d}"
        super().save(*args, **kwargs)

    def __str__(self):
        num = self.formatted_order_number or str(self.id)
        return f"{num} - {self.client.user.email}"


class OrderItem(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    price = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"{self.product.name} ({self.quantity})"
