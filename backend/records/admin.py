from django.contrib import admin
from .models import Status, RecordsLog, ChairNum, RecordingType, PaymentType, PaymentState, Record

@admin.register(Status)
class StatusAdmin(admin.ModelAdmin):
    list_display = ('title', 'created_at', 'updated_at')
    list_filter = ('created_at', 'updated_at')
    search_fields = ('title',)

@admin.register(RecordsLog)
class RecordsLogAdmin(admin.ModelAdmin):
    list_display = ('title', 'created_at', 'updated_at')
    list_filter = ('created_at', 'updated_at')
    search_fields = ('title',)

@admin.register(ChairNum)
class ChairNumAdmin(admin.ModelAdmin):
    list_display = ('title', 'created_at', 'updated_at')
    list_filter = ('created_at', 'updated_at')
    search_fields = ('title',)

@admin.register(RecordingType)
class RecordingTypeAdmin(admin.ModelAdmin):
    list_display = ('title', 'created_at', 'updated_at')
    list_filter = ('created_at', 'updated_at')
    search_fields = ('title',)

@admin.register(PaymentType)
class PaymentTypeAdmin(admin.ModelAdmin):
    list_display = ('title', 'created_at', 'updated_at')
    list_filter = ('created_at', 'updated_at')
    search_fields = ('title',)

@admin.register(PaymentState)
class PaymentStateAdmin(admin.ModelAdmin):
    list_display = ('title', 'created_at', 'updated_at')
    list_filter = ('created_at', 'updated_at')
    search_fields = ('title',)

@admin.register(Record)
class RecordAdmin(admin.ModelAdmin):
    list_display = ('client', 'doctor', 'assistant', 'service', 'specialization', 'tooth', 'registration_date', 'record_start', 'record_end', 'recording_type', 'chair', 'payment_type', 'payment_state', 'status', 'created_at', 'updated_at')
    list_filter = ('doctor', 'assistant', 'service', 'specialization', 'registration_date', 'record_start', 'record_end', 'recording_type', 'chair', 'payment_type', 'payment_state', 'status', 'created_at', 'updated_at')
    search_fields = ('client__first_name', 'client__last_name', 'doctor__first_name', 'doctor__last_name', 'assistant__first_name', 'assistant__last_name', 'service__title', 'specialization__title', 'notes', 'reason')
    date_hierarchy = 'registration_date'
