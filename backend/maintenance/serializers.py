
from django.utils.translation import gettext_lazy as _
from rest_framework import serializers

from .models import Maintenance, MaintenanceStatus


class MaintenanceSerializer(serializers.ModelSerializer):
    vehicle_display = serializers.CharField(
        source="vehicle.full_name",
        read_only=True,
    )

    created_by_display = serializers.CharField(
        source="created_by.get_full_name",
        read_only=True,
        default="",
    )

    class Meta:
        model = Maintenance
        fields = [
            "id",
            "vehicle",
            "vehicle_display",
            "maintenance_type",
            "title",
            "description",
            "status",
            "scheduled_date",
            "started_at",
            "completed_at",
            "mileage",
            "cost",
            "provider",
            "notes",
            "created_by",
            "created_by_display",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "status",
            "started_at",
            "completed_at",
            "created_by",
            "created_at",
            "updated_at",
        ]

    def validate_title(self, value):
        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                _("Le titre de la maintenance est obligatoire.")
            )

        return value

    def validate_provider(self, value):
        return value.strip()

    def validate(self, attrs):
        instance = self.instance

        if instance and instance.status != MaintenanceStatus.PLANNED:
            raise serializers.ValidationError(
                _(
                    "Seule une maintenance planifiée peut être modifiée. "
                    "Utilisez les actions métier pour changer son statut."
                )
            )

        scheduled_date = attrs.get(
            "scheduled_date",
            getattr(instance, "scheduled_date", None),
        )

        if scheduled_date is None:
            raise serializers.ValidationError({
                "scheduled_date": _("La date prévue est obligatoire.")
            })

        return attrs
