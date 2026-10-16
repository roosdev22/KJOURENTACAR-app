from django.core.exceptions import ValidationError
from django.http import FileResponse
from django.shortcuts import get_object_or_404

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Contract
from .serializers import ContractSerializer, SignedContractUploadSerializer
from .services import cancel_contract, upload_signed_contract


STAFF_ROLES = {
    "AGENT",
    "GESTIONNAIRE",
    "ADMIN",
    "SUPER_ADMIN",
}

OPERATOR_ROLES = {
    "AGENT",
    "ADMIN",
    "SUPER_ADMIN",
}


def _visible_contracts(user):
    """Limite les contrats consultables par l'utilisateur connecté."""
    queryset = Contract.objects.select_related(
        "reservation",
        "reservation__client",
        "created_by",
    )

    role = getattr(user, "role", None)

    if role == "CLIENT":
        return queryset.filter(reservation__client_id=user.pk)

    if role in STAFF_ROLES:
        return queryset

    return queryset.none()


def _error_response(exc):
    return Response(
        {"detail": exc.messages},
        status=status.HTTP_400_BAD_REQUEST,
    )


class ContractListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        contracts = _visible_contracts(request.user)
        serializer = ContractSerializer(contracts, many=True)
        return Response(serializer.data)


class ContractDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        contract = get_object_or_404(
            _visible_contracts(request.user),
            pk=pk,
        )
        return Response(ContractSerializer(contract).data)


class ContractUploadSignedView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        if getattr(request.user, "role", None) not in OPERATOR_ROLES:
            return Response(
                {"detail": "Vous n'êtes pas autorisé à téléverser ce document."},
                status=status.HTTP_403_FORBIDDEN,
            )

        contract = get_object_or_404(
            _visible_contracts(request.user),
            pk=pk,
        )

        serializer = SignedContractUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            contract = upload_signed_contract(
                contract=contract,
                uploaded_file=serializer.validated_data["file"],
            )
        except ValidationError as exc:
            return _error_response(exc)

        return Response(
            ContractSerializer(contract).data,
            status=status.HTTP_200_OK,
        )


class ContractCancelView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        if getattr(request.user, "role", None) not in OPERATOR_ROLES:
            return Response(
                {"detail": "Vous n'êtes pas autorisé à annuler ce contrat."},
                status=status.HTTP_403_FORBIDDEN,
            )

        contract = get_object_or_404(
            _visible_contracts(request.user),
            pk=pk,
        )

        try:
            contract = cancel_contract(contract.pk)
        except ValidationError as exc:
            return _error_response(exc)

        return Response(ContractSerializer(contract).data)


class ContractDownloadView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk, document_type):
        contract = get_object_or_404(
            _visible_contracts(request.user),
            pk=pk,
        )

        if document_type == "generated":
            document = contract.generated_file
            filename = f"{contract.reference}.pdf"
        elif document_type == "signed":
            document = contract.signed_file
            filename = f"{contract.reference}-signe.pdf"
        else:
            return Response(
                {"detail": "Type de document inconnu."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not document or not document.name:
            return Response(
                {"detail": "Le document demandé n'est pas disponible."},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            file_handle = document.open("rb")
        except (FileNotFoundError, OSError):
            return Response(
                {"detail": "Le fichier est introuvable dans le stockage."},
                status=status.HTTP_404_NOT_FOUND,
            )

        return FileResponse(
            file_handle,
            as_attachment=True,
            filename=filename,
            content_type="application/pdf",
        )