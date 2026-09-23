from rest_framework import serializers

from apps.chat.models import ChatSession, Diagnosis

from .models import Booking, CallRequest


class BookingCreateSerializer(serializers.ModelSerializer):
    session_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    diagnosis_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    service_requested = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = Booking
        fields = ["id", "session_id", "diagnosis_id", "service_requested", "preferred_datetime", "notes", "status", "created_at"]
        read_only_fields = ["id", "status", "created_at"]

    def validate(self, attrs):
        request = self.context["request"]
        session_id = attrs.pop("session_id", None)
        diagnosis_id = attrs.pop("diagnosis_id", None)

        if session_id:
            try:
                attrs["session"] = ChatSession.objects.get(id=session_id, customer=request.user)
            except ChatSession.DoesNotExist:
                raise serializers.ValidationError({"session_id": "Session not found."})

        if diagnosis_id:
            try:
                diagnosis = Diagnosis.objects.get(id=diagnosis_id, session__customer=request.user)
            except Diagnosis.DoesNotExist:
                raise serializers.ValidationError({"diagnosis_id": "Diagnosis not found."})
            attrs["diagnosis"] = diagnosis
            if not attrs.get("service_requested"):
                attrs["service_requested"] = diagnosis.recommended_service

        if not attrs.get("service_requested"):
            raise serializers.ValidationError({"service_requested": "This field is required."})
        return attrs

    def create(self, validated_data):
        validated_data["customer"] = self.context["request"].user
        return Booking.objects.create(**validated_data)


class BookingDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = Booking
        fields = [
            "id", "customer", "session", "diagnosis", "service_requested",
            "preferred_datetime", "notes", "status", "created_at", "updated_at",
        ]


class CallRequestSerializer(serializers.ModelSerializer):
    session_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)

    class Meta:
        model = CallRequest
        fields = ["id", "session_id", "phone_number", "preferred_time", "status", "created_at"]
        read_only_fields = ["id", "status", "created_at"]

    def validate(self, attrs):
        request = self.context["request"]
        session_id = attrs.pop("session_id", None)
        if session_id:
            try:
                attrs["session"] = ChatSession.objects.get(id=session_id, customer=request.user)
            except ChatSession.DoesNotExist:
                raise serializers.ValidationError({"session_id": "Session not found."})
        return attrs

    def create(self, validated_data):
        validated_data["customer"] = self.context["request"].user
        return CallRequest.objects.create(**validated_data)
