from django.db import models

class Product(models.Model):
    name = models.CharField(max_length=255)
    category = models.CharField(max_length=100) # e.g. Fruits, Vegetables, Grains, Herbs
    is_currently_needed = models.BooleanField(default=False)
    urgency = models.CharField(max_length=20, default='low') # low, medium, high
    unit = models.CharField(max_length=10, default='kg')
    base_price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    image = models.URLField(max_length=500, blank=True, default='')
    quantity_needed = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

    def __str__(self):
        return self.name
