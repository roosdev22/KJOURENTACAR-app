from rest_framework.permissions import BasePermission


class IsAuthenticatedAndActive(BasePermission):
    """
    Autorise uniquement les utilisateurs authentifiés, actifs et non supprimés.
    """

    message = "Votre compte n'est pas autorisé à effectuer cette action."

    def has_permission(self, request, view):
        user = request.user

        if not user or not user.is_authenticated:
            return False

        if not user.is_active:
            return False

        if getattr(user, "deleted_at", None) is not None:
            return False

        return True


class IsNotForcedPasswordChange(BasePermission):
    """
    Bloque l'accès normal lorsqu'un utilisateur doit obligatoirement changer
    son mot de passe. Exception : l'endpoint change_password reste accessible.
    """

    message = (
        "Vous devez changer votre mot de passe temporaire "
        "avant de pouvoir continuer."
    )

    def has_permission(self, request, view):
        user = request.user

        if not user or not user.is_authenticated:
            return False

        if not getattr(user, "force_password_change", False):
            return True

        # Autoriser uniquement l'action change_password
        return getattr(view, "action", None) == "change_password"


class IsAdmin(BasePermission):
    """
    Accès réservé aux rôles ADMIN et SUPER_ADMIN.
    """

    message = "Accès réservé aux administrateurs."

    def has_permission(self, request, view):
        user = request.user

        if not user or not user.is_authenticated:
            return False

        return user.is_active and user.role in ["ADMIN", "SUPER_ADMIN"]


class IsSuperAdmin(BasePermission):
    """
    Accès réservé au SUPER_ADMIN.
    """

    message = "Cette action est réservée au Super Admin."

    def has_permission(self, request, view):
        user = request.user

        if not user or not user.is_authenticated:
            return False

        return (
            user.is_active
            and user.role == "SUPER_ADMIN"
            and user.is_superuser
        )


class IsGestionnaire(BasePermission):
    """
    Accès réservé aux rôles GESTIONNAIRE et SUPER_ADMIN.
    """

    message = "Accès réservé au gestionnaire."

    def has_permission(self, request, view):
        user = request.user

        if not user or not user.is_authenticated:
            return False

        return user.is_active and user.role in ["GESTIONNAIRE", "SUPER_ADMIN"]


class IsAgent(BasePermission):
    """
    Accès réservé aux rôles AGENT, GESTIONNAIRE, ADMIN et SUPER_ADMIN.
    """

    message = "Accès réservé au personnel autorisé."

    def has_permission(self, request, view):
        user = request.user

        if not user or not user.is_authenticated:
            return False

        return user.is_active and user.role in [
            "AGENT",
            "GESTIONNAIRE",
            "ADMIN",
            "SUPER_ADMIN",
        ]


class CanCreateUser(BasePermission):
    """
    SUPER_ADMIN : peut créer tous les rôles.
    ADMIN       : peut créer CLIENT, AGENT et GESTIONNAIRE uniquement.
    GESTIONNAIRE / AGENT : aucun droit de création.
    """

    message = "Vous n'avez pas le droit de créer cet utilisateur."

    def has_permission(self, request, view):
        user = request.user

        if not user or not user.is_authenticated:
            return False

        return user.is_active and user.role in ["ADMIN", "SUPER_ADMIN", "AGENT"]


class CanChangeRole(BasePermission):
    """
    SUPER_ADMIN : peut attribuer tous les rôles.
    ADMIN       : peut modifier CLIENT / AGENT / GESTIONNAIRE uniquement.
    Un utilisateur ne peut pas modifier son propre rôle.
    """

    message = "Vous n'avez pas le droit de modifier ce rôle."

    def has_permission(self, request, view):
        user = request.user

        if not user or not user.is_authenticated:
            return False

        return user.is_active and user.role in ["ADMIN", "SUPER_ADMIN"]


class CanManageUsers(BasePermission):
    """
    Gestion générale des utilisateurs — ADMIN et SUPER_ADMIN uniquement.
    """

    message = "Accès réservé aux administrateurs."

    def has_permission(self, request, view):
        user = request.user

        if not user or not user.is_authenticated:
            return False

        return user.is_active and user.role in ["ADMIN", "SUPER_ADMIN"]