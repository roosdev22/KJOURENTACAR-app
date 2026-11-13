
from django.db import transaction
from rest_framework.exceptions import ValidationError

from .models import HistoriqueParametre, ParametresEntreprise


class ParametresEntrepriseService:
    """
    Service métier pour la configuration de l'entreprise.

    Toute modification passe par ce service afin de conserver
    un historique des valeurs avant et après chaque changement.
    """

    CHAMPS_MODIFIABLES = (
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
    )

    @classmethod
    @transaction.atomic
    def obtenir_ou_creer(cls, utilisateur=None):
        """
        Retourne la configuration principale.

        Si elle n'existe pas, crée la configuration par défaut
        et journalise sa création.
        """
        parametres, cree = ParametresEntreprise.objects.get_or_create(
            cle="principal",
        )

        if cree:
            HistoriqueParametre.objects.create(
                utilisateur=utilisateur,
                action=HistoriqueParametre.Action.CREATION,
                modele="ParametresEntreprise",
                objet_id=str(parametres.pk),
                description="Création de la configuration principale.",
                justification="Initialisation de la configuration.",
                anciennes_valeurs={},
                nouvelles_valeurs=cls._valeurs(parametres),
            )

        return parametres

    @classmethod
    @transaction.atomic
    def modifier(cls, *, donnees, utilisateur, justification):
        """
        Modifie la configuration et enregistre les changements
        dans l'historique au sein d'une transaction atomique.
        """
        if not justification or not justification.strip():
            raise ValidationError({
                "justification": (
                    "Un motif est obligatoire pour modifier les paramètres."
                )
            })

        champs_interdits = set(donnees) - set(cls.CHAMPS_MODIFIABLES)
        if champs_interdits:
            raise ValidationError({
                "detail": (
                    "Champs non modifiables : "
                    + ", ".join(sorted(champs_interdits))
                )
            })

        parametres = (
            ParametresEntreprise.objects
            .select_for_update()
            .filter(cle="principal")
            .first()
        )

        if parametres is None:
            raise ValidationError(
                "La configuration principale n'existe pas."
            )

        anciennes_valeurs = {}
        nouvelles_valeurs = {}

        for champ in cls.CHAMPS_MODIFIABLES:
            if champ not in donnees:
                continue

            ancienne_valeur = getattr(parametres, champ)
            nouvelle_valeur = donnees[champ]

            if ancienne_valeur != nouvelle_valeur:
                anciennes_valeurs[champ] = ancienne_valeur
                nouvelles_valeurs[champ] = nouvelle_valeur

        if not nouvelles_valeurs:
            return parametres, False

        for champ, valeur in nouvelles_valeurs.items():
            setattr(parametres, champ, valeur)

        parametres.modifie_par = utilisateur

        # save() applique full_clean() au modèle.
        parametres.save()

        HistoriqueParametre.objects.create(
            utilisateur=utilisateur,
            action=HistoriqueParametre.Action.MODIFICATION,
            modele="ParametresEntreprise",
            objet_id=str(parametres.pk),
            description="Modification des paramètres de l'entreprise.",
            justification=justification.strip(),
            anciennes_valeurs=anciennes_valeurs,
            nouvelles_valeurs={
                champ: getattr(parametres, champ)
                for champ in nouvelles_valeurs
            },
        )

        return parametres, True

    @classmethod
    def _valeurs(cls, parametres):
        """Retourne uniquement les champs métier à historiser."""
        return {
            champ: getattr(parametres, champ)
            for champ in cls.CHAMPS_MODIFIABLES
        }
