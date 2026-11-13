
from django.urls import path

from .views import (
    HistoriqueParametreListView,
    ParametresEntrepriseView,
)

app_name = "parametres"

urlpatterns = [
    path(
        "",
        ParametresEntrepriseView.as_view(),
        name="entreprise",
    ),
    path(
        "historique/",
        HistoriqueParametreListView.as_view(),
        name="historique",
    ),
]
