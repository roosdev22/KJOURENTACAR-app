
from rest_framework.permissions import BasePermission, SAFE_METHODS


class PeutConsulterParametres(BasePermission):
    message = "Accès réservé au personnel administratif autorisé."

    def has_permission(self, request, view):
        user = request.user

        return bool(
            user
            and user.is_authenticated
            and user.is_active
            and getattr(user, "deleted_at", None) is None
            and not getattr(user, "force_password_change", False)
            and user.role in ("ADMIN", "SUPER_ADMIN")
        )


class PeutGererParametres(BasePermission):
    message = "Seuls les administrateurs peuvent modifier les paramètres."

    def has_permission(self, request, view):
        user = request.user

        if not (
            user
            and user.is_authenticated
            and user.is_active
            and getattr(user, "deleted_at", None) is None
            and not getattr(user, "force_password_change", False)
        ):
            return False

        if request.method in SAFE_METHODS:
            return user.role in ("ADMIN", "SUPER_ADMIN")

        return user.role in ("ADMIN", "SUPER_ADMIN")
