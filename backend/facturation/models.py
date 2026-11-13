
import uuid

from django.db import models
from django.db.models import Q
from django.utils import timezone
from django.utils.translation import gettext_lazy as _


class Facture(models.Model):
    """Facture de location associée à une réservation."""

    class Statut(models.TextChoices):
        EMISE = "EMISE", _("Émise")
        ANNULEE = "ANNULEE", _("Annulée")

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    reference = models.CharField(
        max_length=30,
        unique=True,
        editable=False,
        verbose_name=_("Référence"),
    )

    reservation = models.OneToOneField(
        "reservations.Reservation",
        on_delete=models.PROTECT,
        related_name="facture",
        verbose_name=_("Réservation"),
    )

    statut = models.CharField(
        max_length=10,
        choices=Statut.choices,
        default=Statut.EMISE,
        db_index=True,
        verbose_name=_("Statut"),
    )

    devise = models.CharField(
        max_length=3,
        default="HTG",
        editable=False,
        verbose_name=_("Devise de facturation"),
    )

    montant_location = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        editable=False,
        verbose_name=_("Montant de location"),
    )

    montant_caution = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
        editable=False,
        verbose_name=_("Montant de la caution"),
    )

    emise_le = models.DateTimeField(
        default=timezone.now,
        editable=False,
        db_index=True,
        verbose_name=_("Date d'émission"),
    )

    creee_par = models.ForeignKey(
        "users.User",
        on_delete=models.PROTECT,
        related_name="factures_creees",
        verbose_name=_("Créée par"),
    )

    motif_annulation = models.TextField(
        blank=True,
        verbose_name=_("Motif d'annulation"),
    )

    annulee_le = models.DateTimeField(
        null=True,
        blank=True,
        editable=False,
        verbose_name=_("Date d'annulation"),
    )

    annulee_par = models.ForeignKey(
        "users.User",
        on_delete=models.PROTECT,
        related_name="factures_annulees",
        null=True,
        blank=True,
        verbose_name=_("Annulée par"),
    )

    class Meta:
        verbose_name = _("facture")
        verbose_name_plural = _("factures")
        ordering = ["-emise_le"]
        constraints = [
            models.CheckConstraint(
                check=Q(montant_location__gt=0),
                name="facture_location_positive",
            ),
            models.CheckConstraint(
                check=Q(montant_caution__gte=0),
                name="facture_caution_non_negative",
            ),
            models.CheckConstraint(
                check=(
                    ~Q(statut="ANNULEE")
                    | Q(annulee_le__isnull=False)
                ),
                name="facture_annulee_requires_date",
            ),
        ]

    def __str__(self):
        return self.reference
