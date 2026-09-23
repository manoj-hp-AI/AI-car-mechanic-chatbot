import os

from django.conf import settings
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.permissions import IsCustomer

from .models import ChatSession, Diagnosis, DiagnosticState, Message, UploadedMedia
from .serializers import (
    ChatRequestSerializer,
    ChatSessionSerializer,
    DiagnosisRequestSerializer,
    DiagnosisSerializer,
    UploadedMediaSerializer,
)
from .services import diagnosis_engine, gemini_service, part_analyzer, question_bank, question_guard, scope_guard

STARTER_CATEGORIES = {c for c in ChatSession.Category.values if c != ChatSession.Category.OTHER}


def _get_or_create_session(user, session_id):
    if session_id:
        return get_object_or_404(ChatSession, id=session_id, customer=user), False
    session = ChatSession.objects.create(customer=user)
    return session, True


def _bot_message(session, text, message_type=Message.MessageType.SYSTEM):
    return Message.objects.create(session=session, sender=Message.Sender.BOT, message_type=message_type, text=text)


def _ask_next_question(session: ChatSession, state: DiagnosticState):
    """
    Determine the next follow-up question for the session.
    For car parts or free-form issues, uses Gemini AI when available, supported by
    part-specific diagnostic questions so specific parts are never misdiagnosed as engine.
    """
    category = session.category
    component = part_analyzer.detect_component(state.initial_free_text)

    # If category is OTHER or if a specific car part was described:
    if category == ChatSession.Category.OTHER or (component != "GENERAL" and component != "ENGINE"):
        # 1. Ask Gemini AI for dynamic follow-up questions tailored to this car part
        if settings.GEMINI_ENABLED and state.dynamic_question_count < 3:
            raw = gemini_service.suggest_dynamic_question(
                category, state.symptoms, state.initial_free_text, component=component
            )
            validated = question_guard.validate_dynamic_question(raw) if raw else None
            if validated and validated["key"] not in state.asked_question_keys:
                return validated

        # 2. Check dedicated component questions for this specific car part
        comp_questions = part_analyzer.get_component_questions(component)
        if comp_questions:
            for q in comp_questions:
                if q["key"] not in state.asked_question_keys:
                    return q
            # Once all targeted component questions are answered, triage is complete
            return None

        # 3. Fallback generic questions only if no component questions exist
        for q in question_bank.GENERIC_FALLBACK_QUESTIONS:
            if q["key"] not in state.asked_question_keys:
                return q

        return None

    # Standard starter categories (WONT_START, OVERHEATING, BRAKE_PROBLEM, AC_NOT_COOLING, ENGINE_NOISE)
    if category in question_bank.QUESTION_BANK:
        q = question_bank.get_next_question(category, state.asked_question_keys)
        if q:
            return q

    return None


class ChatView(APIView):
    """
    POST /api/chat/
    Body: {session_id?, message?, starter_category?}
    Drives the full Scope Guard -> Question Guard -> Diagnostic State pipeline.
    """
    permission_classes = [IsCustomer]
    throttle_scope = "chat"

    def post(self, request):
        serializer = ChatRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        session, created = _get_or_create_session(request.user, data.get("session_id"))

        message_text = data.get("message", "").strip()
        starter_category = data.get("starter_category")

        if message_text:
            Message.objects.create(session=session, sender=Message.Sender.CUSTOMER, text=message_text)

        # --- Step 1: Scope Guard + category assignment (skip guard for a trusted starter click) ---
        if session.category is None:
            if starter_category:
                session.category = starter_category
                session.status = ChatSession.Status.COLLECTING
                session.save(update_fields=["category", "status"])
                DiagnosticState.objects.get_or_create(session=session)
                bot_text = (
                    f"Got it - let's diagnose \"{scope_guard.STARTER_LABELS.get(starter_category, starter_category)}\". "
                    "I'll ask a few quick questions."
                )
                _bot_message(session, bot_text)
            else:
                in_scope, category, needs_ai_check = scope_guard.classify(message_text)
                if needs_ai_check:
                    in_scope = gemini_service.classify_scope(message_text)
                    category = ChatSession.Category.OTHER if in_scope else None

                if not in_scope:
                    session.status = ChatSession.Status.REJECTED
                    session.save(update_fields=["status"])
                    _bot_message(session, scope_guard.REJECTION_MESSAGE)
                    return Response(
                        ChatSessionSerializer(session).data, status=status.HTTP_200_OK
                    )

                session.category = category
                session.status = ChatSession.Status.COLLECTING
                session.save(update_fields=["category", "status"])
                state = DiagnosticState.objects.create(session=session, initial_free_text=message_text)
                component = part_analyzer.detect_component(message_text)
                if component != "GENERAL":
                    comp_name = component.replace('_', ' ').title()
                    _bot_message(session, f"Got it - I see you are reporting an issue with your vehicle's {comp_name}. Let me ask a few quick diagnostic questions.")
                else:
                    _bot_message(session, "Thanks - that sounds like an automotive issue. Let me ask a few follow-up questions.")

        # --- Step 2: record the answer to whatever question was pending ---
        state, _ = DiagnosticState.objects.get_or_create(session=session)
        if state.pending_question_key and message_text:
            state.symptoms[state.pending_question_key] = message_text
            state.asked_question_keys.append(state.pending_question_key)
            if state.pending_question_key.startswith("dynamic_"):
                state.dynamic_question_count += 1
            state.pending_question_key = ""
            state.pending_question = {}
            state.save()

        # --- Step 3: ask the next question, or mark ready for diagnosis ---
        if session.status == ChatSession.Status.COLLECTING:
            next_q = _ask_next_question(session, state)
            if next_q:
                state.pending_question_key = next_q["key"]
                state.pending_question = next_q
                state.save(update_fields=["pending_question_key", "pending_question"])
                q_text = next_q["question"]
                if next_q.get("options"):
                    q_text += " (" + " / ".join(next_q["options"]) + ")"
                _bot_message(session, q_text)
            else:
                state.status = DiagnosticState.Status.READY
                state.save(update_fields=["status"])
                session.status = ChatSession.Status.READY
                session.save(update_fields=["status"])
                _bot_message(
                    session,
                    "I have enough information now. Call POST /api/diagnosis/ (or tap 'Get Diagnosis') "
                    "to see the structured diagnosis.",
                )

        session.refresh_from_db()
        return Response(ChatSessionSerializer(session).data, status=status.HTTP_200_OK)


class UploadView(APIView):
    """
    POST /api/upload/  (multipart/form-data: session_id, file)
    Validates the file server-side, stores it, and (only if configured) asks
    Gemini for a short caption which is merged into the diagnostic symptoms -
    Gemini never receives or needs any other privileges here.
    """
    permission_classes = [IsCustomer]
    parser_classes = [MultiPartParser, FormParser]
    throttle_scope = "upload"

    def post(self, request):
        session_id = request.data.get("session_id")
        file_obj = request.FILES.get("file")
        if not session_id or not file_obj:
            return Response({"detail": "session_id and file are required."}, status=status.HTTP_400_BAD_REQUEST)

        session = get_object_or_404(ChatSession, id=session_id, customer=request.user)

        ext = os.path.splitext(file_obj.name)[1].lower()
        media_type = None
        for kind, extensions in settings.ALLOWED_UPLOAD_EXTENSIONS.items():
            if ext in extensions:
                media_type = kind.upper()
                break
        if media_type is None:
            return Response({"detail": f"Unsupported file type '{ext}'."}, status=status.HTTP_400_BAD_REQUEST)

        max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
        if file_obj.size > max_bytes:
            return Response(
                {"detail": f"File exceeds the {settings.MAX_UPLOAD_SIZE_MB}MB limit."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        media = UploadedMedia.objects.create(session=session, file=file_obj, media_type=media_type)
        Message.objects.create(
            session=session, sender=Message.Sender.CUSTOMER,
            message_type=media_type, media=media, text=f"[{media_type.lower()} uploaded]",
        )

        if settings.GEMINI_ENABLED:
            summary = gemini_service.analyze_media(media.file.path, media_type)
            if summary:
                media.ai_analysis_summary = summary
                media.save(update_fields=["ai_analysis_summary"])
                state, _ = DiagnosticState.objects.get_or_create(session=session)
                state.symptoms[f"media_note_{media.id}"] = summary
                state.save(update_fields=["symptoms"])

        return Response(UploadedMediaSerializer(media).data, status=status.HTTP_201_CREATED)


class DiagnosisView(APIView):
    """
    POST /api/diagnosis/
    Body: {session_id}
    Backend-only diagnosis assembly: rule engine first, optional validated
    Gemini-assisted causes for OTHER category, then persisted. Idempotent -
    calling again just returns the existing diagnosis.
    """
    permission_classes = [IsCustomer]

    def get(self, request):
        """GET /api/diagnosis/ - list caller's own diagnoses across all sessions."""
        diagnoses = Diagnosis.objects.filter(session__customer=request.user).order_by("-created_at")
        return Response(DiagnosisSerializer(diagnoses, many=True).data)

    def post(self, request):
        serializer = DiagnosisRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        session = get_object_or_404(
            ChatSession, id=serializer.validated_data["session_id"], customer=request.user
        )

        existing = Diagnosis.objects.filter(session=session).first()
        if existing:
            return Response(DiagnosisSerializer(existing).data)

        state, _ = DiagnosticState.objects.get_or_create(session=session)
        if state.status != DiagnosticState.Status.READY and session.status != ChatSession.Status.READY:
            return Response(
                {"detail": "This session isn't ready for diagnosis yet - keep answering the follow-up questions."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        component = part_analyzer.detect_component(state.initial_free_text)
        service_override = None

        if session.category == ChatSession.Category.OTHER or (component != "GENERAL" and component != "ENGINE"):
            comp_causes, comp_severity, comp_service = part_analyzer.get_component_diagnosis(
                component, state.symptoms, state.initial_free_text
            )
            causes = comp_causes
            severity = comp_severity
            service_override = comp_service
            source = Diagnosis.Source.RULE_ENGINE

            if settings.GEMINI_ENABLED:
                raw_extra = gemini_service.suggest_extra_causes(
                    session.category, state.symptoms, state.initial_free_text, component=component
                )
                extra = diagnosis_engine.validate_gemini_causes(raw_extra)
                if extra:
                    causes = extra + causes
                    source = Diagnosis.Source.GEMINI_ASSISTED
        else:
            causes, severity = diagnosis_engine.generate_rule_based_diagnosis(session.category, state.symptoms)
            source = Diagnosis.Source.RULE_ENGINE

        causes, overall_confidence, service = diagnosis_engine.finalize_diagnosis(
            session.category, causes, severity, service_override=service_override
        )

        diagnosis = Diagnosis.objects.create(
            session=session,
            category=session.category,
            possible_causes=causes,
            overall_confidence=overall_confidence,
            severity=severity,
            recommended_service=service,
            summary=f"Based on your answers, the most likely issue relates to: {causes[0]['cause']}." if causes else "",
            source=source,
        )

        state.status = DiagnosticState.Status.DIAGNOSED
        state.save(update_fields=["status"])
        session.status = ChatSession.Status.DIAGNOSED
        session.save(update_fields=["status"])

        _bot_message(
            session,
            f"Diagnosis ready: {diagnosis.recommended_service} recommended "
            f"(severity: {diagnosis.severity.lower()}). You can now book a mechanic or request a call.",
        )

        return Response(DiagnosisSerializer(diagnosis).data, status=status.HTTP_201_CREATED)


class SessionDetailView(APIView):
    """GET /api/chat/<session_id>/ - fetch a session with its message history (own sessions only)."""
    permission_classes = [IsCustomer]

    def get(self, request, session_id):
        session = get_object_or_404(ChatSession, id=session_id, customer=request.user)
        return Response(ChatSessionSerializer(session).data)


class MySessionsView(APIView):
    """GET /api/chat/sessions/ - list the authenticated customer's own sessions."""
    permission_classes = [IsCustomer]

    def get(self, request):
        sessions = ChatSession.objects.filter(customer=request.user)
        return Response(ChatSessionSerializer(sessions, many=True).data)
