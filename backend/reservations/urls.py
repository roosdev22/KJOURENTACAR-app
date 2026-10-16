from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import ReservationViewSet


# ============================================================
# ROUTER
# ============================================================

router = DefaultRouter()

router.register(
    r'reservations',
    ReservationViewSet,
    basename='reservation',
)


# ============================================================
# URLS
# ============================================================

urlpatterns = [
    path(
        '',
        include(router.urls),
    ),
]