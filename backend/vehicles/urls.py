# apps/vehicles/urls.py

"""
URLs — KJOURRENTACAR / Vehicles

Routes principales :

    GET    /api/vehicles/
        → Liste des véhicules disponibles pour le catalogue.

    GET    /api/vehicles/{id}/
        → Détail d'un véhicule.

    POST   /api/vehicles/
        → Création d'un véhicule.

    PUT    /api/vehicles/{id}/
        → Modification complète.

    PATCH  /api/vehicles/{id}/
        → Modification partielle.

    DELETE /api/vehicles/{id}/
        → Suppression d'un véhicule.

Actions supplémentaires :

    POST /api/vehicles/{id}/change-status/
        → Modifier le statut du véhicule.

    POST /api/vehicles/{id}/change-condition/
        → Modifier l'état du véhicule.

    POST /api/vehicles/{id}/add-image/
        → Ajouter une image.

    DELETE /api/vehicles/{id}/images/{image_id}/
        → Supprimer une image.

    POST /api/vehicles/{id}/set-primary-image/
        → Définir l'image principale.

    GET /api/vehicles/equipment/
        → Liste des équipements.

    POST /api/vehicles/equipment/
        → Créer un équipement.

    PATCH /api/vehicles/equipment/{id}/
        → Modifier un équipement.

    DELETE /api/vehicles/equipment/{id}/
        → Supprimer un équipement.
"""

from django.urls import include, path

from rest_framework.routers import DefaultRouter

from .views import (
    VehicleViewSet,
    EquipmentViewSet,
)


# ============================================================
# ROUTER
# ============================================================

router = DefaultRouter()

router.register(
    r"",
    VehicleViewSet,
    basename="vehicle",
)

router.register(
    r"equipment",
    EquipmentViewSet,
    basename="equipment",
)


# ============================================================
# URLS
# ============================================================

urlpatterns = [
    path(
        "",
        include(router.urls),
    ),
]

