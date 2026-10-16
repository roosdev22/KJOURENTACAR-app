from __future__ import annotations

from decimal import Decimal, InvalidOperation
from typing import Optional
from uuid import UUID

from django.core.exceptions import ValidationError
from django.db import transaction
from django.utils import timezone

from payments.models import (
    Currency,
    ExchangeRate,
    Paiement,
    PaymentMethod,
    PaymentStatus,
    quantize_money,
)
from reservations.models import Reservation, ReservationStatus
from reservations.services import verifier_disponibilite_vehicules
from vehicles.models import Vehicle


ZERO = Decimal("0.00")
ONE = Decimal("1.000000")


class PaymentService:
    """
    Service métier centralisé pour les paiements.

    Principes :

    - Le backend est la source de vérité.
    - Le frontend ne fournit jamais :
        * taux_change
        * montant_htg
        * statut
        * date_paiement
        * montant_rembourse
        * enregistre_par

    - Chaque paiement conserve son snapshot financier :
        montant
        devise
        taux_change
        montant_htg

    - Le taux de change historique d'un paiement USD est conservé.
      Un ancien paiement n'utilise jamais un nouveau taux.

    - Le montant payé d'une réservation correspond uniquement aux
      paiements SUCCEEDED, nets des remboursements.

    - Les remboursements USD utilisent le taux historique du paiement.

    - Les paiements PENDING ne comptent pas dans le montant payé.
      Le dépassement est donc revérifié au moment de la confirmation,
      sous verrou transactionnel.

    - Ordre de verrouillage unique pour les opérations d'écriture :

        1. Réservation
        2. Tous les paiements de la réservation
        3. Paiement concerné

    - Confirmer un paiement ne confirme jamais la réservation.

      La confirmation de réservation reste de la responsabilité
      de Reservation.confirmer(agent).

    - Les opérations sur un paiement existant utilisent son UUID public.
      Un UUID inconnu lève Paiement.DoesNotExist afin que la view
      retourne HTTP 404.
    """

    # ============================================================
    # UTILITAIRES
    # ============================================================

    @staticmethod
    def _normalize_currency(devise: str) -> str:
        """
        Normalise et valide la devise.

        Devises supportées :
            HTG
            USD
        """
        if not devise:
            raise ValidationError(
                {"devise": "La devise est obligatoire."}
            )

        devise = str(devise).strip().upper()

        if devise not in Currency.values:
            raise ValidationError(
                {
                    "devise": (
                        "La devise sélectionnée n'est pas supportée. "
                        "Les devises disponibles sont HTG et USD."
                    )
                }
            )

        return devise

    @staticmethod
    def _normalize_method(methode: str) -> str:
        """
        Normalise et valide la méthode de paiement.
        """
        if not methode:
            raise ValidationError(
                {
                    "methode": (
                        "La méthode de paiement est obligatoire."
                    )
                }
            )

        methode = str(methode).strip().upper()

        if methode not in PaymentMethod.values:
            raise ValidationError(
                {
                    "methode": (
                        "La méthode de paiement sélectionnée "
                        "n'est pas valide."
                    )
                }
            )

        return methode

    @staticmethod
    def _validate_method_currency(
        methode: str,
        devise: str,
    ) -> None:
        """
        Vérifie la compatibilité entre méthode et devise.

        Règles métier :

            CASH    -> HTG ou USD
            MONCASH -> HTG uniquement
            NATCASH -> HTG uniquement

        MonCash et NatCash utilisent leurs APIs respectives.
        Leur paiement est donc exprimé en HTG dans notre système.
        """
        if methode in (
            PaymentMethod.MONCASH,
            PaymentMethod.NATCASH,
        ) and devise != Currency.HTG:
            raise ValidationError(
                {
                    "devise": (
                        "Les paiements MonCash et NatCash "
                        "doivent être effectués en HTG."
                    )
                }
            )

    @staticmethod
    def _normalize_reference(
        reference: Optional[str],
    ) -> Optional[str]:
        """
        Transforme une référence vide en NULL.

        Cela permet notamment d'éviter les conflits avec un champ
        unique lorsque plusieurs paiements n'ont aucune référence.
        """
        if reference is None:
            return None

        reference = str(reference).strip()

        return reference or None

    @staticmethod
    def _quantize_money(
        amount: Decimal,
    ) -> Decimal:
        """
        Arrondi monétaire partagé avec le modèle.
        """
        return quantize_money(amount)

    @classmethod
    def _normalize_amount(
        cls,
        montant: Decimal,
        field_name: str = "montant",
    ) -> Decimal:
        """
        Convertit en Decimal et valide le montant.

        Le montant :

        - doit être numérique ;
        - doit être fini ;
        - doit être strictement positif ;
        - ne doit pas comporter plus de deux décimales.

        Exemple :

            100.00 -> accepté
            100.50 -> accepté
            100.005 -> refusé
            0 -> refusé
            -10 -> refusé
            NaN -> refusé
            Infinity -> refusé
        """
        erreur_invalide = {
            field_name: (
                "Le montant fourni n'est pas un montant valide."
            )
        }

        try:
            montant = Decimal(str(montant))
        except (
            TypeError,
            ValueError,
            InvalidOperation,
        ):
            raise ValidationError(erreur_invalide)

        if not montant.is_finite():
            raise ValidationError(erreur_invalide)

        if montant <= ZERO:
            raise ValidationError(
                {
                    field_name: (
                        "Le montant doit être supérieur à zéro."
                    )
                }
            )

        try:
            arrondi = cls._quantize_money(montant)
        except InvalidOperation:
            raise ValidationError(erreur_invalide)

        if arrondi != montant:
            raise ValidationError(
                {
                    field_name: (
                        "Le montant ne peut pas comporter "
                        "plus de deux décimales."
                    )
                }
            )

        return arrondi

    # ============================================================
    # VERROUILLAGE
    # ============================================================

    @staticmethod
    def _get_locked_reservation(
        reservation_id: UUID,
    ) -> Reservation:
        """
        Étape 1 :

        verrouille la réservation.

        Utilisé uniquement dans les transactions d'écriture.
        """
        try:
            return (
                Reservation.objects
                .select_for_update()
                .get(pk=reservation_id)
            )
        except Reservation.DoesNotExist as exc:
            raise ValidationError(
                {
                    "reservation": (
                        "La réservation demandée "
                        "n'existe pas."
                    )
                }
            ) from exc

    @staticmethod
    def _lock_reservation_payments(
        reservation_id: UUID,
    ) -> list[Paiement]:
        """
        Étape 2 :

        verrouille tous les paiements de la réservation.

        L'ordre pk croissant garantit un ordre déterministe.
        """
        return list(
            Paiement.objects
            .select_for_update()
            .filter(
                reservation_id=reservation_id,
            )
            .order_by("pk")
        )

    @classmethod
    def _lock_payment_context(
        cls,
        payment_uuid: UUID,
    ) -> tuple[Reservation, Paiement]:
        """
        Verrouille le contexte complet d'un paiement.

        Ordre :

            1. réservation
            2. tous les paiements
            3. paiement concerné

        Le paiement est identifié publiquement par UUID.

        Un UUID inconnu lève Paiement.DoesNotExist afin que
        la view retourne HTTP 404.
        """

        # Lecture initiale sans verrou afin de connaître
        # la réservation associée au paiement.
        reservation_id = (
            Paiement.objects
            .filter(uuid=payment_uuid)
            .values_list(
                "reservation_id",
                flat=True,
            )
            .first()
        )

        if reservation_id is None:
            raise Paiement.DoesNotExist(
                "Le paiement demandé n'existe pas."
            )

        # 1. Verrouillage réservation.
        reservation = cls._get_locked_reservation(
            reservation_id,
        )

        # 2. Verrouillage de tous les paiements.
        paiements = cls._lock_reservation_payments(
            reservation.pk,
        )

        # 3. Le paiement concerné est déjà verrouillé
        #    puisqu'il appartient à la liste précédente.
        paiement = next(
            (
                paiement
                for paiement in paiements
                if paiement.uuid == payment_uuid
            ),
            None,
        )

        if paiement is None:
            raise Paiement.DoesNotExist(
                "Le paiement demandé n'existe pas."
            )

        return reservation, paiement

    # ============================================================
    # TAUX DE CHANGE
    # ============================================================

    @staticmethod
    def _get_conversion_rate(
        devise: str,
    ) -> Decimal:
        """
        Retourne le taux de conversion vers HTG.

        HTG :
            1

        USD :
            dernier taux USD → HTG actif.
        """
        devise = PaymentService._normalize_currency(
            devise,
        )

        if devise == Currency.HTG:
            return ONE

        taux = (
            ExchangeRate.objects
            .filter(
                from_currency=Currency.USD,
                to_currency=Currency.HTG,
                active=True,
            )
            .order_by(
                "-created_at",
                "-pk",
            )
            .first()
        )

        if taux is None:
            raise ValidationError(
                {
                    "devise": (
                        "Aucun taux de change USD → HTG actif "
                        "n'est configuré. Veuillez configurer "
                        "un taux avant d'enregistrer un paiement "
                        "en USD."
                    )
                }
            )

        if taux.rate is None or taux.rate <= ZERO:
            raise ValidationError(
                {
                    "taux_change": (
                        "Le taux de change USD → HTG "
                        "configuré est invalide."
                    )
                }
            )

        taux_decimal = Decimal(str(taux.rate))

        if not taux_decimal.is_finite() or taux_decimal <= ZERO:
            raise ValidationError(
                {
                    "taux_change": (
                        "Le taux de change USD → HTG "
                        "configuré est invalide."
                    )
                }
            )

        return taux_decimal

    @classmethod
    def _calculate_amount_htg(
        cls,
        montant: Decimal,
        devise: str,
    ) -> tuple[Decimal, Decimal]:
        """
        Calcule :

            montant_htg
            taux_change

        Exemple :

            500 USD × 135
            = 67 500 HTG
        """
        montant = cls._normalize_amount(
            montant,
        )

        devise = cls._normalize_currency(
            devise,
        )

        taux_change = cls._get_conversion_rate(
            devise,
        )

        montant_htg = cls._quantize_money(
            montant * taux_change,
        )

        if montant_htg <= ZERO:
            raise ValidationError(
                {
                    "montant_htg": (
                        "Le montant équivalent en HTG "
                        "doit être supérieur à zéro."
                    )
                }
            )

        return montant_htg, taux_change

    # ============================================================
    # CALCULS FINANCIERS
    # ============================================================

    @classmethod
    def _get_successful_amount_htg(
        cls,
        reservation_id: UUID,
        exclude_payment_id: Optional[int] = None,
    ) -> Decimal:
        """
        Calcule le montant réellement payé en HTG.

        Seuls les paiements SUCCEEDED comptent.

        Les remboursements sont déduits avec le taux historique
        du paiement.

        Les statuts suivants ne comptent jamais :

            PENDING
            FAILED
            CANCELLED
            REFUNDED
        """
        queryset = Paiement.objects.filter(
            reservation_id=reservation_id,
            statut=PaymentStatus.SUCCEEDED,
        )

        if exclude_payment_id is not None:
            queryset = queryset.exclude(
                pk=exclude_payment_id,
            )

        total = ZERO

        # Pas de .only(...) : la propriété montant_net_htg peut lire
        # d'autres champs (montant, devise) et provoquerait sinon
        # une requête SQL supplémentaire par paiement.
        for paiement in queryset:
            if (
                paiement.montant_htg is None
                or paiement.montant_htg <= ZERO
            ):
                continue

            if paiement.montant_rembourse and (
                paiement.taux_change is None
                or paiement.taux_change <= ZERO
            ):
                raise ValidationError(
                    {
                        "paiement": (
                            "Le taux de change historique "
                            "d'un paiement remboursé est invalide."
                        )
                    }
                )

            total += paiement.montant_net_htg

        return cls._quantize_money(total)

    @classmethod
    def _get_reservation_total(
        cls,
        reservation: Reservation,
    ) -> Decimal:
        """
        Retourne le montant total de la réservation en HTG.
        """
        montant_total = getattr(
            reservation,
            "montant_total",
            None,
        )

        if montant_total is None:
            raise ValidationError(
                {
                    "reservation": (
                        "Le montant total de la réservation "
                        "est indisponible."
                    )
                }
            )

        try:
            montant_total = Decimal(
                str(montant_total),
            )
        except (
            TypeError,
            ValueError,
            InvalidOperation,
        ) as exc:
            raise ValidationError(
                {
                    "reservation": (
                        "Le montant total de la réservation "
                        "est invalide."
                    )
                }
            ) from exc

        if not montant_total.is_finite():
            raise ValidationError(
                {
                    "reservation": (
                        "Le montant total de la réservation "
                        "est invalide."
                    )
                }
            )

        montant_total = cls._quantize_money(
            montant_total,
        )

        if montant_total <= ZERO:
            raise ValidationError(
                {
                    "reservation": (
                        "Le montant total de la réservation "
                        "doit être supérieur à zéro."
                    )
                }
            )

        return montant_total

    @classmethod
    def _compute_financials(
        cls,
        reservation: Reservation,
        exclude_payment_id: Optional[int] = None,
    ) -> tuple[Decimal, Decimal, Decimal]:
        """
        Retourne :

            montant_total
            montant_paye
            montant_restant

        Tous les montants sont en HTG.
        """
        montant_total = cls._get_reservation_total(
            reservation,
        )

        montant_paye = cls._get_successful_amount_htg(
            reservation.pk,
            exclude_payment_id=exclude_payment_id,
        )

        montant_restant = cls._quantize_money(
            max(
                montant_total - montant_paye,
                ZERO,
            )
        )

        return (
            montant_total,
            montant_paye,
            montant_restant,
        )

    # ============================================================
    # RÉSUMÉ
    # ============================================================

    @classmethod
    def get_payment_summary(
        cls,
        reservation_id: UUID,
    ) -> dict:
        """
        Retourne le résumé financier d'une réservation.

        Tous les montants sont en HTG.

        Cette méthode est une lecture seule.
        """
        try:
            reservation = Reservation.objects.get(
                pk=reservation_id,
            )
        except Reservation.DoesNotExist as exc:
            raise ValidationError(
                {
                    "reservation": (
                        "La réservation demandée "
                        "n'existe pas."
                    )
                }
            ) from exc

        (
            montant_total,
            montant_paye,
            montant_restant,
        ) = cls._compute_financials(
            reservation,
        )

        return {
            "devise": Currency.HTG,
            "montant_total": montant_total,
            "montant_paye": montant_paye,
            "montant_restant": montant_restant,
            "est_entierement_paye": (
                montant_restant == ZERO
            ),
        }

    # ============================================================
    # CRÉATION
    # ============================================================

    @classmethod
    @transaction.atomic
    def create_payment(
        cls,
        *,
        reservation_id: UUID,
        montant: Decimal,
        methode: str,
        enregistre_par=None,
        reference: Optional[str] = None,
        notes: str = "",
        devise: str = "HTG",
    ) -> Paiement:
        """
        Crée un paiement avec le statut PENDING.

        Le backend calcule :

            taux_change
            montant_htg

        Le frontend ne peut pas imposer ces valeurs.

        Règles de devise :

            CASH    -> HTG ou USD
            MONCASH -> HTG uniquement
            NATCASH -> HTG uniquement
        """

        # --------------------------------------------------------
        # 1. Réservation
        # --------------------------------------------------------

        reservation = cls._get_locked_reservation(
            reservation_id,
        )

        # --------------------------------------------------------
        # 2. Paiements existants
        # --------------------------------------------------------

        cls._lock_reservation_payments(
            reservation.pk,
        )

        # --------------------------------------------------------
        # Réservation expirée (vérifiée en premier)
        # --------------------------------------------------------

        if reservation.statut == ReservationStatus.EXPIRED:
            raise ValidationError(
                {
                    "code": "RESERVATION_EXPIRED",
                    "detail": (
                        "Impossible d'enregistrer un paiement : "
                        "la réservation est expirée."
                    ),
                }
            )

        # --------------------------------------------------------
        # Normalisation
        # --------------------------------------------------------

        montant = cls._normalize_amount(
            montant,
        )

        devise = cls._normalize_currency(
            devise,
        )

        methode = cls._normalize_method(
            methode,
        )

        cls._validate_method_currency(
            methode,
            devise,
        )

        reference = cls._normalize_reference(
            reference,
        )

        if notes is None:
            notes = ""

        # --------------------------------------------------------
        # Calcul financier
        # --------------------------------------------------------

        montant_htg, taux_change = (
            cls._calculate_amount_htg(
                montant,
                devise,
            )
        )

        (
            _total,
            _paye,
            montant_restant,
        ) = cls._compute_financials(
            reservation,
        )

        if montant_restant <= ZERO:
            raise ValidationError(
                {
                    "montant": (
                        "Cette réservation est déjà "
                        "entièrement payée."
                    )
                }
            )

        if montant_htg > montant_restant:
            raise ValidationError(
                {
                    "montant": (
                        f"Le montant du paiement "
                        f"({montant_htg} HTG, "
                        f"{montant} {devise} au taux de "
                        f"{taux_change}) dépasse le montant "
                        f"restant à payer "
                        f"({montant_restant} HTG)."
                    )
                }
            )

        # --------------------------------------------------------
        # Création
        # --------------------------------------------------------

        paiement = Paiement(
            reservation=reservation,
            montant=montant,
            devise=devise,
            taux_change=taux_change,
            montant_htg=montant_htg,
            methode=methode,
            statut=PaymentStatus.PENDING,
            enregistre_par=enregistre_par,
            reference=reference,
            notes=notes,
        )

        paiement.full_clean()
        paiement.save()

        return paiement

    # ============================================================
    # PAIEMENT CASH
    # ============================================================

    @classmethod
    @transaction.atomic
    def register_cash_payment(
        cls,
        *,
        reservation_id: UUID,
        montant: Decimal,
        enregistre_par,
        devise: str = "HTG",
        reference: Optional[str] = None,
        notes: str = "",
    ) -> Paiement:
        """
        Enregistre et confirme immédiatement un paiement CASH.

        Ce flux est destiné à l'agent.

        Exemple :

            Agent
              ↓
            CASH
              ↓
        création PENDING
              ↓
        validation backend
              ↓
          SUCCEEDED

        HTG et USD sont autorisés.

        La création et la confirmation sont exécutées dans
        la même transaction atomique.
        """

        if enregistre_par is None:
            raise ValidationError(
                {
                    "enregistre_par": (
                        "Un paiement en espèces doit être "
                        "enregistré par un utilisateur identifié."
                    )
                }
            )

        paiement = cls.create_payment(
            reservation_id=reservation_id,
            montant=montant,
            methode=PaymentMethod.CASH,
            enregistre_par=enregistre_par,
            reference=reference,
            notes=notes,
            devise=devise,
        )

        return cls.confirm_payment(
            paiement.uuid,
            enregistre_par=enregistre_par,
        )

    # ============================================================
    # CONFIRMATION
    # ============================================================

    @classmethod
    @transaction.atomic
    def confirm_payment(
        cls,
        payment_uuid: UUID,
        *,
        enregistre_par=None,
        reference: Optional[str] = None,
        provider_verified: bool = False,
    ) -> Paiement:
        """
        Confirme un paiement :

            PENDING → SUCCEEDED

        Cette méthode NE confirme JAMAIS la réservation.

        La réservation doit être confirmée séparément via :

            Reservation.confirmer(agent)

        CASH :
            confirmation autorisée par le personnel.

        MONCASH / NATCASH :
            confirmation manuelle interdite.
            La confirmation doit provenir de l'intégration
            serveur/webhook du fournisseur.

        `provider_verified=True` est réservé au backend
        après vérification réelle du fournisseur.
        """

        reservation, paiement = cls._lock_payment_context(
            payment_uuid,
        )

        # --------------------------------------------------------
        # Idempotence
        # --------------------------------------------------------

        if paiement.statut == PaymentStatus.SUCCEEDED:
            return paiement

        # --------------------------------------------------------
        # Réservation déjà expirée
        # --------------------------------------------------------

        if reservation.statut == ReservationStatus.EXPIRED:
            raise ValidationError(
                {
                    "code": "RESERVATION_EXPIRED",
                    "detail": (
                        "Impossible de confirmer ce paiement : "
                        "la réservation est expirée."
                    ),
                    "statut": str(reservation.statut),
                    "date_debut": str(reservation.date_debut),
                }
            )

        # --------------------------------------------------------
        # Transition de statut
        # --------------------------------------------------------

        if paiement.statut != PaymentStatus.PENDING:
            raise ValidationError(
                {
                    "code": "INVALID_PAYMENT_STATUS",
                    "detail": (
                        "Seul un paiement en attente "
                        "peut être confirmé."
                    ),
                    "statut": str(paiement.statut),
                }
            )

        # --------------------------------------------------------
        # Règles par méthode
        # --------------------------------------------------------

        if paiement.methode in (
            PaymentMethod.MONCASH,
            PaymentMethod.NATCASH,
        ):
            if not provider_verified:
                raise ValidationError(
                    {
                        "code": "PROVIDER_CONFIRMATION_REQUIRED",
                        "detail": (
                            "Les paiements MonCash et NatCash ne "
                            "peuvent pas être confirmés manuellement. "
                            "La confirmation doit provenir du "
                            "fournisseur."
                        ),
                    }
                )

        elif enregistre_par is None and not provider_verified:
            raise ValidationError(
                {
                    "enregistre_par": (
                        "La confirmation d'un paiement en espèces "
                        "doit être faite par un utilisateur "
                        "identifié."
                    )
                }
            )

        # --------------------------------------------------------
        # Revérification financière sous verrou
        # --------------------------------------------------------

        (
            _total,
            _paye,
            montant_restant,
        ) = cls._compute_financials(
            reservation,
            exclude_payment_id=paiement.pk,
        )

        if montant_restant <= ZERO:
            raise ValidationError(
                {
                    "montant": (
                        "Cette réservation est déjà "
                        "entièrement payée."
                    )
                }
            )

        if paiement.montant_htg > montant_restant:
            raise ValidationError(
                {
                    "montant": (
                        f"Le paiement ({paiement.montant_htg} HTG) "
                        f"dépasse le montant restant à payer "
                        f"({montant_restant} HTG)."
                    )
                }
            )

        # --------------------------------------------------------
        # Vérification des véhicules
        # --------------------------------------------------------

        lignes = list(
            reservation.lignes.all()
        )

        if not lignes:
            raise ValidationError(
                {
                    "code": "NO_VEHICLE",
                    "detail": (
                        "Impossible de confirmer ce paiement : "
                        "aucun véhicule n'est associé à la réservation."
                    ),
                }
            )

        vehicule_ids = list(
            dict.fromkeys(
                ligne.vehicule_id
                for ligne in lignes
            )
        )

        # --------------------------------------------------------
        # Verrouillage des véhicules
        # --------------------------------------------------------

        vehicules = list(
            Vehicle.objects
            .select_for_update()
            .filter(id__in=vehicule_ids)
            .order_by("pk")
        )

        vehicules_trouves = {
            vehicule.id
            for vehicule in vehicules
        }

        vehicules_introuvables = sorted(
            set(vehicule_ids) - vehicules_trouves,
            key=str,
        )

        if vehicules_introuvables:
            raise ValidationError(
                {
                    "code": "VEHICLE_NOT_FOUND",
                    "detail": (
                        "Impossible de confirmer ce paiement : "
                        "un ou plusieurs véhicules associés "
                        "à la réservation sont introuvables."
                    ),
                    "vehicules_introuvables": [
                        str(vehicle_id)
                        for vehicle_id in vehicules_introuvables
                    ],
                }
            )

        # --------------------------------------------------------
        # Vérification des conflits temporels
        # --------------------------------------------------------

        verifier_disponibilite_vehicules(
            reservation=reservation,
            vehicule_ids=vehicule_ids,
        )

        # --------------------------------------------------------
        # Mise à jour du paiement
        # --------------------------------------------------------

        reference = cls._normalize_reference(
            reference,
        )

        if reference:
            paiement.reference = reference

        maintenant = timezone.now()

        paiement.statut = PaymentStatus.SUCCEEDED
        paiement.date_paiement = maintenant

        # Audit : on ne remplace pas enregistre_par,
        # qui représente l'utilisateur ayant créé le paiement.
        ligne = (
            f"[Confirmation "
            f"{maintenant:%Y-%m-%d %H:%M}]"
        )

        if enregistre_par is not None:
            ligne += f" par {enregistre_par}"

        paiement.notes = (
            f"{paiement.notes}\n{ligne}"
        ).strip()

        paiement.full_clean()
        paiement.save()

        return paiement    

    # ============================================================
    # ANNULATION
    # ============================================================

    @classmethod
    @transaction.atomic
    def cancel_payment(
        cls,
        payment_uuid: UUID,
        *,
        enregistre_par=None,
    ) -> Paiement:
        """
        Annule uniquement un paiement PENDING.

        Transition :

            PENDING → CANCELLED

        Un paiement SUCCEEDED ne peut pas être annulé.
        Il doit passer par refund_payment().
        """

        _reservation, paiement = (
            cls._lock_payment_context(
                payment_uuid,
            )
        )

        # Idempotence
        if paiement.statut == PaymentStatus.CANCELLED:
            return paiement

        if paiement.statut != PaymentStatus.PENDING:
            raise ValidationError(
                {
                    "statut": (
                        "Seul un paiement en attente "
                        "peut être annulé."
                    )
                }
            )

        paiement.statut = PaymentStatus.CANCELLED

        # L'auteur de l'annulation est ajouté dans les notes.
        # On ne remplace pas enregistre_par, qui représente
        # l'utilisateur ayant créé le paiement.
        ligne = (
            f"[Annulation "
            f"{timezone.now():%Y-%m-%d %H:%M}]"
        )

        if enregistre_par is not None:
            ligne += f" par {enregistre_par}"

        paiement.notes = (
            f"{paiement.notes}\n{ligne}"
        ).strip()

        paiement.full_clean()
        paiement.save()

        return paiement

    # ============================================================
    # REMBOURSEMENT
    # ============================================================

    @classmethod
    @transaction.atomic
    def refund_payment(
        cls,
        payment_uuid: UUID,
        montant: Optional[Decimal] = None,
        *,
        enregistre_par=None,
        notes: Optional[str] = None,
    ) -> Paiement:
        """
        Rembourse totalement ou partiellement un paiement SUCCEEDED.

        `montant` est exprimé dans la devise originale du paiement.

        Si montant=None :
            remboursement total du montant encore remboursable.

        Transition :

            SUCCEEDED → SUCCEEDED
                remboursement partiel

            SUCCEEDED → REFUNDED
                remboursement complet

        Le taux historique du paiement reste utilisé pour le calcul
        financier HTG.
        """

        _reservation, paiement = (
            cls._lock_payment_context(
                payment_uuid,
            )
        )

        # --------------------------------------------------------
        # Vérification statut
        # --------------------------------------------------------

        if paiement.statut != PaymentStatus.SUCCEEDED:
            raise ValidationError(
                {
                    "statut": (
                        "Seul un paiement réussi "
                        "peut être remboursé."
                    )
                }
            )

        # --------------------------------------------------------
        # Montant déjà remboursé
        # --------------------------------------------------------

        montant_deja_rembourse = (
            paiement.montant_rembourse
            or ZERO
        )

        montant_non_rembourse = cls._quantize_money(
            max(
                paiement.montant
                - montant_deja_rembourse,
                ZERO,
            )
        )

        if montant_non_rembourse <= ZERO:
            raise ValidationError(
                {
                    "montant": (
                        "Ce paiement a déjà été "
                        "entièrement remboursé."
                    )
                }
            )

        # --------------------------------------------------------
        # Montant du remboursement
        # --------------------------------------------------------

        if montant is None:
            montant = montant_non_rembourse
        else:
            montant = cls._normalize_amount(
                montant,
            )

        if montant > montant_non_rembourse:
            raise ValidationError(
                {
                    "montant": (
                        f"Le montant du remboursement "
                        f"({montant} {paiement.devise}) "
                        f"dépasse le montant encore "
                        f"remboursable "
                        f"({montant_non_rembourse} "
                        f"{paiement.devise})."
                    )
                }
            )

        nouveau_montant_rembourse = (
            cls._quantize_money(
                montant_deja_rembourse
                + montant,
            )
        )

        paiement.montant_rembourse = (
            nouveau_montant_rembourse
        )

        # --------------------------------------------------------
        # Statut
        # --------------------------------------------------------

        if (
            nouveau_montant_rembourse
            >= paiement.montant
        ):
            paiement.statut = (
                PaymentStatus.REFUNDED
            )
        else:
            paiement.statut = (
                PaymentStatus.SUCCEEDED
            )

        # --------------------------------------------------------
        # Audit
        # --------------------------------------------------------

        ligne = (
            f"[Remboursement "
            f"{timezone.now():%Y-%m-%d %H:%M}] "
            f"{montant} {paiement.devise}"
        )

        if enregistre_par is not None:
            ligne += f" par {enregistre_par}"

        if notes:
            ligne += f" — {notes.strip()}"

        paiement.notes = (
            f"{paiement.notes}\n{ligne}"
        ).strip()

        paiement.full_clean()
        paiement.save()

        return paiement

    # ============================================================
    # LECTURE
    # ============================================================

    @staticmethod
    def get_payment(
        payment_id: int,
    ) -> Paiement:
        """
        Récupère un paiement par identifiant interne.

        Réservé aux usages internes.
        """
        return (
            Paiement.objects
            .select_related(
                "reservation",
                "enregistre_par",
            )
            .get(pk=payment_id)
        )

    @staticmethod
    def get_payment_by_uuid(
        payment_uuid: UUID,
    ) -> Paiement:
        """
        Récupère un paiement par UUID public.

        Lecture seule, sans verrou.
        """
        return (
            Paiement.objects
            .select_related(
                "reservation",
                "enregistre_par",
            )
            .get(uuid=payment_uuid)
        )

    @staticmethod
    def get_reservation_payments(
        reservation_id: UUID,
    ):
        """
        Retourne tous les paiements d'une réservation.
        """

        if not Reservation.objects.filter(
            pk=reservation_id,
        ).exists():
            raise ValidationError(
                {
                    "reservation": (
                        "La réservation demandée "
                        "n'existe pas."
                    )
                }
            )

        return (
            Paiement.objects
            .filter(
                reservation_id=reservation_id,
            )
            .select_related(
                "reservation",
                "enregistre_par",
            )
            .order_by("-created_at")
        )