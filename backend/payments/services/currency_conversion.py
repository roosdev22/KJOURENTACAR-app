from __future__ import annotations

from decimal import Decimal, ROUND_HALF_UP
from typing import Optional

from django.core.exceptions import ValidationError

from payments.models import Currency, ExchangeRate


class CurrencyConversionService:
    """
    Service centralisé de conversion monétaire KJOURENTACAR.

    Règle de référence actuelle :

        1 USD = X HTG

    Les taux ne sont jamais codés en dur.
    Ils sont récupérés depuis ExchangeRate.

    Exemples :

        100 USD -> 13 000 HTG
        13 000 HTG -> 13 000 HTG

    Pour les paiements CASH :
        - HTG : aucune conversion.
        - USD : conversion USD -> HTG avec le taux actif.
    """

    MONEY_QUANTIZER = Decimal("0.01")
    RATE_QUANTIZER = Decimal("0.000001")

    USD = Currency.USD
    HTG = Currency.HTG

    # ==============================================================
    # NORMALISATION
    # ==============================================================

    @classmethod
    def _normalize_currency(cls, currency: str) -> str:
        """
        Normalise et valide une devise KJOURENTACAR.
        """

        if not currency:
            raise ValidationError(
                {
                    "devise": (
                        "La devise est obligatoire."
                    )
                }
            )

        currency = str(currency).upper().strip()

        valid_currencies = {
            choice
            for choice, _label in Currency.choices
        }

        if currency not in valid_currencies:
            raise ValidationError(
                {
                    "devise": (
                        "La devise doit être HTG ou USD."
                    )
                }
            )

        return currency

    @classmethod
    def _normalize_amount(
        cls,
        amount: Decimal,
    ) -> Decimal:
        """
        Convertit le montant en Decimal et vérifie
        qu'il est strictement positif.
        """

        try:
            amount = Decimal(str(amount))
        except (TypeError, ValueError, ArithmeticError) as exc:
            raise ValidationError(
                {
                    "montant": (
                        "Le montant est invalide."
                    )
                }
            ) from exc

        if amount <= Decimal("0"):
            raise ValidationError(
                {
                    "montant": (
                        "Le montant doit être "
                        "supérieur à zéro."
                    )
                }
            )

        return amount

    @classmethod
    def _normalize_rate(
        cls,
        rate: Decimal,
    ) -> Decimal:
        """
        Normalise et valide un taux de change.
        """

        try:
            rate = Decimal(str(rate))
        except (TypeError, ValueError, ArithmeticError) as exc:
            raise ValidationError(
                {
                    "taux_change": (
                        "Le taux de change est invalide."
                    )
                }
            ) from exc

        if rate <= Decimal("0"):
            raise ValidationError(
                {
                    "taux_change": (
                        "Le taux de change doit être "
                        "supérieur à zéro."
                    )
                }
            )

        return rate.quantize(
            cls.RATE_QUANTIZER,
            rounding=ROUND_HALF_UP,
        )

    # ==============================================================
    # TAUX ACTIF
    # ==============================================================

    @classmethod
    def get_active_usd_to_htg_rate(
        cls,
    ) -> Optional[ExchangeRate]:
        """
        Retourne le taux actif USD -> HTG le plus récent.

        Exemple :

            1 USD = 130 HTG
        """

        return (
            ExchangeRate.objects
            .filter(
                from_currency=cls.USD,
                to_currency=cls.HTG,
                active=True,
            )
            .order_by("-created_at")
            .first()
        )

    @classmethod
    def require_active_usd_to_htg_rate(
        cls,
    ) -> ExchangeRate:
        """
        Retourne obligatoirement le taux actif USD -> HTG.

        Une erreur est levée si aucun taux n'est disponible.
        """

        exchange_rate = (
            cls.get_active_usd_to_htg_rate()
        )

        if exchange_rate is None:
            raise ValidationError(
                {
                    "taux_change": (
                        "Aucun taux de change actif "
                        "USD vers HTG n'est disponible."
                    )
                }
            )

        return exchange_rate

    # ==============================================================
    # CONVERSION VERS HTG
    # ==============================================================

    @classmethod
    def convert_to_htg(
        cls,
        amount: Decimal,
        from_currency: str,
    ) -> tuple[Decimal, Optional[ExchangeRate]]:
        """
        Convertit un montant vers HTG.

        HTG :
            aucune conversion.

        USD :
            USD -> HTG avec le taux actif.

        Retourne :

            (
                montant_htg,
                exchange_rate
            )

        Exemple :

            100 USD
            taux = 130
            résultat = 13 000 HTG
        """

        amount = cls._normalize_amount(amount)

        from_currency = cls._normalize_currency(
            from_currency
        )

        # ----------------------------------------------------------
        # Paiement déjà en HTG
        # ----------------------------------------------------------

        if from_currency == cls.HTG:
            return (
                amount.quantize(
                    cls.MONEY_QUANTIZER,
                    rounding=ROUND_HALF_UP,
                ),
                None,
            )

        # ----------------------------------------------------------
        # USD -> HTG
        # ----------------------------------------------------------

        if from_currency != cls.USD:
            raise ValidationError(
                {
                    "devise": (
                        "La conversion vers HTG "
                        "est disponible pour HTG ou USD."
                    )
                }
            )

        exchange_rate = (
            cls.require_active_usd_to_htg_rate()
        )

        converted_amount = (
            amount * exchange_rate.rate
        ).quantize(
            cls.MONEY_QUANTIZER,
            rounding=ROUND_HALF_UP,
        )

        return converted_amount, exchange_rate

    # ==============================================================
    # CONVERSION GÉNÉRIQUE
    # ==============================================================

    @classmethod
    def convert(
        cls,
        amount: Decimal,
        from_currency: str,
        to_currency: str,
        *,
        rate: Optional[Decimal] = None,
    ) -> Decimal:
        """
        Convertit un montant entre HTG et USD.

        Pour la règle actuelle :

            USD -> HTG
                utilise le taux USD -> HTG.

            HTG -> USD
                utilise l'inverse du taux USD -> HTG.

            même devise
                aucune conversion.

        Si rate est fourni, il représente le taux
        dans le sens de la conversion demandée.
        """

        amount = cls._normalize_amount(amount)

        from_currency = cls._normalize_currency(
            from_currency
        )

        to_currency = cls._normalize_currency(
            to_currency
        )

        # ----------------------------------------------------------
        # Même devise
        # ----------------------------------------------------------

        if from_currency == to_currency:
            return amount.quantize(
                cls.MONEY_QUANTIZER,
                rounding=ROUND_HALF_UP,
            )

        # ----------------------------------------------------------
        # Taux explicitement fourni
        # ----------------------------------------------------------

        if rate is not None:
            rate = cls._normalize_rate(rate)

            converted_amount = amount * rate

            return converted_amount.quantize(
                cls.MONEY_QUANTIZER,
                rounding=ROUND_HALF_UP,
            )

        # ----------------------------------------------------------
        # USD -> HTG
        # ----------------------------------------------------------

        if (
            from_currency == cls.USD
            and to_currency == cls.HTG
        ):
            exchange_rate = (
                cls.require_active_usd_to_htg_rate()
            )

            converted_amount = (
                amount * exchange_rate.rate
            )

            return converted_amount.quantize(
                cls.MONEY_QUANTIZER,
                rounding=ROUND_HALF_UP,
            )

        # ----------------------------------------------------------
        # HTG -> USD
        # ----------------------------------------------------------

        if (
            from_currency == cls.HTG
            and to_currency == cls.USD
        ):
            exchange_rate = (
                cls.require_active_usd_to_htg_rate()
            )

            converted_amount = (
                amount / exchange_rate.rate
            )

            return converted_amount.quantize(
                cls.MONEY_QUANTIZER,
                rounding=ROUND_HALF_UP,
            )

        raise ValidationError(
            {
                "devise": (
                    "La conversion demandée n'est "
                    "pas supportée."
                )
            }
        )

    # ==============================================================
    # CONVERSION AVEC TAUX HISTORIQUE
    # ==============================================================

    @classmethod
    def convert_using_active_rate(
        cls,
        amount: Decimal,
        from_currency: str,
        to_currency: str,
    ) -> tuple[Decimal, Optional[ExchangeRate]]:
        """
        Convertit un montant avec le taux actif et retourne
        le taux exact utilisé.

        HTG -> HTG :

            montant inchangé
            taux = None

        USD -> HTG :

            utilise le taux USD -> HTG actif.

        Exemple :

            100 USD
            taux = 130
            résultat = 13 000 HTG
        """

        amount = cls._normalize_amount(amount)

        from_currency = cls._normalize_currency(
            from_currency
        )

        to_currency = cls._normalize_currency(
            to_currency
        )

        # ----------------------------------------------------------
        # Même devise
        # ----------------------------------------------------------

        if from_currency == to_currency:
            return (
                amount.quantize(
                    cls.MONEY_QUANTIZER,
                    rounding=ROUND_HALF_UP,
                ),
                None,
            )

        # ----------------------------------------------------------
        # USD -> HTG
        # ----------------------------------------------------------

        if (
            from_currency == cls.USD
            and to_currency == cls.HTG
        ):
            exchange_rate = (
                cls.require_active_usd_to_htg_rate()
            )

            converted_amount = (
                amount * exchange_rate.rate
            ).quantize(
                cls.MONEY_QUANTIZER,
                rounding=ROUND_HALF_UP,
            )

            return (
                converted_amount,
                exchange_rate,
            )

        # ----------------------------------------------------------
        # HTG -> USD
        # ----------------------------------------------------------

        if (
            from_currency == cls.HTG
            and to_currency == cls.USD
        ):
            exchange_rate = (
                cls.require_active_usd_to_htg_rate()
            )

            converted_amount = (
                amount / exchange_rate.rate
            ).quantize(
                cls.MONEY_QUANTIZER,
                rounding=ROUND_HALF_UP,
            )

            return (
                converted_amount,
                exchange_rate,
            )

        raise ValidationError(
            {
                "devise": (
                    "La conversion demandée n'est "
                    "pas supportée."
                )
            }
        )