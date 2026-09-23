from django.urls import path

from .views import BookingCreateView, BookingDetailView, CallRequestCreateView

urlpatterns = [
    path("booking/", BookingCreateView.as_view(), name="booking-create"),
    path("booking/<uuid:booking_id>/", BookingDetailView.as_view(), name="booking-detail"),
    path("call-request/", CallRequestCreateView.as_view(), name="call-request-create"),
]
