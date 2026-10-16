
"""
URL Configuration pour l'application users.

Toutes les routes d'authentification et de gestion des utilisateurs
sont gérées par UserViewSet.

Base URL :
    /api/

Exemples :
    POST /api/users/login/
    GET  /api/users/me/
    POST /api/users/change_password/
    POST /api/users/verify_email/
    POST /api/users/forgot_password/
    POST /api/users/reset_password/
    POST /api/users/google_login/
    POST /api/users/create_by_admin/
    PATCH /api/users/{id}/change_role/
"""


from django.urls import include, path
from rest_framework.routers import DefaultRouter

from users import views


# ============================================================
# ROUTER USER
# ============================================================

router = DefaultRouter()

router.register(
    r"users",
    views.UserViewSet,
    basename="user",
)


# ============================================================
# URL PATTERNS
# ============================================================

urlpatterns = [
    # --------------------------------------------------------
    # UserViewSet
    # --------------------------------------------------------
    #
    # Le router génère automatiquement les routes CRUD :
    #
    # GET     /api/users/
    # POST    /api/users/
    # GET     /api/users/{id}/
    # PUT     /api/users/{id}/
    # PATCH   /api/users/{id}/
    # DELETE  /api/users/{id}/
    #
    # Et les @action de UserViewSet :
    #
    # POST /api/users/login/
    # GET  /api/users/me/
    # POST /api/users/change_password/
    # POST /api/users/create_by_admin/
    # PATCH /api/users/{id}/change_role/
    # POST /api/users/verify_email/
    # POST /api/users/forgot_password/
    # POST /api/users/reset_password/
    # POST /api/users/validate_reset_token/
    # POST /api/users/google_login/
    #
    # GET  /api/users/trash/
    # POST /api/users/{id}/restore/
    # GET  /api/users/{id}/audit_history/
    # GET  /api/users/eligibility/
    #
    path(
        "",
        include(router.urls),
    ),
]

