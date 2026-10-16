
from decimal import Decimal

from rest_framework import serializers

from payments.models import Paiement, PaymentMethod


class PaymentSerializer(serializers.ModelSerializer):
    """
    Serializer de lecture d'un paiement.

    Les données financières calculées par le backend sont
    exposées en lecture seule.
    """

    methode_display = serializers.CharField(
        source="get_methode_display",
        read_only=True,
    )

    statut_display = serializers.CharField(
        source="get_statut_display",
        read_only=True,
    )

    reservation_numero = serializers.CharField(
        source="reservation.numero",
        read_only=True,
    )

    montant_non_rembourse = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        read_only=True,
    )

    est_finalise = serializers.BooleanField(
        read_only=True,
    )

    est_remboursable = serializers.BooleanField(
        read_only=True,
    )

    class Meta:
        model = Paiement
        fields = (
            "uuid",
            "reference",
            "reservation",
            "reservation_numero",
            "montant",
            "devise",
            "taux_change",
            "montant_htg",
            "montant_rembourse",
            "montant_non_rembourse",
            "methode",
            "methode_display",
            "statut",
            "statut_display",
            "date_paiement",
            "created_at",
            "updated_at",
            "notes",
            "enregistre_par",
            "est_finalise",
            "est_remboursable",
        )

        read_only_fields = (
            "uuid",
            "reference",
            "taux_change",
            "montant_htg",
            "montant_rembourse",
            "statut",
            "date_paiement",
            "created_at",
            "updated_at",
            "enregistre_par",
            "est_finalise",
            "est_remboursable",
            "montant_non_rembourse",
        )


class PaymentCreateSerializer(serializers.Serializer):
    """
    Création d'un paiement.

    Le paiement est toujours créé avec le statut PENDING.

    Le frontend fournit uniquement les informations nécessaires
    à la demande de paiement.

    Le backend calcule :
        - le taux de change ;
        - le montant équivalent en HTG ;
        - le montant restant ;
        - la validité financière du paiement.

    Le frontend ne peut pas fournir :
        - statut ;
        - date_paiement ;
        - montant_rembourse ;
        - taux_change ;
        - montant_htg ;
        - created_at ;
        - updated_at ;
        - enregistre_par.
    """

    reservation = serializers.UUIDField()

    montant = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        min_value=Decimal("0.01"),
    )

    methode = serializers.ChoiceField(
        choices=PaymentMethod.choices,
    )

    devise = serializers.ChoiceField(
        choices=(
            ("HTG", "Gourde haïtienne"),
            ("USD", "Dollar américain"),
        ),
        required=True,
    )

    reference = serializers.CharField(
        max_length=100,
        required=False,
        allow_blank=True,
    )

    notes = serializers.CharField(
        required=False,
        allow_blank=True,
    )

    def validate_devise(self, value: str) -> str:
        """
        Normalise la devise avant transmission au service métier.
        """

        return value.upper().strip()

    def validate(self, attrs):
        """
        Validation légère avant transmission au service métier.

        Règles de devise :
            - CASH     : HTG ou USD
            - MONCASH  : HTG uniquement
            - NATCASH  : HTG uniquement

        La validation financière définitive et les opérations
        de paiement sont effectuées par PaymentService.
        """

        montant = attrs.get("montant")
        methode = attrs.get("methode")
        devise = attrs.get("devise")

        if montant is None or montant <= Decimal("0.00"):
            raise serializers.ValidationError(
                {
                    "montant": (
                        "Le montant doit être supérieur à zéro."
                    )
                }
            )

        if methode in (
            PaymentMethod.MONCASH,
            PaymentMethod.NATCASH,
        ) and devise != "HTG":
            raise serializers.ValidationError(
                {
                    "devise": (
                        "Les paiements MonCash et NatCash "
                        "doivent être effectués en HTG."
                    )
                }
            )

        return attrs


class PaymentConfirmSerializer(serializers.Serializer):
    """
    Confirmation d'un paiement PENDING.

    Le statut et la date de paiement sont déterminés
    exclusivement par le backend.
    """

    reference = serializers.CharField(
        max_length=100,
        required=False,
        allow_blank=True,
    )

    def validate(self, attrs):
        reference = attrs.get("reference")

        if reference == "":
            attrs["reference"] = None

        return attrs


class PaymentRefundSerializer(serializers.Serializer):
    """
    Demande de remboursement total ou partiel.

    Si montant n'est pas fourni :
    le backend rembourse automatiquement
    le montant encore remboursable.
    """

    montant = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        min_value=Decimal("0.01"),
        required=False,
    )

    notes = serializers.CharField(
        required=False,
        allow_blank=True,
    )

    def validate_montant(self, value):
        if value <= Decimal("0.00"):
            raise serializers.ValidationError(
                "Le montant doit être supérieur à zéro."
            )

        return value

class PaymentSummarySerializer(serializers.Serializer):
    devise = serializers.CharField()
    montant_total = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
    )
    montant_paye = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
    )
    montant_restant = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
    )
    est_entierement_paye = serializers.BooleanField()