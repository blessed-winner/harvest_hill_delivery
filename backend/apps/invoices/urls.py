from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import InvoiceViewSet, InvoiceSummaryView

router = DefaultRouter()
router.register(r'invoices', InvoiceViewSet, basename='invoice')

urlpatterns = [
    path('invoiceSummary/', InvoiceSummaryView.as_view(), name='invoice-summary'),
] + router.urls
