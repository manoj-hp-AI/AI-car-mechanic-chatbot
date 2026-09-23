from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """
    Single user table for both customers and admins, distinguished by `role`.

    - Customer self-registration always creates role=CUSTOMER (see serializers.RegisterSerializer).
    - Admin accounts are never created through a public endpoint. They are created via:
        * the `createadmin` management command, or
        * Django's built-in /django-admin/ site (superuser only), or
        * a superuser using the admin-only `AdminCreateView`.
    """

    class Role(models.TextChoices):
        CUSTOMER = "CUSTOMER", "Customer"
        ADMIN = "ADMIN", "Admin"

    class AdminSubRole(models.TextChoices):
        SUPPORT = "SUPPORT", "Support Admin"
        MANAGER = "MANAGER", "Manager Admin"
        SUPERADMIN = "SUPERADMIN", "Super Admin"

    role = models.CharField(max_length=10, choices=Role.choices, default=Role.CUSTOMER)
    admin_sub_role = models.CharField(
        max_length=12, choices=AdminSubRole.choices, null=True, blank=True,
        help_text="Only meaningful when role=ADMIN.",
    )
    phone_number = models.CharField(max_length=20, blank=True)
    is_active_account = models.BooleanField(default=True)  # explicit "active status" field per spec
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.username} ({self.role})"

    @property
    def is_admin_role(self):
        return self.role == self.Role.ADMIN
