import uuid
from decimal import Decimal

from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from decimal import Decimal, ROUND_HALF_UP
# from reservations.models import Reservation

MONEY_QUANTUM = Decimal("0.01")


def quantize_money(amount: Decimal) -> Decimal:
    return Decimal(str(amount)).quantize(
        MONEY_QUANTUM,
        rounding=ROUND_HALF_UP,
    )

class PaymentMethod(models.TextChoices):
    CASH = "CASH", _("Espèces")
    MONCASH = "MONCASH", _("MonCash")
    NATCASH = "NATCASH", _("NatCash")


class PaymentStatus(models.TextChoices):
    PENDING = "PENDING", _("En attente")
    SUCCEEDED = "SUCCEEDED", _("Réussi")
    FAILED = "FAILED", _("Échoué")
    CANCELLED = "CANCELLED", _("Annulé")
    REFUNDED = "REFUNDED", _("Remboursé")


FINAL_STATUSES = frozenset(
    {
        PaymentStatus.SUCCEEDED,
        PaymentStatus.CANCELLED,
        PaymentStatus.REFUNDED,
    }
)

REFUNDABLE_STATUSES = frozenset(
    {
        PaymentStatus.SUCCEEDED,
    }
)


class Currency(models.TextChoices):
    HTG = "HTG", _("Gourde haïtienne")
    USD = "USD", _("Dollar américain")


class Paiement(models.Model):
    uuid = models.UUIDField(
        default=uuid.uuid4,
        editable=False,
        unique=True,
        verbose_name=_("identifiant public"),
        help_text=_(
            "Identifiant public utilisé par l'API et les URLs. "
            "L'identifiant interne ne doit pas être exposé."
        ),
    )

    reference = models.CharField(
        max_length=100,
        unique=True,
        null=True,
        blank=True,
        verbose_name=_("référence"),
        help_text=_(
            "Référence externe du prestataire ou référence "
            "interne pour un paiement en espèces."
        ),
    )

    devise = models.CharField(
        max_length=3,
        choices=Currency.choices,
        null=True,
        blank=True,
        verbose_name=_("devise"),
        help_text=_(
            "Devise réellement utilisée pour le paiement. "
            "Pour CASH, elle est choisie par l'agent."
        ),
)

 
    reservation = models.ForeignKey(
        "reservations.Reservation",
        on_delete=models.PROTECT,
        related_name="paiements",
        verbose_name=_("réservation"),
    )

    enregistre_par = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="paiements_enregistres",
        null=True,
        blank=True,
        verbose_name=_("enregistré par"),
        help_text=_(
            "Utilisateur ayant enregistré ou confirmé le paiement."
        ),
    )

    montant = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.01"))],
        verbose_name=_("montant"),
    )

    taux_change = models.DecimalField(
        max_digits=12,
        decimal_places=6,
        null=True,
        blank=True,
        verbose_name=_("taux de change"),
        help_text=_(
            "Taux utilisé au moment du paiement. "
            "Exemple : 130.000000 pour 1 USD = 130 HTG."
        ),
    )

    montant_htg = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name=_("montant équivalent en HTG"),
        help_text=_(
            "Montant du paiement converti en HTG "
            "au taux utilisé lors de l'enregistrement."
        ),
    )

    montant_rembourse = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(Decimal("0.01"))],
        verbose_name=_("montant remboursé"),
        help_text=_(
            "Montant remboursé lors d'un remboursement "
            "total ou partiel."
        ),
    )

    methode = models.CharField(
        max_length=20,
        choices=PaymentMethod.choices,
        verbose_name=_("méthode de paiement"),
    )

    statut = models.CharField(
        max_length=20,
        choices=PaymentStatus.choices,
        default=PaymentStatus.PENDING,
        verbose_name=_("statut"),
    )

    date_paiement = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name=_("date du paiement"),
        help_text=_(
            "Date à laquelle le paiement a été confirmé comme réussi."
        ),
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name=_("créé le"),
    )

    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name=_("modifié le"),
    )

    notes = models.TextField(
        blank=True,
        default="",
        verbose_name=_("notes"),
    )

    class Meta:
        db_table = "payments_paiement"
        ordering = ["-created_at"]
        indexes = [
            models.Index(
                fields=["reservation", "statut"],
                name="payment_res_status_idx",
            ),
            models.Index(
                fields=["methode", "statut"],
                name="payment_method_status_idx",
            ),
            models.Index(
                fields=["date_paiement"],
                name="payment_date_idx",
            ),
            models.Index(
                fields=["devise", "statut"],
                name="payment_currency_status_idx",
            ),
        ]
        verbose_name = _("paiement")
        verbose_name_plural = _("paiements")

    @property
    def est_finalise(self) -> bool:
        return self.statut in FINAL_STATUSES

    @property
    def est_remboursable(self) -> bool:
        return self.statut in REFUNDABLE_STATUSES

    @property
    def montant_non_rembourse(self) -> Decimal:
        montant_rembourse = (
            self.montant_rembourse
            if self.montant_rembourse is not None
            else Decimal("0.00")
        )

        return max(
            self.montant - montant_rembourse,
            Decimal("0.00"),
        )


    @property
    def montant_net_htg(self) -> Decimal:
        """
        Montant réellement conservé par la réservation en HTG.

        Le remboursement est exprimé dans la devise originale
        du paiement et converti avec le taux historique.
        """

        montant_htg = (
            self.montant_htg
            if self.montant_htg is not None
            else Decimal("0.00")
        )

        montant_rembourse = (
            self.montant_rembourse
            if self.montant_rembourse is not None
            else Decimal("0.00")
        )

        taux_change = (
            self.taux_change
            if self.taux_change is not None
            else Decimal("0.00")
        )

        montant_rembourse_htg = (
            montant_rembourse * taux_change
        )

        return max(
            quantize_money(
                montant_htg - montant_rembourse_htg
            ),
            Decimal("0.00"),
        )
    def clean(self) -> None:
        super().clean()

        self._normalize_currency()
        self._validate_not_modifying_final_payment()
        self._validate_amount()
        self._validate_currency_snapshot()
        self._validate_payment_method_currency()
        self._validate_remboursement()
        self._validate_payment_status()

    def _normalize_currency(self) -> None:
        if not self.devise:
            raise ValidationError(
                {
                    "devise": _(
                        "La devise est obligatoire."
                    )
                }
            )

        self.devise = self.devise.upper()

        if self.devise not in Currency.values:
            raise ValidationError(
                {
                    "devise": _(
                        "La devise doit être HTG ou USD."
                    )
                }
            )
    def _validate_payment_method_currency(self) -> None:
        """
        Vérifie uniquement que la devise enregistrée est valide.

        CASH :
            L'agent choisit HTG ou USD.

        MONCASH / NATCASH :
            La devise et les règles spécifiques du prestataire
            seront gérées par l'intégration API correspondante.
        """
        if not self.devise:
            raise ValidationError(
                {"devise": _("La devise est obligatoire.")}
            )

        self.devise = self.devise.upper()

        if self.devise not in Currency.values:
            raise ValidationError(
                {"devise": _("La devise doit être HTG ou USD.")}
            )

    def _validate_payment_status(self) -> None:
        if self.statut not in PaymentStatus.values:
            raise ValidationError(
                {"statut": _("Le statut du paiement est invalide.")}
            )

    def _validate_not_modifying_final_payment(self) -> None:
        if not self.pk:
            return

        try:
            original = Paiement.objects.get(pk=self.pk)
        except Paiement.DoesNotExist:
            return

        if not original.est_finalise:
            return

        protected_fields = (
            "reservation_id",
            "montant",
            "taux_change",
            "montant_htg",
            "devise",
            "methode",
            "statut",
            "reference",
            "enregistre_par_id",
            "montant_rembourse",
            "date_paiement",
        )

        modified_fields = [
            field
            for field in protected_fields
            if getattr(original, field) != getattr(self, field)
        ]

        if modified_fields:
            raise ValidationError(
                _(
                    "Un paiement finalisé ne peut plus "
                    "être modifié directement."
                )
            )

    def _validate_amount(self) -> None:
        if self.montant <= Decimal("0.00"):
            raise ValidationError(
                {
                    "montant": _(
                        "Le montant du paiement doit être "
                        "supérieur à zéro."
                    )
                }
            )

    def _validate_currency_snapshot(self) -> None:
            """
            Vérifie le snapshot financier enregistré avec le paiement.

            Chaque paiement doit conserver :
            - le taux utilisé au moment du paiement ;
            - son équivalent en HTG.

            Pour HTG :
                taux_change = 1.000000
                montant_htg = montant

            Pour USD :
                taux_change = taux USD -> HTG
                montant_htg = montant * taux_change
            """

            if not self.devise:
                return

            if self.taux_change is None:
                raise ValidationError(
                    {
                        "taux_change": _(
                            "Le taux de change est obligatoire."
                        )
                    }
                )

            if self.taux_change <= Decimal("0"):
                raise ValidationError(
                    {
                        "taux_change": _(
                            "Le taux de change doit être supérieur à zéro."
                        )
                    }
                )

            if self.montant_htg is None:
                raise ValidationError(
                    {
                        "montant_htg": _(
                            "Le montant équivalent en HTG est obligatoire."
                        )
                    }
                )

            if self.montant_htg <= Decimal("0"):
                raise ValidationError(
                    {
                        "montant_htg": _(
                            "Le montant équivalent en HTG doit être "
                            "supérieur à zéro."
                        )
                    }
                )

    # def _validate_montant_vs_reservation(self) -> None:
    #     """
    #     Ne valide pas ici le montant cumulé par rapport à la réservation.

    #     La réservation peut être exprimée en HTG tandis qu'un paiement
    #     CASH peut être effectué en USD.

    #     La conversion et la vérification du montant restant sont donc
    #     gérées par PaymentService, qui dispose du taux de change et du
    #     verrouillage transactionnel nécessaires.
    #     """

    #     if self.statut != PaymentStatus.SUCCEEDED:
    #         return

    #     if not self.reservation_id:
    #         return

    #     montant_total_reservation = getattr(
    #         self.reservation,
    #         "montant_total",
    #         None,
    #     )

    #     if montant_total_reservation is None:
    #         return

    #     if montant_total_reservation <= Decimal("0.00"):
    #         return

    def _validate_remboursement(self) -> None:
        if self.montant_rembourse is not None:
            if self.montant_rembourse <= Decimal("0.00"):
                raise ValidationError(
                    {
                        "montant_rembourse": _(
                            "Le montant remboursé doit être "
                            "supérieur à zéro."
                        )
                    }
                )

            if self.montant_rembourse > self.montant:
                raise ValidationError(
                    {
                        "montant_rembourse": _(
                            "Le montant remboursé ne peut pas "
                            "dépasser le montant du paiement."
                        )
                    }
                )

        if self.statut == PaymentStatus.REFUNDED:
            if self.montant_rembourse is None:
                raise ValidationError(
                    {
                        "montant_rembourse": _(
                            "Un paiement remboursé doit avoir "
                            "un montant remboursé."
                        )
                    }
                )

    def save(self, *args, **kwargs) -> None:
        if self.devise:
            self.devise = self.devise.upper()

        if (
            self.statut == PaymentStatus.SUCCEEDED
            and self.date_paiement is None
        ):
            self.date_paiement = timezone.now()

        super().save(*args, **kwargs)

    def __str__(self) -> str:
        reference = self.reference or str(self.uuid)[:8]

        return (
            f"{reference} — "
            f"{self.montant} {self.devise} — "
            f"{self.get_methode_display()}"
        )

    def __repr__(self) -> str:
        return (
            f"<Paiement "
            f"pk={self.pk} "
            f"uuid={self.uuid} "
            f"statut={self.statut} "
            f"montant={self.montant} "
            f"devise={self.devise}>"
        )

class ExchangeRate(models.Model):
    """
    Taux de change utilisé par KJOURENTACAR.

    Exemple :
        1 USD = 130 HTG

    Le taux est historisé afin que les anciens paiements
    conservent le taux qui était en vigueur au moment
    de leur enregistrement.
    """

    from_currency = models.CharField(
        max_length=3,
        choices=Currency.choices,
        verbose_name=_("devise source"),
        help_text=_("Devise à convertir."),
    )

    to_currency = models.CharField(
        max_length=3,
        choices=Currency.choices,
        verbose_name=_("devise cible"),
        help_text=_("Devise vers laquelle convertir."),
    )

    rate = models.DecimalField(
        max_digits=12,
        decimal_places=6,
        validators=[
            MinValueValidator(Decimal("0.000001")),
        ],
        verbose_name=_("taux de change"),
        help_text=_(
            "Nombre d'unités de la devise cible pour "
            "1 unité de la devise source."
        ),
    )

    active = models.BooleanField(
        default=True,
        verbose_name=_("actif"),
        help_text=_(
            "Indique si ce taux peut être utilisé "
            "pour les nouvelles conversions."
        ),
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name=_("créé le"),
    )

    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name=_("modifié le"),
    )

    class Meta:
        verbose_name = _("taux de change")
        verbose_name_plural = _("taux de change")
        ordering = ["-created_at"]
        indexes = [
            models.Index(
                fields=[
                    "from_currency",
                    "to_currency",
                    "active",
                ],
                name="exchange_rate_lookup_idx",
            ),
        ]

    def clean(self):
        super().clean()

        if self.from_currency:
            self.from_currency = self.from_currency.upper()

        if self.to_currency:
            self.to_currency = self.to_currency.upper()

        if self.from_currency == self.to_currency:
            raise ValidationError(
                {
                    "to_currency": _(
                        "La devise source et la devise cible "
                        "doivent être différentes."
                    )
                }
            )

        if self.rate is not None and self.rate <= Decimal("0"):
            raise ValidationError(
                {
                    "rate": _(
                        "Le taux de change doit être supérieur à zéro."
                    )
                }
            )

    def save(self, *args, **kwargs):
        if self.from_currency:
            self.from_currency = self.from_currency.upper()

        if self.to_currency:
            self.to_currency = self.to_currency.upper()

        self.full_clean()
        return super().save(*args, **kwargs)

    def __str__(self):
        return (
            f"1 {self.from_currency} = "
            f"{self.rate} {self.to_currency}"
        )

