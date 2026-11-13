
from rest_framework import serializers

from .models import FormatRapport, PlanificationRapport, RapportGenere, TypeRapport


class PeriodeRapportSerializer(serializers.Serializer):
    date_debut = serializers.DateField(required=False)
    date_fin = serializers.DateField(required=False)

    def validate(self, attrs):
        debut = attrs.get("date_debut")
        fin = attrs.get("date_fin")

        if debut and fin and debut > fin:
            raise serializers.ValidationError({
                "date_fin": "La date de fin doit être postérieure ou égale à la date de début."
            })

        return attrs


class PlanificationRapportSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlanificationRapport
        fields = (
            "id",
            "type_rapport",
            "frequence",
            "jour",
            "heure",
            "format_pdf",
            "format_excel",
            "destinataires",
            "actif",
            "prochaine_execution",
            "derniere_execution",
            "cree_par",
            "cree_le",
            "modifie_le",
           
        )
        read_only_fields = (
            "id",
            "prochaine_execution",
            "derniere_execution",
            "cree_par",
           "cree_le",
           "modifie_le",
        )

    def validate(self, attrs):
        instance = self.instance

        frequence = attrs.get(
            "frequence",
            getattr(instance, "frequence", None),
        )
        jour = attrs.get("jour", getattr(instance, "jour", None))
        format_pdf = attrs.get(
            "format_pdf",
            getattr(instance, "format_pdf", False),
        )
        format_excel = attrs.get(
            "format_excel",
            getattr(instance, "format_excel", False),
        )
        destinataires = attrs.get(
            "destinataires",
            getattr(instance, "destinataires", []),
        )

        if not format_pdf and not format_excel:
            raise serializers.ValidationError(
                "Sélectionne au moins un format : PDF ou Excel."
            )

        if frequence == "HEBDOMADAIRE" and jour is None:
            raise serializers.ValidationError({
                "jour": "Le jour de la semaine est obligatoire pour une fréquence hebdomadaire."
            })

        if frequence == "MENSUELLE" and jour is None:
            raise serializers.ValidationError({
                "jour": "Le jour du mois est obligatoire pour une fréquence mensuelle."
            })

        if not isinstance(destinataires, list):
            raise serializers.ValidationError({
                "destinataires": "Cette valeur doit être une liste d'adresses e-mail."
            })

        for adresse in destinataires:
            if not isinstance(adresse, str) or not serializers.EmailField().run_validation(adresse):
                raise serializers.ValidationError({
                    "destinataires": "Chaque destinataire doit être une adresse e-mail valide."
                })

        return attrs


class RapportGenereSerializer(serializers.ModelSerializer):
    class Meta:
        model = RapportGenere
        fields = (
            "id",
            "type_rapport",
            "format_rapport",
            "date_debut",
            "date_fin",
            "statut",
            "fichier",
            "auteur",
            "planification",
            "erreur",
            "cree_le",
            "termine_le",
        )
        read_only_fields = fields


class DemandeGenerationRapportSerializer(PeriodeRapportSerializer):
    type_rapport = serializers.ChoiceField(choices=TypeRapport.choices)
    format_rapport = serializers.ChoiceField(choices=FormatRapport.choices)
