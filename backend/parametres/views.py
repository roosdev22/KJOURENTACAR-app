
from rest_framework import generics
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import HistoriqueParametre
from .permissions import PeutConsulterParametres, PeutGererParametres
from .serializers import (
    HistoriqueParametreSerializer,
    ModifierParametresEntrepriseSerializer,
    ParametresEntrepriseSerializer,
)
from .services import ParametresEntrepriseService


class ParametresEntrepriseView(APIView):
    permission_classes = [PeutGererParametres]

    def get(self, request):
        parametres = ParametresEntrepriseService.obtenir_ou_creer(
            utilisateur=request.user
        )
        serializer = ParametresEntrepriseSerializer(parametres)
        return Response(serializer.data)

    def patch(self, request):
        parametres = ParametresEntrepriseService.obtenir_ou_creer(
            utilisateur=request.user
        )

        serializer = ModifierParametresEntrepriseSerializer(
            parametres,
            data=request.data,
            partial=True,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        parametres = serializer.save()

        return Response(
            ParametresEntrepriseSerializer(parametres).data
        )

    def put(self, request):
        parametres = ParametresEntrepriseService.obtenir_ou_creer(
            utilisateur=request.user
        )

        serializer = ModifierParametresEntrepriseSerializer(
            parametres,
            data=request.data,
            partial=False,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        parametres = serializer.save()

        return Response(
            ParametresEntrepriseSerializer(parametres).data
        )


class HistoriqueParametreListView(generics.ListAPIView):
    serializer_class = HistoriqueParametreSerializer
    permission_classes = [PeutConsulterParametres]

    def get_queryset(self):
        queryset = HistoriqueParametre.objects.select_related(
            "utilisateur"
        ).all()

        action = self.request.query_params.get("action")
        modele = self.request.query_params.get("modele")

        if action:
            queryset = queryset.filter(action=action)

        if modele:
            queryset = queryset.filter(modele=modele)

        return queryset
