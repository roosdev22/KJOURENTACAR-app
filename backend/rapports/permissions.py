
from rest_framework.permissions import BasePermission


class PeutConsulterRapports(BasePermission):
    """
    Autorise uniquement les utilisateurs authentifiés ayant
    le rôle ADMIN ou SUPER_ADMIN à accéder au module Rapports.
    """

    message = (
        "Accès refusé. Seuls les administrateurs "
        "et les super administrateurs peuvent consulter les rapports."
    )

    roles_autorises = {"ADMIN", "SUPER_ADMIN"}

    def has_permission(self, request, view):
        user = request.user

        if not user or not user.is_authenticated:
            return False

        return getattr(user, "role", None) in self.roles_autorises
