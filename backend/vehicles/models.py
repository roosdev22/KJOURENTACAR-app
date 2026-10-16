# apps/vehicles/models.py

import re
import uuid

from datetime import date
from decimal import Decimal
from typing import TYPE_CHECKING

from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import (
    MaxValueValidator,
    MinValueValidator,
    RegexValidator,
)
from django.db import models
from django.db.models import F, Q
from django.utils.translation import gettext_lazy as _

from simple_history.models import HistoricalRecords


if TYPE_CHECKING:
    from users.models import User


# ============================================================
# CONSTANTES DE VALIDATION
# ============================================================

MIN_VEHICLE_YEAR = 1900
MAX_VEHICLE_YEAR = 2100

MIN_SEATS = 1
MAX_SEATS = 50

MIN_DOORS = 1
MAX_DOORS = 10

VIN_LENGTH = 17


# ============================================================
# VALIDATEURS
# ============================================================

validate_vehicle_name = RegexValidator(
    regex=r"^.*[A-Za-zÀ-ÖØ-öø-ÿ].*$",
    message=_(
        "Ce champ doit contenir au moins une lettre."
    ),
)

validate_vin_format = RegexValidator(
    regex=r"^[A-HJ-NPR-Z0-9]{17}$",
    message=_(
        "Le VIN doit contenir exactement 17 caractères "
        "alphanumériques et ne doit pas contenir les lettres "
        "I, O ou Q."
    ),
)


# ============================================================
# CHOIX — CATÉGORIE
# ============================================================


class VehicleCategory(models.TextChoices):
    ECONOMIQUE = "ECONOMIQUE", _("Économique")
    COMPACTE = "COMPACTE", _("Compacte")
    BERLINE = "BERLINE", _("Berline")
    SUV = "SUV", _("SUV")
    PICKUP = "PICKUP", _("Pick-up")
    MINIVAN = "MINIVAN", _("Minivan")
    VAN = "VAN", _("Van")
    LUXE = "LUXE", _("Luxe")
    SPORT = "SPORT", _("Sport")
    AUTRE = "AUTRE", _("Autre")


# ============================================================
# CHOIX — TRANSMISSION
# ============================================================


class TransmissionType(models.TextChoices):
    MANUAL = "MANUAL", _("Manuelle")
    AUTOMATIC = "AUTOMATIC", _("Automatique")


# ============================================================
# CHOIX — CARBURANT
# ============================================================


class FuelType(models.TextChoices):
    GASOLINE = "GASOLINE", _("Essence")
    DIESEL = "DIESEL", _("Diesel")
    HYBRID = "HYBRID", _("Hybride")
    ELECTRIC = "ELECTRIC", _("Électrique")
    LPG = "LPG", _("GPL")
    OTHER = "OTHER", _("Autre")


# ============================================================
# CHOIX — STATUT STRUCTUREL
# ============================================================


class VehicleStatus(models.TextChoices):
    """
    Statut structurel du véhicule.

    IMPORTANT :
    Ce statut ne représente PAS la disponibilité liée
    aux réservations.
    """

    AVAILABLE = "AVAILABLE", _("Disponible")
    MAINTENANCE = "MAINTENANCE", _("En maintenance")
    OUT_OF_SERVICE = "OUT_OF_SERVICE", _("Hors service")


# ============================================================
# CHOIX — ÉTAT DU VÉHICULE
# ============================================================


class VehicleCondition(models.TextChoices):
    EXCELLENT = "EXCELLENT", _("Excellent")
    GOOD = "GOOD", _("Bon")
    FAIR = "FAIR", _("Moyen")
    POOR = "POOR", _("Mauvais")


# ============================================================
# VEHICLE
# ============================================================


class Vehicle(models.Model):
    """
    Véhicule du parc automobile KJOURRENTACAR.

    Les réservations, locations et opérations de maintenance
    seront gérées dans des modules séparés.
    """

    # ========================================================
    # IDENTIFICATION
    # ========================================================

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    brand = models.CharField(
        _("marque"),
        max_length=100,
        db_index=True,
        validators=[
            validate_vehicle_name,
        ],
    )

    model = models.CharField(
        _("modèle"),
        max_length=100,
        db_index=True,
        validators=[
            validate_vehicle_name,
        ],
    )

    year = models.PositiveSmallIntegerField(
        _("année"),
        validators=[
            MinValueValidator(MIN_VEHICLE_YEAR),
            MaxValueValidator(MAX_VEHICLE_YEAR),
        ],
        db_index=True,
    )

    registration_number = models.CharField(
        _("plaque d'immatriculation"),
        max_length=30,
        unique=True,
    )

    vin = models.CharField(
        _("numéro de châssis (VIN)"),
        max_length=VIN_LENGTH,
        unique=True,
        null=True,
        blank=True,
        validators=[
            validate_vin_format,
        ],
        help_text=_(
            "VIN de 17 caractères alphanumériques. "
            "Les lettres I, O et Q sont interdites."
        ),
    )

    color = models.CharField(
    _("couleur"),
    max_length=50,
    blank=True,
    validators=[
        RegexValidator(
            regex=r"^[A-Za-zÀ-ÖØ-öø-ÿ]+(?:[ -][A-Za-zÀ-ÖØ-öø-ÿ]+)*$",
            message=_(
                "La couleur doit contenir uniquement des lettres, "
                "avec éventuellement des espaces ou des tirets."
            ),
        ),
    ],
)

    # ========================================================
    # CARACTÉRISTIQUES
    # ========================================================

    category = models.CharField(
        _("catégorie"),
        max_length=20,
        choices=VehicleCategory.choices,
        default=VehicleCategory.ECONOMIQUE,
        db_index=True,
    )

    transmission = models.CharField(
        _("transmission"),
        max_length=20,
        choices=TransmissionType.choices,
        default=TransmissionType.MANUAL,
        db_index=True,
    )

    fuel_type = models.CharField(
        _("carburant"),
        max_length=20,
        choices=FuelType.choices,
        default=FuelType.GASOLINE,
        db_index=True,
    )

    seats = models.PositiveSmallIntegerField(
        _("nombre de places"),
        default=5,
        validators=[
            MinValueValidator(MIN_SEATS),
            MaxValueValidator(MAX_SEATS),
        ],
    )

    doors = models.PositiveSmallIntegerField(
        _("nombre de portes"),
        default=4,
        validators=[
            MinValueValidator(MIN_DOORS),
            MaxValueValidator(MAX_DOORS),
        ],
    )

    air_conditioning = models.BooleanField(
        _("climatisation"),
        default=True,
    )

    # ========================================================
    # TARIFICATION
    # ========================================================

    daily_rate = models.DecimalField(
        _("prix par jour"),
        max_digits=12,
        decimal_places=2,
        validators=[
            MinValueValidator(Decimal("0.00")),
        ],
    )

    weekly_rate = models.DecimalField(
        _("prix par semaine"),
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[
            MinValueValidator(Decimal("0.00")),
        ],
    )

    monthly_rate = models.DecimalField(
        _("prix par mois"),
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[
            MinValueValidator(Decimal("0.00")),
        ],
    )

    deposit = models.DecimalField(
        _("caution"),
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
        validators=[
            MinValueValidator(Decimal("0.00")),
        ],
    )

    unlimited_mileage = models.BooleanField(
        _("kilométrage illimité"),
        default=False,
    )

    # ========================================================
    # ÉTAT & SUIVI
    # ========================================================

    status = models.CharField(
        _("statut"),
        max_length=20,
        choices=VehicleStatus.choices,
        default=VehicleStatus.AVAILABLE,
        db_index=True,
    )

    # FIX models.E020 — "check" est une classmethod réservée par Django.
    # Renommé en "condition", cohérent avec VehicleCondition.
    condition = models.CharField(
        _("état général"),
        max_length=20,
        choices=VehicleCondition.choices,
        default=VehicleCondition.GOOD,
        db_index=True,
    )

    mileage = models.PositiveIntegerField(
        _("kilométrage"),
        default=0,
        validators=[
            MinValueValidator(0),
        ],
    )

    last_maintenance_date = models.DateField(
        _("date de dernière maintenance"),
        null=True,
        blank=True,
    )

    next_maintenance_date = models.DateField(
        _("date de prochaine maintenance"),
        null=True,
        blank=True,
    )

    # ========================================================
    # CONTENU
    # ========================================================

    description = models.TextField(
        _("description"),
        blank=True,
    )

    # ========================================================
    # AUDIT
    # ========================================================

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="vehicles_created",
        verbose_name=_("créé par"),
    )

    created_at = models.DateTimeField(
        _("créé le"),
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        _("mis à jour le"),
        auto_now=True,
    )

    # ========================================================
    # HISTORIQUE
    # ========================================================

    history = HistoricalRecords(
        verbose_name=_("historique"),
    )

    # ========================================================
    # META
    # ========================================================

    class Meta:
        verbose_name = _("véhicule")
        verbose_name_plural = _("véhicules")

        ordering = [
            "-created_at",
        ]

        indexes = [
            models.Index(
                fields=["brand", "model"],
                name="vehicle_brand_model_idx",
            ),
            models.Index(
                fields=["status", "category"],
                name="vehicle_status_category_idx",
            ),
            models.Index(
                fields=["status", "fuel_type"],
                name="vehicle_status_fuel_idx",
            ),
            models.Index(
                fields=["-created_at"],
                name="vehicle_created_at_idx",
            ),
        ]

        constraints = [
            # =================================================
            # ANNÉE
            # =================================================

            models.CheckConstraint(
                check=Q(year__gte=MIN_VEHICLE_YEAR),
                name="vehicle_year_min_check",
            ),

            models.CheckConstraint(
                check=Q(year__lte=MAX_VEHICLE_YEAR),
                name="vehicle_year_max_check",
            ),

            # =================================================
            # PLACES
            # =================================================

            models.CheckConstraint(
                check=(
                    Q(seats__gte=MIN_SEATS)
                    & Q(seats__lte=MAX_SEATS)
                ),
                name="vehicle_seats_range_check",
            ),

            # =================================================
            # PORTES
            # =================================================

            models.CheckConstraint(
                check=(
                    Q(doors__gte=MIN_DOORS)
                    & Q(doors__lte=MAX_DOORS)
                ),
                name="vehicle_doors_range_check",
            ),

            # =================================================
            # TARIFS
            # =================================================

            models.CheckConstraint(
                check=Q(
                    daily_rate__gte=Decimal("0.00")
                ),
                name="vehicle_daily_rate_positive_check",
            ),

            models.CheckConstraint(
                check=(
                    Q(weekly_rate__isnull=True)
                    | Q(
                        weekly_rate__gte=Decimal("0.00")
                    )
                ),
                name="vehicle_weekly_rate_positive_check",
            ),

            models.CheckConstraint(
                check=(
                    Q(monthly_rate__isnull=True)
                    | Q(
                        monthly_rate__gte=Decimal("0.00")
                    )
                ),
                name="vehicle_monthly_rate_positive_check",
            ),

            models.CheckConstraint(
                check=Q(
                    deposit__gte=Decimal("0.00")
                ),
                name="vehicle_deposit_positive_check",
            ),

            # =================================================
            # TARIF HEBDOMADAIRE
            # =================================================

            models.CheckConstraint(
                check=(
                    Q(weekly_rate__isnull=True)
                    | Q(
                        weekly_rate__lte=(
                            F("daily_rate")
                            * Decimal("7")
                        )
                    )
                ),
                name="vehicle_weekly_rate_limit_check",
            ),

            # =================================================
            # TARIF MENSUEL
            # =================================================

            models.CheckConstraint(
                check=(
                    Q(monthly_rate__isnull=True)
                    | Q(
                        monthly_rate__lte=(
                            F("daily_rate")
                            * Decimal("30")
                        )
                    )
                ),
                name="vehicle_monthly_rate_limit_check",
            ),

            # =================================================
            # MAINTENANCE
            # =================================================

            models.CheckConstraint(
                check=(
                    Q(last_maintenance_date__isnull=True)
                    | Q(next_maintenance_date__isnull=True)
                    | Q(
                        next_maintenance_date__gte=F(
                            "last_maintenance_date"
                        )
                    )
                ),
                name="vehicle_maintenance_dates_check",
            ),
        ]

    # ========================================================
    # STRING
    # ========================================================

    def __str__(self) -> str:
        return (
            f"{self.brand} {self.model} "
            f"({self.registration_number})"
        )

    # ========================================================
    # VALIDATION MÉTIER
    # ========================================================

    def clean(self):
        """
        Validation métier complète du véhicule.
        """

        errors = {}

        current_year = date.today().year

        # ====================================================
        # ANNÉE
        # ====================================================

        if self.year is not None:
            if self.year > current_year + 1:
                errors["year"] = _(
                    "L'année du véhicule ne peut pas dépasser "
                    "l'année prochaine."
                )

        # ====================================================
        # VIN
        # ====================================================

        if self.vin:
            normalized_vin = self.vin.strip().upper()

            if len(normalized_vin) != VIN_LENGTH:
                errors["vin"] = _(
                    "Le VIN doit contenir exactement "
                    "17 caractères."
                )

            elif not re.fullmatch(
                r"[A-HJ-NPR-Z0-9]{17}",
                normalized_vin,
            ):
                errors["vin"] = _(
                    "Le VIN contient des caractères invalides. "
                    "Utilisez uniquement des lettres et chiffres, "
                    "sans I, O ou Q."
                )

        # ====================================================
        # IMMATRICULATION
        # ====================================================

        if self.registration_number:
            registration = (
                self.registration_number
                .strip()
                .upper()
            )

            if not registration:
                errors["registration_number"] = _(
                    "Le numéro d'immatriculation est obligatoire."
                )

            elif not re.fullmatch(
                r"[A-Z0-9][A-Z0-9 ._-]*",
                registration,
            ):
                errors["registration_number"] = _(
                    "Le numéro d'immatriculation contient "
                    "des caractères invalides."
                )

        # ====================================================
        # MARQUE
        # ====================================================

        if self.brand is not None:
            if not self.brand.strip():
                errors["brand"] = _(
                    "La marque ne peut pas être vide."
                )

        # ====================================================
        # MODÈLE
        # ====================================================

        if self.model is not None:
            if not self.model.strip():
                errors["model"] = _(
                    "Le modèle ne peut pas être vide."
                )

        # ====================================================
        # COULEUR
        # ====================================================

        if self.color and not self.color.strip():
            errors["color"] = _(
                "La couleur ne peut pas contenir uniquement "
                "des espaces."
            )

        # ====================================================
        # DESCRIPTION
        # ====================================================

        if self.description is not None:
            self.description = self.description.strip()

        # ====================================================
        # MAINTENANCE
        # ====================================================

        if (
            self.next_maintenance_date
            and self.last_maintenance_date
            and self.next_maintenance_date
            < self.last_maintenance_date
        ):
            errors["next_maintenance_date"] = _(
                "La prochaine maintenance ne peut pas être "
                "antérieure à la dernière maintenance."
            )

        # ====================================================
        # DERNIÈRE MAINTENANCE
        # ====================================================

        if (
            self.last_maintenance_date
            and self.last_maintenance_date > date.today()
        ):
            errors["last_maintenance_date"] = _(
                "La date de dernière maintenance ne peut pas "
                "être dans le futur."
            )

        # ====================================================
        # TARIF HEBDOMADAIRE
        # ====================================================

        if (
            self.weekly_rate is not None
            and self.daily_rate is not None
            and self.weekly_rate
            > self.daily_rate * Decimal("7")
        ):
            errors["weekly_rate"] = _(
                "Le prix hebdomadaire ne peut normalement pas "
                "dépasser 7 fois le prix journalier."
            )

        # ====================================================
        # TARIF MENSUEL
        # ====================================================

        if (
            self.monthly_rate is not None
            and self.daily_rate is not None
            and self.monthly_rate
            > self.daily_rate * Decimal("30")
        ):
            errors["monthly_rate"] = _(
                "Le prix mensuel ne peut normalement pas "
                "dépasser 30 fois le prix journalier."
            )

        # ====================================================
        # COHÉRENCE TARIFAIRE
        # ====================================================

        if (
            self.weekly_rate is not None
            and self.monthly_rate is not None
            and self.monthly_rate < self.weekly_rate
        ):
            errors["monthly_rate"] = _(
                "Le prix mensuel ne peut pas être inférieur "
                "au prix hebdomadaire."
            )

        # ====================================================
        # CAUTION
        # ====================================================

        if (
            self.deposit is not None
            and self.deposit < Decimal("0.00")
        ):
            errors["deposit"] = _(
                "La caution ne peut pas être négative."
            )

        # ====================================================
        # KILOMÉTRAGE
        # ====================================================

        if self.mileage is not None and self.mileage < 0:
            errors["mileage"] = _(
                "Le kilométrage ne peut pas être négatif."
            )

        # ====================================================
        # ERREURS
        # ====================================================

        if errors:
            raise ValidationError(errors)

        if (
            self.status == VehicleStatus.AVAILABLE
            and self.condition not in (
                VehicleCondition.EXCELLENT,
                VehicleCondition.GOOD,
            )
        ):
            errors["status"] = _(
                "Un véhicule doit être en excellent ou bon état "
                "pour être disponible à la location."
            )

        if errors:
            raise ValidationError(errors)
    # ========================================================
    # SAVE
    # ========================================================

    def save(self, *args, **kwargs):
        """
        Normalise puis valide le véhicule avant sauvegarde.
        """

        # ====================================================
        # NORMALISATION
        # ====================================================

        if self.brand:
            self.brand = self.brand.strip()

        if self.model:
            self.model = self.model.strip()

        if self.registration_number:
            self.registration_number = (
                self.registration_number
                .strip()
                .upper()
            )

        if self.vin:
            self.vin = (
                self.vin
                .strip()
                .upper()
            )

        if self.color:
            self.color = self.color.strip()

        # ====================================================
        # VALIDATION
        # ====================================================

        self.full_clean()

        # ====================================================
        # UPDATE_FIELDS
        # ====================================================

        update_fields = kwargs.get("update_fields")

        if update_fields is not None:
            update_fields = set(update_fields)

            update_fields.add("updated_at")

            kwargs["update_fields"] = update_fields

        # ====================================================
        # SAUVEGARDE
        # ====================================================

        super().save(*args, **kwargs)

    # ========================================================
    # PROPRIÉTÉS
    # ========================================================

    @property
    def is_available(self) -> bool:
        """
        Disponibilité structurelle du véhicule.

        Ne vérifie pas les réservations.
        """

        return self.status == VehicleStatus.AVAILABLE

    @property
    def display_name(self) -> str:
        return f"{self.brand} {self.model}"

    @property
    def full_name(self) -> str:
        return (
            f"{self.brand} {self.model} "
            f"- {self.registration_number}"
        )

    # ========================================================
    # ACTIONS MÉTIER
    # ========================================================

    def mark_as_available(self):
        self.status = VehicleStatus.AVAILABLE

        self.save(
            update_fields=[
                "status",
                "updated_at",
            ]
        )

    def mark_as_maintenance(self):
        self.status = VehicleStatus.MAINTENANCE

        self.save(
            update_fields=[
                "status",
                "updated_at",
            ]
        )

    def mark_as_out_of_service(self):
        self.status = VehicleStatus.OUT_OF_SERVICE

        self.save(
            update_fields=[
                "status",
                "updated_at",
            ]
        )


# ============================================================
# VEHICLE IMAGE
# ============================================================


class VehicleImage(models.Model):
    """
    Image associée à un véhicule.

    Un véhicule peut avoir plusieurs images,
    mais une seule peut être principale.
    """

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    vehicle = models.ForeignKey(
        Vehicle,
        on_delete=models.CASCADE,
        related_name="images",
        verbose_name=_("véhicule"),
    )

    image = models.ImageField(
        _("image"),
        upload_to="vehicles/",
    )

    caption = models.CharField(
        _("légende"),
        max_length=255,
        blank=True,
    )

    is_primary = models.BooleanField(
        _("image principale"),
        default=False,
    )

    display_order = models.PositiveIntegerField(
        _("ordre d'affichage"),
        default=0,
    )

    created_at = models.DateTimeField(
        _("créé le"),
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        _("mis à jour le"),
        auto_now=True,
    )

    class Meta:
        verbose_name = _("image de véhicule")
        verbose_name_plural = _("images de véhicules")

        ordering = [
            "display_order",
            "-created_at",
        ]

        indexes = [
            models.Index(
                fields=[
                    "vehicle",
                    "display_order",
                ],
                name="vehicle_image_order_idx",
            ),
        ]

        constraints = [
            # =================================================
            # UNE SEULE IMAGE PRINCIPALE
            # =================================================

            models.UniqueConstraint(
                fields=["vehicle"],
                condition=Q(is_primary=True),
                name="unique_primary_image_per_vehicle",
            ),

            # =================================================
            # ORDRE D'AFFICHAGE
            # =================================================

            models.CheckConstraint(
                check=Q(display_order__gte=0),
                name="vehicle_image_display_order_check",
            ),
        ]

    def __str__(self) -> str:
        return (
            f"Image - "
            f"{self.vehicle.brand} "
            f"{self.vehicle.model}"
        )

    def clean(self):
        errors = {}

        if not self.image:
            errors["image"] = _(
                "Une image est obligatoire."
            )

        if self.caption and not self.caption.strip():
            errors["caption"] = _(
                "La légende ne peut pas contenir uniquement "
                "des espaces."
            )

        if errors:
            raise ValidationError(errors)

    def save(self, *args, **kwargs):
        if self.caption:
            self.caption = self.caption.strip()

        self.full_clean()

        super().save(*args, **kwargs)


# ============================================================
# EQUIPMENT
# ============================================================


class Equipment(models.Model):
    """
    Équipement disponible dans le catalogue.

    Exemples :

        GPS
        Bluetooth
        Caméra de recul
        Siège enfant
        USB
    """

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    name = models.CharField(
        _("nom"),
        max_length=100,
        unique=True,
        validators=[
            validate_vehicle_name,
        ],
    )

    description = models.TextField(
        _("description"),
        blank=True,
    )

    is_active = models.BooleanField(
        _("actif"),
        default=True,
        db_index=True,
    )

    created_at = models.DateTimeField(
        _("créé le"),
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        _("mis à jour le"),
        auto_now=True,
    )

    class Meta:
        verbose_name = _("équipement")
        verbose_name_plural = _("équipements")

        ordering = [
            "name",
        ]

    def __str__(self) -> str:
        return self.name

    def clean(self):
        errors = {}

        if self.name is not None:
            self.name = self.name.strip()

            if not self.name:
                errors["name"] = _(
                    "Le nom de l'équipement est obligatoire."
                )

        if self.description:
            self.description = self.description.strip()

        if errors:
            raise ValidationError(errors)

    def save(self, *args, **kwargs):
        self.full_clean()

        super().save(*args, **kwargs)


# ============================================================
# VEHICLE EQUIPMENT
# ============================================================


class VehicleEquipment(models.Model):
    """
    Relation entre un véhicule et un équipement.
    """

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    vehicle = models.ForeignKey(
        Vehicle,
        on_delete=models.CASCADE,
        related_name="vehicle_equipments",
        verbose_name=_("véhicule"),
    )

    equipment = models.ForeignKey(
        Equipment,
        on_delete=models.PROTECT,
        related_name="vehicle_equipments",
        verbose_name=_("équipement"),
    )

    created_at = models.DateTimeField(
        _("ajouté le"),
        auto_now_add=True,
    )

    class Meta:
        verbose_name = _("équipement du véhicule")
        verbose_name_plural = _("équipements des véhicules")

        constraints = [
            models.UniqueConstraint(
                fields=[
                    "vehicle",
                    "equipment",
                ],
                name="unique_vehicle_equipment",
            ),
        ]

    def __str__(self) -> str:
        return (
            f"{self.vehicle.brand} "
            f"{self.vehicle.model} → "
            f"{self.equipment.name}"
        )

    def clean(self):
        errors = {}

        if not self.vehicle_id:
            errors["vehicle"] = _(
                "Un véhicule est obligatoire."
            )

        if not self.equipment_id:
            errors["equipment"] = _(
                "Un équipement est obligatoire."
            )

        if errors:
            raise ValidationError(errors)

    def save(self, *args, **kwargs):
        self.full_clean()

        super().save(*args, **kwargs)