from django.contrib import admin
from .models import Specialization, Service, Doctors, Assistant

@admin.register(Specialization)
class SpecializationAdmin(admin.ModelAdmin):
    list_display = ('title', 'cost', 'created_at', 'updated_at')
    list_filter = ('created_at', 'updated_at')
    search_fields = ('title',)
    date_hierarchy = 'created_at'

@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = ('title', 'spec_id', 'created_at', 'updated_at')
    list_filter = ('spec_id', 'created_at', 'updated_at')
    search_fields = ('title',)
    date_hierarchy = 'created_at'

@admin.register(Doctors)
class DoctorsAdmin(admin.ModelAdmin):
    list_display = ('first_name', 'last_name', 'father_name', 'body', 'services_id', 'created_at', 'updated_at')
    list_filter = ('services_id', 'created_at', 'updated_at')
    search_fields = ('first_name', 'last_name', 'father_name')
    date_hierarchy = 'created_at'

@admin.register(Assistant)
class AssistantAdmin(admin.ModelAdmin):
    list_display = ('first_name', 'last_name', 'father_name', 'body', 'services_id', 'created_at', 'updated_at')
    list_filter = ('services_id', 'created_at', 'updated_at')
    search_fields = ('first_name', 'last_name', 'father_name')
    date_hierarchy = 'created_at'
