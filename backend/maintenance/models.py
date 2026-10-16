
import uuid
from decimal import Decimal

from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

from vehicles.models import Vehicle

class MaintenanceType(models.TextChoices):
    PREVENTIVE = "PREVENTIVE", _("Préventive")
    REPAIR = "REPAIR", _("Réparation")
    INSPECTION = "INSPECTION", _("Inspection")
    OIL_CHANGE = "OIL_CHANGE", _("Vidange")
    TIRE_CHANGE = "TIRE_CHANGE", _("Changement de pneus")
    OTHER = "OTHER", _("Autre")


class MaintenanceStatus(models.TextChoices):
    PLANNED = "PLANNED", _("Planifiée")
    IN_PROGRESS = "IN_PROGRESS", _("En cours")
    COMPLETED = "COMPLETED", _("Terminée")
    CANCELLED = "CANCELLED", _("Annulée")


class Maintenance(models.Model):
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    vehicle = models.ForeignKey(
        Vehicle,
        on_delete=models.PROTECT,
        related_name="maintenance_records",
        verbose_name=_("véhicule"),
    )

    maintenance_type = models.CharField(
        _("type de maintenance"),
        max_length=20,
        choices=MaintenanceType.choices,
        db_index=True,
    )

    title = models.CharField(
        _("titre"),
        max_length=150,
    )

    description = models.TextField(
        _("description"),
        blank=True,
    )

    status = models.CharField(
        _("statut"),
        max_length=20,
        choices=MaintenanceStatus.choices,
        default=MaintenanceStatus.PLANNED,
        db_index=True,
    )

    scheduled_date = models.DateField(
        _("date prévue"),
        db_index=True,
    )

    started_at = models.DateTimeField(
        _("début de maintenance"),
        null=True,
        blank=True,
    )

    completed_at = models.DateTimeField(
        _("fin de maintenance"),
        null=True,
        blank=True,
    )

    mileage = models.PositiveIntegerField(
        _("kilométrage lors de la maintenance"),
        validators=[MinValueValidator(0)],
    )

    cost = models.DecimalField(
        _("coût"),
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
        validators=[MinValueValidator(Decimal("0.00"))],
    )

    provider = models.CharField(
        _("garage ou prestataire"),
        max_length=150,
        blank=True,
    )

    notes = models.TextField(
        _("notes internes"),
        blank=True,
    )

    created_by = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="maintenance_records_created",
        verbose_name=_("créé par"),
    )

    created_at = models.DateTimeField(
        _("créé le"),
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        _("modifié le"),
        auto_now=True,
    )

    class Meta:
        verbose_name = _("maintenance")
        verbose_name_plural = _("maintenances")
        ordering = ["-scheduled_date", "-created_at"]

        indexes = [
            models.Index(
                fields=["vehicle", "status"],
                name="maint_vehicle_status_idx",
            ),
            models.Index(
                fields=["scheduled_date", "status"],
                name="maint_date_status_idx",
            ),
        ]

    def __str__(self):
        return f"{self.title} — {self.vehicle}"

    def clean(self):
        errors = {}

        if self.title and not self.title.strip():
            errors["title"] = _("Le titre est obligatoire.")

        if self.provider:
            self.provider = self.provider.strip()

        if self.title:
            self.title = self.title.strip()

        if self.completed_at and not self.started_at:
            errors["completed_at"] = _(
                "Une date de début est nécessaire."
            )

        if (
            self.started_at
            and self.completed_at
            and self.completed_at < self.started_at
        ):
            errors["completed_at"] = _(
                "La fin ne peut pas précéder le début."
            )

        if (
            self.status == MaintenanceStatus.COMPLETED
            and not self.completed_at
        ):
            errors["completed_at"] = _(
                "Une maintenance terminée doit avoir une date de fin."
            )

        if errors:
            raise ValidationError(errors)

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)
