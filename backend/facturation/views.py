
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from facturation.models import Facture
from facturation.serializers import (
    CreerFactureSerializer,
    FactureSerializer,
)
from facturation.services import FacturationService
from payments.services import PaymentService
from users.permissions import (
    IsAgent,
    IsAuthenticatedAndActive,
    IsNotForcedPasswordChange,
)


class FactureViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.CreateModelMixin,
    viewsets.GenericViewSet,
):
    """
    Consultation et création contrôlée des factures.
    Les montants et statuts ne sont jamais modifiables directement.
    """

    serializer_class = FactureSerializer
    permission_classes = [
        IsAuthenticatedAndActive,
        IsNotForcedPasswordChange,
        IsAgent,
    ]

    queryset = Facture.objects.select_related(
        "reservation",
        "reservation__client",
        "creee_par",
        "annulee_par",
    ).all()

    def create(self, request, *args, **kwargs):
        serializer = CreerFactureSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            facture, creee = FacturationService.creer_facture(
                reservation_id=serializer.validated_data["reservation_id"],
                utilisateur=request.user,
            )
        except ValueError as exc:
            raise ValidationError({"detail": str(exc)}) from exc

        output = FactureSerializer(
            facture,
            context=self.get_serializer_context(),
        )

        return Response(
            output.data,
            status=(
                status.HTTP_201_CREATED
                if creee
                else status.HTTP_200_OK
            ),
        )

    @action(
        detail=True,
        methods=["get"],
        url_path="situation-financiere",
    )
    def situation_financiere(self, request, pk=None):
        """
        Retourne la situation financière actuelle de la réservation
        associée à la facture, en HTG.
        """
        facture = self.get_object()

        try:
            resume = PaymentService.get_payment_summary(
                facture.reservation_id,
            )
        except DjangoValidationError as exc:
            detail = (
                exc.message_dict
                if hasattr(exc, "message_dict")
                else exc.messages
            )
            raise ValidationError(detail) from exc

        # La facture conserve son montant historique.
        # Ne pas afficher un solde ambigu si le montant de la
        # réservation a changé depuis l'émission de la facture.
        if resume["montant_total"] != facture.montant_location:
            raise ValidationError({
                "detail": (
                    "Le montant actuel de la réservation diffère "
                    "du montant enregistré sur la facture. "
                    "La situation financière ne peut pas être "
                    "affichée de manière fiable."
                ),
            })

        montant_paye = resume["montant_paye"]
        montant_restant = resume["montant_restant"]

        if montant_paye == 0:
            statut_reglement = "NON_PAYEE"
        elif montant_restant > 0:
            statut_reglement = "PARTIELLEMENT_PAYEE"
        else:
            statut_reglement = "PAYEE"

        return Response({
            "facture_id": str(facture.id),
            "reference": facture.reference,
            "devise": resume["devise"],
            "montant_location": facture.montant_location,
            "montant_caution": facture.montant_caution,
            "montant_paye": montant_paye,
            "montant_restant": montant_restant,
            "statut_reglement": statut_reglement,
        })
