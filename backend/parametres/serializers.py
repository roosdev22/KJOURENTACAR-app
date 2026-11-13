
from rest_framework import serializers

from .models import HistoriqueParametre, ParametresEntreprise
from .services import ParametresEntrepriseService


class ParametresEntrepriseSerializer(serializers.ModelSerializer):
    class Meta:
        model = ParametresEntreprise
        fields = (
            "id",
            "raison_sociale",
            "nom_commercial",
            "nif",
            "patente",
            "adresse",
            "telephone",
            "email",
            "site_web",
            "devise_defaut",
            "prefixe_reservation",
            "prefixe_facture",
            "prefixe_contrat",
            "modifie_par",
            "cree_le",
            "modifie_le",
        )
        read_only_fields = (
            "id",
            "modifie_par",
            "cree_le",
            "modifie_le",
        )


class ModifierParametresEntrepriseSerializer(
    serializers.ModelSerializer
):
    justification = serializers.CharField(
        write_only=True,
        trim_whitespace=True,
        max_length=2000,
        required=True,
    )

    class Meta:
        model = ParametresEntreprise
        fields = (
            "raison_sociale",
            "nom_commercial",
            "nif",
            "patente",
            "adresse",
            "telephone",
            "email",
            "site_web",
            "devise_defaut",
            "prefixe_reservation",
            "prefixe_facture",
            "prefixe_contrat",
            "justification",
        )

    def validate_justification(self, value):
        if not value.strip():
            raise serializers.ValidationError(
                "Le motif de modification est obligatoire."
            )
        return value.strip()

    def update(self, instance, validated_data):
        justification = validated_data.pop("justification")
        utilisateur = self.context["request"].user

        parametres, _ = ParametresEntrepriseService.modifier(
            donnees=validated_data,
            utilisateur=utilisateur,
            justification=justification,
        )
        return parametres


class HistoriqueParametreSerializer(serializers.ModelSerializer):
    utilisateur_nom = serializers.SerializerMethodField()

    class Meta:
        model = HistoriqueParametre
        fields = (
            "id",
            "utilisateur",
            "utilisateur_nom",
            "action",
            "modele",
            "objet_id",
            "description",
            "justification",
            "anciennes_valeurs",
            "nouvelles_valeurs",
            "date_action",
        )
        read_only_fields = fields

    def get_utilisateur_nom(self, obj):
        if not obj.utilisateur:
            return None

        return (
            obj.utilisateur.get_full_name()
            or obj.utilisateur.get_username()
        )
