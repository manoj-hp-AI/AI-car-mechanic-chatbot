from django.contrib import admin

from .models import Booking, CallRequest


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ("id", "customer", "service_requested", "status", "created_at")
    list_filter = ("status",)


@admin.register(CallRequest)
class CallRequestAdmin(admin.ModelAdmin):
    list_display = ("id", "customer", "phone_number", "status", "created_at")
    list_filter = ("status",)
