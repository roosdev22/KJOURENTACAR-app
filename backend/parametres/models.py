
from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import RegexValidator
from django.db import models


prefix_validator = RegexValidator(
    regex=r"^[A-Z0-9][A-Z0-9_-]{0,19}$",
    message=(
        "Le préfixe doit contenir entre 1 et 20 caractères : "
        "lettres majuscules, chiffres, tirets ou underscores."
    ),
)


class ParametresEntreprise(models.Model):
    """
    Configuration générale de KJOURENTACAR.

    Une seule configuration principale est autorisée.
    Les changements doivent être effectués par le service métier
    afin de garantir leur traçabilité.
    """

    class Devise(models.TextChoices):
        HTG = "HTG", "Gourde haïtienne"
        USD = "USD", "Dollar américain"

    cle = models.CharField(
        max_length=20,
        default="principal",
        unique=True,
        editable=False,
    )

    # Identité de l'entreprise
    raison_sociale = models.CharField(
        max_length=200,
        blank=True,
        default="",
        verbose_name="Raison sociale",
    )
    nom_commercial = models.CharField(
        max_length=200,
        blank=True,
        default="K-JOU RENT A CAR",
        verbose_name="Nom commercial",
    )
    nif = models.CharField(
        max_length=50,
        blank=True,
        default="",
        verbose_name="NIF",
    )
    patente = models.CharField(
        max_length=50,
        blank=True,
        default="",
        verbose_name="Numéro de patente",
    )

    # Coordonnées
    adresse = models.TextField(
        blank=True,
        default="",
        verbose_name="Adresse",
    )
    telephone = models.CharField(
        max_length=30,
        blank=True,
        default="",
        verbose_name="Téléphone",
    )
    email = models.EmailField(
        blank=True,
        default="",
        verbose_name="Adresse e-mail",
    )
    site_web = models.URLField(
        blank=True,
        default="",
        verbose_name="Site web",
    )

    # Configuration financière générale
    devise_defaut = models.CharField(
        max_length=3,
        choices=Devise.choices,
        default=Devise.HTG,
        verbose_name="Devise par défaut",
    )

    # Préfixes utilisés par les modules métier
    prefixe_reservation = models.CharField(
        max_length=20,
        default="RES",
        validators=[prefix_validator],
        verbose_name="Préfixe des réservations",
    )
    prefixe_facture = models.CharField(
        max_length=20,
        default="FAC",
        validators=[prefix_validator],
        verbose_name="Préfixe des factures",
    )
    prefixe_contrat = models.CharField(
        max_length=20,
        default="CTR",
        validators=[prefix_validator],
        verbose_name="Préfixe des contrats",
    )

    # Traçabilité de la configuration
    modifie_par = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="parametres_entreprise_modifies",
        verbose_name="Modifié par",
    )
    cree_le = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Créé le",
    )
    modifie_le = models.DateTimeField(
        auto_now=True,
        verbose_name="Modifié le",
    )

    class Meta:
        verbose_name = "Paramètre de l'entreprise"
        verbose_name_plural = "Paramètres de l'entreprise"

    def clean(self):
        super().clean()

        if self.cle != "principal":
            raise ValidationError(
                {"cle": "La clé doit être « principal »."}
            )

        for field_name in (
            "prefixe_reservation",
            "prefixe_facture",
            "prefixe_contrat",
        ):
            value = getattr(self, field_name, "")
            if value:
                setattr(self, field_name, value.upper())

    def save(self, *args, **kwargs):
        # Normaliser avant full_clean pour valider les préfixes
        # après leur conversion en majuscules.
        self.cle = "principal"

        for field_name in (
            "prefixe_reservation",
            "prefixe_facture",
            "prefixe_contrat",
        ):
            value = getattr(self, field_name, "")
            if value:
                setattr(self, field_name, value.upper())

        self.full_clean()
        return super().save(*args, **kwargs)

    def __str__(self):
        return (
            self.nom_commercial
            or self.raison_sociale
            or "Paramètres de l'entreprise"
        )


class HistoriqueParametre(models.Model):
    """
    Journal des changements des paramètres.

    Les entrées sont créées par les services métier.
    Elles ne doivent pas être modifiées ou supprimées
    par les opérations normales de l'application.
    """

    class Action(models.TextChoices):
        CREATION = "CREATION", "Création"
        MODIFICATION = "MODIFICATION", "Modification"
        ACTIVATION = "ACTIVATION", "Activation"
        DESACTIVATION = "DESACTIVATION", "Désactivation"

    utilisateur = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="historique_parametres",
        verbose_name="Utilisateur responsable",
    )

    action = models.CharField(
        max_length=20,
        choices=Action.choices,
        verbose_name="Action",
    )
    modele = models.CharField(
        max_length=100,
        verbose_name="Modèle concerné",
    )
    objet_id = models.CharField(
        max_length=100,
        blank=True,
        default="",
        verbose_name="Identifiant de l'objet",
    )
    description = models.CharField(
        max_length=255,
        verbose_name="Description",
    )
    justification = models.TextField(
        blank=True,
        default="",
        verbose_name="Motif du changement",
    )

    anciennes_valeurs = models.JSONField(
        default=dict,
        blank=True,
        verbose_name="Valeurs précédentes",
    )
    nouvelles_valeurs = models.JSONField(
        default=dict,
        blank=True,
        verbose_name="Nouvelles valeurs",
    )

    date_action = models.DateTimeField(
        auto_now_add=True,
        editable=False,
        verbose_name="Date de l'action",
    )

    class Meta:
        verbose_name = "Historique des paramètres"
        verbose_name_plural = "Historique des paramètres"
        ordering = ["-date_action", "-pk"]

    def save(self, *args, **kwargs):
        # Une entrée existante ne peut pas être modifiée
        # via save() : chaque changement doit créer une entrée.
        if not self._state.adding:
            raise ValidationError(
                "Une entrée d'historique existante est immuable."
            )

        self.full_clean()
        return super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        raise ValidationError(
            "La suppression de l'historique est interdite."
        )

    def __str__(self):
        return (
            f"{self.action} — {self.modele} — "
            f"{self.date_action:%Y-%m-%d %H:%M}"
        )
