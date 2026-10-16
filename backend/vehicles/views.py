# apps/vehicles/views.py

"""
Views / ViewSets — KJOURRENTACAR / Vehicles

Gestion du parc automobile.

Rôles
-----

CLIENT
    - Consulte uniquement les véhicules disponibles.
    - Peut consulter les détails des véhicules disponibles.
    - Aucun droit de création/modification/suppression.

AGENT
    - Peut consulter les véhicules.
    - Peut effectuer certaines opérations du parc :
        * changement de statut
        * changement de condition
    - Ne peut pas créer/modifier/supprimer un véhicule.

GESTIONNAIRE
    - Peut gérer le parc automobile.
    - Création
    - Modification
    - Gestion des images
    - Changement de statut / condition

ADMIN
    - Gestion complète des véhicules.
    - Suppression autorisée.

SUPER_ADMIN
    - Accès complet.

IMPORTANT
---------

Le filtrage des véhicules visibles par le CLIENT est effectué
côté serveur.

Le CLIENT ne peut donc jamais demander directement un véhicule
indisponible pour contourner le frontend.
"""


from typing import Any

from django.db import transaction
from django.db.models import QuerySet

from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import (
    FormParser,
    JSONParser,
    MultiPartParser,
)
from rest_framework.permissions import BasePermission
from rest_framework.request import Request
from rest_framework.response import Response

from .models import (
    Vehicle,
    VehicleImage,
    Equipment,
    VehicleEquipment,
    VehicleStatus,
    VehicleCondition,
    VehicleCategory,
    FuelType,
)

from .serializers import (
    VehicleListSerializer,
    VehicleDetailSerializer,
    VehicleCreateUpdateSerializer,
    VehicleStatusSerializer,
    VehicleConditionSerializer,
    VehicleImageSerializer,
    EquipmentSerializer,
    VehicleReportSerializer,

)

from .permissions import (
    CanViewVehicles,
    IsVehicleManager,
    IsVehicleAdmin,
    IsVehicleEmployee,
)


# ============================================================
# VEHICLE VIEWSET
# ============================================================


class VehicleViewSet(viewsets.ModelViewSet):
    """
    API principale du parc automobile.

    Routes principales
    ------------------

    GET
        /api/vehicles/

    GET
        /api/vehicles/{id}/

    POST
        /api/vehicles/

    PUT
        /api/vehicles/{id}/

    PATCH
        /api/vehicles/{id}/

    DELETE
        /api/vehicles/{id}/


    Actions
    -------

    POST
        /api/vehicles/{id}/change-status/

    POST
        /api/vehicles/{id}/change-condition/

    POST
        /api/vehicles/{id}/add-image/

    DELETE
        /api/vehicles/{id}/images/{image_id}/

    POST
        /api/vehicles/{id}/images/{image_id}/set-primary/
    """

    queryset = (
        Vehicle.objects
        .select_related("created_by")
        .prefetch_related(
            "images",
            "vehicle_equipments__equipment",
        )
        .all()
    )

    lookup_field = "pk"

    parser_classes = [
        JSONParser,
        MultiPartParser,
        FormParser,
    ]

    # ========================================================
    # QUERYSET
    # ========================================================

    def get_queryset(self) -> QuerySet[Vehicle]:
        """
        Retourne uniquement les véhicules que l'utilisateur
        est autorisé à consulter.

        CLIENT
            -> uniquement AVAILABLE.

        AGENT / GESTIONNAIRE / ADMIN / SUPER_ADMIN
            -> tous les véhicules.

        Utilisateur non authentifié
            -> aucun véhicule.
        """

        queryset = super().get_queryset()

        user = self.request.user

        # ----------------------------------------------------
        # Utilisateur non authentifié
        # ----------------------------------------------------

        if not user or not user.is_authenticated:
            return queryset.none()

        # ----------------------------------------------------
        # Compte inactif
        # ----------------------------------------------------

        if not getattr(user, "is_active", False):
            return queryset.none()

        # ----------------------------------------------------
        # Compte supprimé
        # ----------------------------------------------------

        if getattr(user, "deleted_at", None) is not None:
            return queryset.none()

        # ----------------------------------------------------
        # Rôle
        # ----------------------------------------------------

        role = getattr(user, "role", None)

        if role:
            role = str(role).upper()

        # ----------------------------------------------------
        # CLIENT
        # ----------------------------------------------------

        if role == "CLIENT":
            return queryset.filter(
                status=VehicleStatus.AVAILABLE
            )

        # ----------------------------------------------------
        # PERSONNEL
        # ----------------------------------------------------

        return queryset

    # ========================================================
    # PERMISSIONS
    # ========================================================

    def get_permissions(self) -> list[BasePermission]:
        """
        Permissions dynamiques selon l'action.

        LIST / RETRIEVE
            CLIENT
            AGENT
            GESTIONNAIRE
            ADMIN
            SUPER_ADMIN

        CREATE
            GESTIONNAIRE
            ADMIN
            SUPER_ADMIN

        UPDATE / PATCH
            GESTIONNAIRE
            ADMIN
            SUPER_ADMIN

        DELETE
            ADMIN
            SUPER_ADMIN

        CHANGE STATUS
            AGENT
            GESTIONNAIRE
            ADMIN
            SUPER_ADMIN

        CHANGE CONDITION
            AGENT
            GESTIONNAIRE
            ADMIN
            SUPER_ADMIN

        IMAGES
            GESTIONNAIRE
            ADMIN
            SUPER_ADMIN
        """

        # ----------------------------------------------------
        # CONSULTATION
        # ----------------------------------------------------

        if self.action in {
            "list",
            "retrieve",
        }:
            permission_classes = [
                CanViewVehicles,
            ]

        # ----------------------------------------------------
        # CREATION
        # ----------------------------------------------------

        elif self.action == "create":
            permission_classes = [
                IsVehicleManager,
            ]

        # ----------------------------------------------------
        # MODIFICATION
        # ----------------------------------------------------

        elif self.action in {
            "update",
            "partial_update",
        }:
            permission_classes = [
                IsVehicleManager,
            ]

        # ----------------------------------------------------
        # SUPPRESSION
        # ----------------------------------------------------

        elif self.action == "destroy":
            permission_classes = [
                IsVehicleAdmin,
            ]

        # ----------------------------------------------------
        # CHANGEMENT DE STATUT
        # ----------------------------------------------------

        elif self.action == "change_status":
            permission_classes = [
                IsVehicleEmployee,
            ]

        # ----------------------------------------------------
        # CHANGEMENT DE CONDITION
        # ----------------------------------------------------

        elif self.action == "change_condition":
            permission_classes = [
                IsVehicleEmployee,
            ]

        # ----------------------------------------------------
        # AJOUT IMAGE
        # ----------------------------------------------------

        elif self.action == "add_image":
            permission_classes = [
                IsVehicleManager,
            ]

        # ----------------------------------------------------
        # SUPPRESSION IMAGE
        # ----------------------------------------------------

        elif self.action == "delete_image":
            permission_classes = [
                IsVehicleManager,
            ]

        # ----------------------------------------------------
        # IMAGE PRINCIPALE
        # ----------------------------------------------------

        elif self.action == "set_primary_image":
            permission_classes = [
                IsVehicleManager,
            ]

        # ----------------------------------------------------
        # SÉCURITÉ PAR DÉFAUT
        # ----------------------------------------------------

        else:
            permission_classes = [
                IsVehicleManager,
            ]

        return [
            permission()
            for permission in permission_classes
        ]

    # ========================================================
    # SERIALIZER
    # ========================================================

    def get_serializer_class(self):
        """
        Sélectionne automatiquement le serializer.

        CLIENT
            -> VehicleListSerializer

        CREATE / UPDATE
            -> VehicleCreateUpdateSerializer

        CHANGE STATUS
            -> VehicleStatusSerializer

        CHANGE CONDITION
            -> VehicleConditionSerializer

        Personnel en lecture
            -> VehicleDetailSerializer
        """

        user = self.request.user

        role = getattr(user, "role", None)

        if role:
            role = str(role).upper()

        # ----------------------------------------------------
        # CLIENT
        # ----------------------------------------------------

        if (
            role == "CLIENT"
            and self.action in {
                "list",
                "retrieve",
            }
        ):
            return VehicleListSerializer

        # ----------------------------------------------------
        # CREATE / UPDATE
        # ----------------------------------------------------

        if self.action in {
            "create",
            "update",
            "partial_update",
        }:
            return VehicleCreateUpdateSerializer

        # ----------------------------------------------------
        # CHANGE STATUS
        # ----------------------------------------------------

        if self.action == "change_status":
            return VehicleStatusSerializer

        # ----------------------------------------------------
        # CHANGE CONDITION
        # ----------------------------------------------------

        if self.action == "change_condition":
            return VehicleConditionSerializer

        # ----------------------------------------------------
        # DEFAULT
        # ----------------------------------------------------

        return VehicleDetailSerializer

    # ========================================================
    # CREATE
    # ========================================================

    def perform_create(
        self,
        serializer,
    ) -> None:
        """
        Définit automatiquement created_by.

        Le frontend ne peut pas choisir le créateur.
        """

        serializer.save(
            created_by=self.request.user
        )

    # ========================================================
    # CHANGE STATUS
    # ========================================================

    @action(
        detail=True,
        methods=["post"],
        url_path="change-status",
    )
    def change_status(
        self,
        request: Request,
        pk: str | None = None,
    ) -> Response:
        """
        Modifie le statut opérationnel du véhicule.

        Exemple :

            POST /api/vehicles/{id}/change-status/

        Body :

            {
                "status": "MAINTENANCE"
            }
        """

        vehicle = self.get_object()

        serializer = VehicleStatusSerializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        vehicle.status = (
            serializer.validated_data["status"]
        )

        vehicle.save(
            update_fields=[
                "status",
                "updated_at",
            ]
        )

        response_serializer = VehicleDetailSerializer(
            vehicle,
            context=self.get_serializer_context(),
        )

        return Response(
            response_serializer.data,
            status=status.HTTP_200_OK,
        )

    # ========================================================
    # CHANGE CONDITION
    # ========================================================

    @action(
        detail=True,
        methods=["post"],
        url_path="change-condition",
    )
    def change_condition(
        self,
        request: Request,
        pk: str | None = None,
    ) -> Response:
        """
        Modifie l'état général du véhicule.

        Exemple :

            POST /api/vehicles/{id}/change-condition/

        Body :

            {
                "condition": "EXCELLENT"
            }
        """

        vehicle = self.get_object()

        serializer = VehicleConditionSerializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        vehicle.condition = (
            serializer.validated_data["condition"]
        )

        vehicle.save(
            update_fields=[
                "condition",
                "updated_at",
            ]
        )

        response_serializer = VehicleDetailSerializer(
            vehicle,
            context=self.get_serializer_context(),
        )

        return Response(
            response_serializer.data,
            status=status.HTTP_200_OK,
        )

    # ========================================================
    # ADD IMAGE
    # ========================================================

    @action(
        detail=True,
        methods=["post"],
        url_path="add-image",
        parser_classes=[
            MultiPartParser,
            FormParser,
        ],
    )
    def add_image(
        self,
        request: Request,
        pk: str | None = None,
    ) -> Response:
        """
        Ajoute une image à un véhicule.

        Form-data :

            image
            caption
            is_primary
            display_order
        """

        vehicle = self.get_object()

        serializer = VehicleImageSerializer(
            data=request.data,
            context=self.get_serializer_context(),
        )

        serializer.is_valid(
            raise_exception=True
        )

        image = serializer.save(
            vehicle=vehicle
        )

        return Response(
            VehicleImageSerializer(
                image,
                context=self.get_serializer_context(),
            ).data,
            status=status.HTTP_201_CREATED,
        )

    # ========================================================
    # DELETE IMAGE
    # ========================================================

    @action(
        detail=True,
        methods=["delete"],
        url_path=r"images/(?P<image_id>[^/.]+)",
    )
    def delete_image(
        self,
        request: Request,
        pk: str | None = None,
        image_id: str | None = None,
    ) -> Response:
        """
        Supprime une image appartenant au véhicule.
        """

        vehicle = self.get_object()

        try:
            image = vehicle.images.get(
                pk=image_id
            )

        except VehicleImage.DoesNotExist:
            return Response(
                {
                    "detail": (
                        "Cette image n'existe pas "
                        "pour ce véhicule."
                    )
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        image.delete()

        return Response(
            status=status.HTTP_204_NO_CONTENT
        )

    # ========================================================
    # SET PRIMARY IMAGE
    # ========================================================

    @action(
        detail=True,
        methods=["post"],
        url_path=(
            r"images/(?P<image_id>[^/.]+)/set-primary"
        ),
    )
    def set_primary_image(
        self,
        request: Request,
        pk: str | None = None,
        image_id: str | None = None,
    ) -> Response:
        """
        Définit une image comme image principale.

        Une seule image peut être principale pour
        un véhicule.
        """

        vehicle = self.get_object()

        try:
            image = vehicle.images.get(
                pk=image_id
            )

        except VehicleImage.DoesNotExist:
            return Response(
                {
                    "detail": (
                        "Cette image n'existe pas "
                        "pour ce véhicule."
                    )
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        # ----------------------------------------------------
        # Retire l'ancienne image principale
        # ----------------------------------------------------

        vehicle.images.filter(
            is_primary=True
        ).exclude(
            pk=image.pk
        ).update(
            is_primary=False
        )

        # ----------------------------------------------------
        # Définit la nouvelle image principale
        # ----------------------------------------------------

        image.is_primary = True

        image.save(
            update_fields=[
                "is_primary",
                "updated_at",
            ]
        )

        return Response(
            VehicleImageSerializer(
                image,
                context=self.get_serializer_context(),
            ).data,
            status=status.HTTP_200_OK,
        )



    @action(detail=False, methods=["get"], url_path="reports")
    def reports(self, request):
        """
        Statistiques globales du parc automobile.

        GET /api/vehicles/reports/
        """

        from django.db.models import Count
        from django.utils import timezone

        today = timezone.now().date()

        HIGH_MILEAGE_THRESHOLD = 100_000

        queryset = Vehicle.objects.all()

        # ------------------------------------------------
        # Total
        # ------------------------------------------------
        total = queryset.count()

        # ------------------------------------------------
        # Par statut
        # ------------------------------------------------
        by_status_qs = (
            queryset
            .values("status")
            .annotate(count=Count("id"))
        )

        # Initialise tous les statuts à 0
        by_status = {s.value: 0 for s in VehicleStatus}

        for row in by_status_qs:
            by_status[row["status"]] = row["count"]

        # ------------------------------------------------
        # Par catégorie
        # ------------------------------------------------
        by_category_qs = (
            queryset
            .values("category")
            .annotate(count=Count("id"))
        )

        by_category = {c.value: 0 for c in VehicleCategory}

        for row in by_category_qs:
            by_category[row["category"]] = row["count"]

        # ------------------------------------------------
        # Par carburant
        # ------------------------------------------------
        by_fuel_qs = (
            queryset
            .values("fuel_type")
            .annotate(count=Count("id"))
        )

        by_fuel_type = {f.value: 0 for f in FuelType}

        for row in by_fuel_qs:
            by_fuel_type[row["fuel_type"]] = row["count"]

        # ------------------------------------------------
        # Par état général
        # ------------------------------------------------
        by_condition_qs = (
            queryset
            .values("condition")
            .annotate(count=Count("id"))
        )

        by_condition = {c.value: 0 for c in VehicleCondition}

        for row in by_condition_qs:
            by_condition[row["condition"]] = row["count"]

        # ------------------------------------------------
        # Maintenance en retard
        # ------------------------------------------------
        maintenance_overdue = queryset.filter(
            next_maintenance_date__lt=today,
            status=VehicleStatus.AVAILABLE,
        ).count()

        # ------------------------------------------------
        # Kilométrage élevé
        # ------------------------------------------------
        high_mileage = queryset.filter(
            mileage__gte=HIGH_MILEAGE_THRESHOLD,
        ).count()

        # ------------------------------------------------
        # Récemment ajoutés (5 derniers)
        # ------------------------------------------------
        recently_added = (
            queryset
            .select_related("created_by")
            .prefetch_related("images", "vehicle_equipments__equipment")
            .order_by("-created_at")[:5]
        )

        # ------------------------------------------------
        # Réponse
        # ------------------------------------------------
        data = {
            "total": total,
            "by_status": by_status,
            "by_category": by_category,
            "by_fuel_type": by_fuel_type,
            "by_condition": by_condition,
            "maintenance_overdue": maintenance_overdue,
            "high_mileage": high_mileage,
            "recently_added": recently_added,
        }

        serializer = VehicleReportSerializer(
            data,
            context={"request": request},
        )

        return Response(serializer.data)
# ============================================================
# EQUIPMENT VIEWSET
# ============================================================


class EquipmentViewSet(viewsets.ModelViewSet):
    """
    Gestion du catalogue des équipements.

    CLIENT
        -> voit uniquement les équipements actifs.

    AGENT / GESTIONNAIRE / ADMIN / SUPER_ADMIN
        -> peuvent consulter les équipements.

    GESTIONNAIRE / ADMIN / SUPER_ADMIN
        -> peuvent créer et modifier.

    ADMIN / SUPER_ADMIN
        -> peuvent supprimer.
    """

    queryset = (
        Equipment.objects
        .all()
    )

    serializer_class = EquipmentSerializer

    lookup_field = "pk"

    # ========================================================
    # QUERYSET
    # ========================================================

    def get_queryset(self) -> QuerySet[Equipment]:
        """
        Filtre les équipements selon le rôle.
        """

        queryset = super().get_queryset()

        user = self.request.user

        # ----------------------------------------------------
        # Authentification
        # ----------------------------------------------------

        if not user or not user.is_authenticated:
            return queryset.none()

        # ----------------------------------------------------
        # Compte inactif
        # ----------------------------------------------------

        if not getattr(user, "is_active", False):
            return queryset.none()

        # ----------------------------------------------------
        # Soft delete
        # ----------------------------------------------------

        if getattr(user, "deleted_at", None) is not None:
            return queryset.none()

        # ----------------------------------------------------
        # CLIENT
        # ----------------------------------------------------

        role = getattr(user, "role", None)

        if role:
            role = str(role).upper()

        if role == "CLIENT":
            return queryset.filter(
                is_active=True
            )

        # ----------------------------------------------------
        # PERSONNEL
        # ----------------------------------------------------

        return queryset

    # ========================================================
    # PERMISSIONS
    # ========================================================

    def get_permissions(self) -> list[BasePermission]:
        """
        Permissions dynamiques pour les équipements.
        """

        # ----------------------------------------------------
        # CONSULTATION
        # ----------------------------------------------------

        if self.action in {
            "list",
            "retrieve",
        }:
            permission_classes = [
                CanViewVehicles,
            ]

        # ----------------------------------------------------
        # CREATION
        # ----------------------------------------------------

        elif self.action == "create":
            permission_classes = [
                IsVehicleManager,
            ]

        # ----------------------------------------------------
        # MODIFICATION
        # ----------------------------------------------------

        elif self.action in {
            "update",
            "partial_update",
        }:
            permission_classes = [
                IsVehicleManager,
            ]

        # ----------------------------------------------------
        # SUPPRESSION
        # ----------------------------------------------------

        elif self.action == "destroy":
            permission_classes = [
                IsVehicleAdmin,
            ]

        # ----------------------------------------------------
        # PAR DÉFAUT
        # ----------------------------------------------------

        else:
            permission_classes = [
                IsVehicleManager,
            ]

        return [
            permission()
            for permission in permission_classes
        ]

        

    # ========================================================
    # CREATE
    # ========================================================

    def perform_create(
        self,
        serializer,
    ) -> None:
        """
        Crée un équipement.
        """

        serializer.save()


    # ========================================================
# REPORTS
# ========================================================



