# ty: ignore
import uuid
from datetime import date, timedelta
from typing import TYPE_CHECKING, Optional, Any
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.core.exceptions import ValidationError
from django.core.validators import RegexValidator
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
if TYPE_CHECKING:
    from django.db.models.manager import Manager
    from django.db.models.fields.related_descriptors import RelatedManager
    from .models import SocialAccount, PasswordResetToken
from simple_history.models import HistoricalRecords
import re




class RoleChoices(models.TextChoices):
    CLIENT       = 'CLIENT',       _('Client')
    AGENT        = 'AGENT',        _('Agent de location')
    GESTIONNAIRE = 'GESTIONNAIRE', _('Gestionnaire du parc automobile')
    ADMIN        = 'ADMIN',        _('Admin')
    SUPER_ADMIN  = 'SUPER_ADMIN',  _('Super Admin')


# Rôles qui sont du personnel interne (pas CLIENT)
INTERNAL_ROLES = [
    RoleChoices.AGENT,
    RoleChoices.GESTIONNAIRE,
    RoleChoices.ADMIN,
    RoleChoices.SUPER_ADMIN,
]

# Rôles qui ont accès à l'admin Django
STAFF_ROLES = [
    RoleChoices.AGENT,
    RoleChoices.GESTIONNAIRE,
    RoleChoices.ADMIN,
    RoleChoices.SUPER_ADMIN,
]


class SocialProviderChoices(models.TextChoices):
    GOOGLE = 'google', _('Google')


# ========== VALIDATEURS ==========

phone_regex = RegexValidator(
        regex=r'^\+?[1-9]\d{7,14}$',
        message=_('Numéro de téléphone invalide (format: +33612345678)'),
        code='invalid_phone'
    )
        
license_regex = RegexValidator(
        regex=r'^[A-Za-z0-9\- ]{5,30}$',
        message=_('Numéro de permis invalide'),
        code='invalid_license'
    )

document_number_regex = RegexValidator(
        regex=r'^[A-Za-z0-9\- ]{3,50}$',
        message=_('Numéro de pièce d’identité invalide.'),
        code='invalid_document_number',
    )




def validate_address(value):
    if not value:
        return

    value = value.strip()

    if len(value) < 10:
        raise ValidationError(
            _('L’adresse doit contenir au moins 10 caractères.')
        )

    if len(value) > 255:
        raise ValidationError(
            _('L’adresse ne peut pas dépasser 255 caractères.')
        )

    # Au moins une lettre
    if not re.search(r'[A-Za-zÀ-ÖØ-öø-ÿ]', value):
        raise ValidationError(
            _('L’adresse doit contenir au moins une lettre.')
        )

    # Refuse une répétition excessive d'un même caractère
    if re.search(r'(.)\1{6,}', value):
        raise ValidationError(
            _('L’adresse saisie n’est pas valide.')
        )

    # Caractères autorisés :
    # lettres, chiffres, espaces, virgules, points,
    # apostrophes, tirets, slash et #
    if not re.fullmatch(
        r"[A-Za-zÀ-ÖØ-öø-ÿ0-9\s,.'’/#-]+",
        value
    ):
        raise ValidationError(
            _('L’adresse contient des caractères non autorisés.')
        )
class UserManager(BaseUserManager):
    """Manager utilisateur pour le modèle User."""
    
    def get_queryset(self):
        from django.db.models.query import QuerySet
        return super().get_queryset().filter(deleted_at__isnull=True)
    def create_user(
        self,
        email: str,
        password: Optional[str] = None,
        **extra_fields: Any
    ) -> 'User':

        if not email:
            raise ValueError(_('L\'adresse email est obligatoire'))

        email = self.normalize_email(email)
        extra_fields.setdefault('role', RoleChoices.CLIENT)

        oauth_only = extra_fields.get('oauth_only', False)

        if not oauth_only and not password:
            raise ValueError(_('Un mot de passe est obligatoire (sauf pour OAuth)'))

        role = extra_fields.get('role')

        # Personnel interne : changement de mot de passe obligatoire à la 1ère connexion
        if role in [RoleChoices.AGENT, RoleChoices.GESTIONNAIRE, RoleChoices.ADMIN]:
            extra_fields.setdefault('force_password_change', True)
            extra_fields.setdefault('is_email_verified', True)

        user = self.model(email=email, **extra_fields)

        if password:
            user.set_password(password)

        user.save(using=self._db)
        return user

    def create_superuser(
        self,
        email: str,
        password: Optional[str] = None,
        **extra_fields: Any
    ) -> 'User':

        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', RoleChoices.SUPER_ADMIN)
        extra_fields.setdefault('is_email_verified', True)
        extra_fields.setdefault('force_password_change', False)
        extra_fields.setdefault('oauth_only', False)

        if extra_fields.get('is_staff') is not True:
            raise ValueError(_('Superuser doit avoir is_staff=True.'))
        if extra_fields.get('is_superuser') is not True:
            raise ValueError(_('Superuser doit avoir is_superuser=True.'))
        if extra_fields.get('role') != RoleChoices.SUPER_ADMIN:
            raise ValueError(_('Superuser doit avoir le rôle SUPER_ADMIN.'))
        if not password:
            raise ValueError(_('Superuser doit avoir un mot de passe.'))

        return self.create_user(email, password, **extra_fields)


class User(PermissionsMixin, AbstractBaseUser):
    """Modèle utilisateur personnalisé avec support OAuth2."""

    # ========== IDENTIFIANT ==========
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # ========== AUTHENTIFICATION ==========
    email = models.EmailField(_('adresse email'), unique=True, db_index=True)

    # ========== INFORMATIONS PERSONNELLES ==========
    first_name = models.CharField(_('prénom'), max_length=150, blank=True)
    last_name  = models.CharField(_('nom'),    max_length=150, blank=True)
    phone = models.CharField(
        _('numéro de téléphone'),
        max_length=20,
        blank=True,
        validators=[phone_regex],
        help_text=_('Format: +33612345678')
    )
    address = models.TextField(
        _('adresse'),
        blank=True,
        help_text=_('Adresse complète pour le contrat de location')
    )

    # ========== DOCUMENTS DE VÉRIFICATION ==========
    driving_license_number = models.CharField(
        _('numéro de permis'),
        max_length=50,
        unique=True,
        null=True,
        blank=True,
        validators=[license_regex],
        db_index=True,
    )
    driving_license_expiry = models.DateField(
        _('date d\'expiration du permis'),
        null=True,
        blank=True,
    )
    id_document_type = models.CharField(
        _('type de pièce d\'identité'),
        max_length=20,
        choices=[
            ('PASSPORT',        _('Passeport')),
            ('ID_CARD',         _('Carte d\'identité')),
            ('DRIVER_LICENSE',  _('Permis de conduire')),
        ],
        blank=True,
    )
    id_document_number = models.CharField(
        _('numéro de pièce d\'identité'),
        max_length=50,
        unique=True,
        null=True,
        blank=True,
        validators=[document_number_regex],
        db_index=True,
)

    # ========== RÔLES ET PERMISSIONS ==========
    role = models.CharField(
        _('rôle'),
        max_length=20,
        choices=RoleChoices.choices,
        default=RoleChoices.CLIENT,
        db_index=True,
    )
    is_active = models.BooleanField(
        _('actif'),
        default=True,
        help_text=_('Un utilisateur inactif ne peut pas se connecter')
    )
    is_staff = models.BooleanField(
        _('staff'),
        default=False,
        help_text=_('Accès à l\'admin Django')
    )
    force_password_change = models.BooleanField(
        _('forcer le changement de mot de passe'),
        default=False,
    )

    # ========== OAUTH2 ==========
    oauth_only = models.BooleanField(
        _('authentification OAuth uniquement'),
        default=False,
    )

    # ========== MÉTADONNÉES ==========
    created_at       = models.DateTimeField(_('créé le'), default=timezone.now, editable=False)
    updated_at       = models.DateTimeField(_('mis à jour le'), auto_now=True)
    is_email_verified = models.BooleanField(_('email vérifié'), default=False)

    # ========== TYPE HINTS RELATIONS INVERSES ==========
    if TYPE_CHECKING:
        social_accounts: 'RelatedManager[SocialAccount]'
        reset_tokens:    'RelatedManager[PasswordResetToken]'

    objects = UserManager()
    all_objects = models.Manager() 

    USERNAME_FIELD  = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']

    class Meta:
        verbose_name          = _('utilisateur')
        verbose_name_plural   = _('utilisateurs')
        ordering              = ['-created_at']
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['driving_license_number']),
            models.Index(fields=['id_document_number']),
            models.Index(fields=['role']),
            models.Index(fields=['oauth_only']),
            models.Index(fields=['-created_at']),
        ]

    deleted_at = models.DateTimeField(
        _('supprimé le'),
        null=True,
        blank=True,
        db_index=True,
        help_text=_('Null = utilisateur actif. Non-null = soft-deleted, restaurable.')
    )
    deleted_by = models.ForeignKey(
        'self',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='deleted_users',
        verbose_name=_('supprimé par'),
    )

    history = HistoricalRecords(
        verbose_name=_('historique'),
        history_change_reason_field=models.TextField(null=True, blank=True),
    )

    def __str__(self) -> str:
        role_display = dict(RoleChoices.choices).get(self.role, self.role)
        return f"{self.email} ({role_display})"

    # ========== SAVE — synchronise is_staff / is_superuser avec le rôle ==========
    def save(self, *args: Any, **kwargs: Any) -> None:
        self.is_staff     = self.role in STAFF_ROLES
        self.is_superuser = self.role == RoleChoices.SUPER_ADMIN
        super().save(*args, **kwargs)

    @property
    def is_deleted(self) -> bool:
        """True si l'utilisateur est en soft-delete (restaurable)."""
        return self.deleted_at is not None
    # ========== VALIDATION ==========
    def clean(self) -> None:
        super().clean()

        if self.driving_license_number and not self.driving_license_expiry:
            raise ValidationError({
                'driving_license_expiry': _('Date d\'expiration obligatoire si numéro fourni')
            })

        if self.driving_license_expiry and self.driving_license_expiry < date.today():
            raise ValidationError({
                'driving_license_expiry': _('Le permis est expiré')
            })

        if self.address and not self.phone:
            raise ValidationError({
                'phone': _('Téléphone requis si adresse fournie')
            })

        # ✅ GESTIONNAIRE au lieu de MANAGER (corrigé)
        if self.oauth_only and self.role in [
            RoleChoices.AGENT,
            RoleChoices.GESTIONNAIRE,
            RoleChoices.ADMIN,
        ]:
            raise ValidationError({
                'oauth_only': _('Un AGENT/GESTIONNAIRE/ADMIN ne peut pas utiliser oauth_only')
            })

    # ========== MÉTHODES MÉTIER ==========

    def is_eligible_for_rental(self) -> dict[str, Any]:
        """Vérifie si le client peut louer un véhicule."""
        missing_docs: list[str] = []
        reasons:      list[str] = []

        if not self.phone:
            missing_docs.append('phone')
            reasons.append(_('Numéro de téléphone manquant'))
        if not self.address:
            missing_docs.append('address')
            reasons.append(_('Adresse manquante'))
        if not self.driving_license_number:
            missing_docs.append('driving_license_number')
            reasons.append(_('Numéro de permis manquant'))
        if not self.driving_license_expiry:
            missing_docs.append('driving_license_expiry')
            reasons.append(_('Date d\'expiration du permis manquante'))
        elif self.driving_license_expiry <= date.today():
            missing_docs.append('driving_license_expired')
            reasons.append(_('Permis expiré'))
        if not self.id_document_number:
            missing_docs.append('id_document_number')
            reasons.append(_('Numéro de pièce d\'identité manquant'))
        if not self.id_document_type:
            missing_docs.append('id_document_type')
            reasons.append(_('Type de pièce d\'identité manquant'))

        return {
            'eligible':     len(missing_docs) == 0,
            'missing_docs': missing_docs,
            'reasons':      reasons,
        }

    def has_valid_driving_license(self) -> bool:
        """Retourne True si le permis existe et n'est pas expiré."""
        if not self.driving_license_number or not self.driving_license_expiry:
            return False
        return self.driving_license_expiry > date.today()

    def get_full_name(self) -> str:
        """Retourne le nom complet ou l'email par défaut."""
        full_name = f"{self.first_name} {self.last_name}".strip()
        return full_name if full_name else str(self.email)

    def has_social_account(self, provider: Optional[str] = None) -> bool:
        """Vérifie si l'utilisateur a un compte social lié."""
        query = self.social_accounts.all()
        if provider:
            query = query.filter(provider=provider)
        return query.exists()

    @property
    def is_internal_staff(self) -> bool:
        """True si l'utilisateur est du personnel interne (pas CLIENT)."""
        return self.role in INTERNAL_ROLES

    @property
    def is_gestionnaire(self) -> bool:
        """True si l'utilisateur est gestionnaire du parc automobile."""
        return self.role == RoleChoices.GESTIONNAIRE


# ========== SOCIAL ACCOUNT ==========

class SocialAccount(models.Model):
    """Stocke les connexions Google OAuth2 des utilisateurs."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='social_accounts',
    )
    provider = models.CharField(
        _('fournisseur'),
        max_length=20,
        choices=SocialProviderChoices.choices,
        db_index=True,
    )
    uid = models.CharField(
        _('ID utilisateur du fournisseur'),
        max_length=255,
        db_index=True,
        help_text="Google 'sub'",
    )
    access_token            = models.TextField(_('token d\'accès'), blank=True)
    access_token_expires_at = models.DateTimeField(_('expiration du token'), null=True, blank=True)
    refresh_token           = models.TextField(_('refresh token'), blank=True)
    created_at              = models.DateTimeField(auto_now_add=True)
    updated_at              = models.DateTimeField(auto_now=True)

    objects: 'Manager[SocialAccount]' = models.Manager()

    class Meta:
        unique_together      = ('provider', 'uid')
        verbose_name         = _('compte social')
        verbose_name_plural  = _('comptes sociaux')
        ordering             = ['-created_at']
        indexes = [
            models.Index(fields=['provider', 'uid']),
            models.Index(fields=['user']),
        ]

    def __str__(self) -> str:
        provider_display = dict(SocialProviderChoices.choices).get(self.provider, self.provider)
        return f"{self.user.email} ({provider_display})"

    def is_access_token_valid(self) -> bool:
        if not self.access_token_expires_at:
            return True
        return timezone.now() < self.access_token_expires_at

    def needs_token_refresh(self) -> bool:
        if not self.access_token_expires_at:
            return False
        return (self.access_token_expires_at - timezone.now()) < timedelta(minutes=5)


# ========== PASSWORD RESET TOKEN ==========

class PasswordResetToken(models.Model):
    """Token pour la réinitialisation de mot de passe. Expire après 24h."""

    id      = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user    = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reset_tokens')
    token   = models.CharField(max_length=255, unique=True, db_index=True)
    is_used = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(help_text="Le token expire après 24h")
    used_at    = models.DateTimeField(null=True, blank=True)

    objects: 'Manager[PasswordResetToken]' = models.Manager()

    class Meta:
        verbose_name         = "Token de réinitialisation"
        verbose_name_plural  = "Tokens de réinitialisation"
        ordering             = ['-created_at']
        indexes = [
            models.Index(fields=['token']),
            models.Index(fields=['user', 'is_used']),
        ]

    def __str__(self) -> str:
        status = 'Used' if self.is_used else 'Active'
        return f"Reset token for {self.user.email} - {status}"

    def is_valid(self) -> bool:
        return not self.is_used and self.expires_at > timezone.now()

    def mark_as_used(self) -> None:
        self.is_used = True
        self.used_at = timezone.now()
        self.save()

    @staticmethod
    def create_token(user: User) -> 'PasswordResetToken':
        import secrets
        # Nettoyer les tokens expirés non utilisés
        PasswordResetToken.objects.filter(
            user=user,
            is_used=False,
            expires_at__lt=timezone.now()
        ).delete()

        return PasswordResetToken.objects.create(
            user=user,
            token=secrets.token_urlsafe(32),
            expires_at=timezone.now() + timedelta(hours=24),
        )


# ========== EMAIL VERIFICATION TOKEN ==========

class EmailVerificationToken(models.Model):
    """Token pour vérifier l'adresse email. Expire après 24h."""

    id      = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user    = models.ForeignKey(User, on_delete=models.CASCADE, related_name='email_verification_tokens')
    token   = models.CharField(max_length=255, unique=True, db_index=True)
    is_used = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()

    objects: 'Manager[EmailVerificationToken]' = models.Manager()

    class Meta:
        verbose_name         = "Email Verification Token"
        verbose_name_plural  = "Email Verification Tokens"
        ordering             = ['-created_at']
        indexes = [
            models.Index(fields=['token']),
            models.Index(fields=['user']),
        ]

    def __str__(self) -> str:
        status = 'Used' if self.is_used else 'Active'
        return f"Email verification for {self.user.email} - {status}"

    def is_valid(self) -> bool:
        return not self.is_used and self.expires_at > timezone.now()

    @staticmethod
    def create_token(user: User) -> 'EmailVerificationToken':
        import secrets
        # Nettoyer les tokens expirés non utilisés
        EmailVerificationToken.objects.filter(
            user=user,
            is_used=False,
            expires_at__lt=timezone.now()
        ).delete()

        return EmailVerificationToken.objects.create(
            user=user,
            token=secrets.token_urlsafe(32),
            expires_at=timezone.now() + timedelta(hours=24),
        )