from django.contrib import admin

from .models import ChatSession, Diagnosis, DiagnosticState, Message, UploadedMedia


@admin.register(ChatSession)
class ChatSessionAdmin(admin.ModelAdmin):
    list_display = ("id", "customer", "category", "status", "created_at")
    list_filter = ("category", "status")


@admin.register(Diagnosis)
class DiagnosisAdmin(admin.ModelAdmin):
    list_display = ("id", "session", "category", "severity", "overall_confidence", "source", "created_at")
    list_filter = ("category", "severity", "source")


admin.site.register(Message)
admin.site.register(UploadedMedia)
admin.site.register(DiagnosticState)
