"""
URL configuration for KJOURENTACAR project.
"""

from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from config.dashboard_views import AdminDashboardStatsView

urlpatterns = [
    # ============================================================
    # ADMINISTRATION DJANGO
    # ============================================================
    path(
        "admin/",
        admin.site.urls,
    ),

    # ============================================================
    # API UTILISATEURS
    # ============================================================
    path(
        "api/",
        include("users.urls"),
    ),

    # ============================================================
    # API VÉHICULES
    # ============================================================
    path(
        "api/vehicles/",
        include("vehicles.urls"),
    ),

        # ========================================================

    # path(
    #     'admin/',
    #     admin.site.urls,
    # ),

    # ========================================================
    # API RÉSERVATIONS
    # ========================================================

    path(
        'api/',
        include('reservations.urls'),
    ),

    path(
    "api/payments/",
    include("payments.urls"),
    ),

    # ============================================================
    # API CONTRATS
    # ============================================================
    path(
        "api/contracts/",
        include("contracts.urls"),
    ),

    # ============================================================
# API RAPPORTS
# ============================================================
    path(
        "api/rapports/",
        include("rapports.urls"),
    ),

    
    path("api/maintenance/", include("maintenance.urls")),

    path(
        "api/admin/dashboard/",
        AdminDashboardStatsView.as_view(),
        name="admin-dashboard-stats",
    ),

    path(
    "api/facturation/",
    include("facturation.urls"),
),


    path(
        "api/parametres/",
        include("parametres.urls"),
    ),

    path(
    "api/notifications/",
    include("notifications.urls"),
),


]




# ================================================================
# FICHIERS MEDIA — DÉVELOPPEMENT UNIQUEMENT
# ================================================================
if settings.DEBUG:
    urlpatterns += static(
        settings.MEDIA_URL,
        document_root=settings.MEDIA_ROOT,
    )

