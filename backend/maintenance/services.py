
from django.core.exceptions import ValidationError
from django.db import transaction
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

from vehicles.models import Vehicle, VehicleCondition, VehicleStatus

from .models import Maintenance, MaintenanceStatus


class MaintenanceService:
    """
    Centralise les transitions métier d'une maintenance.
    """

    @staticmethod
    @transaction.atomic
    def demarrer(maintenance_id):
        maintenance = (
            Maintenance.objects
            .select_for_update()
            .select_related("vehicle")
            .get(pk=maintenance_id)
        )

        if maintenance.status != MaintenanceStatus.PLANNED:
            raise ValidationError(
                _("Seule une maintenance planifiée peut démarrer.")
            )

        vehicle = (
            Vehicle.objects
            .select_for_update()
            .get(pk=maintenance.vehicle_id)
        )

        if vehicle.status == VehicleStatus.OUT_OF_SERVICE:
            raise ValidationError(
                _("Ce véhicule est hors service.")
            )

        if Maintenance.objects.filter(
            vehicle=vehicle,
            status=MaintenanceStatus.IN_PROGRESS,
        ).exclude(pk=maintenance.pk).exists():
            raise ValidationError(
                _("Une autre maintenance est déjà en cours pour ce véhicule.")
            )

        now = timezone.now()

        maintenance.status = MaintenanceStatus.IN_PROGRESS
        maintenance.started_at = now
        maintenance.save(
            update_fields=[
                "status",
                "started_at",
                "updated_at",
            ]
        )

        vehicle.status = VehicleStatus.MAINTENANCE
        vehicle.save(
            update_fields=["status", "updated_at"]
        )

        return maintenance

    @staticmethod
    @transaction.atomic
    def terminer(maintenance_id):
        maintenance = (
            Maintenance.objects
            .select_for_update()
            .get(pk=maintenance_id)
        )

        if maintenance.status != MaintenanceStatus.IN_PROGRESS:
            raise ValidationError(
                _("Seule une maintenance en cours peut être terminée.")
            )

        vehicle = (
            Vehicle.objects
            .select_for_update()
            .get(pk=maintenance.vehicle_id)
        )

        now = timezone.now()

        maintenance.status = MaintenanceStatus.COMPLETED
        maintenance.completed_at = now
        maintenance.save(
            update_fields=[
                "status",
                "completed_at",
                "updated_at",
            ]
        )

        vehicle.last_maintenance_date = now.date()
        vehicle.mileage = max(vehicle.mileage, maintenance.mileage)

        # Ne jamais remettre automatiquement en service
        # un véhicule hors service ou en mauvais état.
        other_active = Maintenance.objects.filter(
            vehicle=vehicle,
            status=MaintenanceStatus.IN_PROGRESS,
        ).exclude(pk=maintenance.pk).exists()

        if (
            not other_active
            and vehicle.status == VehicleStatus.MAINTENANCE
        ):
            if vehicle.condition in (
                VehicleCondition.EXCELLENT,
                VehicleCondition.GOOD,
            ):
                vehicle.status = VehicleStatus.AVAILABLE
            else:
                vehicle.status = VehicleStatus.OUT_OF_SERVICE

        vehicle.save(
            update_fields=[
                "last_maintenance_date",
                "mileage",
                "status",
                "updated_at",
            ]
        )

        return maintenance
