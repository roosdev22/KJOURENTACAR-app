import logging
from pathlib import Path

from django.http import FileResponse
from django.shortcuts import get_object_or_404

from rest_framework import generics, status
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import PlanificationRapport, RapportGenere
from .permissions import PeutConsulterRapports
from .serializers import (
    DemandeGenerationRapportSerializer,
    PeriodeRapportSerializer,
    PlanificationRapportSerializer,
    RapportGenereSerializer,
)
from .services.agregations import (
    rapport_financier,
    rapport_reservations,
    rapport_vehicules,
    rapport_contrats,
    rapport_maintenance,
)
from .services.generation import generer_rapport


logger = logging.getLogger(__name__)


class RapportAPIView(APIView):
    permission_classes = [PeutConsulterRapports]
    fonction_rapport = None

    def get(self, request):
        serializer = PeriodeRapportSerializer(
            data=request.query_params
        )
        serializer.is_valid(raise_exception=True)

        try:
            resultat = self.fonction_rapport(
                **serializer.validated_data
            )
        except ValueError as exc:
            raise ValidationError(
                {"detail": str(exc)}
            ) from exc

        return Response(resultat)


class RapportFinancierView(RapportAPIView):
    fonction_rapport = staticmethod(rapport_financier)


class RapportReservationsView(RapportAPIView):
    fonction_rapport = staticmethod(rapport_reservations)


class RapportVehiculesView(RapportAPIView):
    fonction_rapport = staticmethod(rapport_vehicules)


class RapportContratsView(RapportAPIView):
    fonction_rapport = staticmethod(rapport_contrats)


class RapportMaintenanceView(RapportAPIView):
    fonction_rapport = staticmethod(rapport_maintenance)


class PlanificationRapportListCreateView(
    generics.ListCreateAPIView
):
    serializer_class = PlanificationRapportSerializer
    permission_classes = [PeutConsulterRapports]

    def get_queryset(self):
        return (
            PlanificationRapport.objects
            .select_related("cree_par")
            .order_by("-cree_le")
        )

    def perform_create(self, serializer):
        serializer.save(cree_par=self.request.user)


class PlanificationRapportDetailView(
    generics.RetrieveUpdateDestroyAPIView
):
    serializer_class = PlanificationRapportSerializer
    permission_classes = [PeutConsulterRapports]

    queryset = PlanificationRapport.objects.select_related(
        "cree_par"
    )


class RapportGenereListView(generics.ListAPIView):
    serializer_class = RapportGenereSerializer
    permission_classes = [PeutConsulterRapports]

    queryset = (
        RapportGenere.objects
        .select_related("auteur", "planification")
        .order_by("-cree_le")
    )


class RapportGenerationView(APIView):
    permission_classes = [PeutConsulterRapports]

    def post(self, request):
        serializer = DemandeGenerationRapportSerializer(
            data=request.data
        )
        serializer.is_valid(raise_exception=True)
        donnees = serializer.validated_data

        date_debut = donnees.get("date_debut")
        date_fin = donnees.get("date_fin")

        if date_debut is None or date_fin is None:
            raise ValidationError({
                "date_debut": (
                    "Les dates de début et de fin sont obligatoires."
                ),
                "date_fin": (
                    "Les dates de début et de fin sont obligatoires."
                ),
            })

        try:
            rapport = generer_rapport(
                type_rapport=donnees["type_rapport"],
                format_rapport=donnees["format_rapport"],
                date_debut=date_debut,
                date_fin=date_fin,
                auteur=request.user,
            )
        except ValueError as exc:
            raise ValidationError(
                {"detail": str(exc)}
            ) from exc
        except Exception:
            logger.exception(
                "Erreur lors de la génération d'un rapport."
            )
            return Response(
                {
                    "detail": (
                        "La génération du rapport a échoué. "
                        "Consultez les journaux du serveur."
                    )
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response(
            RapportGenereSerializer(rapport).data,
            status=status.HTTP_201_CREATED,
        )


class RapportTelechargementView(APIView):
    permission_classes = [PeutConsulterRapports]

    def get(self, request, pk):
        rapport = get_object_or_404(
            RapportGenere,
            pk=pk,
        )

        if (
            rapport.statut != RapportGenere.StatutRapport.TERMINE
            or not rapport.fichier
        ):
            raise ValidationError({
                "detail": (
                    "Ce rapport n'est pas disponible au téléchargement."
                )
            })

        if not rapport.fichier.storage.exists(
            rapport.fichier.name
        ):
            raise ValidationError({
                "detail": "Le fichier du rapport est introuvable."
            })

        if rapport.format_rapport == "PDF":
            extension = "pdf"
            type_contenu = "application/pdf"
        elif rapport.format_rapport == "EXCEL":
            extension = "xlsx"
            type_contenu = (
                "application/vnd.openxmlformats-officedocument."
                "spreadsheetml.sheet"
            )
        else:
            raise ValidationError({
                "detail": "Le format de ce rapport est invalide."
            })

        nom_fichier = (
            f"{rapport.type_rapport.lower()}_{rapport.pk}.{extension}"
        )

        return FileResponse(
            rapport.fichier.open("rb"),
            as_attachment=True,
            filename=Path(nom_fichier).name,
            content_type=type_contenu,
        )
