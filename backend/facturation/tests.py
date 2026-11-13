
import uuid
from datetime import timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone

from facturation.models import Facture
from facturation.services import FacturationService
from reservations.models import Reservation


User = get_user_model()


class FacturationServiceTests(TestCase):
    """Tests des règles métier du service de facturation."""

    def setUp(self):
        self.agent = self._creer_utilisateur("AGENT")
        self.client = self._creer_utilisateur("CLIENT")
        self.reservation = self._creer_reservation()

    @staticmethod
    def _creer_utilisateur(role):
        identifiant = uuid.uuid4().hex[:12]

        return User.objects.create_user(
            email=f"{role.lower()}-{identifiant}@example.com",
            password="TestPassword123!",
            first_name="Test",
            last_name=role,
            phone=f"509{uuid.uuid4().int % 10**8:08d}",
            address="Adresse de test",
            id_document_type="PASSPORT",
            role=role,
            is_active=True,
        )

    def _creer_reservation(self, statut="CONFIRMED", montant="2500.00"):
        aujourd_hui = timezone.localdate()

        return Reservation.objects.create(
            numero=f"RES-TEST-{uuid.uuid4().hex[:10].upper()}",
            client=self.client,
            created_by=self.agent,
            date_debut=aujourd_hui + timedelta(days=1),
            date_fin=aujourd_hui + timedelta(days=3),
            nombre_jours=2,
            montant_total=Decimal(montant),
            caution_totale=Decimal("1000.00"),
            statut=statut,
            date_confirmation=(
                timezone.now() if statut == "CONFIRMED" else None
            ),
            source="AGENT",
            notes_client="",
            notes_agent="",
            motif_annulation="",
        )

    def test_creer_facture_pour_reservation_confirmee(self):
        facture, creee = FacturationService.creer_facture(
            reservation_id=self.reservation.pk,
            utilisateur=self.agent,
        )

        self.assertTrue(creee)
        self.assertEqual(facture.statut, Facture.Statut.EMISE)
        self.assertEqual(facture.reservation_id, self.reservation.pk)
        self.assertEqual(facture.creee_par_id, self.agent.pk)
        self.assertEqual(facture.devise, "HTG")
        self.assertEqual(facture.montant_location, Decimal("2500.00"))
        self.assertEqual(facture.montant_caution, Decimal("1000.00"))
        self.assertTrue(facture.reference.startswith("FAC-"))
        self.assertEqual(Facture.objects.count(), 1)

    def test_deuxieme_demande_ne_cree_pas_de_doublon(self):
        premiere, premiere_creee = FacturationService.creer_facture(
            reservation_id=self.reservation.pk,
            utilisateur=self.agent,
        )
        seconde, seconde_creee = FacturationService.creer_facture(
            reservation_id=self.reservation.pk,
            utilisateur=self.agent,
        )

        self.assertTrue(premiere_creee)
        self.assertFalse(seconde_creee)
        self.assertEqual(premiere.pk, seconde.pk)
        self.assertEqual(Facture.objects.count(), 1)

    def test_reservation_non_confirmee_refusee(self):
        reservation = self._creer_reservation(statut="PENDING_VERIFICATION")

        with self.assertRaisesMessage(
            ValueError,
            "La réservation doit être confirmée avant la facturation.",
        ):
            FacturationService.creer_facture(
                reservation_id=reservation.pk,
                utilisateur=self.agent,
            )

        self.assertFalse(Facture.objects.filter(reservation=reservation).exists())

    def test_role_client_refuse(self):
        with self.assertRaisesMessage(
            ValueError,
            "Vous n'êtes pas autorisé à créer une facture.",
        ):
            FacturationService.creer_facture(
                reservation_id=self.reservation.pk,
                utilisateur=self.client,
            )

        self.assertEqual(Facture.objects.count(), 0)

    def test_montant_location_invalide_refuse(self):
        reservation = self._creer_reservation(montant="0.00")

        with self.assertRaisesMessage(
            ValueError,
            "Le montant de location de la réservation est invalide.",
        ):
            FacturationService.creer_facture(
                reservation_id=reservation.pk,
                utilisateur=self.agent,
            )

        self.assertFalse(Facture.objects.filter(reservation=reservation).exists())

    def test_reservation_inexistante_refusee(self):
        with self.assertRaisesMessage(
            ValueError,
            "La réservation demandée n'existe pas.",
        ):
            FacturationService.creer_facture(
                reservation_id=uuid.uuid4(),
                utilisateur=self.agent,
            )

        self.assertEqual(Facture.objects.count(), 0)
