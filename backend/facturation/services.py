
import uuid

from django.db import transaction
from django.utils import timezone

from reservations.models import Reservation
from facturation.models import Facture


class FacturationService:
    """Centralise les règles métier de facturation."""

    ROLES_AUTORISES = {
        "AGENT",
        "GESTIONNAIRE",
        "ADMIN",
        "SUPER_ADMIN",
}

    @staticmethod
    def _generer_reference():
        date_emission = timezone.localdate().strftime("%Y%m%d")
        identifiant = uuid.uuid4().hex[:10].upper()
        return f"FAC-{date_emission}-{identifiant}"

    @classmethod
    @transaction.atomic
    def creer_facture(cls, *, reservation_id, utilisateur):
        """
        Crée une facture pour une réservation confirmée.

        Le montant est toujours lu depuis la réservation en base.
        Aucun paiement n'est créé par cette méthode.
        """
        if not utilisateur or not utilisateur.is_authenticated:
            raise ValueError("Une authentification est nécessaire.")

        if not utilisateur.is_active:
            raise ValueError("Ce compte utilisateur est inactif.")

        role = getattr(utilisateur, "role", None)
        if role not in cls.ROLES_AUTORISES:
            raise ValueError(
                "Vous n'êtes pas autorisé à créer une facture."
            )

        try:
            reservation = (
                Reservation.objects.select_for_update()
                .get(pk=reservation_id)
            )
        except Reservation.DoesNotExist as exc:
            raise ValueError("La réservation demandée n'existe pas.") from exc

        statuts_facturables = {
            "CONFIRMED",
            "EN_COURS",
            "TERMINEE",
        }

        if reservation.statut not in statuts_facturables:
            raise ValueError(
                "La réservation doit être confirmée avant la facturation."
            )

        facture_existante = Facture.objects.filter(
            reservation=reservation
        ).first()

        if facture_existante:
            if facture_existante.statut == Facture.Statut.ANNULEE:
                raise ValueError(
                    "Une facture annulée existe déjà pour cette réservation. "
                    "La création d'une nouvelle facture nécessite une "
                    "procédure de réémission dédiée."
                )

            return facture_existante, False

        montant_location = reservation.montant_total
        montant_caution = reservation.caution_totale or 0

        if montant_location is None or montant_location <= 0:
            raise ValueError(
                "Le montant de location de la réservation est invalide."
            )

        if montant_caution < 0:
            raise ValueError(
                "Le montant de la caution ne peut pas être négatif."
            )

        facture = Facture.objects.create(
            reference=cls._generer_reference(),
            reservation=reservation,
            statut=Facture.Statut.EMISE,
            devise="HTG",
            montant_location=montant_location,
            montant_caution=montant_caution,
            creee_par=utilisateur,
        )

        return facture, True
