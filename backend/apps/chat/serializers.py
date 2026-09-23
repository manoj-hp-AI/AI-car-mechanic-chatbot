from rest_framework import serializers

from .models import ChatSession, Diagnosis, Message, UploadedMedia


class ChatRequestSerializer(serializers.Serializer):
    session_id = serializers.UUIDField(required=False, allow_null=True)
    message = serializers.CharField(required=False, allow_blank=True, default="")
    starter_category = serializers.ChoiceField(
        choices=[c for c in ChatSession.Category.values if c != ChatSession.Category.OTHER],
        required=False,
        allow_null=True,
    )

    def validate(self, attrs):
        if not attrs.get("message") and not attrs.get("starter_category"):
            raise serializers.ValidationError("Provide either a message or a starter_category.")
        return attrs


class UploadedMediaSerializer(serializers.ModelSerializer):
    class Meta:
        model = UploadedMedia
        fields = ["id", "session", "file", "media_type", "ai_analysis_summary", "uploaded_at"]
        read_only_fields = ["ai_analysis_summary", "uploaded_at"]


class MessageSerializer(serializers.ModelSerializer):
    media = UploadedMediaSerializer(read_only=True)

    class Meta:
        model = Message
        fields = ["id", "sender", "message_type", "text", "media", "created_at"]


class DiagnosisSerializer(serializers.ModelSerializer):
    class Meta:
        model = Diagnosis
        fields = [
            "id", "session", "category", "possible_causes", "overall_confidence",
            "severity", "recommended_service", "summary", "source", "created_at",
        ]


class ChatSessionSerializer(serializers.ModelSerializer):
    messages = MessageSerializer(many=True, read_only=True)
    pending_question = serializers.SerializerMethodField()
    diagnosis = serializers.SerializerMethodField()

    class Meta:
        model = ChatSession
        fields = [
            "id", "category", "status", "created_at", "updated_at",
            "messages", "pending_question", "diagnosis",
        ]

    def get_pending_question(self, obj):
        state = getattr(obj, "diagnostic_state", None)
        if state and state.pending_question:
            return state.pending_question
        return None

    def get_diagnosis(self, obj):
        try:
            diag = obj.diagnosis
            if diag:
                return DiagnosisSerializer(diag).data
        except Exception:
            pass
        return None


class DiagnosisRequestSerializer(serializers.Serializer):
    session_id = serializers.UUIDField()

