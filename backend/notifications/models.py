
import uuid

from django.conf import settings
from django.db import models


class Notification(models.Model):
    class Type(models.TextChoices):
        RESERVATION = "RESERVATION", "Réservation"
        PAYMENT = "PAYMENT", "Paiement"
        CONTRACT = "CONTRACT", "Contrat"
        MAINTENANCE = "MAINTENANCE", "Maintenance"
        SYSTEM = "SYSTEM", "Système"

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    destinataire = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications",
    )

    type = models.CharField(
        max_length=20,
        choices=Type.choices,
        default=Type.SYSTEM,
        db_index=True,
    )

    titre = models.CharField(max_length=150)
    message = models.TextField()
    lien = models.CharField(max_length=255, blank=True)

    lue_le = models.DateTimeField(null=True, blank=True, db_index=True)
    cree_le = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ["-cree_le"]
        indexes = [
            models.Index(
                fields=["destinataire", "lue_le", "-cree_le"],
                name="notif_user_read_date_idx",
            ),
        ]

    def __str__(self):
        return f"{self.titre} — {self.destinataire}"
