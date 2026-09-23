from django.urls import path

from .views import ChatView, DiagnosisView, MySessionsView, SessionDetailView, UploadView

urlpatterns = [
    path("chat/", ChatView.as_view(), name="chat"),
    path("chat/sessions/", MySessionsView.as_view(), name="my-sessions"),
    path("chat/<uuid:session_id>/", SessionDetailView.as_view(), name="session-detail"),
    path("upload/", UploadView.as_view(), name="upload"),
    path("diagnosis/", DiagnosisView.as_view(), name="diagnosis"),
]
