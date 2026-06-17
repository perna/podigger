from rest_framework.permissions import BasePermission


class IsAdminRole(BasePermission):
    """Allows access only to users with role == "admin"."""

    def has_permission(self, request, view):  # noqa: ARG002
        return request.user.is_authenticated and request.user.role == "admin"


class IsEditorOrAdmin(BasePermission):
    """Allows access to users with role == "editor" or role == "admin"."""

    def has_permission(self, request, view):  # noqa: ARG002
        return request.user.is_authenticated and request.user.role in (
            "editor",
            "admin",
        )
