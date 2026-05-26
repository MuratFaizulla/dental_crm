from django.contrib import admin

from .models import Payment


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ['id', 'record', 'amount', 'payment_type', 'paid_at', 'received_by']
    list_filter = ['payment_type', 'paid_at']
    search_fields = ['record__client_first_name', 'record__client_last_name']
