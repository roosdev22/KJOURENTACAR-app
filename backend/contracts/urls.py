from django.urls import path

from .views import (
    ContractCancelView,
    ContractDetailView,
    ContractDownloadView,
    ContractListView,
    ContractUploadSignedView,
)


app_name = "contracts"

urlpatterns = [
    path("", ContractListView.as_view(), name="list"),
    path("<uuid:pk>/", ContractDetailView.as_view(), name="detail"),
    path(
        "<uuid:pk>/upload-signed/",
        ContractUploadSignedView.as_view(),
        name="upload-signed",
    ),
    path(
        "<uuid:pk>/cancel/",
        ContractCancelView.as_view(),
        name="cancel",
    ),
    path(
        "<uuid:pk>/download/<str:document_type>/",
        ContractDownloadView.as_view(),
        name="download",
    ),
]