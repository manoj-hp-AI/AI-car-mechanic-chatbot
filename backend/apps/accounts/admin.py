from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import User


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ("username", "email", "role", "admin_sub_role", "is_active_account", "created_at")
    list_filter = ("role", "admin_sub_role", "is_active_account")
    fieldsets = UserAdmin.fieldsets + (
        ("Role info", {"fields": ("role", "admin_sub_role", "phone_number", "is_active_account")}),
    )
