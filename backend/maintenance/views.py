
from django.core.exceptions import ValidationError as DjangoValidationError
from django.utils.translation import gettext_lazy as _

from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from .models import Maintenance
from .permissions import CanManageMaintenance
from .serializers import MaintenanceSerializer
from .services import MaintenanceService


class MaintenanceViewSet(viewsets.ModelViewSet):
    """
    API de gestion des maintenances du parc automobile.

    Les changements d'état sont délégués à MaintenanceService.
    """

    serializer_class = MaintenanceSerializer
    permission_classes = [CanManageMaintenance]

    # Conserver l'historique des maintenances : pas de suppression directe.
    http_method_names = [
        "get",
        "post",
        "put",
        "patch",
        "head",
        "options",
    ]

    def get_queryset(self):
        return (
            Maintenance.objects
            .select_related("vehicle", "created_by")
            .all()
        )

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=["post"])
    def demarrer(self, request, pk=None):
        """Démarre une maintenance planifiée."""

        maintenance = self.get_object()

        try:
            maintenance = MaintenanceService.demarrer(maintenance.pk)
        except DjangoValidationError as exc:
            raise ValidationError({"detail": exc.messages}) from exc

        return Response(
            self.get_serializer(maintenance).data,
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=["post"])
    def terminer(self, request, pk=None):
        """Termine une maintenance en cours."""

        maintenance = self.get_object()

        try:
            maintenance = MaintenanceService.terminer(maintenance.pk)
        except DjangoValidationError as exc:
            raise ValidationError({"detail": exc.messages}) from exc

        return Response(
            self.get_serializer(maintenance).data,
            status=status.HTTP_200_OK,
        )
