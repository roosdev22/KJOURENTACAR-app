# apps/vehicles/permissions.py

"""
Permissions DRF — KJOURRENTACAR / Vehicles

Rôles disponibles :

    CLIENT
    AGENT
    GESTIONNAIRE
    ADMIN
    SUPER_ADMIN

Principe :

    CLIENT
        → peut consulter le catalogue des véhicules disponibles.

    AGENT
        → peut effectuer certaines opérations opérationnelles,
          mais ne gère pas la configuration du parc.

    GESTIONNAIRE
        → peut gérer le parc automobile.

    ADMIN
        → peut gérer le parc et effectuer les opérations
          administratives.

    SUPER_ADMIN
        → accès complet.
"""

from rest_framework.permissions import (
    BasePermission,
    SAFE_METHODS,
)


# ============================================================
# CONSTANTES DES RÔLES
# ============================================================

CLIENT = "CLIENT"
AGENT = "AGENT"
GESTIONNAIRE = "GESTIONNAIRE"
ADMIN = "ADMIN"
SUPER_ADMIN = "SUPER_ADMIN"


# ============================================================
# GROUPES DE RÔLES
# ============================================================

# Personnel autorisé à créer et modifier les véhicules.
#
# IMPORTANT :
# AGENT n'est volontairement PAS inclus ici.
#
# L'agent peut travailler avec le parc mais ne peut pas
# modifier la configuration principale d'un véhicule.
VEHICLE_MANAGEMENT_ROLES = {
    GESTIONNAIRE,
    ADMIN,
    SUPER_ADMIN,
}


# Personnel autorisé à effectuer les opérations
# opérationnelles sur les véhicules.
#
# Exemple :
#   - changer le statut
#   - changer la condition
#   - opérations liées à la gestion quotidienne
VEHICLE_OPERATION_ROLES = {
    AGENT,
    GESTIONNAIRE,
    ADMIN,
    SUPER_ADMIN,
}


# Administrateurs pouvant effectuer les opérations
# administratives sensibles.
VEHICLE_ADMIN_ROLES = {
    ADMIN,
    SUPER_ADMIN,
}


# Personnel interne.
VEHICLE_STAFF_ROLES = {
    AGENT,
    GESTIONNAIRE,
    ADMIN,
    SUPER_ADMIN,
}


# ============================================================
# HELPERS
# ============================================================

def is_authenticated_and_active(user) -> bool:
    """
    Vérifie qu'un utilisateur est :

        - authentifié
        - actif
        - non supprimé

    Le soft-delete est basé sur deleted_at.
    """

    if not user or not user.is_authenticated:
        return False

    if not getattr(user, "is_active", False):
        return False

    if getattr(user, "deleted_at", None) is not None:
        return False

    return True


def get_user_role(user):
    """
    Retourne le rôle normalisé de l'utilisateur.

    Exemple :

        "client" -> "CLIENT"
        "ADMIN"  -> "ADMIN"
    """

    role = getattr(user, "role", None)

    if not role:
        return None

    return str(role).upper()


# ============================================================
# CONSULTATION DU CATALOGUE
# ============================================================

class CanViewVehicles(BasePermission):
    """
    Autorise la consultation des véhicules.

    Tous les utilisateurs authentifiés et actifs peuvent
    effectuer des requêtes GET.

    IMPORTANT :

    Cette permission ne décide PAS quels véhicules sont visibles.

    Le ViewSet doit appliquer :

        CLIENT
            → status=AVAILABLE

        PERSONNEL
            → accès selon les règles internes.
    """

    message = (
        "Vous devez être authentifié pour consulter "
        "les véhicules."
    )

    def has_permission(self, request, view) -> bool:

        if not is_authenticated_and_active(
            request.user
        ):
            return False

        return request.method in SAFE_METHODS


# ============================================================
# GESTION DU PARC
# ============================================================

class IsVehicleManager(BasePermission):
    """
    Permission principale pour gérer le parc automobile.

    Autorisés :

        GESTIONNAIRE
        ADMIN
        SUPER_ADMIN

    Lecture :

        GET
        HEAD
        OPTIONS

    Gestion :

        POST
        PUT
        PATCH

    IMPORTANT :

    La suppression est volontairement gérée par
    IsVehicleAdmin.
    """

    message = (
        "Vous n'avez pas les permissions nécessaires "
        "pour gérer les véhicules."
    )

    def has_permission(self, request, view) -> bool:

        if not is_authenticated_and_active(
            request.user
        ):
            return False

        role = get_user_role(request.user)

        # ----------------------------------------------------
        # Lecture
        # ----------------------------------------------------

        if request.method in SAFE_METHODS:
            return True

        # ----------------------------------------------------
        # Gestion du parc
        # ----------------------------------------------------

        return role in VEHICLE_MANAGEMENT_ROLES


# ============================================================
# ADMINISTRATEUR VÉHICULE
# ============================================================

class IsVehicleAdmin(BasePermission):
    """
    Permission réservée aux administrateurs.

    Autorisés :

        ADMIN
        SUPER_ADMIN

    Utilisation :

        - suppression
        - opérations administratives sensibles
        - opérations critiques
    """

    message = (
        "Cette opération est réservée aux administrateurs."
    )

    def has_permission(self, request, view) -> bool:

        if not is_authenticated_and_active(
            request.user
        ):
            return False

        role = get_user_role(request.user)

        return role in VEHICLE_ADMIN_ROLES


# ============================================================
# EMPLOYÉ / OPÉRATIONNEL
# ============================================================

class IsVehicleEmployee(BasePermission):
    """
    Permission destinée aux opérations quotidiennes
    du parc automobile.

    Autorisés :

        AGENT
        GESTIONNAIRE
        ADMIN
        SUPER_ADMIN

    CLIENT :

        ❌ interdit
    """

    message = (
        "Vous n'avez pas les permissions nécessaires "
        "pour cette opération."
    )

    def has_permission(self, request, view) -> bool:

        if not is_authenticated_and_active(
            request.user
        ):
            return False

        role = get_user_role(request.user)

        return role in VEHICLE_OPERATION_ROLES


# ============================================================
# GESTIONNAIRE DU PARC
# ============================================================

class IsGestionnaireVehicle(BasePermission):
    """
    Permission destinée aux responsables du parc.

    Autorisés :

        GESTIONNAIRE
        ADMIN
        SUPER_ADMIN
    """

    message = (
        "Cette opération est réservée au gestionnaire "
        "du parc automobile."
    )

    def has_permission(self, request, view) -> bool:

        if not is_authenticated_and_active(
            request.user
        ):
            return False

        role = get_user_role(request.user)

        return role in {
            GESTIONNAIRE,
            ADMIN,
            SUPER_ADMIN,
        }


# ============================================================
# SUPER ADMIN
# ============================================================

class IsVehicleSuperAdmin(BasePermission):
    """
    Permission exclusivement réservée au SUPER_ADMIN.

    Deux conditions doivent être respectées :

        role == SUPER_ADMIN

        ET

        is_superuser == True
    """

    message = (
        "Cette opération est réservée au Super Admin."
    )

    def has_permission(self, request, view) -> bool:

        if not is_authenticated_and_active(
            request.user
        ):
            return False

        role = get_user_role(request.user)

        return (
            role == SUPER_ADMIN
            and getattr(
                request.user,
                "is_superuser",
                False,
            )
        )


# ============================================================
# PERSONNEL INTERNE
# ============================================================

class IsVehicleStaff(BasePermission):
    """
    Autorise uniquement le personnel interne.

    Autorisés :

        AGENT
        GESTIONNAIRE
        ADMIN
        SUPER_ADMIN

    CLIENT :

        ❌ interdit
    """

    message = (
        "Cette opération est réservée au personnel "
        "de KJOURRENTACAR."
    )

    def has_permission(self, request, view) -> bool:

        if not is_authenticated_and_active(
            request.user
        ):
            return False

        role = get_user_role(request.user)

        return role in VEHICLE_STAFF_ROLES

