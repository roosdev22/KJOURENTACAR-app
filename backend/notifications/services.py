
from django.db import transaction

from .models import Notification


class NotificationService:
    @staticmethod
    @transaction.atomic
    def creer(
        *,
        destinataire,
        titre: str,
        message: str,
        type_notification: str = Notification.Type.SYSTEM,
        lien: str = "",
    ) -> Notification:
        if destinataire is None or not getattr(
            destinataire, "is_authenticated", False
        ):
            raise ValueError(
                "Un utilisateur authentifié est obligatoire."
            )

        titre = titre.strip()
        message = message.strip()
        lien = lien.strip()

        if not titre:
            raise ValueError("Le titre est obligatoire.")

        if not message:
            raise ValueError("Le message est obligatoire.")

        types_valides = {
            choix[0] for choix in Notification.Type.choices
        }

        if type_notification not in types_valides:
            raise ValueError("Le type de notification est invalide.")

        return Notification.objects.create(
            destinataire=destinataire,
            titre=titre,
            message=message,
            type=type_notification,
            lien=lien,
        )

    @staticmethod
    def creer_pour_plusieurs(
        *,
        destinataires,
        titre: str,
        message: str,
        type_notification: str = Notification.Type.SYSTEM,
        lien: str = "",
    ) -> int:
        titre = titre.strip()
        message = message.strip()
        lien = lien.strip()

        if not titre or not message:
            raise ValueError(
                "Le titre et le message sont obligatoires."
            )

        types_valides = {
            choix[0] for choix in Notification.Type.choices
        }

        if type_notification not in types_valides:
            raise ValueError("Le type de notification est invalide.")

        utilisateurs = list(destinataires)

        notifications = [
            Notification(
                destinataire=utilisateur,
                titre=titre,
                message=message,
                type=type_notification,
                lien=lien,
            )
            for utilisateur in utilisateurs
            if utilisateur is not None
            and getattr(utilisateur, "is_authenticated", False)
            and getattr(utilisateur, "is_active", False)
            and getattr(utilisateur, "deleted_at", None) is None
        ]

        with transaction.atomic():
            Notification.objects.bulk_create(notifications)

        return len(notifications)
