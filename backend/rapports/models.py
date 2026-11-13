import uuid
from datetime import datetime, time, timedelta
from zoneinfo import ZoneInfo

from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.files.storage import FileSystemStorage
from django.core.validators import (
    MaxValueValidator,
    MinValueValidator,
    validate_email,
)
from django.db import models
from django.utils import timezone
from simple_history.models import HistoricalRecords


# ============================================================
# STOCKAGE PRIVÉ
# ============================================================

def stockage_prive():
    """
    Stockage hors de MEDIA_ROOT : les rapports contiennent des données
    financières et ne doivent jamais être servis par une URL publique.

    C'est une fonction (et non une instance) pour que le chemin absolu
    ne soit pas figé dans les fichiers de migration : il reste lu depuis
    settings.PRIVATE_MEDIA_ROOT, donc identique en local et dans Docker.
    """
    return FileSystemStorage(location=settings.PRIVATE_MEDIA_ROOT)


# ============================================================
# CHOIX PARTAGÉS (une seule définition)
# ============================================================

class TypeRapport(models.TextChoices):
    FINANCIER = "FINANCIER", "Financier"
    RESERVATIONS = "RESERVATIONS", "Réservations"
    VEHICULES = "VEHICULES", "Véhicules"
    CONTRATS = "CONTRATS", "Contrats"
    MAINTENANCE = "MAINTENANCE", "Maintenance"


class FormatRapport(models.TextChoices):
    PDF = "PDF", "PDF"
    EXCEL = "EXCEL", "Excel"


# ============================================================
# PLANIFICATION
# ============================================================

class PlanificationRapport(models.Model):
    """
    Configuration d'une génération automatique.

    Convention des jours :
      - HEBDOMADAIRE : 1 = lundi ... 7 = dimanche (isoweekday)
      - MENSUELLE    : 1 à 28 (évite les mois courts : pas de 31 février)
      - QUOTIDIENNE  : jour non utilisé (NULL)

    L'heure est toujours interprétée dans le fuseau settings.TIME_ZONE
    (America/Port-au-Prince).
    """

    class Frequence(models.TextChoices):
        QUOTIDIENNE = "QUOTIDIENNE", "Quotidienne"
        HEBDOMADAIRE = "HEBDOMADAIRE", "Hebdomadaire"
        MENSUELLE = "MENSUELLE", "Mensuelle"

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    type_rapport = models.CharField(
        max_length=20,
        choices=TypeRapport.choices,
        default=TypeRapport.FINANCIER,
    )

    frequence = models.CharField(
        max_length=15,
        choices=Frequence.choices,
        default=Frequence.MENSUELLE,
    )

    jour = models.PositiveSmallIntegerField(
        null=True,
        blank=True,
        default=1,
        validators=[MinValueValidator(1), MaxValueValidator(28)],
        help_text=(
            "Hebdomadaire : 1 (lundi) à 7 (dimanche). "
            "Mensuelle : 1 à 28. Ignoré si quotidienne."
        ),
    )

    heure = models.TimeField(
        default=time(7, 0),
        help_text="Heure locale (America/Port-au-Prince).",
    )

    format_pdf = models.BooleanField(default=True)
    format_excel = models.BooleanField(default=False)

    destinataires = models.JSONField(default=list, blank=True)

    actif = models.BooleanField(default=True)

    prochaine_execution = models.DateTimeField(null=True, blank=True)
    derniere_execution = models.DateTimeField(null=True, blank=True)

    cree_par = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="planifications_rapports_creees",
    )

    cree_le = models.DateTimeField(auto_now_add=True)
    modifie_le = models.DateTimeField(auto_now=True)

    # Les planifications sont de la configuration modifiable :
    # on garde qui a changé quoi et quand.
    history = HistoricalRecords()

    class Meta:
        ordering = ["type_rapport", "frequence", "heure"]
        indexes = [
            # Index de la requête de Celery Beat :
            # actif=True AND prochaine_execution <= maintenant
            models.Index(
                fields=["actif", "prochaine_execution"],
                name="planif_actif_prochaine_idx",
            ),
        ]
        constraints = [
            models.CheckConstraint(
                check=(
                    models.Q(format_pdf=True)
                    | models.Q(format_excel=True)
                ),
                name="planif_au_moins_un_format",
            ),
            models.CheckConstraint(
                check=(
                    models.Q(frequence="QUOTIDIENNE", jour__isnull=True)
                    | models.Q(
                        frequence="HEBDOMADAIRE",
                        jour__gte=1,
                        jour__lte=7,
                    )
                    | models.Q(
                        frequence="MENSUELLE",
                        jour__gte=1,
                        jour__lte=28,
                    )
                ),
                name="planif_jour_coherent",
            ),
        ]

    # --------------------------------------------------------
    # Validation
    # --------------------------------------------------------
    # ATTENTION : clean() n'est PAS appelée automatiquement par DRF.
    # Le serializer doit appeler instance.full_clean() (voir
    # l'exemple fourni avec ce fichier), sinon une requête POST
    # contourne ces règles et tombe sur les contraintes SQL.

    def clean(self):
        if self.frequence == self.Frequence.QUOTIDIENNE:
            self.jour = None
        elif self.jour is None:
            raise ValidationError(
                {"jour": "Le jour est obligatoire pour cette fréquence."}
            )
        elif (
            self.frequence == self.Frequence.HEBDOMADAIRE
            and not 1 <= self.jour <= 7
        ):
            raise ValidationError(
                {
                    "jour": (
                        "Pour une fréquence hebdomadaire, le jour doit "
                        "être compris entre 1 (lundi) et 7 (dimanche)."
                    )
                }
            )
        elif (
            self.frequence == self.Frequence.MENSUELLE
            and not 1 <= self.jour <= 28
        ):
            raise ValidationError(
                {
                    "jour": (
                        "Pour une fréquence mensuelle, le jour doit être "
                        "compris entre 1 et 28."
                    )
                }
            )

        if not self.format_pdf and not self.format_excel:
            raise ValidationError(
                "Sélectionnez au moins un format PDF ou Excel."
            )

        if not isinstance(self.destinataires, list):
            raise ValidationError(
                {"destinataires": "Les destinataires doivent être une liste."}
            )

        for adresse in self.destinataires:
            try:
                validate_email(adresse)
            except ValidationError:
                raise ValidationError(
                    {"destinataires": f"Adresse e-mail invalide : {adresse}"}
                )

    # --------------------------------------------------------
    # Calcul de la prochaine exécution
    # --------------------------------------------------------

    def calculer_prochaine_execution(self, apres=None):
        """
        Retourne le prochain datetime (aware) strictement postérieur à
        `apres` (par défaut : maintenant) correspondant à la planification.

        On parcourt les jours un à un (62 maximum) et on garde le premier
        qui correspond : c'est moins élégant qu'un calcul direct, mais
        sans cas particulier (changement de mois, d'année, d'heure d'été)
        et donc plus facile à relire et à tester.
        """
        if not self.actif:
            return None

        fuseau = ZoneInfo(settings.TIME_ZONE)
        reference = (apres or timezone.now()).astimezone(fuseau)

        for decalage in range(62):
            jour_candidat = reference.date() + timedelta(days=decalage)

            if self.frequence == self.Frequence.HEBDOMADAIRE:
                if jour_candidat.isoweekday() != self.jour:
                    continue
            elif self.frequence == self.Frequence.MENSUELLE:
                if jour_candidat.day != self.jour:
                    continue
            # QUOTIDIENNE : tous les jours conviennent

            candidat = datetime.combine(
                jour_candidat, self.heure, tzinfo=fuseau
            )
            if candidat > reference:
                return candidat

        return None

    def marquer_executee(self, quand=None):
        """
        À appeler par la tâche Celery après chaque exécution.
        Met à jour derniere_execution et recalcule prochaine_execution
        sans toucher aux autres champs.
        """
        quand = quand or timezone.now()
        self.derniere_execution = quand
        self.prochaine_execution = self.calculer_prochaine_execution(
            apres=quand
        )
        self.save(
            update_fields=[
                "derniere_execution",
                "prochaine_execution",
                "modifie_le",
            ]
        )

    def save(self, *args, **kwargs):
        # Sauvegarde complète (création, modification depuis l'API ou
        # l'admin) : on normalise et on recalcule l'échéance.
        # Sauvegarde partielle (update_fields) : on n'y touche pas, pour
        # ne pas décaler une exécution due.
        if kwargs.get("update_fields") is None:
            if self.frequence == self.Frequence.QUOTIDIENNE:
                self.jour = None
            self.prochaine_execution = self.calculer_prochaine_execution()
        super().save(*args, **kwargs)

    def __str__(self):
        return (
            f"{self.get_type_rapport_display()} - "
            f"{self.get_frequence_display()}"
        )


# ============================================================
# RAPPORT GÉNÉRÉ
# ============================================================

class RapportGenere(models.Model):
    """
    Journal des rapports : un enregistrement par fichier produit,
    qu'il soit demandé à la main ou par une planification.
    """

    class StatutRapport(models.TextChoices):
        EN_ATTENTE = "EN_ATTENTE", "En attente"
        EN_COURS = "EN_COURS", "En cours"
        TERMINE = "TERMINE", "Terminé"
        ECHEC = "ECHEC", "Échec"

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    type_rapport = models.CharField(
        max_length=20,
        choices=TypeRapport.choices,
        db_index=True,
    )

    format_rapport = models.CharField(
        max_length=10,
        choices=FormatRapport.choices,
    )

    date_debut = models.DateField()
    date_fin = models.DateField()

    statut = models.CharField(
        max_length=15,
        choices=StatutRapport.choices,
        default=StatutRapport.EN_ATTENTE,
        db_index=True,
    )

    fichier = models.FileField(
        upload_to="rapports/%Y/%m/",
        storage=stockage_prive,
        blank=True,
    )

    # NULL = généré par le système (planification). PROTECT conservé :
    # pour l'audit, on désactive un compte au lieu de le supprimer.
    auteur = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="rapports_generes",
    )

    # NULL = demandé manuellement.
    planification = models.ForeignKey(
        PlanificationRapport,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="rapports_generes",
    )

    # Message court destiné à l'utilisateur. La trace complète de
    # l'exception va dans les logs, jamais ici (chemins, requêtes SQL).
    erreur = models.CharField(max_length=255, blank=True)

    cree_le = models.DateTimeField(auto_now_add=True, db_index=True)
    termine_le = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-cree_le"]
        indexes = [
            models.Index(
                fields=["type_rapport", "date_debut", "date_fin"],
                name="rapport_type_periode_idx",
            ),
        ]
        constraints = [
            models.CheckConstraint(
                check=models.Q(date_fin__gte=models.F("date_debut")),
                name="rapport_periode_valide",
            ),
        ]

    def clean(self):
        if self.date_debut and self.date_fin and self.date_fin < self.date_debut:
            raise ValidationError(
                {"date_fin": "La date de fin doit être postérieure au début."}
            )

    def __str__(self):
        return (
            f"{self.get_type_rapport_display()} "
            f"({self.date_debut} - {self.date_fin})"
        )