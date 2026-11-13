
from rest_framework.routers import DefaultRouter

from facturation.views import FactureViewSet

router = DefaultRouter()
router.register("", FactureViewSet, basename="facture")

urlpatterns = router.urls
