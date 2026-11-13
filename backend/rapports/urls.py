
from django.urls import path

from .views import (
    RapportFinancierView,
    RapportReservationsView,
    RapportVehiculesView,
    RapportContratsView,
    RapportMaintenanceView,
    PlanificationRapportListCreateView,
    PlanificationRapportDetailView,
    RapportGenereListView,
    RapportGenerationView,
    RapportTelechargementView,
)

app_name = "rapports"

urlpatterns = [
    path("financier/", RapportFinancierView.as_view(), name="financier"),
    path("reservations/", RapportReservationsView.as_view(), name="reservations"),
    path("vehicules/", RapportVehiculesView.as_view(), name="vehicules"),
    path("contrats/", RapportContratsView.as_view(), name="contrats"),
    path("maintenance/", RapportMaintenanceView.as_view(), name="maintenance"),

    path(
        "planifications/",
        PlanificationRapportListCreateView.as_view(),
        name="planification-list-create",
    ),
    path(
        "planifications/<uuid:pk>/",
        PlanificationRapportDetailView.as_view(),
        name="planification-detail",
    ),
    path("generes/", RapportGenereListView.as_view(), name="generes"),

    path("generer/", RapportGenerationView.as_view(), name="generer"),
    path(
        "<uuid:pk>/telecharger/",
        RapportTelechargementView.as_view(),
        name="telecharger",
    ),
]
