
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase, APIClient

from users.models import User
from notifications.models import Notification
from django.utils import timezone

class NotificationAPITests(APITestCase):
    def setUp(self):
        self.client_a = User.objects.create_user(
            email="notification-a@example.com",
            password="TestPassword-2026!",
            role="CLIENT",
        )
        self.client_b = User.objects.create_user(
            email="notification-b@example.com",
            password="TestPassword-2026!",
            role="CLIENT",
        )

        self.api_a = APIClient()
        self.api_a.force_authenticate(user=self.client_a)

        self.api_b = APIClient()
        self.api_b.force_authenticate(user=self.client_b)

        self.notification_non_lue = Notification.objects.create(
            destinataire=self.client_a,
            type=Notification.Type.RESERVATION,
            titre="Réservation créée",
            message="Votre réservation a été créée.",
        )

        self.notification_lue = Notification.objects.create(
            destinataire=self.client_a,
            type=Notification.Type.PAYMENT,
            titre="Paiement reçu",
            message="Votre paiement a été enregistré.",
            lue_le=__import__(
                "django.utils.timezone",
                fromlist=["now"],
            ).now(),
        )

        self.notification_autre_utilisateur = Notification.objects.create(
            destinataire=self.client_b,
            type=Notification.Type.SYSTEM,
            titre="Notification privée",
            message="Cette notification appartient à un autre utilisateur.",
        )

    def test_liste_limitee_aux_notifications_de_l_utilisateur(self):
        response = self.api_a.get(reverse("notifications:list"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

        ids = {str(item["id"]) for item in response.data}
        self.assertIn(str(self.notification_non_lue.id), ids)
        self.assertIn(str(self.notification_lue.id), ids)
        self.assertNotIn(
            str(self.notification_autre_utilisateur.id),
            ids,
        )

    def test_compteur_des_notifications_non_lues(self):
        response = self.api_a.get(
            reverse("notifications:unread-count")
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 1)

    def test_marquer_une_notification_comme_lue(self):
        response = self.api_a.post(
            reverse(
                "notifications:mark-read",
                kwargs={"pk": self.notification_non_lue.id},
            )
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.notification_non_lue.refresh_from_db()
        self.assertIsNotNone(self.notification_non_lue.lue_le)
        self.assertTrue(response.data["est_lue"])

    def test_impossible_de_lire_la_notification_d_un_autre(self):
        response = self.api_a.post(
            reverse(
                "notifications:mark-read",
                kwargs={
                    "pk": self.notification_autre_utilisateur.id,
                },
            )
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

        self.notification_autre_utilisateur.refresh_from_db()
        self.assertIsNone(self.notification_autre_utilisateur.lue_le)

    def test_marquer_toutes_ses_notifications_comme_lues(self):
        response = self.api_a.post(
            reverse("notifications:mark-all-read")
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["modifiees"], 1)

        self.assertFalse(
            Notification.objects.filter(
                destinataire=self.client_a,
                lue_le__isnull=True,
            ).exists()
        )

        self.notification_autre_utilisateur.refresh_from_db()
        self.assertIsNone(self.notification_autre_utilisateur.lue_le)
