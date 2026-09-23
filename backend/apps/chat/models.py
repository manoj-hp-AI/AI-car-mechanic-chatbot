import uuid

from django.conf import settings
from django.db import models


class ChatSession(models.Model):
    class Status(models.TextChoices):
        ACTIVE = "ACTIVE", "Active"                    # collecting the initial query / category
        COLLECTING = "COLLECTING", "Collecting info"    # asking follow-up questions
        READY = "READY", "Ready for diagnosis"
        DIAGNOSED = "DIAGNOSED", "Diagnosed"
        REJECTED = "REJECTED", "Out of scope"
        CLOSED = "CLOSED", "Closed"

    class Category(models.TextChoices):
        WONT_START = "WONT_START", "Car won't start"
        ENGINE_NOISE = "ENGINE_NOISE", "Strange engine noise"
        OVERHEATING = "OVERHEATING", "Car overheating"
        BRAKE_PROBLEM = "BRAKE_PROBLEM", "Brake problem"
        AC_NOT_COOLING = "AC_NOT_COOLING", "AC not cooling"
        OTHER = "OTHER", "Other automotive issue"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    customer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="chat_sessions")
    category = models.CharField(max_length=20, choices=Category.choices, null=True, blank=True)
    status = models.CharField(max_length=12, choices=Status.choices, default=Status.ACTIVE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Session {self.id} ({self.category or 'uncategorized'})"


class Message(models.Model):
    class Sender(models.TextChoices):
        CUSTOMER = "CUSTOMER", "Customer"
        BOT = "BOT", "Bot"

    class MessageType(models.TextChoices):
        TEXT = "TEXT", "Text"
        IMAGE = "IMAGE", "Image"
        AUDIO = "AUDIO", "Audio"
        VIDEO = "VIDEO", "Video"
        SYSTEM = "SYSTEM", "System"

    id = models.BigAutoField(primary_key=True)
    session = models.ForeignKey(ChatSession, on_delete=models.CASCADE, related_name="messages")
    sender = models.CharField(max_length=10, choices=Sender.choices)
    message_type = models.CharField(max_length=10, choices=MessageType.choices, default=MessageType.TEXT)
    text = models.TextField(blank=True)
    media = models.ForeignKey(
        "UploadedMedia", null=True, blank=True, on_delete=models.SET_NULL, related_name="messages"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]


def upload_path(instance, filename):
    return f"session_{instance.session_id}/{uuid.uuid4().hex}_{filename}"


class UploadedMedia(models.Model):
    class MediaType(models.TextChoices):
        IMAGE = "IMAGE", "Image"
        AUDIO = "AUDIO", "Audio"
        VIDEO = "VIDEO", "Video"

    id = models.BigAutoField(primary_key=True)
    session = models.ForeignKey(ChatSession, on_delete=models.CASCADE, related_name="media_files")
    file = models.FileField(upload_to=upload_path)
    media_type = models.CharField(max_length=10, choices=MediaType.choices)
    # Short, backend-validated text summary of the Gemini analysis (never raw model output).
    ai_analysis_summary = models.CharField(max_length=500, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)


class DiagnosticState(models.Model):
    """
    Backend-owned state machine for a session's diagnostic conversation.
    Gemini never writes to this table directly - only validated results do.
    """
    class Status(models.TextChoices):
        COLLECTING = "COLLECTING", "Collecting"
        READY = "READY", "Ready"
        DIAGNOSED = "DIAGNOSED", "Diagnosed"

    session = models.OneToOneField(ChatSession, on_delete=models.CASCADE, related_name="diagnostic_state")
    status = models.CharField(max_length=12, choices=Status.choices, default=Status.COLLECTING)
    # {question_key: answer_text}
    symptoms = models.JSONField(default=dict, blank=True)
    asked_question_keys = models.JSONField(default=list, blank=True)
    # the question_key currently awaiting an answer from the customer
    pending_question_key = models.CharField(max_length=40, blank=True)
    # full dict of the currently-pending question (incl. options), so dynamic
    # (Gemini-guarded) questions can be re-matched to their answer text
    pending_question = models.JSONField(default=dict, blank=True)
    initial_free_text = models.TextField(blank=True)
    dynamic_question_count = models.PositiveSmallIntegerField(default=0)
    updated_at = models.DateTimeField(auto_now=True)


class Diagnosis(models.Model):
    class Severity(models.TextChoices):
        LOW = "LOW", "Low"
        MEDIUM = "MEDIUM", "Medium"
        HIGH = "HIGH", "High"
        CRITICAL = "CRITICAL", "Critical / stop driving"

    class Source(models.TextChoices):
        RULE_ENGINE = "RULE_ENGINE", "Backend rule engine"
        GEMINI_ASSISTED = "GEMINI_ASSISTED", "Gemini-assisted (validated)"

    id = models.BigAutoField(primary_key=True)
    session = models.OneToOneField(ChatSession, on_delete=models.CASCADE, related_name="diagnosis")
    category = models.CharField(max_length=20)
    # [{"cause": str, "confidence": int(0-100)}]
    possible_causes = models.JSONField(default=list)
    overall_confidence = models.PositiveSmallIntegerField(default=0)
    severity = models.CharField(max_length=10, choices=Severity.choices, default=Severity.MEDIUM)
    recommended_service = models.CharField(max_length=200)
    summary = models.TextField(blank=True)
    source = models.CharField(max_length=20, choices=Source.choices, default=Source.RULE_ENGINE)
    created_at = models.DateTimeField(auto_now_add=True)
