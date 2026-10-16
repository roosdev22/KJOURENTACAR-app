# apps/vehicles/serializers.py

"""
Serializers DRF — KJOURRENTACAR / Vehicles

Gestion de la représentation, validation et synchronisation
des données du parc automobile.

Architecture :

    VehicleListSerializer
        → Catalogue public / véhicules disponibles.

    VehicleImageSerializer
        → Images des véhicules.

    EquipmentSerializer
        → Catalogue des équipements.

    PublicEquipmentSerializer
        → Équipements visibles par le client.

    VehicleEquipmentSerializer
        → Association véhicule / équipement.

    VehicleDetailSerializer
        → Détails complets pour le personnel autorisé.

    VehicleCreateUpdateSerializer
        → Création et modification d'un véhicule.

    VehicleStatusSerializer
        → Modification contrôlée du statut.

    VehicleConditionSerializer
        → Modification contrôlée de l'état.

    VehicleResponseSerializer
        → Réponse complète après création/modification.

IMPORTANT
---------
Les permissions restent de la responsabilité des Views/Permissions.
Les serializers assurent principalement la validation des données.
"""

from datetime import date
from decimal import Decimal
import re
from typing import Any

from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import transaction
from django.utils.translation import gettext_lazy as _

from rest_framework import serializers

from .models import (
    Vehicle,
    VehicleImage,
    Equipment,
    VehicleEquipment,
    VehicleStatus,
    VehicleCondition,
)


# ============================================================
# CONSTANTES DE VALIDATION
# ============================================================

VIN_LENGTH = 17

MIN_VEHICLE_YEAR = 1900

MAX_VEHICLE_YEAR_OFFSET = 1

MIN_SEATS = 1
MAX_SEATS = 50

MIN_DOORS = 1
MAX_DOORS = 10

MAX_IMAGE_SIZE = 10 * 1024 * 1024  # 10 MB

ALLOWED_IMAGE_EXTENSIONS = {
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
}


# ============================================================
# HELPERS
# ============================================================

def django_validation_to_drf(
    exc: DjangoValidationError,
) -> serializers.ValidationError:
    """
    Convertit une ValidationError Django en ValidationError DRF.
    """

    if hasattr(exc, "message_dict"):
        return serializers.ValidationError(
            exc.message_dict
        )

    return serializers.ValidationError(
        {
            "detail": exc.messages,
        }
    )


def get_existing_value(
    serializer: serializers.Serializer,
    attrs: dict[str, Any],
    field_name: str,
) -> Any:
    """
    Retourne la valeur fournie dans attrs.

    En cas de PATCH, si le champ n'est pas fourni,
    retourne la valeur actuelle de l'instance.
    """

    if field_name in attrs:
        return attrs[field_name]

    instance = getattr(serializer, "instance", None)

    if instance is not None:
        return getattr(instance, field_name, None)

    return None


# ============================================================
# VEHICLE IMAGE
# ============================================================

class VehicleImageSerializer(serializers.ModelSerializer):
    """
    Serializer pour les images d'un véhicule.
    """

    image_url = serializers.SerializerMethodField()

    class Meta:
        model = VehicleImage

        fields = [
            "id",
            "image",
            "image_url",
            "caption",
            "is_primary",
            "display_order",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "image_url",
            "created_at",
            "updated_at",
        ]

    def validate_image(self, value):
        """
        Validation de base du fichier image.
        """

        if not value:
            raise serializers.ValidationError(
                _("Une image est obligatoire.")
            )

        # Taille maximale
        if value.size > MAX_IMAGE_SIZE:
            raise serializers.ValidationError(
                _(
                    "L'image ne doit pas dépasser "
                    "10 Mo."
                )
            )

        # Extension
        filename = getattr(value, "name", "") or ""
        extension = ""

        if "." in filename:
            extension = (
                filename.rsplit(".", 1)[-1]
                .lower()
            )
            extension = f".{extension}"

        if extension not in ALLOWED_IMAGE_EXTENSIONS:
            raise serializers.ValidationError(
                _(
                    "Format d'image non supporté. "
                    "Formats autorisés : JPG, JPEG, PNG et WEBP."
                )
            )

        return value

    def validate_caption(self, value: str) -> str:
        """
        Nettoie la légende.
        """

        if value is None:
            return ""

        value = value.strip()

        return value

    def validate_display_order(self, value: int) -> int:
        """
        L'ordre d'affichage ne peut pas être négatif.
        """

        if value < 0:
            raise serializers.ValidationError(
                _("L'ordre d'affichage ne peut pas être négatif.")
            )

        return value

    def validate(self, attrs: dict[str, Any]) -> dict[str, Any]:
        """
        Validation globale de l'image.
        """

        is_primary = attrs.get(
            "is_primary",
            getattr(self.instance, "is_primary", False),
        )

        vehicle = getattr(
            self.instance,
            "vehicle",
            None,
        )

        # La relation vehicle est généralement fournie
        # par la View et non par ce serializer.
        if vehicle and is_primary:
            queryset = VehicleImage.objects.filter(
                vehicle=vehicle,
                is_primary=True,
            )

            if self.instance:
                queryset = queryset.exclude(
                    pk=self.instance.pk
                )

            if queryset.exists():
                raise serializers.ValidationError({
                    "is_primary": _(
                        "Ce véhicule possède déjà une image principale."
                    )
                })

        return attrs

    def get_image_url(
        self,
        obj: VehicleImage,
    ) -> str | None:
        """
        Retourne l'URL absolue de l'image.
        """

        if not obj.image:
            return None

        request = self.context.get("request")

        if request:
            return request.build_absolute_uri(
                obj.image.url
            )

        return obj.image.url


# ============================================================
# EQUIPMENT
# ============================================================

class EquipmentSerializer(serializers.ModelSerializer):
    """
    Serializer du catalogue des équipements.
    """

    class Meta:
        model = Equipment

        fields = [
            "id",
            "name",
            "description",
            "is_active",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
        ]

    def validate_name(self, value: str) -> str:
        """
        Valide et normalise le nom de l'équipement.
        """

        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                _("Le nom de l'équipement est obligatoire.")
            )

        if len(value) > 100:
            raise serializers.ValidationError(
                _("Le nom de l'équipement ne peut pas dépasser 100 caractères.")
            )

        return value

    def validate_description(self, value: str) -> str:
        if value is None:
            return ""

        return value.strip()


# ============================================================
# VEHICLE EQUIPMENT
# ============================================================

class VehicleEquipmentSerializer(serializers.ModelSerializer):
    """
    Serializer pour l'association entre un véhicule
    et un équipement.
    """

    equipment_name = serializers.CharField(
        source="equipment.name",
        read_only=True,
    )

    class Meta:
        model = VehicleEquipment

        fields = [
            "id",
            "vehicle",
            "equipment",
            "equipment_name",
            "created_at",
        ]

        read_only_fields = [
            "id",
            "created_at",
            "equipment_name",
        ]

    def validate_equipment(self, value: Equipment) -> Equipment:
        """
        Seuls les équipements actifs peuvent être associés.
        """

        if not value.is_active:
            raise serializers.ValidationError(
                _("Cet équipement est inactif.")
            )

        return value

    def validate(self, attrs: dict[str, Any]) -> dict[str, Any]:
        vehicle = attrs.get(
            "vehicle",
            getattr(self.instance, "vehicle", None),
        )

        equipment = attrs.get(
            "equipment",
            getattr(self.instance, "equipment", None),
        )

        if vehicle and equipment:
            queryset = VehicleEquipment.objects.filter(
                vehicle=vehicle,
                equipment=equipment,
            )

            if self.instance:
                queryset = queryset.exclude(
                    pk=self.instance.pk
                )

            if queryset.exists():
                raise serializers.ValidationError({
                    "equipment": _(
                        "Cet équipement est déjà associé à ce véhicule."
                    )
                })

        return attrs


# ============================================================
# EQUIPMENT — VERSION PUBLIQUE
# ============================================================

class PublicEquipmentSerializer(serializers.ModelSerializer):
    """
    Version minimale destinée au client.
    """

    class Meta:
        model = Equipment

        fields = [
            "id",
            "name",
        ]

        read_only_fields = [
            "id",
            "name",
        ]


# ============================================================
# VEHICLE — CATALOGUE CLIENT
# ============================================================

class VehicleListSerializer(serializers.ModelSerializer):
    """
    Serializer utilisé pour le catalogue public.

    La View doit impérativement filtrer les véhicules
    selon les règles métier, notamment :

        status=VehicleStatus.AVAILABLE
    """

    display_name = serializers.CharField(
        read_only=True,
    )

    images = VehicleImageSerializer(
        many=True,
        read_only=True,
    )

    equipment = serializers.SerializerMethodField()

    category_display = serializers.CharField(
        source="get_category_display",
        read_only=True,
    )

    transmission_display = serializers.CharField(
        source="get_transmission_display",
        read_only=True,
    )

    fuel_type_display = serializers.CharField(
        source="get_fuel_type_display",
        read_only=True,
    )

    condition_display = serializers.CharField(
        source="get_condition_display",
        read_only=True,
    )

    class Meta:
        model = Vehicle

        fields = [
            "id",

            # Identification
            "brand",
            "model",
            "year",
            "color",

            # Caractéristiques
            "category",
            "category_display",
            "transmission",
            "transmission_display",
            "fuel_type",
            "fuel_type_display",
            "seats",
            "doors",
            "air_conditioning",

            # Tarification
            "daily_rate",
            "weekly_rate",
            "monthly_rate",
            "deposit",
            "unlimited_mileage",

            # Etat
            "status",
            "condition",
            "condition_display",
            "mileage",

            # Contenu
            "description",

            # Médias
            "images",
            "equipment",

            # Helpers
            "display_name",
        ]

        read_only_fields = fields

    def get_equipment(
        self,
        obj: Vehicle,
    ) -> list[dict[str, Any]]:
        """
        Retourne uniquement les équipements actifs.
        """

        relations = (
            obj.vehicle_equipments
            .select_related("equipment")
            .filter(
                equipment__is_active=True
            )
        )

        return PublicEquipmentSerializer(
            [
                relation.equipment
                for relation in relations
            ],
            many=True,
            context=self.context,
        ).data




# ============================================================
# VEHICLE REPORTS
# ============================================================

class VehicleReportSerializer(serializers.Serializer):
    """
    Serializer pour les statistiques globales du parc automobile.
    """

    total = serializers.IntegerField()

    by_status = serializers.DictField(
        child=serializers.IntegerField(),
    )

    by_category = serializers.DictField(
        child=serializers.IntegerField(),
    )

    by_fuel_type = serializers.DictField(
        child=serializers.IntegerField(),
    )

    by_condition = serializers.DictField(
        child=serializers.IntegerField(),
    )

    maintenance_overdue = serializers.IntegerField()

    high_mileage = serializers.IntegerField()

    recently_added = VehicleListSerializer(many=True)



# ============================================================
# VEHICLE — DETAIL INTERNE
# ============================================================


class VehicleDetailSerializer(serializers.ModelSerializer):
    """
    Serializer détaillé pour le personnel autorisé.
    """

    display_name = serializers.CharField(
        read_only=True,
    )

    full_name = serializers.CharField(
        read_only=True,
    )

    images = VehicleImageSerializer(
        many=True,
        read_only=True,
    )

    vehicle_equipments = VehicleEquipmentSerializer(
        many=True,
        read_only=True,
    )

    created_by_email = serializers.EmailField(
        source="created_by.email",
        read_only=True,
        allow_null=True,
    )

    category_display = serializers.CharField(
        source="get_category_display",
        read_only=True,
    )

    transmission_display = serializers.CharField(
        source="get_transmission_display",
        read_only=True,
    )

    fuel_type_display = serializers.CharField(
        source="get_fuel_type_display",
        read_only=True,
    )

    status_display = serializers.CharField(
        source="get_status_display",
        read_only=True,
    )

    condition_display = serializers.CharField(
        source="get_condition_display",
        read_only=True,
    )

    class Meta:
        model = Vehicle

        fields = [
            "id",

            # Identification
            "brand",
            "model",
            "year",
            "registration_number",
            "vin",
            "color",

            # Caractéristiques
            "category",
            "category_display",
            "transmission",
            "transmission_display",
            "fuel_type",
            "fuel_type_display",
            "seats",
            "doors",
            "air_conditioning",

            # Tarification
            "daily_rate",
            "weekly_rate",
            "monthly_rate",
            "deposit",
            "unlimited_mileage",

            # Etat
            "status",
            "status_display",
            "condition",
            "condition_display",
            "mileage",
            "last_maintenance_date",
            "next_maintenance_date",

            # Contenu
            "description",

            # Relations
            "images",
            "vehicle_equipments",

            # Audit
            "created_by",
            "created_by_email",
            "created_at",
            "updated_at",

            # Helpers
            "display_name",
            "full_name",
        ]

        read_only_fields = [
            "id",
            "created_by",
            "created_by_email",
            "created_at",
            "updated_at",
            "display_name",
            "full_name",
            "status_display",
            "category_display",
            "transmission_display",
            "fuel_type_display",
            "condition_display",
        ]


# ============================================================
# VEHICLE — CREATION / MODIFICATION
# ============================================================

class VehicleCreateUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer de création et modification.

    Les équipements sont gérés via `equipment_ids`.

    La validation globale tient compte des valeurs
    existantes lors d'un PATCH.
    """

    equipment_ids = serializers.ListField(
        child=serializers.UUIDField(),
        required=False,
        write_only=True,
        allow_empty=True,
    )

    class Meta:
        model = Vehicle

        fields = [
            # Identification
            "id",
            "brand",
            "model",
            "year",
            "registration_number",
            "vin",
            "color",

            # Caractéristiques
            "category",
            "transmission",
            "fuel_type",
            "seats",
            "doors",
            "air_conditioning",

            # Tarification
            "daily_rate",
            "weekly_rate",
            "monthly_rate",
            "deposit",
            "unlimited_mileage",

            # Etat
            "status",
            "condition",
            "mileage",
            "last_maintenance_date",
            "next_maintenance_date",

            # Contenu
            "description",

            # Equipements
            "equipment_ids",

            # Dates
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
        ]

    # ========================================================
    # IDENTIFICATION
    # ========================================================

    def validate_brand(self, value: str) -> str:
        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                _("La marque est obligatoire.")
            )

        return value

    def validate_model(self, value: str) -> str:
        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                _("Le modèle est obligatoire.")
            )

        return value

    def validate_registration_number(
        self,
        value: str,
    ) -> str:
        value = value.strip().upper()

        if not value:
            raise serializers.ValidationError(
                _("La plaque d'immatriculation est obligatoire.")
            )

        if not re.fullmatch(
            r"[A-Z0-9][A-Z0-9 ._-]*",
            value,
        ):
            raise serializers.ValidationError(
                _(
                    "La plaque d'immatriculation contient "
                    "des caractères invalides."
                )
            )

        return value

    def validate_vin(
        self,
        value: str | None,
    ) -> str | None:
        """
        VIN standard de 17 caractères.
        I, O et Q interdits.
        """

        if value is None:
            return None

        value = value.strip().upper()

        if not value:
            return None

        if len(value) != VIN_LENGTH:
            raise serializers.ValidationError(
                _(
                    "Le numéro VIN doit contenir exactement "
                    "17 caractères."
                )
            )

        if not re.fullmatch(
            r"[A-HJ-NPR-Z0-9]{17}",
            value,
        ):
            raise serializers.ValidationError(
                _(
                    "Le numéro VIN contient des caractères "
                    "invalides. Utilisez uniquement des lettres "
                    "et chiffres, sans I, O ou Q."
                )
            )

        return value

    def validate_color(
        self,
        value: str,
    ) -> str:
        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                _("La couleur ne peut pas être vide.")
            )

        return value

    # ========================================================
    # CARACTÉRISTIQUES
    # ========================================================

    def validate_year(self, value: int) -> int:
        current_year = date.today().year

        if value < MIN_VEHICLE_YEAR:
            raise serializers.ValidationError(
                _(
                    f"L'année doit être supérieure ou égale à "
                    f"{MIN_VEHICLE_YEAR}."
                )
            )

        if value > current_year + MAX_VEHICLE_YEAR_OFFSET:
            raise serializers.ValidationError(
                _(
                    "L'année du véhicule ne peut pas dépasser "
                    "l'année prochaine."
                )
            )

        return value

    def validate_seats(self, value: int) -> int:
        if not MIN_SEATS <= value <= MAX_SEATS:
            raise serializers.ValidationError(
                _(
                    f"Le nombre de places doit être compris "
                    f"entre {MIN_SEATS} et {MAX_SEATS}."
                )
            )

        return value

    def validate_doors(self, value: int) -> int:
        if not MIN_DOORS <= value <= MAX_DOORS:
            raise serializers.ValidationError(
                _(
                    f"Le nombre de portes doit être compris "
                    f"entre {MIN_DOORS} et {MAX_DOORS}."
                )
            )

        return value

    def validate_mileage(self, value: int) -> int:
        if value < 0:
            raise serializers.ValidationError(
                _("Le kilométrage ne peut pas être négatif.")
            )

        return value

    # ========================================================
    # TARIFICATION
    # ========================================================

    def validate_daily_rate(
        self,
        value: Decimal,
    ) -> Decimal:
        if value < Decimal("0.00"):
            raise serializers.ValidationError(
                _("Le tarif journalier ne peut pas être négatif.")
            )

        return value

    def validate_weekly_rate(
        self,
        value: Decimal | None,
    ) -> Decimal | None:
        if value is not None and value < Decimal("0.00"):
            raise serializers.ValidationError(
                _("Le tarif hebdomadaire ne peut pas être négatif.")
            )

        return value

    def validate_monthly_rate(
        self,
        value: Decimal | None,
    ) -> Decimal | None:
        if value is not None and value < Decimal("0.00"):
            raise serializers.ValidationError(
                _("Le tarif mensuel ne peut pas être négatif.")
            )

        return value

    def validate_deposit(
        self,
        value: Decimal,
    ) -> Decimal:
        if value < Decimal("0.00"):
            raise serializers.ValidationError(
                _("La caution ne peut pas être négative.")
            )

        return value

    # ========================================================
    # ÉQUIPEMENTS
    # ========================================================

    def validate_equipment_ids(
        self,
        value: list,
    ) -> list:
        """
        Vérifie :

        - UUID valides ;
        - absence de doublons ;
        - équipements existants ;
        - équipements actifs.
        """

        if not value:
            return value

        unique_ids = set(value)

        if len(unique_ids) != len(value):
            raise serializers.ValidationError(
                _(
                    "Un équipement ne peut être ajouté "
                    "qu'une seule fois."
                )
            )

        existing_ids = set(
            Equipment.objects.filter(
                id__in=unique_ids,
                is_active=True,
            ).values_list(
                "id",
                flat=True,
            )
        )

        missing_ids = unique_ids - existing_ids

        if missing_ids:
            raise serializers.ValidationError(
                _(
                    "Un ou plusieurs équipements sont invalides "
                    "ou inactifs."
                )
            )

        return value

    # ========================================================
    # VALIDATION GLOBALE
    # ========================================================

    def validate(
        self,
        attrs: dict[str, Any],
    ) -> dict[str, Any]:
        """
        Validation globale compatible avec CREATE, PUT et PATCH.
        """

        # ----------------------------------------------------
        # Valeurs existantes + valeurs nouvelles
        # ----------------------------------------------------

        year = get_existing_value(
            self,
            attrs,
            "year",
        )

        daily_rate = get_existing_value(
            self,
            attrs,
            "daily_rate",
        )

        weekly_rate = get_existing_value(
            self,
            attrs,
            "weekly_rate",
        )

        monthly_rate = get_existing_value(
            self,
            attrs,
            "monthly_rate",
        )

        last_date = get_existing_value(
            self,
            attrs,
            "last_maintenance_date",
        )

        next_date = get_existing_value(
            self,
            attrs,
            "next_maintenance_date",
        )

        mileage = get_existing_value(
            self,
            attrs,
            "mileage",
        )

        # ----------------------------------------------------
        # Année
        # ----------------------------------------------------

        if year is not None:
            current_year = date.today().year

            if year < MIN_VEHICLE_YEAR:
                raise serializers.ValidationError({
                    "year": _(
                        f"L'année doit être supérieure ou égale "
                        f"à {MIN_VEHICLE_YEAR}."
                    )
                })

            if year > current_year + 1:
                raise serializers.ValidationError({
                    "year": _(
                        "L'année du véhicule ne peut pas dépasser "
                        "l'année prochaine."
                    )
                })

        # ----------------------------------------------------
        # Maintenance
        # ----------------------------------------------------

        if last_date and last_date > date.today():
            raise serializers.ValidationError({
                "last_maintenance_date": _(
                    "La dernière maintenance ne peut pas être "
                    "dans le futur."
                )
            })

        if (
            last_date
            and next_date
            and next_date < last_date
        ):
            raise serializers.ValidationError({
                "next_maintenance_date": _(
                    "La prochaine maintenance ne peut pas être "
                    "antérieure à la dernière maintenance."
                )
            })

        # ----------------------------------------------------
        # Tarifs
        # ----------------------------------------------------

        if daily_rate is not None:
            if daily_rate < Decimal("0.00"):
                raise serializers.ValidationError({
                    "daily_rate": _(
                        "Le tarif journalier ne peut pas être négatif."
                    )
                })

        if weekly_rate is not None:
            if weekly_rate < Decimal("0.00"):
                raise serializers.ValidationError({
                    "weekly_rate": _(
                        "Le tarif hebdomadaire ne peut pas être négatif."
                    )
                })

            if (
                daily_rate is not None
                and weekly_rate
                > daily_rate * Decimal("7")
            ):
                raise serializers.ValidationError({
                    "weekly_rate": _(
                        "Le prix hebdomadaire ne peut pas "
                        "dépasser 7 fois le prix journalier."
                    )
                })

        if monthly_rate is not None:
            if monthly_rate < Decimal("0.00"):
                raise serializers.ValidationError({
                    "monthly_rate": _(
                        "Le tarif mensuel ne peut pas être négatif."
                    )
                })

            if (
                daily_rate is not None
                and monthly_rate
                > daily_rate * Decimal("30")
            ):
                raise serializers.ValidationError({
                    "monthly_rate": _(
                        "Le prix mensuel ne peut pas "
                        "dépasser 30 fois le prix journalier."
                    )
                })

        # ----------------------------------------------------
        # Cohérence tarifs
        # ----------------------------------------------------

        if (
            weekly_rate is not None
            and monthly_rate is not None
            and monthly_rate < weekly_rate
        ):
            raise serializers.ValidationError({
                "monthly_rate": _(
                    "Le tarif mensuel ne peut pas être inférieur "
                    "au tarif hebdomadaire."
                )
            })

        # ----------------------------------------------------
        # Kilométrage
        # ----------------------------------------------------

        if mileage is not None and mileage < 0:
            raise serializers.ValidationError({
                "mileage": _(
                    "Le kilométrage ne peut pas être négatif."
                )
            })

        return attrs

    # ========================================================
    # CREATE
    # ========================================================

    @transaction.atomic
    def create(
        self,
        validated_data: dict[str, Any],
    ) -> Vehicle:
        """
        Crée un véhicule et ses équipements.
        """

        equipment_ids = validated_data.pop(
            "equipment_ids",
            [],
        )

        request = self.context.get("request")

        if (
            request
            and request.user
            and request.user.is_authenticated
        ):
            validated_data["created_by"] = request.user

        try:
            vehicle = Vehicle.objects.create(
                **validated_data
            )

        except DjangoValidationError as exc:
            raise django_validation_to_drf(exc)

        self._set_equipments(
            vehicle,
            equipment_ids,
        )

        return vehicle

    # ========================================================
    # UPDATE
    # ========================================================

    @transaction.atomic
    def update(
        self,
        instance: Vehicle,
        validated_data: dict[str, Any],
    ) -> Vehicle:
        """
        Met à jour un véhicule.

        Si `equipment_ids` n'est pas fourni :
            → les équipements existants restent inchangés.

        Si `equipment_ids=[]` :
            → tous les équipements sont supprimés.
        """

        equipment_ids = validated_data.pop(
            "equipment_ids",
            None,
        )

        for attr, value in validated_data.items():
            setattr(
                instance,
                attr,
                value,
            )

        try:
            instance.save()

        except DjangoValidationError as exc:
            raise django_validation_to_drf(exc)

        if equipment_ids is not None:
            self._set_equipments(
                instance,
                equipment_ids,
            )

        return instance

    # ========================================================
    # EQUIPMENTS
    # ========================================================

    def _set_equipments(
        self,
        vehicle: Vehicle,
        equipment_ids: list,
    ) -> None:
        """
        Synchronise les équipements du véhicule.

        Cette méthode est exécutée dans une transaction.
        """

        if equipment_ids is None:
            return

        equipment_ids = list(
            dict.fromkeys(equipment_ids)
        )

        # Supprime les anciennes associations.
        VehicleEquipment.objects.filter(
            vehicle=vehicle,
        ).delete()

        if not equipment_ids:
            return

        equipments = list(
            Equipment.objects.filter(
                id__in=equipment_ids,
                is_active=True,
            )
        )

        # Sécurité supplémentaire.
        if len(equipments) != len(equipment_ids):
            raise serializers.ValidationError({
                "equipment_ids": _(
                    "Un ou plusieurs équipements sont "
                    "invalides ou inactifs."
                )
            })

        VehicleEquipment.objects.bulk_create(
            [
                VehicleEquipment(
                    vehicle=vehicle,
                    equipment=equipment,
                )
                for equipment in equipments
            ]
        )


# ============================================================
# VEHICLE STATUS
# ============================================================

class VehicleStatusSerializer(serializers.Serializer):
    """
    Serializer utilisé pour modifier le statut opérationnel.
    """

    status = serializers.ChoiceField(
        choices=VehicleStatus.choices,
    )


# ============================================================
# VEHICLE CONDITION
# ============================================================

class VehicleConditionSerializer(serializers.Serializer):
    """
    Serializer utilisé pour modifier l'état général.
    """

    condition = serializers.ChoiceField(
        choices=VehicleCondition.choices,
    )


# ============================================================
# VEHICLE — RESPONSE COMPLETE
# ============================================================

class VehicleResponseSerializer(
    VehicleDetailSerializer
):
    """
    Serializer de réponse complète après création
    ou modification d'un véhicule.
    """

    pass