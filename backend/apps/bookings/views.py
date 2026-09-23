from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.permissions import IsCustomer

from .models import Booking, CallRequest
from .serializers import BookingCreateSerializer, BookingDetailSerializer, CallRequestSerializer


class BookingCreateView(APIView):
    """
    POST /api/booking/ - customer books a mechanic, optionally linked to a diagnosis.
    GET /api/booking/  - list the caller's own bookings.
    """
    permission_classes = [IsCustomer]

    def get(self, request):
        bookings = Booking.objects.filter(customer=request.user).order_by("-created_at")
        return Response(BookingDetailSerializer(bookings, many=True).data)

    def post(self, request):
        serializer = BookingCreateSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        booking = serializer.save()
        return Response(BookingDetailSerializer(booking).data, status=status.HTTP_201_CREATED)


class BookingDetailView(APIView):
    """GET /api/booking/{id}/ - fetch a single booking (own bookings only)."""
    permission_classes = [IsCustomer]

    def get(self, request, booking_id):
        booking = get_object_or_404(Booking, id=booking_id, customer=request.user)
        return Response(BookingDetailSerializer(booking).data)


class CallRequestCreateView(APIView):
    """
    POST /api/call-request/ - customer requests a call back from a mechanic.
    GET /api/call-request/  - list caller's own call requests.
    """
    permission_classes = [IsCustomer]

    def get(self, request):
        calls = CallRequest.objects.filter(customer=request.user).order_by("-created_at")
        return Response(CallRequestSerializer(calls, many=True).data)

    def post(self, request):
        serializer = CallRequestSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        call_request = serializer.save()
        return Response(CallRequestSerializer(call_request).data, status=status.HTTP_201_CREATED)
