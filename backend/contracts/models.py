import os
import uuid
from django.conf import settings
from django.core.validators import FileExtensionValidator
from django.db import models
from django.db.models import Q
from django.utils.translation import gettext_lazy as _
from .storage import PrivateContractStorage


# Deux fonctions de premier niveau (et non une fonction qui en fabrique une) :
# les migrations doivent pouvoir sérialiser `upload_to`, ce qu'une closure ne permet pas.
def generated_contract_path(instance, filename):
    ext = os.path.splitext(filename)[1].lower()
    return f"contracts/generated/{instance.reservation_id}/{uuid.uuid4().hex}{ext}"


def signed_contract_path(instance, filename):
    ext = os.path.splitext(filename)[1].lower()
    return f"contracts/signed/{instance.reservation_id}/{uuid.uuid4().hex}{ext}"


class Contract(models.Model):
    """Contrat de location associé à une réservation."""

    class Status(models.TextChoices):
        GENERATED = "GENERATED", _("Généré")
        SIGNED = "SIGNED", _("Signé")
        CANCELLED = "CANCELLED", _("Annulé")

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    reference = models.CharField(
        max_length=20, unique=True, editable=False,
        verbose_name=_("référence"),
    )

    # FK + contrainte conditionnelle : un seul contrat actif par réservation,
    # mais l'historique des contrats annulés est conservé.
    reservation = models.ForeignKey(
        "reservations.Reservation",
        on_delete=models.PROTECT,
        related_name="contracts",
        verbose_name=_("réservation"),
    )

    status = models.CharField(
        max_length=20, choices=Status.choices,
        default=Status.GENERATED, db_index=True,
        verbose_name=_("statut"),
    )

    
    generated_file = models.FileField(
    storage=PrivateContractStorage(),
    upload_to=generated_contract_path,
    blank=True,
    validators=[FileExtensionValidator(["pdf"])],
    verbose_name=_("contrat généré"),
    )

    signed_file = models.FileField(
        storage=PrivateContractStorage(),
        upload_to=signed_contract_path,
        blank=True,
        validators=[FileExtensionValidator(["pdf"])],
        verbose_name=_("contrat signé numérisé"),
    )

    signed_file_sha256 = models.CharField(
        max_length=64, blank=True, editable=False,
        verbose_name=_("empreinte SHA-256 du contrat signé"),
    )

    generated_at = models.DateTimeField(auto_now_add=True, verbose_name=_("date de génération"))
    signed_at = models.DateTimeField(blank=True, null=True, verbose_name=_("date de signature enregistrée"))
    cancelled_at = models.DateTimeField(blank=True, null=True, verbose_name=_("date d'annulation"))
    updated_at = models.DateTimeField(auto_now=True, verbose_name=_("dernière modification"))

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT,
        related_name="contracts_created", blank=True, null=True,
        verbose_name=_("créé par"),
    )

    class Meta:
        verbose_name = _("contrat")
        verbose_name_plural = _("contrats")
        ordering = ["-generated_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["reservation"],
                condition=~Q(status="CANCELLED"),
                name="unique_active_contract_per_reservation",
            ),
            models.CheckConstraint(
                check=(
                    ~Q(status="SIGNED")
                    | (
                        Q(signed_at__isnull=False)
                        & ~Q(signed_file="")
                        & ~Q(signed_file_sha256="")
                    )
                ),
                name="contract_signed_requires_file_date_hash",
            ),
            models.CheckConstraint(
                check=(
                    ~Q(status="CANCELLED")
                    | Q(cancelled_at__isnull=False)
                ),
                name="contract_cancelled_requires_date",
            ),
        ]
        

    def __str__(self):
        return f"{self.reference} — {self.get_status_display()}"