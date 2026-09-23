from django.contrib.auth import get_user_model
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView

from .permissions import IsSuperAdmin
from .serializers import (
    AdminCreateSerializer,
    CustomerRegisterSerializer,
    RoleAwareTokenObtainPairSerializer,
    UserPublicSerializer,
)

User = get_user_model()


class CustomerRegisterView(generics.CreateAPIView):
    """POST /api/auth/register/  - public, always creates a CUSTOMER account."""
    serializer_class = CustomerRegisterSerializer
    permission_classes = [permissions.AllowAny]
    throttle_scope = "auth"


class CustomerLoginView(TokenObtainPairView):
    """POST /api/auth/login/  - customer-only login."""
    throttle_scope = "auth"

    def get_serializer_class(self):
        class _Serializer(RoleAwareTokenObtainPairSerializer):
            expected_role = User.Role.CUSTOMER
        return _Serializer


class AdminLoginView(TokenObtainPairView):
    """POST /api/auth/admin/login/  - admin-only login. No public registration counterpart."""
    throttle_scope = "auth"

    def get_serializer_class(self):
        class _Serializer(RoleAwareTokenObtainPairSerializer):
            expected_role = User.Role.ADMIN
        return _Serializer


class MeView(APIView):
    """GET /api/auth/me/ - returns the authenticated user's public profile."""

    def get(self, request):
        return Response(UserPublicSerializer(request.user).data)


class AdminCreateView(generics.CreateAPIView):
    """
    POST /api/auth/admin/create/
    Controlled, non-public admin creation. Only an existing SUPERADMIN may
    create further admin accounts - this is the only backend path (besides
    the `createadmin` management command / Django admin site) that can set
    role=ADMIN.
    """
    serializer_class = AdminCreateSerializer
    permission_classes = [IsSuperAdmin]

    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        response.data.pop("password", None)
        return Response(response.data, status=status.HTTP_201_CREATED)
