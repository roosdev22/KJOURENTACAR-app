
from rest_framework import serializers

from facturation.models import Facture


class FactureSerializer(serializers.ModelSerializer):
    reservation_id = serializers.UUIDField(
        source="reservation.id",
        read_only=True,
    )
    creee_par_id = serializers.UUIDField(read_only=True)
    annulee_par_id = serializers.UUIDField(read_only=True)

    class Meta:
        model = Facture
        fields = [
            "id",
            "reference",
            "reservation_id",
            "statut",
            "devise",
            "montant_location",
            "montant_caution",
            "emise_le",
            "creee_par_id",
            "motif_annulation",
            "annulee_le",
            "annulee_par_id",
        ]
        read_only_fields = fields


class CreerFactureSerializer(serializers.Serializer):
    reservation_id = serializers.UUIDField(required=True)
