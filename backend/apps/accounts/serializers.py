from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

User = get_user_model()


class CustomerRegisterSerializer(serializers.ModelSerializer):
    """
    Public registration endpoint. Always creates role=CUSTOMER - the client
    cannot influence the role, no matter what is posted in the body.
    """
    password = serializers.CharField(write_only=True, validators=[validate_password])

    class Meta:
        model = User
        fields = ["id", "username", "email", "password", "first_name", "last_name", "phone_number"]

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("An account with this email already exists.")
        return value

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User(role=User.Role.CUSTOMER, **validated_data)
        user.set_password(password)
        user.save()
        return user


class RoleAwareTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Shared login serializer for both customers and admins. The `expected_role`
    (set by the view) is enforced here so an admin can't log in through the
    customer form and vice versa.
    """
    expected_role = None

    def validate(self, attrs):
        data = super().validate(attrs)
        user = self.user
        if not user.is_active or not user.is_active_account:
            raise serializers.ValidationError("This account has been deactivated.")
        if self.expected_role and user.role != self.expected_role:
            raise serializers.ValidationError("Invalid credentials for this login type.")
        data["role"] = user.role
        data["username"] = user.username
        data["user_id"] = user.id
        return data


class UserPublicSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email", "first_name", "last_name", "role", "admin_sub_role"]


class AdminCreateSerializer(serializers.ModelSerializer):
    """
    Used only by an already-authenticated super-admin (see views.AdminCreateView).
    There is no public route to this serializer.
    """
    password = serializers.CharField(write_only=True, validators=[validate_password])

    class Meta:
        model = User
        fields = ["id", "username", "email", "password", "first_name", "last_name", "admin_sub_role"]

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User(role=User.Role.ADMIN, **validated_data)
        user.set_password(password)
        user.is_staff = True  # allows access to django-admin if desired
        user.save()
        return user
