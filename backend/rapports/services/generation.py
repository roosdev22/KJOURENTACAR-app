import logging
from datetime import date
from pathlib import Path

from django.core.files.base import ContentFile
from django.db import transaction
from django.utils import timezone

from rapports.models import RapportGenere, TypeRapport, FormatRapport
from rapports.services.agregations import (
    rapport_financier,
    rapport_reservations,
    rapport_vehicules,
    rapport_contrats,
    rapport_maintenance,
)
from rapports.services.pdf import generer_pdf
from rapports.services.excel import generer_excel

logger = logging.getLogger(__name__)

AGREGATIONS = {
    TypeRapport.FINANCIER: rapport_financier,
    TypeRapport.RESERVATIONS: rapport_reservations,
    TypeRapport.VEHICULES: rapport_vehicules,
    TypeRapport.CONTRATS: rapport_contrats,
    TypeRapport.MAINTENANCE: rapport_maintenance,
}


def generer_rapport(*, type_rapport, format_rapport, date_debut, date_fin,
                    auteur=None, planification=None):
    """
    Génère un rapport, conserve son historique et stocke le fichier
    dans le stockage privé configuré sur RapportGenere.fichier.
    """
    if type_rapport not in AGREGATIONS:
        raise ValueError("Le type de rapport demandé est invalide.")

    if format_rapport not in (FormatRapport.PDF, FormatRapport.EXCEL):
        raise ValueError("Le format demandé doit être PDF ou EXCEL.")

    if date_debut > date_fin:
        raise ValueError(
            "La date de début doit être antérieure ou égale à la date de fin."
        )

    rapport = RapportGenere.objects.create(
        type_rapport=type_rapport,
        format_rapport=format_rapport,
        date_debut=date_debut,
        date_fin=date_fin,
        auteur=auteur,
        planification=planification,
        statut=RapportGenere.StatutRapport.EN_COURS,
    )

    try:
        fonction = AGREGATIONS[type_rapport]

        if type_rapport == TypeRapport.VEHICULES:
            donnees = fonction()
        else:
            donnees = fonction(
                date_debut=date_debut,
                date_fin=date_fin,
            )

        if format_rapport == FormatRapport.PDF:
            contenu = generer_pdf(
                type_rapport, donnees, date_debut, date_fin
            )
            extension = "pdf"
            mime_type = "application/pdf"
        else:
            contenu = generer_excel(
                type_rapport, donnees, date_debut, date_fin
            )
            extension = "xlsx"
            mime_type = (
                "application/vnd.openxmlformats-officedocument."
                "spreadsheetml.sheet"
            )

        nom_fichier = (
            f"{type_rapport.lower()}_{date_debut:%Y%m%d}_"
            f"{date_fin:%Y%m%d}_{rapport.id}.{extension}"
        )

        with transaction.atomic():
            rapport.fichier.save(
                nom_fichier,
                ContentFile(contenu),
                save=False,
            )
            rapport.statut = RapportGenere.StatutRapport.TERMINE
            rapport.termine_le = timezone.now()
            rapport.erreur = ""
            rapport.save(
                update_fields=[
                    "fichier",
                    "statut",
                    "termine_le",
                    "erreur",
                ]
            )

        return rapport

    except Exception:
        logger.exception(
            "Échec de génération du rapport %s (type=%s, format=%s)",
            rapport.pk,
            type_rapport,
            format_rapport,
        )
        rapport.statut = RapportGenere.StatutRapport.ECHEC
        rapport.erreur = (
            "La génération a échoué. Consultez les journaux du serveur."
        )
        rapport.termine_le = timezone.now()
        rapport.save(
            update_fields=["statut", "erreur", "termine_le"]
        )
        raise