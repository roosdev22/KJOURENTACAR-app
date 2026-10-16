# apps/reservations/models.py

import random
import uuid
from decimal import Decimal
from typing import TYPE_CHECKING

from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator
from django.db import models
from django.db.models import F, Q
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from payments.models import PaymentStatus
from simple_history.models import HistoricalRecords

from users.models import RoleChoices


if TYPE_CHECKING:
    from vehicles.models import Vehicle
    from users.models import User


# ============================================================
# CONSTANTES MÉTIER
# ============================================================

MIN_RENTAL_DAYS = 1


# Rôles autorisés à effectuer les opérations administratives
# sur une réservation.
STAFF_ROLES = {
    RoleChoices.AGENT,
    RoleChoices.GESTIONNAIRE,
    RoleChoices.ADMIN,
    RoleChoices.SUPER_ADMIN,
}


# ============================================================
# CHOIX — STATUT RÉSERVATION
# ============================================================

class ReservationStatus(models.TextChoices):
    """
    Machine à états de la réservation.

    Flux client :

        PENDING_VERIFICATION
                ↓
             paiement
                ↓
        vérification agent
           ↙          ↘
      CONFIRMED      CANCELLED

    Expiration automatique :

        PENDING_VERIFICATION
                ↓
          date de début atteinte
                ↓
             EXPIRED

    Cycle de location :

        CONFIRMED → EN_COURS → TERMINEE

    Une réservation EXPIRED ne peut plus être payée
    ni confirmée.

    Le remboursement éventuel est géré par Payment.
    """

    PENDING_VERIFICATION = (
        "PENDING_VERIFICATION",
        _("En attente de vérification"),
    )

    CONFIRMED = (
        "CONFIRMED",
        _("Confirmée"),
    )

    CANCELLED = (
        "CANCELLED",
        _("Annulée"),
    )

    EN_COURS = (
        "EN_COURS",
        _("En cours"),
    )

    TERMINEE = (
        "TERMINEE",
        _("Terminée"),
    )

    EXPIRED = (
        "EXPIRED",
        _("Expirée"),
    )
# ============================================================
# CHOIX — SOURCE DE LA RÉSERVATION
# ============================================================

class ReservationSource(models.TextChoices):
    """
    Indique qui a créé la réservation.

    CLIENT :
        Réservation créée en ligne par le client.

    AGENT :
        Réservation créée directement par un membre du personnel.
    """

    CLIENT = (
        'CLIENT',
        _('En ligne par le client'),
    )

    AGENT = (
        'AGENT',
        _('En agence par un agent'),
    )


# ============================================================
# RESERVATION
# ============================================================

class Reservation(models.Model):
    """
    Demande de location soumise par un client.

    Une réservation peut contenir un ou plusieurs véhicules
    via LigneReservation.

    Flux client :

        PENDING_VERIFICATION
                ↓
             paiement
                ↓
        vérification agent
           ↙          ↘
      CONFIRMED     CANCELLED

    Flux agent :

        CONFIRMED directement
    """

    # ========================================================
    # IDENTIFICATION
    # ========================================================

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    numero = models.CharField(
        _('numéro de réservation'),
        max_length=20,
        unique=True,
        editable=False,
        db_index=True,
        help_text=_(
            'Généré automatiquement. '
            'Format : RES-YYYYMMDD-XXXX'
        ),
    )

    # ========================================================
    # RELATIONS
    # ========================================================

    client = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='reservations',
        verbose_name=_('client'),
        help_text=_(
            'Utilisateur possédant le rôle CLIENT.'
        ),
    )

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='reservations_creees',
        verbose_name=_('créée par'),
        help_text=_(
            'Le client lui-même si source=CLIENT, '
            'un membre du personnel si source=AGENT.'
        ),
    )

    validated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reservations_validees',
        verbose_name=_('validée par'),
        help_text=_(
            'Membre du personnel ayant confirmé ou annulé '
            'la réservation.'
        ),
    )

    # ========================================================
    # DATES
    # ========================================================

    date_debut = models.DateField(
        _('date de début'),
        db_index=True,
    )

    date_fin = models.DateField(
        _('date de fin'),
        db_index=True,
    )

    date_confirmation = models.DateTimeField(
        _('date de confirmation'),
        null=True,
        blank=True,
        help_text=_(
            'Renseignée lors de la confirmation.'
        ),
    )

    date_annulation = models.DateTimeField(
        _('date d’annulation'),
        null=True,
        blank=True,
        help_text=_(
            'Renseignée lors de l’annulation.'
        ),
    )

    # ========================================================
    # TARIFICATION
    # ========================================================

    nombre_jours = models.PositiveSmallIntegerField(
        _('nombre de jours'),
        editable=False,
        help_text=_(
            'Calculé automatiquement à partir '
            'des dates de début et de fin.'
        ),
    )

    montant_total = models.DecimalField(
        _('montant total'),
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[
            MinValueValidator(Decimal('0.00')),
        ],
        help_text=_(
            'Calculé à partir des lignes de réservation.'
        ),
    )

    caution_totale = models.DecimalField(
        _('caution totale'),
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[
            MinValueValidator(Decimal('0.00')),
        ],
        help_text=_(
            'Somme des cautions des lignes de réservation.'
        ),
    )

    # ========================================================
    # STATUT ET SOURCE
    # ========================================================

    statut = models.CharField(
        _('statut'),
        max_length=30,
        choices=ReservationStatus.choices,
        default=ReservationStatus.PENDING_VERIFICATION,
        db_index=True,
    )

    source = models.CharField(
        _('source'),
        max_length=10,
        choices=ReservationSource.choices,
        default=ReservationSource.CLIENT,
        db_index=True,
        help_text=_(
            'Indique l’origine de la réservation.'
        ),
    )

    # ========================================================
    # NOTES ET AUDIT
    # ========================================================

    notes_client = models.TextField(
        _('notes du client'),
        blank=True,
        help_text=_(
            'Demandes particulières du client.'
        ),
    )

    notes_agent = models.TextField(
        _('notes de l’agent'),
        blank=True,
        help_text=_(
            'Remarques internes non visibles par le client.'
        ),
    )

    motif_annulation = models.TextField(
        _('motif d’annulation'),
        blank=True,
        help_text=_(
            'Obligatoire lorsque la réservation est annulée.'
        ),
    )

    # ========================================================
    # TIMESTAMPS
    # ========================================================

    created_at = models.DateTimeField(
        _('créée le'),
        auto_now_add=True,
        db_index=True,
    )

    updated_at = models.DateTimeField(
        _('mise à jour le'),
        auto_now=True,
    )

    # ========================================================
    # HISTORIQUE
    # ========================================================

    history = HistoricalRecords(
        verbose_name=_('historique'),
        history_change_reason_field=models.TextField(
            null=True,
            blank=True,
        ),
    )

    # ========================================================
    # META
    # ========================================================

    class Meta:
        verbose_name = _('réservation')
        verbose_name_plural = _('réservations')

        ordering = ['-created_at']

        indexes = [
            models.Index(
                fields=['client', 'statut'],
                name='reservation_client_statut_idx',
            ),
            models.Index(
                fields=['statut', 'date_debut'],
                name='reservation_statut_debut_idx',
            ),
            models.Index(
                fields=['-created_at'],
                name='reservation_created_at_idx',
            ),
        ]

        constraints = [
            models.CheckConstraint(
                check=Q(
                    date_fin__gt=models.F('date_debut')
                ),
                name='reservation_date_fin_after_debut',
            ),

            models.CheckConstraint(
                check=Q(
                    montant_total__gte=Decimal('0.00')
                ),
                name='reservation_montant_total_positive',
            ),

            models.CheckConstraint(
                check=Q(
                    caution_totale__gte=Decimal('0.00')
                ),
                name='reservation_caution_positive',
            ),

            models.CheckConstraint(
                check=Q(
                    nombre_jours__gte=MIN_RENTAL_DAYS
                ),
                name='reservation_nombre_jours_min',
            ),
        ]

    # ========================================================
    # STRING
    # ========================================================

    def __str__(self) -> str:
        return (
            f'{self.numero} — '
            f'{self.client.get_full_name()} '
            f'({self.statut})'
        )

    # ========================================================
    # GÉNÉRATION DU NUMÉRO
    # ========================================================

    @staticmethod
    def _generer_numero() -> str:
        """
        Génère un numéro unique.

        Format :
            RES-YYYYMMDD-XXXX
        """

        date_str = timezone.now().strftime('%Y%m%d')

        while True:
            suffixe = str(
                random.randint(1, 9999)
            ).zfill(4)

            numero = (
                f'RES-{date_str}-{suffixe}'
            )

            if not Reservation.objects.filter(
                numero=numero
            ).exists():
                return numero

    # ========================================================
    # CALCUL DU MONTANT TOTAL
    # ========================================================

    def calculer_montant_total(self) -> Decimal:
        """
        Calcule le montant total à partir des lignes.
        """

        total = Decimal('0.00')

        for ligne in self.lignes.all():
            total += ligne.sous_total

        return total

    # ========================================================
    # CALCUL DE LA CAUTION
    # ========================================================

    def calculer_caution_totale(self) -> Decimal:
        """
        Calcule la caution totale.
        """

        total = Decimal('0.00')

        for ligne in self.lignes.all():
            total += ligne.caution_unitaire

        return total

    # ========================================================
    # RECALCUL DES TOTAUX
    # ========================================================

    def recalculer_totaux(self) -> None:
        """
        Recalcule et sauvegarde les totaux.

        Cette méthode doit être appelée après la création
        des lignes de réservation.
        """

        self.montant_total = (
            self.calculer_montant_total()
        )

        self.caution_totale = (
            self.calculer_caution_totale()
        )

        self.save(
            update_fields=[
                'montant_total',
                'caution_totale',
                'updated_at',
            ]
        )

    # ========================================================
    # VALIDATION MÉTIER
    # ========================================================

    def clean(self) -> None:
        errors = {}

        # ----------------------------------------------------
        # DATES
        # ----------------------------------------------------

        if self.date_debut and self.date_fin:

            if self.date_fin <= self.date_debut:
                errors['date_fin'] = _(
                    'La date de fin doit être postérieure '
                    'à la date de début.'
                )

            else:
                delta = (
                    self.date_fin - self.date_debut
                ).days

                if delta < MIN_RENTAL_DAYS:
                    errors['date_debut'] = _(
                        f'La durée minimale de location est '
                        f'de {MIN_RENTAL_DAYS} jour(s).'
                    )

        # Une nouvelle réservation ne peut pas commencer
        # dans le passé.
        if (
            self.date_debut
            and self.date_debut < timezone.now().date()
            and not self.pk
        ):
            errors['date_debut'] = _(
                'La date de début ne peut pas être '
                'dans le passé.'
            )

        # ----------------------------------------------------
        # MOTIF D'ANNULATION
        # ----------------------------------------------------

        if (
            self.statut == ReservationStatus.CANCELLED
            and not self.motif_annulation
        ):
            errors['motif_annulation'] = _(
                'Un motif est obligatoire pour '
                'annuler une réservation.'
            )

        # ----------------------------------------------------
        # DATE DE CONFIRMATION
        # ----------------------------------------------------

        if (
            self.statut == ReservationStatus.CONFIRMED
            and not self.date_confirmation
        ):
            errors['date_confirmation'] = _(
                'La date de confirmation est obligatoire '
                'lorsque le statut est CONFIRMED.'
            )

        # ----------------------------------------------------
        # DATE D'ANNULATION
        # ----------------------------------------------------

        if (
            self.statut == ReservationStatus.CANCELLED
            and not self.date_annulation
        ):
            errors['date_annulation'] = _(
                'La date d’annulation est obligatoire '
                'lorsque le statut est CANCELLED.'
            )

        # ----------------------------------------------------
        # CLIENT
        # ----------------------------------------------------

        if self.client_id:

            if self.client.role != RoleChoices.CLIENT:
                errors['client'] = _(
                    'L’utilisateur associé doit avoir '
                    'le rôle CLIENT.'
                )

        # ----------------------------------------------------
        # ÉLIGIBILITÉ DU CLIENT
        # ----------------------------------------------------

        if self.client_id and not self.pk:

            eligibility = (
                self.client.is_eligible_for_rental()
            )

            if not eligibility['eligible']:

                reasons = ', '.join(
                    str(reason)
                    for reason in eligibility['reasons']
                )

                errors['client'] = _(
                    'Le client n’est pas éligible à la '
                    f'location : {reasons}'
                )

        # ----------------------------------------------------
        # SOURCE / CREATED_BY
        # ----------------------------------------------------

        if self.created_by_id:

            if self.source == ReservationSource.CLIENT:

                if (
                    self.client_id
                    and self.created_by_id
                    != self.client_id
                ):
                    errors['created_by'] = _(
                        'Pour une réservation en ligne, '
                        'created_by doit être le client lui-même.'
                    )

            elif self.source == ReservationSource.AGENT:

                if (
                    self.created_by.role
                    not in STAFF_ROLES
                ):
                    errors['created_by'] = _(
                        'Pour une réservation en agence, '
                        'created_by doit être un membre '
                        'autorisé du personnel.'
                    )

        # ----------------------------------------------------
        # ERREURS
        # ----------------------------------------------------

        if errors:
            raise ValidationError(errors)

    # ========================================================
    # SAVE
    # ========================================================

    def save(self, *args, **kwargs) -> None:

        # Génération du numéro à la création.
        if not self.numero:
            self.numero = (
                self._generer_numero()
            )

        # Calcul de la durée.
        if self.date_debut and self.date_fin:
            self.nombre_jours = (
                self.date_fin - self.date_debut
            ).days

        self.full_clean()

        super().save(*args, **kwargs)

    # ========================================================
    # PROPRIÉTÉS
    # ========================================================

    @property
    def est_modifiable(self) -> bool:
        """
        Une réservation est modifiable uniquement
        lorsqu'elle est en attente de vérification.
        """

        return (
            self.statut
            == ReservationStatus.PENDING_VERIFICATION
        )

    @property
    def est_annulable(self) -> bool:
        """
        Une réservation en attente ou confirmée
        peut être annulée.
        """

        return self.statut in [
            ReservationStatus.PENDING_VERIFICATION,
            ReservationStatus.CONFIRMED,
        ]

    @property
    def paiement_reussi(self) -> bool:
        """
        Retourne True si au moins un paiement
        est réussi.
        """

        return self.paiements.filter(
            statut='SUCCEEDED'
        ).exists()

    # ========================================================
    # CONFIRMER
    # ========================================================
    def confirmer(self, agent) -> None:
        """
        Confirme une réservation.

        Cette méthode applique uniquement les invariants
        directement liés à l'objet Reservation.

        Les vérifications complexes concernant :
        - les conflits de véhicules ;
        - le verrouillage des ressources ;
        - la disponibilité temporelle ;
        - les paiements ;
        - l'éligibilité détaillée du client ;

        sont gérées par confirmer_reservation() dans services.py.
        """

        # ============================================================
        # 1. VÉRIFICATION DE L'AGENT
        # ============================================================

        if not agent:
            raise ValidationError(
                {
                    "code": "AGENT_REQUIRED",
                    "detail": _(
                        "L'utilisateur chargé de confirmer "
                        "la réservation est obligatoire."
                    ),
                }
            )

        if agent.role not in STAFF_ROLES:
            raise ValidationError(
                {
                    "code": "CONFIRMATION_NOT_ALLOWED",
                    "detail": _(
                        "Seul un membre autorisé du personnel "
                        "peut confirmer une réservation."
                    ),
                }
            )

        # ============================================================
        # 2. VÉRIFICATION DU STATUT
        # ============================================================

        if self.statut != ReservationStatus.PENDING_VERIFICATION:
            raise ValidationError(
                {
                    "code": "INVALID_RESERVATION_STATUS",
                    "detail": _(
                        "Seule une réservation "
                        "PENDING_VERIFICATION peut être confirmée."
                    ),
                    "statut_actuel": self.statut,
                }
            )

        # ============================================================
        # 3. CONFIRMATION
        # ============================================================

        self.statut = ReservationStatus.CONFIRMED
        self.validated_by = agent
        self.date_confirmation = timezone.now()

        self.save(
            update_fields=[
                "statut",
                "validated_by",
                "date_confirmation",
                "updated_at",
            ]
        )
        # ========================================================
        # ANNULER
        # ========================================================
        # ========================================================
    # EXPIRER
    # ========================================================

    def expirer(self) -> None:
        """
        Fait passer une réservation PENDING_VERIFICATION
        au statut EXPIRED.

        Cette transition est destinée au traitement automatique
        exécuté par Celery.

        Une réservation expirée ne peut plus être :
        - payée ;
        - confirmée ;
        - démarrée ;
        - modifiée comme une réservation en attente.

        Le remboursement éventuel d'un paiement réussi est géré
        séparément par le service de paiement.
        """

        if self.statut != ReservationStatus.PENDING_VERIFICATION:
            raise ValidationError(
                {
                    "code": "INVALID_RESERVATION_STATUS",
                    "detail": _(
                        "Seule une réservation "
                        "PENDING_VERIFICATION peut être expirée."
                    ),
                    "statut_actuel": self.statut,
                }
            )

        self.statut = ReservationStatus.EXPIRED

        self.save(
            update_fields=[
                "statut",
                "updated_at",
            ]
        )
    def annuler(
        self,
        agent,
        motif: str,
    ) -> None:
        """
        Annule une réservation.

        Le remboursement éventuel est géré par Payment.
        """

        # Vérification du rôle.
        if agent.role not in STAFF_ROLES:
            raise ValidationError(
                _(
                    'Seul un membre autorisé du personnel '
                    'peut annuler une réservation.'
                )
            )

        if not self.est_annulable:
            raise ValidationError(
                _(
                    'Cette réservation ne peut plus être annulée.'
                )
            )

        if not motif or not motif.strip():
            raise ValidationError(
                {
                    'motif_annulation': _(
                        'Le motif est obligatoire.'
                    )
                }
            )

        self.statut = ReservationStatus.CANCELLED

        self.validated_by = agent

        self.motif_annulation = motif.strip()

        self.date_annulation = timezone.now()

        self.save(
            update_fields=[
                'statut',
                'validated_by',
                'motif_annulation',
                'date_annulation',
                'updated_at',
            ]
        )

    # ========================================================
    # DÉMARRER
    # ========================================================

    def demarrer(self) -> None:
        """
        Passe la réservation à EN_COURS.
        """

        if self.statut != ReservationStatus.CONFIRMED:
            raise ValidationError(
                _(
                    'Seule une réservation CONFIRMED '
                    'peut démarrer.'
                )
            )

        self.statut = ReservationStatus.EN_COURS

        self.save(
            update_fields=[
                'statut',
                'updated_at',
            ]
        )

    # ========================================================
    # TERMINER
    # ========================================================

    def terminer(self) -> None:
        """
        Passe la réservation à TERMINEE.
        """

        if self.statut != ReservationStatus.EN_COURS:
            raise ValidationError(
                _(
                    'Seule une réservation EN_COURS '
                    'peut être terminée.'
                )
            )

        self.statut = ReservationStatus.TERMINEE

        self.save(
            update_fields=[
                'statut',
                'updated_at',
            ]
        )


# ============================================================
# LIGNE DE RÉSERVATION
# ============================================================

class LigneReservation(models.Model):
    """
    Représente un véhicule dans une réservation.

    Les prix sont copiés depuis Vehicle au moment
    de la création afin de conserver l'historique
    tarifaire de la réservation.
    """

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    reservation = models.ForeignKey(
        Reservation,
        on_delete=models.CASCADE,
        related_name='lignes',
        verbose_name=_('réservation'),
    )

    vehicule = models.ForeignKey(
        'vehicles.Vehicle',
        on_delete=models.PROTECT,
        related_name='lignes_reservation',
        verbose_name=_('véhicule'),
    )

    # ========================================================
    # PRIX
    # ========================================================

    prix_journalier_unitaire = models.DecimalField(
        _('prix journalier unitaire'),
        max_digits=12,
        decimal_places=2,
        validators=[
            MinValueValidator(Decimal('0.00')),
        ],
        help_text=_(
            'Copié depuis Vehicle.daily_rate.'
        ),
    )

    caution_unitaire = models.DecimalField(
        _('caution unitaire'),
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[
            MinValueValidator(Decimal('0.00')),
        ],
        help_text=_(
            'Copié depuis Vehicle.deposit.'
        ),
    )

    sous_total = models.DecimalField(
        _('sous-total'),
        max_digits=12,
        decimal_places=2,
        validators=[
            MinValueValidator(Decimal('0.00')),
        ],
        help_text=_(
            'Prix journalier × nombre de jours.'
        ),
    )

    # ========================================================
    # NOTES
    # ========================================================

    notes = models.TextField(
        _('notes'),
        blank=True,
        help_text=_(
            'Remarques spécifiques au véhicule.'
        ),
    )

    # ========================================================
    # TIMESTAMPS
    # ========================================================

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    # ========================================================
    # META
    # ========================================================

    class Meta:
        verbose_name = _('ligne de réservation')
        verbose_name_plural = _('lignes de réservation')

        ordering = ['created_at']

        constraints = [
            models.UniqueConstraint(
                fields=[
                    'reservation',
                    'vehicule',
                ],
                name='unique_vehicule_par_reservation',
            ),

            models.CheckConstraint(
                check=Q(
                    prix_journalier_unitaire__gte=Decimal('0.00')
                ),
                name='ligne_prix_journalier_positive',
            ),

            models.CheckConstraint(
                check=Q(
                    sous_total__gte=Decimal('0.00')
                ),
                name='ligne_sous_total_positive',
            ),
        ]

    # ========================================================
    # STRING
    # ========================================================

    def __str__(self) -> str:
        return (
            f'{self.reservation.numero} — '
            f'{self.vehicule.brand} '
            f'{self.vehicule.model}'
        )

    # ========================================================
    # VALIDATION
    # ========================================================


    def clean(self) -> None:
        errors = {}

        # ----------------------------------------------------
        # DISPONIBILITÉ DU VÉHICULE
        # ----------------------------------------------------

        if self.vehicule_id:

            from vehicles.models import VehicleStatus

            if (
                self.vehicule.status
                != VehicleStatus.AVAILABLE
            ):
                errors['vehicule'] = _(
                    f'Le véhicule {self.vehicule} '
                    f'n’est pas disponible '
                    f'(statut actuel : '
                    f'{self.vehicule.get_status_display()}).'
                )

        # ----------------------------------------------------
        # CHEVAUCHEMENT
        # ----------------------------------------------------

        if (
            self.vehicule_id
            and self.reservation_id
        ):

            reservation = self.reservation

            chevauchement = (
                LigneReservation.objects
                .filter(
                    vehicule=self.vehicule,
                    reservation__date_debut__lt=(
                        reservation.date_fin
                    ),
                    reservation__date_fin__gt=(
                        reservation.date_debut
                    ),
                )
                .filter(
                    Q(
                        reservation__statut=(
                            ReservationStatus.PENDING_VERIFICATION
                        ),
                        reservation__paiements__statut=(
                            PaymentStatus.SUCCEEDED
                        ),
                    )
                    | Q(
                        reservation__statut__in=[
                            ReservationStatus.CONFIRMED,
                            ReservationStatus.EN_COURS,
                        ],
                    )
                )
                .exclude(
                    reservation=reservation
                )
                .distinct()
            )

            if chevauchement.exists():
                errors['vehicule'] = _(
                    f'Le véhicule {self.vehicule} '
                    'est déjà réservé sur cette période.'
                )

        # ----------------------------------------------------
        # ERREURS
        # ----------------------------------------------------

        if errors:
            raise ValidationError(errors)

    # ========================================================
    # SAVE
    # ========================================================

    def save(self, *args, **kwargs) -> None:

        # Copier les prix uniquement à la création.
        if not self.pk:

            self.prix_journalier_unitaire = (
                self.vehicule.daily_rate
            )

            self.caution_unitaire = (
                self.vehicule.deposit
            )

        # Calculer le sous-total.
        if (
            self.reservation_id
            and self.prix_journalier_unitaire is not None
        ):
            self.sous_total = (
                self.prix_journalier_unitaire
                * self.reservation.nombre_jours
            )

        self.full_clean()

        super().save(*args, **kwargs)


# ============================================================
# RETOUR DE VÉHICULE
# ============================================================


class VehicleReturn(models.Model):
    """
    Retour physique d'une réservation.

    Une réservation peut contenir plusieurs véhicules.

    VehicleReturn représente le retour global de la réservation,
    tandis que VehicleReturnLine représente le retour de chaque
    véhicule individuellement.

    ORDRE D'OPÉRATIONS DANS LE SERVICE (contrainte non négociable) :
        1. VehicleReturn.objects.create(...)   ← réservation encore EN_COURS
        2. VehicleReturnLine.objects.create()  ← une par LigneReservation
        3. reservation.terminer()              ← passe à TERMINEE
        4. libérer les véhicules              ← status → AVAILABLE

    Toutes ces étapes doivent s'exécuter dans une transaction atomique.
    Inverser 1 et 3 ferait échouer la validation clean() de VehicleReturn
    car elle vérifie que la réservation est EN_COURS.
    """

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    reservation = models.OneToOneField(
        Reservation,
        on_delete=models.PROTECT,
        related_name="retour",
        verbose_name=_("réservation"),
        # NOTE : OneToOneField crée déjà un index unique en base.
        # Ne pas ajouter d'Index manuel sur ce champ.
    )

    enregistre_par = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="retours_enregistres",
        verbose_name=_("enregistré par"),
    )

    # ========================================================
    # DATES
    # ========================================================

    date_retour_prevue = models.DateField(
        _("date de retour prévue"),
        editable=False,
        help_text=_(
            "Copiée automatiquement depuis reservation.date_fin "
            "lors du save(). Ne jamais setter manuellement."
        ),
    )

    date_retour_effective = models.DateTimeField(
        _("date de retour effective"),
        default=timezone.now,
    )

    # ========================================================
    # PÉNALITÉS
    # ========================================================

    penalite_retard = models.DecimalField(
        _("pénalité de retard"),
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
        validators=[
            MinValueValidator(Decimal("0.00")),
        ],
        help_text=_(
            "Saisie manuellement par l'agent. "
            "Non calculée automatiquement."
        ),
    )

    penalite_dommages = models.DecimalField(
        _("pénalité dommages"),
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
        validators=[
            MinValueValidator(Decimal("0.00")),
        ],
        help_text=_(
            "Décision humaine de l'agent basée sur l'état "
            "constaté dans les lignes de retour."
        ),
    )

    caution_restituee = models.BooleanField(
        _("caution restituée"),
        default=False,
    )

    # ========================================================
    # AUDIT
    # ========================================================

    created_at = models.DateTimeField(
        _("créé le"),
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        _("mis à jour le"),
        auto_now=True,
    )

    history = HistoricalRecords(
        verbose_name=_("historique"),
    )

    # ========================================================
    # META
    # ========================================================

    class Meta:
        verbose_name = _("retour de véhicule")
        verbose_name_plural = _("retours de véhicules")

        ordering = [
            "-created_at",
        ]

        indexes = [
            # CORRECTION : index sur reservation supprimé —
            # OneToOneField génère déjà un index unique automatiquement.
            models.Index(
                fields=[
                    "date_retour_effective",
                ],
                name="return_effective_date_idx",
            ),
        ]

        constraints = [
            models.CheckConstraint(
                check=Q(
                    penalite_retard__gte=Decimal("0.00")
                ),
                name="return_late_penalty_positive",
            ),
            models.CheckConstraint(
                check=Q(
                    penalite_dommages__gte=Decimal("0.00")
                ),
                name="return_damage_penalty_positive",
            ),
        ]

    # ========================================================
    # STRING
    # ========================================================

    def __str__(self) -> str:
        return (
            f"Retour - "
            f"{self.reservation.numero}"
        )

    # ========================================================
    # VALIDATION MÉTIER
    # ========================================================

    def clean(self):
        errors = {}

        if not self.reservation_id:
            errors["reservation"] = _(
                "Une réservation est obligatoire."
            )

        if not self.enregistre_par_id:
            errors["enregistre_par"] = _(
                "L'utilisateur ayant enregistré le retour "
                "est obligatoire."
            )

        if self.reservation_id:
            # CONTRAINTE D'ORDRE : cette validation implique que
            # VehicleReturn doit être créé AVANT que reservation.terminer()
            # soit appelé dans le service. Voir docstring de la classe.
            if self.reservation.statut != ReservationStatus.EN_COURS:
                errors["reservation"] = _(
                    "Le retour ne peut être enregistré que pour "
                    "une réservation en cours."
                )

            if (
                self.date_retour_prevue
                and self.reservation.date_fin
                and self.date_retour_prevue
                != self.reservation.date_fin
            ):
                errors["date_retour_prevue"] = _(
                    "La date de retour prévue doit correspondre "
                    "à la date de fin de la réservation."
                )

        if self.date_retour_effective is not None:
            if self.date_retour_effective > timezone.now():
                errors["date_retour_effective"] = _(
                    "La date de retour effective ne peut pas "
                    "être dans le futur."
                )

        if errors:
            raise ValidationError(errors)

    # ========================================================
    # SAVE
    # ========================================================

    def save(self, *args, **kwargs):
        """
        Normalise les données dérivées avant sauvegarde.

        La date de retour prévue est toujours copiée depuis
        Reservation.date_fin pour garantir la cohérence même
        si la réservation est modifiée après coup.
        """

        if self.reservation_id:
            self.date_retour_prevue = (
                self.reservation.date_fin
            )

        self.full_clean()

        update_fields = kwargs.get("update_fields")

        if update_fields is not None:
            update_fields = set(update_fields)
            update_fields.add("updated_at")
            kwargs["update_fields"] = update_fields

        super().save(*args, **kwargs)

    # ========================================================
    # PROPRIÉTÉS
    # ========================================================

    @property
    def total_penalites(self) -> Decimal:
        """Somme des pénalités de retard et de dommages."""
        return self.penalite_retard + self.penalite_dommages

    @property
    def nombre_vehicules(self) -> int:
        """
        Nombre de véhicules attendus au retour.

        CORRECTION : source = reservation.lignes (véhicules loués),
        pas self.lignes (lignes de retour déjà créées).
        Utilisé pour savoir combien de véhicules DOIVENT être retournés.
        """
        return self.reservation.lignes.count()

    @property
    def nombre_vehicules_retournes(self) -> int:
        """
        Nombre de véhicules ayant effectivement une ligne de retour.

        CORRECTION : source = self.lignes (lignes de retour créées),
        distinct de nombre_vehicules qui compte les véhicules attendus.
        """
        return self.lignes.count()

    # ========================================================
    # VÉRIFICATION DE COMPLÉTUDE
    # ========================================================

    # def tous_les_vehicules_sont_retournes(self) -> bool:
    #     """
    #     Vérifie si tous les véhicules de la réservation
    #     possèdent une ligne de retour.

    #     Le service doit appeler cette méthode avant d'invoquer
    #     reservation.terminer() afin de garantir qu'aucun véhicule
    #     n'est oublié.
    #     """

    #     total_vehicules = self.reservation.lignes.count()
    #     total_retours = self.lignes.count()

    #     return (
    #         total_vehicules > 0
    #         and total_vehicules == total_retours
    #     )

    @property
    def tous_les_vehicules_sont_retournes(self):
        return (
            self.nombre_vehicules > 0
            and self.nombre_vehicules
            == self.nombre_vehicules_retournes
        )


# ============================================================
# LIGNE DE RETOUR DE VÉHICULE
# ============================================================


class VehicleReturnLine(models.Model):
    """
    Retour individuel d'un véhicule appartenant à une
    réservation.

    Une ligne correspond exactement à une LigneReservation.

    C'est ici que sont stockées les données d'inspection :
    kilométrage, état général, observations. Ces données
    servent de justificatif documentaire pour les pénalités
    saisies au niveau de VehicleReturn.
    """

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    vehicle_return = models.ForeignKey(
        VehicleReturn,
        on_delete=models.CASCADE,
        related_name="lignes",
        verbose_name=_("retour"),
    )

    ligne_reservation = models.OneToOneField(
        LigneReservation,
        on_delete=models.PROTECT,
        related_name="ligne_retour",
        verbose_name=_("ligne de réservation"),
        # NOTE : OneToOneField crée déjà un index unique en base.
        # Ne pas ajouter d'Index manuel sur ce champ.
    )

    # ========================================================
    # KILOMÉTRAGE
    # ========================================================

    kilometrage_depart = models.PositiveIntegerField(
        _("kilométrage au départ"),
        editable=False,
        help_text=_(
            "Capturé automatiquement depuis Vehicle.mileage "
            "à la création de la ligne. Snapshot immutable, "
            "comme les prix dans LigneReservation."
        ),
    )

    kilometrage_retour = models.PositiveIntegerField(
        _("kilométrage au retour"),
    )

    # ========================================================
    # ÉTAT DU VÉHICULE
    # ========================================================

    class EtatVehicule(models.TextChoices):
        BON = "BON", _("Bon état")
        DOMMAGES_MINEURS = (
            "DOMMAGES_MINEURS",
            _("Dommages mineurs"),
        )
        DOMMAGES_MAJEURS = (
            "DOMMAGES_MAJEURS",
            _("Dommages majeurs"),
        )

    etat_general = models.CharField(
        _("état général"),
        max_length=20,
        choices=EtatVehicule.choices,
        default=EtatVehicule.BON,
    )

    observations = models.TextField(
        _("observations"),
        blank=True,
    )

    # ========================================================
    # AUDIT
    # ========================================================

    created_at = models.DateTimeField(
        _("créé le"),
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        _("mis à jour le"),
        auto_now=True,
    )

    # CORRECTION : HistoricalRecords ajouté sur VehicleReturnLine.
    # Les données d'inspection (kilométrage, état, observations) sont
    # sensibles : toute modification après coup doit être tracée
    # pour éviter les litiges avec le client.
    history = HistoricalRecords(
        verbose_name=_("historique"),
    )

    # ========================================================
    # META
    # ========================================================

    class Meta:
        verbose_name = _("ligne de retour")
        verbose_name_plural = _("lignes de retour")

        ordering = [
            "-created_at",
        ]

        indexes = [
            # CORRECTION : index sur vehicle_return conservé —
            # ForeignKey ne crée pas d'index unique automatiquement,
            # contrairement à OneToOneField.
            models.Index(
                fields=[
                    "vehicle_return",
                ],
                name="return_line_return_idx",
            ),
            # CORRECTION : index sur ligne_reservation supprimé —
            # OneToOneField génère déjà un index unique automatiquement.
        ]

        constraints = [
            models.CheckConstraint(
                check=Q(
                    kilometrage_retour__gte=F(
                        "kilometrage_depart"
                    )
                ),
                name="return_line_mileage_coherent",
            ),
        ]

    # ========================================================
    # STRING
    # ========================================================

    def __str__(self) -> str:
        return (
            f"Retour - "
            f"{self.ligne_reservation.vehicule.brand} "
            f"{self.ligne_reservation.vehicule.model}"
        )

    # ========================================================
    # VALIDATION MÉTIER
    # ========================================================

    def clean(self):
        errors = {}

        if not self.vehicle_return_id:
            errors["vehicle_return"] = _(
                "Le retour est obligatoire."
            )

        if not self.ligne_reservation_id:
            errors["ligne_reservation"] = _(
                "La ligne de réservation est obligatoire."
            )

        if (
            self.vehicle_return_id
            and self.ligne_reservation_id
        ):
            reservation = self.vehicle_return.reservation

            if (
                self.ligne_reservation.reservation_id
                != reservation.id
            ):
                errors["ligne_reservation"] = _(
                    "La ligne de réservation doit appartenir "
                    "à la réservation du retour."
                )

        if (
            self.kilometrage_retour is not None
            and self.kilometrage_depart is not None
            and self.kilometrage_retour < self.kilometrage_depart
        ):
            errors["kilometrage_retour"] = _(
                "Le kilométrage au retour ne peut pas être "
                "inférieur au kilométrage au départ."
            )

        if errors:
            raise ValidationError(errors)

    # ========================================================
    # SAVE
    # ========================================================

    def save(self, *args, **kwargs):
        """
        Capture automatiquement le kilométrage actuel du véhicule
        comme kilométrage de départ lors de la création.

        Ce snapshot est immutable : il ne sera jamais recalculé
        lors des mises à jour suivantes, comme les prix dans
        LigneReservation.
        """

        if not self.pk:
            if self.ligne_reservation_id:
                self.kilometrage_depart = (
                    self.ligne_reservation.vehicule.mileage
                )

        if self.observations:
            self.observations = self.observations.strip()

        self.full_clean()

        update_fields = kwargs.get("update_fields")

        if update_fields is not None:
            update_fields = set(update_fields)
            update_fields.add("updated_at")
            kwargs["update_fields"] = update_fields

        super().save(*args, **kwargs)