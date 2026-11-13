
from django.core.exceptions import ValidationError as DjangoValidationError
from django.test import TestCase
from rest_framework.exceptions import ValidationError as DRFValidationError

from .models import HistoriqueParametre, ParametresEntreprise
from .services import ParametresEntrepriseService


class ParametresEntrepriseServiceTests(TestCase):
    def setUp(self):
        self.parametres = (
            ParametresEntrepriseService.obtenir_ou_creer()
        )

    def test_configuration_principale_est_unique(self):
        parametres = (
            ParametresEntrepriseService.obtenir_ou_creer()
        )

        self.assertEqual(parametres.pk, self.parametres.pk)
        self.assertEqual(
            ParametresEntreprise.objects.count(),
            1,
        )

    def test_modification_enregistre_un_historique(self):
        ancien_nom = self.parametres.nom_commercial
        nouveau_nom = "K-JOU RENT A CAR TEST"

        parametres, modifie = (
            ParametresEntrepriseService.modifier(
                donnees={"nom_commercial": nouveau_nom},
                utilisateur=None,
                justification="Test de modification",
            )
        )

        self.assertTrue(modifie)
        self.assertEqual(
            parametres.nom_commercial,
            nouveau_nom,
        )

        historique = HistoriqueParametre.objects.filter(
            action=HistoriqueParametre.Action.MODIFICATION,
            objet_id=str(parametres.pk),
        ).latest("date_action")

        self.assertEqual(
            historique.anciennes_valeurs["nom_commercial"],
            ancien_nom,
        )
        self.assertEqual(
            historique.nouvelles_valeurs["nom_commercial"],
            nouveau_nom,
        )
        self.assertEqual(
            historique.justification,
            "Test de modification",
        )

    def test_justification_est_obligatoire(self):
        with self.assertRaises(DRFValidationError):
            ParametresEntrepriseService.modifier(
                donnees={"nom_commercial": "Nouveau nom"},
                utilisateur=None,
                justification="   ",
            )

    def test_champ_non_autorise_est_refuse(self):
        with self.assertRaises(DRFValidationError):
            ParametresEntrepriseService.modifier(
                donnees={"modifie_par": None},
                utilisateur=None,
                justification="Test de sécurité",
            )

    def test_aucun_historique_si_aucune_valeur_ne_change(self):
        historique_avant = HistoriqueParametre.objects.count()

        parametres, modifie = (
            ParametresEntrepriseService.modifier(
                donnees={
                    "nom_commercial": self.parametres.nom_commercial,
                },
                utilisateur=None,
                justification="Aucun changement",
            )
        )

        self.assertFalse(modifie)
        self.assertEqual(
            parametres.nom_commercial,
            self.parametres.nom_commercial,
        )
        self.assertEqual(
            HistoriqueParametre.objects.count(),
            historique_avant,
        )

    def test_historique_existant_ne_peut_pas_etre_modifie(self):
        historique = HistoriqueParametre.objects.first()

        self.assertIsNotNone(historique)

        with self.assertRaises(DjangoValidationError):
            historique.save()

    def test_historique_ne_peut_pas_etre_supprime(self):
        historique = HistoriqueParametre.objects.first()

        self.assertIsNotNone(historique)

        with self.assertRaises(DjangoValidationError):
            historique.delete()
