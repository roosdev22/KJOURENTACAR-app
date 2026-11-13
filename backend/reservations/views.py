from django.core.exceptions import ValidationError as DjangoValidationError
from django.utils.translation import gettext_lazy as _

from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
import logging
from contracts.services import create_contract_for_reservation
from users.models import RoleChoices

from reservations.models import (
    Reservation,
    ReservationStatus,
)

from reservations.serializers import (
    ReservationAgentCreateSerializer,
    ReservationCancellationSerializer,
    ReservationConfirmationSerializer,
    ReservationCreateSerializer,
    ReservationSerializer,
    ReservationTransitionSerializer,
    VehicleReturnSerializer,
)

from reservations.services import (
    confirmer_reservation,
)


# ============================================================
# RÔLES
# ============================================================

STAFF_ROLES = {
    RoleChoices.AGENT,
    RoleChoices.GESTIONNAIRE,
    RoleChoices.ADMIN,
    RoleChoices.SUPER_ADMIN,
}


RESERVATION_CREATION_ROLES = {
    RoleChoices.AGENT,
    RoleChoices.ADMIN,
    RoleChoices.SUPER_ADMIN,
}


RESERVATION_VALIDATION_ROLES = {
    RoleChoices.AGENT,
    RoleChoices.ADMIN,
    RoleChoices.SUPER_ADMIN,
}


RESERVATION_OPERATION_ROLES = {
    RoleChoices.AGENT,
    RoleChoices.ADMIN,
    RoleChoices.SUPER_ADMIN,
}


# ============================================================
# VIEWSET RESERVATION
# ============================================================
logger = logging.getLogger(__name__)
class ReservationViewSet(viewsets.ModelViewSet):
    """
    API de gestion des réservations KJOURRENTACAR.

    CLIENT :
        - consulter ses propres réservations ;
        - créer une réservation pour lui-même.

    AGENT :
        - consulter toutes les réservations ;
        - créer une réservation en agence ;
        - confirmer ;
        - annuler ;
        - démarrer ;
        - terminer.

    GESTIONNAIRE :
        - consulter toutes les réservations ;
        - consulter les réservations en attente ;
        - consulter les réservations confirmées.

    ADMIN / SUPER_ADMIN :
        - consulter ;
        - créer ;
        - confirmer ;
        - annuler ;
        - démarrer ;
        - terminer.

    Les opérations métier sont protégées par les services
    et les méthodes métier appropriées.
    """

    permission_classes = [
        IsAuthenticated,
    ]

    # ========================================================
    # QUERYSET
    # ========================================================

    def get_queryset(self):
        """
        Retourne les réservations accessibles à l'utilisateur.
        """

        user = self.request.user

        queryset = (
            Reservation.objects
            .select_related(
                'client',
                'created_by',
                'validated_by',
            )
            .prefetch_related(
                'lignes__vehicule',
            )
        )

        # ----------------------------------------------------
        # CLIENT
        # ----------------------------------------------------

        if user.role == RoleChoices.CLIENT:
            return queryset.filter(
                client=user,
            )

        # ----------------------------------------------------
        # PERSONNEL
        # ----------------------------------------------------

        if user.role in STAFF_ROLES:
            return queryset

        # ----------------------------------------------------
        # RÔLE INCONNU
        # ----------------------------------------------------

        return queryset.none()

    # ========================================================
    # SERIALIZER
    # ========================================================

    def get_serializer_class(self):
        """
        Retourne le serializer correspondant à l'action.
        """

        if self.action == 'create':

            if self.request.user.role == RoleChoices.CLIENT:
                return ReservationCreateSerializer

            if (
                self.request.user.role
                in RESERVATION_CREATION_ROLES
            ):
                return ReservationAgentCreateSerializer

            return ReservationSerializer

        if self.action == 'annuler':
            return ReservationCancellationSerializer

        if self.action == 'confirmer':
            return ReservationConfirmationSerializer

        if self.action == 'retour':
            return VehicleReturnSerializer

        if self.action in {
            'demarrer',
            'terminer',
        }:
            return ReservationTransitionSerializer

        return ReservationSerializer

    # ========================================================
    # PERMISSIONS MÉTIER
    # ========================================================

    def _is_staff(self):
        """
        Vérifie si l'utilisateur peut consulter
        les réservations du personnel.
        """

        return self.request.user.role in STAFF_ROLES

    # --------------------------------------------------------

    def _is_reservation_operator(self):
        """
        Vérifie si l'utilisateur peut effectuer
        les opérations métier.

        AGENT / ADMIN / SUPER_ADMIN uniquement.
        """

        return (
            self.request.user.role
            in RESERVATION_OPERATION_ROLES
        )

    # --------------------------------------------------------

    def _require_staff(self):
        """
        Vérifie l'accès aux fonctions réservées au personnel.
        """

        if not self._is_staff():
            return Response(
                {
                    'detail': _(
                        'Cette action est réservée '
                        'au personnel autorisé.'
                    )
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        return None

    # --------------------------------------------------------

    def _require_reservation_operator(self):
        """
        Vérifie l'accès aux opérations métier.
        """

        if not self._is_reservation_operator():
            return Response(
                {
                    'detail': _(
                        'Cette action est réservée aux agents '
                        'et aux administrateurs autorisés.'
                    )
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        return None

    # ========================================================
    # LIST
    # ========================================================

    def list(self, request, *args, **kwargs):
        return super().list(
            request,
            *args,
            **kwargs,
        )

    # ========================================================
    # RETRIEVE
    # ========================================================

    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(
            request,
            *args,
            **kwargs,
        )

    # ========================================================
    # CREATE
    # ========================================================

    def create(self, request, *args, **kwargs):
        """
        Création d'une réservation.

        CLIENT :
            réservation en ligne pour lui-même.

        AGENT / ADMIN / SUPER_ADMIN :
            réservation en agence.

        GESTIONNAIRE :
            interdit.
        """

        user = request.user

        allowed_roles = {
            RoleChoices.CLIENT,
            RoleChoices.AGENT,
            RoleChoices.ADMIN,
            RoleChoices.SUPER_ADMIN,
        }

        if user.role not in allowed_roles:
            return Response(
                {
                    'detail': _(
                        'Vous n’avez pas les permissions '
                        'pour créer une réservation.'
                    )
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = self.get_serializer(
            data=request.data,
            context={
                'request': request,
            },
        )

        if not serializer.is_valid():
            logger.warning(
                "Échec création réservation | rôle=%s | erreurs=%s",
                user.role,
                serializer.errors,
            )
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST,
            )

        reservation = serializer.save()

        output_serializer = ReservationSerializer(
            reservation,
            context={
                'request': request,
            },
        )

        return Response(
            output_serializer.data,
            status=status.HTTP_201_CREATED,
        )

    # ========================================================
    # UPDATE
    # ========================================================

    def update(
        self,
        request,
        *args,
        **kwargs,
    ):
        return Response(
            {
                'detail': _(
                    'La modification directe d’une réservation '
                    'n’est pas autorisée. Utilisez les actions '
                    'métier disponibles.'
                )
            },
            status=status.HTTP_405_METHOD_NOT_ALLOWED,
        )

    # ========================================================
    # PARTIAL UPDATE
    # ========================================================

    def partial_update(
        self,
        request,
        *args,
        **kwargs,
    ):
        return Response(
            {
                'detail': _(
                    'La modification directe d’une réservation '
                    'n’est pas autorisée.'
                )
            },
            status=status.HTTP_405_METHOD_NOT_ALLOWED,
        )

    # ========================================================
    # DELETE
    # ========================================================

    def destroy(
        self,
        request,
        *args,
        **kwargs,
    ):
        return Response(
            {
                'detail': _(
                    'La suppression d’une réservation est interdite. '
                    'Utilisez l’action d’annulation.'
                )
            },
            status=status.HTTP_405_METHOD_NOT_ALLOWED,
        )

    # ========================================================
    # ANNULER
    # ========================================================

    @action(
        detail=True,
        methods=['post'],
        url_path='annuler',
    )
    def annuler(
        self,
        request,
        pk=None,
    ):
        """
        Annule une réservation.

        Autorisé :
            AGENT
            ADMIN
            SUPER_ADMIN
        """

        operator_error = (
            self._require_reservation_operator()
        )

        if operator_error:
            return operator_error

        reservation = self.get_object()

        serializer = ReservationCancellationSerializer(
            data=request.data,
            context={
                'request': request,
            },
        )

        serializer.is_valid(
            raise_exception=True,
        )

        motif = serializer.validated_data[
            'motif_annulation'
        ]

        try:
            reservation.annuler(
                agent=request.user,
                motif=motif,
            )

        except DjangoValidationError as exc:

            if hasattr(exc, 'message_dict'):
                return Response(
                    exc.message_dict,
                    status=status.HTTP_400_BAD_REQUEST,
                )

            return Response(
                {
                    'detail': exc.messages,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        output_serializer = ReservationSerializer(
            reservation,
            context={
                'request': request,
            },
        )

        return Response(
            output_serializer.data,
            status=status.HTTP_200_OK,
        )

    # ========================================================
    # CONFIRMER
    # ========================================================

    @action(
        detail=True,
        methods=['post'],
        url_path='confirmer',
    )
    def confirmer(
        self,
        request,
        pk=None,
    ):
        """
        Confirme une réservation et génère son contrat.
        """

        # ----------------------------------------------------
        # PERMISSION
        # ----------------------------------------------------

        operator_error = (
            self._require_reservation_operator()
        )

        if operator_error:
            return operator_error

        # ----------------------------------------------------
        # RÉSERVATION
        # ----------------------------------------------------

        reservation = self.get_object()

        # ----------------------------------------------------
        # SERIALIZER
        # ----------------------------------------------------

        serializer = ReservationConfirmationSerializer(
            data=request.data,
            context={
                'request': request,
            },
        )

        serializer.is_valid(
            raise_exception=True,
        )

        # ----------------------------------------------------
        # CONFIRMATION MÉTIER
        # ----------------------------------------------------

        try:
            reservation = confirmer_reservation(
                reservation_id=reservation.id,
                agent=request.user,
            )

        except DjangoValidationError as exc:

            if hasattr(exc, 'message_dict'):
                return Response(
                    exc.message_dict,
                    status=status.HTTP_400_BAD_REQUEST,
                )

            return Response(
                {
                    'detail': exc.messages,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ----------------------------------------------------
        # GÉNÉRATION DU CONTRAT
        # ----------------------------------------------------

        try:
            contract = create_contract_for_reservation(
                reservation=reservation,
                created_by=request.user,
            )

            contract_data = {
                'generated': bool(contract.generated_file),
                'id': str(contract.id),
                'reference': contract.reference,
                'status': contract.status,
            }

        except Exception:
            logger.exception(
                "Échec de génération du contrat pour "
                "la réservation %s",
                reservation.id,
            )

            contract_data = {
                'generated': False,
                'detail': (
                    "Réservation confirmée, mais génération "
                    "du contrat échouée. Réessayez ou consultez "
                    "les logs du serveur."
                ),
            }

        # ----------------------------------------------------
        # RÉPONSE
        # ----------------------------------------------------

        output_serializer = ReservationSerializer(
            reservation,
            context={
                'request': request,
            },
        )

        response_data = output_serializer.data
        response_data['contract'] = contract_data

        return Response(
            response_data,
            status=status.HTTP_200_OK,
        )


    # ========================================================
    # DÉMARRER
    # ========================================================

    @action(
        detail=True,
        methods=['post'],
        url_path='demarrer',
    )
    def demarrer(
        self,
        request,
        pk=None,
    ):
        """
        CONFIRMED → EN_COURS.
        """

        operator_error = (
            self._require_reservation_operator()
        )

        if operator_error:
            return operator_error

        reservation = self.get_object()

        serializer = ReservationTransitionSerializer(
            data=request.data,
            context={
                'request': request,
            },
        )

        serializer.is_valid(
            raise_exception=True,
        )

        try:
            reservation.demarrer()

        except DjangoValidationError as exc:

            if hasattr(exc, 'message_dict'):
                return Response(
                    exc.message_dict,
                    status=status.HTTP_400_BAD_REQUEST,
                )

            return Response(
                {
                    'detail': exc.messages,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        output_serializer = ReservationSerializer(
            reservation,
            context={
                'request': request,
            },
        )

        return Response(
            output_serializer.data,
            status=status.HTTP_200_OK,
        )

    # ========================================================
    # TERMINER
    # ========================================================

    @action(
        detail=True,
        methods=['post'],
        url_path='terminer',
    )
    def terminer(
        self,
        request,
        pk=None,
    ):
        """
        EN_COURS → TERMINEE.
        """

        operator_error = (
            self._require_reservation_operator()
        )

        if operator_error:
            return operator_error

        reservation = self.get_object()

        serializer = ReservationTransitionSerializer(
            data=request.data,
            context={
                'request': request,
            },
        )

        serializer.is_valid(
            raise_exception=True,
        )

        try:
            reservation.terminer()

        except DjangoValidationError as exc:

            if hasattr(exc, 'message_dict'):
                return Response(
                    exc.message_dict,
                    status=status.HTTP_400_BAD_REQUEST,
                )

            return Response(
                {
                    'detail': exc.messages,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        output_serializer = ReservationSerializer(
            reservation,
            context={
                'request': request,
            },
        )

        return Response(
            output_serializer.data,
            status=status.HTTP_200_OK,
        )

    # ========================================================
    # RETOUR DES VÉHICULES
    # ========================================================

    @action(
        detail=True,
        methods=['post'],
        url_path='retour',
    )
    def retour(
        self,
        request,
        pk=None,
    ):
        """
        Enregistre le retour complet des véhicules.

        Autorisé :
            AGENT
            ADMIN
            SUPER_ADMIN
        """

        operator_error = (
            self._require_reservation_operator()
        )

        if operator_error:
            return operator_error

        reservation = self.get_object()

        serializer = VehicleReturnSerializer(
            data=request.data,
            context={
                'request': request,
                'reservation_id': reservation.id,
            },
        )

        serializer.is_valid(
            raise_exception=True,
        )

        try:
            retour = serializer.save()

        except DjangoValidationError as exc:

            if hasattr(exc, 'message_dict'):
                return Response(
                    exc.message_dict,
                    status=status.HTTP_400_BAD_REQUEST,
                )

            return Response(
                {
                    'detail': exc.messages,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        output_serializer = VehicleReturnSerializer(
            retour,
            context={
                'request': request,
            },
        )

        return Response(
            output_serializer.data,
            status=status.HTTP_200_OK,
        )

    # ========================================================
    # MES RÉSERVATIONS
    # ========================================================

    @action(
        detail=False,
        methods=['get'],
        url_path='mes-reservations',
    )
    def mes_reservations(
        self,
        request,
    ):
        """
        Retourne uniquement les réservations du client connecté.
        """

        if request.user.role != RoleChoices.CLIENT:
            return Response(
                {
                    'detail': _(
                        'Cette route est réservée aux clients.'
                    )
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        queryset = self.get_queryset().filter(
            client=request.user,
        )

        page = self.paginate_queryset(queryset)

        if page is not None:

            serializer = ReservationSerializer(
                page,
                many=True,
                context={
                    'request': request,
                },
            )

            return self.get_paginated_response(
                serializer.data
            )

        serializer = ReservationSerializer(
            queryset,
            many=True,
            context={
                'request': request,
            },
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )

    # ========================================================
    # RÉSERVATIONS EN ATTENTE
    # ========================================================

    @action(
        detail=False,
        methods=['get'],
        url_path='en-attente',
    )
    def en_attente(
        self,
        request,
    ):
        """
        Retourne les réservations PENDING_VERIFICATION.
        """

        staff_error = self._require_staff()

        if staff_error:
            return staff_error

        queryset = (
            self.get_queryset()
            .filter(
                statut=ReservationStatus.PENDING_VERIFICATION,
            )
        )

        page = self.paginate_queryset(queryset)

        if page is not None:

            serializer = ReservationSerializer(
                page,
                many=True,
                context={
                    'request': request,
                },
            )

            return self.get_paginated_response(
                serializer.data
            )

        serializer = ReservationSerializer(
            queryset,
            many=True,
            context={
                'request': request,
            },
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )

    # ========================================================
    # RÉSERVATIONS CONFIRMÉES
    # ========================================================

    @action(
        detail=False,
        methods=['get'],
        url_path='confirmees',
    )
    def confirmees(
        self,
        request,
    ):
        """
        Retourne les réservations CONFIRMED.
        """

        staff_error = self._require_staff()

        if staff_error:
            return staff_error

        queryset = (
            self.get_queryset()
            .filter(
                statut=ReservationStatus.CONFIRMED,
            )
        )

        page = self.paginate_queryset(queryset)

        if page is not None:

            serializer = ReservationSerializer(
                page,
                many=True,
                context={
                    'request': request,
                },
            )

            return self.get_paginated_response(
                serializer.data
            )

        serializer = ReservationSerializer(
            queryset,
            many=True,
            context={
                'request': request,
            },
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )