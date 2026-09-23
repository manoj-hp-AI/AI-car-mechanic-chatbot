from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import AdminCreateView, AdminLoginView, CustomerLoginView, CustomerRegisterView, MeView

urlpatterns = [
    path("register/", CustomerRegisterView.as_view(), name="customer-register"),
    path("login/", CustomerLoginView.as_view(), name="customer-login"),
    path("admin/login/", AdminLoginView.as_view(), name="admin-login"),
    path("admin/create/", AdminCreateView.as_view(), name="admin-create"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token-refresh"),
    path("me/", MeView.as_view(), name="me"),
]
