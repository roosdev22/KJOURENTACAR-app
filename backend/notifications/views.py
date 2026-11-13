from django.shortcuts import render

# Create your views here.

from django.utils import timezone

from rest_framework import generics
from rest_framework.exceptions import NotFound
from rest_framework.response import Response
from rest_framework.views import APIView

from users.permissions import (
    IsAuthenticatedAndActive,
    IsNotForcedPasswordChange,
)

from .models import Notification
from .serializers import NotificationSerializer


class NotificationPermissionMixin:
    permission_classes = [
        IsAuthenticatedAndActive,
        IsNotForcedPasswordChange,
    ]

    def get_queryset(self):
        return Notification.objects.filter(
            destinataire=self.request.user,
        )


class NotificationListView(
    NotificationPermissionMixin,
    generics.ListAPIView,
):
    serializer_class = NotificationSerializer
    pagination_class = None

    def get_queryset(self):
        queryset = super().get_queryset()

        non_lues = self.request.query_params.get("non_lues")

        if non_lues == "true":
            queryset = queryset.filter(lue_le__isnull=True)
        elif non_lues == "false":
            queryset = queryset.filter(lue_le__isnull=False)

        return queryset


class NotificationUnreadCountView(
    NotificationPermissionMixin,
    APIView,
):
    def get(self, request):
        count = self.get_queryset().filter(
            lue_le__isnull=True,
        ).count()

        return Response({"count": count})


class NotificationMarkReadView(
    NotificationPermissionMixin,
    APIView,
):
    def post(self, request, pk):
        notification = self.get_queryset().filter(pk=pk).first()

        if notification is None:
            raise NotFound("Notification introuvable.")

        if notification.lue_le is None:
            notification.lue_le = timezone.now()
            notification.save(update_fields=["lue_le"])

        return Response(NotificationSerializer(notification).data)


class NotificationMarkAllReadView(
    NotificationPermissionMixin,
    APIView,
):
    def post(self, request):
        nombre = self.get_queryset().filter(
            lue_le__isnull=True,
        ).update(lue_le=timezone.now())

        return Response({"modifiees": nombre})
