
from rest_framework.permissions import BasePermission

from users.permissions import (
    IsAuthenticatedAndActive,
    IsNotForcedPasswordChange,
)


class CanManageMaintenance(BasePermission):
    """
    Accès au module Maintenance réservé au GESTIONNAIRE,
    à l'ADMIN et au SUPER_ADMIN.
    """

    message = "Vous n'avez pas la permission de gérer les maintenances."

    allowed_roles = {
        "GESTIONNAIRE",
        "ADMIN",
        "SUPER_ADMIN",
    }

    def has_permission(self, request, view):
        user = request.user

        if not user or not user.is_authenticated:
            return False

        if not user.is_active:
            return False

        if getattr(user, "deleted_at", None) is not None:
            return False

        if getattr(user, "force_password_change", False):
            return False

        return user.role in self.allowed_roles
