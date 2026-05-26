from django.contrib import admin
from users.models import User, FamilyMember


@admin.register(User)
class UserAccountAdmin(admin.ModelAdmin):
    list_display = ('username', 'role', 'last_name', 'first_name', 'email', 'mobile_phone', 'iin', 'is_active', 'created_at')
    list_filter = ('role', 'is_active', 'gender')
    search_fields = ('username', 'first_name', 'last_name', 'email', 'iin', 'mobile_phone')
    readonly_fields = ('created_at', 'updated_at', 'password')
    ordering = ('-created_at',)


@admin.register(FamilyMember)
class FamilyMemberAdmin(admin.ModelAdmin):
    list_display = ('user', 'relation_type', 'last_name', 'first_name', 'iin', 'date_of_birth')
    list_filter = ('relation_type', 'gender')
    search_fields = ('first_name', 'last_name', 'iin', 'user__username')

