from rest_framework.permissions import BasePermission


class IsCustomer(BasePermission):
    message = "This action requires a customer account."

    def has_permission(self, request, view):
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and user.role == user.Role.CUSTOMER
            and user.is_active_account
        )


class IsAdminRole(BasePermission):
    """
    Enforced strictly on the backend - the frontend role never grants access on its own.
    """
    message = "This action requires an admin account."

    def has_permission(self, request, view):
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and user.role == user.Role.ADMIN
            and user.is_active
            and user.is_active_account
        )


class IsSuperAdmin(BasePermission):
    message = "This action requires a super-admin account."

    def has_permission(self, request, view):
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and user.role == user.Role.ADMIN
            and user.admin_sub_role == user.AdminSubRole.SUPERADMIN
        )
