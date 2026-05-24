from django.contrib import admin
from .models import StatusLtv, Gender, FindOut, Ltv, Client

@admin.register(StatusLtv)
class StatusLtvAdmin(admin.ModelAdmin):
    list_display = ('title', 'created_at', 'updated_at')
    list_filter = ('created_at', 'updated_at')
    search_fields = ('title',)

@admin.register(Gender)
class GenderAdmin(admin.ModelAdmin):
    list_display = ('gender_name',)
    search_fields = ('gender_name',)

@admin.register(FindOut)
class FindOutAdmin(admin.ModelAdmin):
    list_display = ('find_out_name',)
    search_fields = ('find_out_name',)

@admin.register(Ltv)
class LtvAdmin(admin.ModelAdmin):
    list_display = ('services', 'status', 'specialization_title', 'tooth', 'specialization_cost', 'count', 'total', 'created_at', 'updated_at')
    list_filter = ('created_at', 'updated_at')
    search_fields = ('services__title', 'status__title', 'specialization_title__title')

@admin.register(Client)
class ClientAdmin(admin.ModelAdmin):
    list_display = ('first_name', 'last_name', 'father_name', 'gender', 'mobile_phone', 'iin', 'date_of_birth', 'find_out', 'ltv', 'doctor', 'created_at', 'updated_at')
    list_filter = ('gender', 'find_out', 'doctor', 'created_at', 'updated_at')
    search_fields = ('first_name', 'last_name', 'father_name', 'mobile_phone', 'iin')
    autocomplete_fields = ('ltv', 'doctor',)
    date_hierarchy = 'date_of_birth'
