from django.db.models import Count
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.permissions import IsAdminRole
from apps.bookings.models import Booking, CallRequest
from apps.chat.models import ChatSession, Diagnosis


class AdminDashboardView(APIView):
    """
    GET /api/admin/dashboard/

    Returns only aggregated, privacy-safe operational metrics. This view
    deliberately never touches Message.text or UploadedMedia.file - no chat
    transcript or uploaded media content is ever exposed to admins here.
    """
    permission_classes = [IsAdminRole]

    def get(self, request):
        total_sessions = ChatSession.objects.count()
        total_diagnoses = Diagnosis.objects.count()

        issue_categories = list(
            ChatSession.objects.exclude(category__isnull=True)
            .values("category").annotate(count=Count("id")).order_by("-count")
        )

        service_recommendations = list(
            Diagnosis.objects.values("recommended_service")
            .annotate(count=Count("id")).order_by("-count")
        )

        severity_breakdown = list(
            Diagnosis.objects.values("severity").annotate(count=Count("id")).order_by("-count")
        )

        total_bookings = Booking.objects.count()
        booking_status_breakdown = list(
            Booking.objects.values("status").annotate(count=Count("id")).order_by("-count")
        )

        total_call_requests = CallRequest.objects.count()
        call_status_breakdown = list(
            CallRequest.objects.values("status").annotate(count=Count("id")).order_by("-count")
        )

        rejected_sessions = ChatSession.objects.filter(status=ChatSession.Status.REJECTED).count()

        def pct(numerator, denominator):
            return round((numerator / denominator) * 100, 1) if denominator else 0.0

        conversion = {
            "sessions_to_diagnosis_rate": pct(total_diagnoses, total_sessions),
            "diagnosis_to_booking_rate": pct(total_bookings, total_diagnoses),
            "sessions_to_booking_rate": pct(total_bookings, total_sessions),
            "sessions_rejected_rate": pct(rejected_sessions, total_sessions),
        }

        return Response({
            "total_sessions": total_sessions,
            "total_diagnoses": total_diagnoses,
            "issue_categories": issue_categories,
            "service_recommendations": service_recommendations,
            "severity_breakdown": severity_breakdown,
            "bookings": {"total": total_bookings, "by_status": booking_status_breakdown},
            "call_requests": {"total": total_call_requests, "by_status": call_status_breakdown},
            "conversion": conversion,
        })
