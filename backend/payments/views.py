from __future__ import annotations

from django.core.exceptions import ValidationError as DjangoValidationError
from django.db.models import QuerySet

from rest_framework import status
# from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from users.permissions import IsAgent

from payments.models import Paiement, PaymentMethod
from payments.serializers import (
    PaymentConfirmSerializer,
    PaymentCreateSerializer,
    PaymentRefundSerializer,
    PaymentSerializer,
    PaymentSummarySerializer,
)
from payments.services import PaymentService


class PaymentBaseView(APIView):
    """
    Vue de base commune aux endpoints de paiement.

    Centralise la gestion des ValidationError Django
    afin d'éviter de répéter le même code dans chaque vue.
    """

    permission_classes = [IsAgent]

    @staticmethod
    def _validation_error_detail(
        exc: DjangoValidationError,
    ) -> dict:
        """
        Convertit une ValidationError Django en réponse
        compatible avec Django REST Framework.
        """

        if hasattr(exc, "message_dict"):
            return exc.message_dict

        return {
            "detail": exc.messages,
        }


class PaymentListCreateView(PaymentBaseView):
    """
    Liste et création des paiements.

    GET
        Retourne les paiements accessibles à l'utilisateur.

    POST
        Crée un nouveau paiement.

        CASH
            Le paiement est enregistré et confirmé
            immédiatement via PaymentService.

        MONCASH / NATCASH
            Le paiement est créé en PENDING et devra
            être confirmé après vérification du fournisseur.

    Les règles financières restent dans PaymentService.
    """

    def get_queryset(self) -> QuerySet[Paiement]:
        return (
            Paiement.objects
            .select_related(
                "reservation",
                "enregistre_par",
            )
            .order_by("-created_at")
        )

    def get(self, request):
        """
        Retourne la liste des paiements.

        IMPORTANT :
        Le filtrage par rôle et par utilisateur devra être
        renforcé dans les permissions / règles d'accès métier.
        """

        queryset = self.get_queryset()

        serializer = PaymentSerializer(
            queryset,
            many=True,
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )

    def post(self, request):
        """
        Crée un nouveau paiement.

        CASH :
            Le paiement est enregistré comme réussi immédiatement.

        MONCASH / NATCASH :
            Le paiement est créé en PENDING.

        Le serializer valide les données d'entrée.
        PaymentService applique ensuite les règles financières.
        """

        serializer = PaymentCreateSerializer(
            data=request.data,
        )

        serializer.is_valid(
            raise_exception=True,
        )

        validated_data = serializer.validated_data

        try:
            methode = validated_data["methode"]

            if methode == PaymentMethod.CASH:
                paiement = PaymentService.register_cash_payment(
                    reservation_id=validated_data["reservation"],
                    montant=validated_data["montant"],
                    devise=validated_data.get("devise"),
                    reference=validated_data.get("reference"),
                    notes=validated_data.get(
                        "notes",
                        "",
                    ),
                    enregistre_par=request.user,
                )
            else:
                paiement = PaymentService.create_payment(
                    reservation_id=validated_data["reservation"],
                    montant=validated_data["montant"],
                    methode=methode,
                    devise=validated_data.get("devise"),
                    reference=validated_data.get("reference"),
                    notes=validated_data.get(
                        "notes",
                        "",
                    ),
                    enregistre_par=request.user,
                )

        except DjangoValidationError as exc:
            return Response(
                self._validation_error_detail(exc),
                status=status.HTTP_400_BAD_REQUEST,
            )

        response_serializer = PaymentSerializer(
            paiement,
        )

        return Response(
            response_serializer.data,
            status=status.HTTP_201_CREATED,
        )

class PaymentDetailView(PaymentBaseView):
    """
    Détail d'un paiement.

    Le paiement est identifié publiquement par son UUID.
    """

    def get(
        self,
        request,
        payment_uuid,
    ):
        try:
            paiement = PaymentService.get_payment_by_uuid(
                payment_uuid,
            )

        except Paiement.DoesNotExist:
            return Response(
                {
                    "detail": "Paiement introuvable.",
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = PaymentSerializer(
            paiement,
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )

class PaymentConfirmView(PaymentBaseView):
    """
    Confirmation d'un paiement PENDING.

    Transition :

        PENDING -> SUCCEEDED

    Le verrouillage transactionnel est entièrement
    géré par PaymentService.
    """

    def post(
        self,
        request,
        payment_uuid,
    ):
        serializer = PaymentConfirmSerializer(
            data=request.data,
        )

        serializer.is_valid(
            raise_exception=True,
        )

        try:
            paiement = PaymentService.confirm_payment(
                payment_uuid,
                enregistre_par=request.user,
                reference=serializer.validated_data.get(
                    "reference",
                ),
            )

        except Paiement.DoesNotExist:
            return Response(
                {
                    "detail": "Paiement introuvable.",
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        except DjangoValidationError as exc:
            return Response(
                self._validation_error_detail(exc),
                status=status.HTTP_400_BAD_REQUEST,
            )

        response_serializer = PaymentSerializer(
            paiement,
        )

        return Response(
            response_serializer.data,
            status=status.HTTP_200_OK,
        )


class PaymentCancelView(PaymentBaseView):
    """
    Annulation d'un paiement PENDING.

    Transition :

        PENDING -> CANCELLED

    PaymentService reste responsable de toutes les
    règles métier et du verrouillage transactionnel.
    """

    def post(
        self,
        request,
        payment_uuid,
    ):
        try:
            paiement = PaymentService.cancel_payment(
                payment_uuid,
                enregistre_par=request.user,
            )

        except Paiement.DoesNotExist:
            return Response(
                {
                    "detail": "Paiement introuvable.",
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        except DjangoValidationError as exc:
            return Response(
                self._validation_error_detail(exc),
                status=status.HTTP_400_BAD_REQUEST,
            )

        response_serializer = PaymentSerializer(
            paiement,
        )

        return Response(
            response_serializer.data,
            status=status.HTTP_200_OK,
        )


class PaymentRefundView(PaymentBaseView):
    """
    Remboursement total ou partiel d'un paiement réussi.

    Remboursement partiel :

        SUCCEEDED -> SUCCEEDED

    Remboursement total :

        SUCCEEDED -> REFUNDED

    PaymentService reste responsable de toutes les
    règles financières du remboursement.
    """

    def post(
        self,
        request,
        payment_uuid,
    ):
        serializer = PaymentRefundSerializer(
            data=request.data,
        )

        serializer.is_valid(
            raise_exception=True,
        )

        try:
            paiement = PaymentService.refund_payment(
                payment_uuid,
                montant=serializer.validated_data.get(
                    "montant",
                ),
                enregistre_par=request.user,
                notes=serializer.validated_data.get(
                    "notes",
                ),
            )

        except Paiement.DoesNotExist:
            return Response(
                {
                    "detail": "Paiement introuvable.",
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        except DjangoValidationError as exc:
            return Response(
                self._validation_error_detail(exc),
                status=status.HTTP_400_BAD_REQUEST,
            )

        response_serializer = PaymentSerializer(
            paiement,
        )

        return Response(
            response_serializer.data,
            status=status.HTTP_200_OK,
        )


class ReservationPaymentSummaryView(PaymentBaseView):
    """
    Résumé financier d'une réservation.

    Retourne :

        - montant_total
        - montant_paye
        - montant_restant
        - est_entierement_paye

    Tous les calculs sont effectués par PaymentService.
    """

    def get(
        self,
        request,
        reservation_id,
    ):
        try:
            summary = PaymentService.get_payment_summary(
                reservation_id,
            )

        except DjangoValidationError as exc:
            return Response(
                self._validation_error_detail(exc),
                status=status.HTTP_400_BAD_REQUEST,
            )

        except (TypeError, ValueError) as exc:
            return Response(
                {
                    "detail": str(exc)
                    or "Identifiant de réservation invalide.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = PaymentSummarySerializer(
            summary,
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )


class ReservationPaymentsView(PaymentBaseView):
    """
    Liste les paiements d'une réservation.

    Une réservation existante sans paiement retourne :

        200 []

    Une réservation inexistante doit être signalée
    comme une erreur métier.
    """

    def get(
        self,
        request,
        reservation_id,
    ):
        try:
            queryset = PaymentService.get_reservation_payments(
                reservation_id,
            )

        except DjangoValidationError as exc:
            return Response(
                self._validation_error_detail(exc),
                status=status.HTTP_400_BAD_REQUEST,
            )

        except (TypeError, ValueError) as exc:
            return Response(
                {
                    "detail": str(exc)
                    or "Identifiant de réservation invalide.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = PaymentSerializer(
            queryset,
            many=True,
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )