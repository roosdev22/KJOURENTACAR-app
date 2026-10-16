
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from django.db import IntegrityError, transaction
from django.utils import timezone

from users.models import (
    User,
    RoleChoices,
    SocialAccount,
    SocialProviderChoices,
    PasswordResetToken,
    EmailVerificationToken,
)

import re

# ============================================================
# CONSTANTES MÉTIER
# ============================================================

INTERNAL_ROLES = {
    RoleChoices.AGENT,
    RoleChoices.GESTIONNAIRE,
    RoleChoices.ADMIN,
}

PRIVILEGED_ROLES = {
    RoleChoices.ADMIN,
    RoleChoices.SUPER_ADMIN,
}


# ============================================================
# USER READ
# ============================================================

class UserReadSerializer(serializers.ModelSerializer):
    """Lecture des informations principales d'un utilisateur."""

    role_display = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "first_name",
            "last_name",
            "role",
            "role_display",
            "phone",
            "address",
            "driving_license_number",
            "driving_license_expiry",
            "id_document_type",
            "id_document_number",
            "is_active",
            "oauth_only",
            "is_email_verified",
            "force_password_change",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
            "role_display",
            "oauth_only",
            "is_email_verified",
            "force_password_change",
        ]

    def get_role_display(self, obj):
        return dict(RoleChoices.choices).get(obj.role, obj.role)


# ============================================================
# USER WRITE
# ============================================================

class UserWriteSerializer(serializers.ModelSerializer):
    """
    Création / modification classique d'un utilisateur.

    Les flags de sécurité ne sont jamais modifiables directement :
    - force_password_change
    - is_email_verified
    - oauth_only
    """

    password = serializers.CharField(
        write_only=True,
        required=False,
        min_length=8,
    )

    class Meta:
        model = User
        fields = [
            "email",
            "password",
            "first_name",
            "last_name",
            "role",
            "phone",
            "address",
            "driving_license_number",
            "driving_license_expiry",
            "id_document_type",
            "id_document_number",
        ]

    def validate(self, attrs):
        request = self.context.get("request")
        password = attrs.get("password")

        if self.instance is None and not password:
            raise serializers.ValidationError({
                "password": "Le mot de passe est obligatoire."
            })

        if password:
            validate_password(password)

        requested_role = attrs.get(
            "role",
            self.instance.role if self.instance else RoleChoices.CLIENT,
        )

        # ----------------------------------------------------
        # Protection des rôles
        # ----------------------------------------------------

        if requested_role == RoleChoices.SUPER_ADMIN:
            if (
                not request
                or not request.user.is_authenticated
                or request.user.role != RoleChoices.SUPER_ADMIN
                or not request.user.is_superuser
            ):
                raise serializers.ValidationError({
                    "role": (
                        "Seul un Super Admin peut attribuer "
                        "le rôle SUPER_ADMIN."
                    )
                })

        if requested_role == RoleChoices.ADMIN:
            if (
                not request
                or not request.user.is_authenticated
                or request.user.role != RoleChoices.SUPER_ADMIN
                or not request.user.is_superuser
            ):
                raise serializers.ValidationError({
                    "role": (
                        "Seul un Super Admin peut attribuer "
                        "le rôle ADMIN."
                    )
                })

        return attrs

    def validate_email(self, value):
        """
        Vérifie l'unicité de l'email sur les comptes actifs uniquement.
        Les comptes soft-deleted ont un email anonymisé, donc
        cette vérification ne les bloque plus.
        """
        email = value.lower().strip()

        qs = User.objects.filter(email=email)  # objects = exclut les soft-deleted

        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)

        if qs.exists():
            raise serializers.ValidationError(
                "Un compte avec cette adresse email existe déjà."
            )

        return email



    def create(self, validated_data):
        password = validated_data.pop("password", None)

        if not password:
            raise serializers.ValidationError({
                "password": "Le mot de passe est obligatoire."
            })

        return User.objects.create_user(
            password=password,
            **validated_data,
        )

    def update(self, instance, validated_data):
        password = validated_data.pop("password", None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if password:
            validate_password(password, user=instance)
            instance.set_password(password)

        instance.full_clean()
        instance.save()

        return instance

  
# ============================================================
# ADMIN CREATE USER
# ============================================================

class AdminCreateUserSerializer(serializers.ModelSerializer):
    """
    Création d'utilisateur par ADMIN / SUPER_ADMIN.

    CLIENT :
        - mot de passe obligatoire
        - pas de mot de passe temporaire

    AGENT :
        - mot de passe temporaire si aucun mot de passe fourni
        - email considéré comme vérifié
        - changement de mot de passe obligatoire

    GESTIONNAIRE :
        - mot de passe temporaire si aucun mot de passe fourni
        - email considéré comme vérifié
        - changement de mot de passe obligatoire

    ADMIN :
        - création réservée au SUPER_ADMIN
        - mot de passe temporaire si aucun mot de passe fourni
        - email considéré comme vérifié
        - changement de mot de passe obligatoire

    SUPER_ADMIN :
        - création réservée au SUPER_ADMIN
        - pas de mot de passe temporaire
        - pas de changement obligatoire
    """

    password = serializers.CharField(
        write_only=True,
        required=False,
        min_length=8,
        error_messages={
            "min_length": (
                "Le mot de passe doit contenir au moins 8 caractères."
            ),
            "blank": "Le mot de passe ne peut pas être vide.",
        },
    )

    temporary_password = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "email",
            "password",
            "temporary_password",
            "first_name",
            "last_name",
            "role",
            "phone",
            "address",
        ]
        read_only_fields = [
            "temporary_password",
        ]
        extra_kwargs = {
            "email": {
                "required": True,
                "error_messages": {
                    "required": "L'adresse email est obligatoire.",
                    "blank": "L'adresse email est obligatoire.",
                    "invalid": "Veuillez saisir une adresse email valide.",
                },
            },
            "first_name": {
                "required": True,
                "error_messages": {
                    "required": "Le prénom est obligatoire.",
                    "blank": "Le prénom est obligatoire.",
                },
            },
            "last_name": {
                "required": True,
                "error_messages": {
                    "required": "Le nom est obligatoire.",
                    "blank": "Le nom est obligatoire.",
                },
            },
            "role": {
                "required": True,
                "error_messages": {
                    "required": "Le rôle est obligatoire.",
                    "invalid_choice": "Le rôle sélectionné est invalide.",
                },
            },
            "phone": {
                "required": False,
                "error_messages": {
                    "blank": "Le numéro de téléphone ne peut pas être vide.",
                },
            },
            "address": {
                "required": False,
                "error_messages": {
                    "blank": "L'adresse ne peut pas être vide.",
                },
            },
        }

    # ============================================================
    # EMAIL
    # ============================================================

    def validate_email(self, value):
        """
        Vérifie que l'email n'est pas déjà utilisé.
        """

        email = value.strip().lower()

        if not email:
            raise serializers.ValidationError(
                "L'adresse email est obligatoire."
            )

        if User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError(
                "Un compte avec cette adresse email existe déjà."
            )

        return email

    # ============================================================
    # PRÉNOM
    # ============================================================

    def validate_first_name(self, value):
        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                "Le prénom est obligatoire."
            )

        if any(char.isdigit() for char in value):
            raise serializers.ValidationError(
                "Le prénom ne peut pas contenir de chiffres."
            )

        if len(value) < 2:
            raise serializers.ValidationError(
                "Le prénom doit contenir au moins 2 caractères."
            )

        return value

    # ============================================================
    # NOM
    # ============================================================

    def validate_last_name(self, value):
        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                "Le nom est obligatoire."
            )

        if any(char.isdigit() for char in value):
            raise serializers.ValidationError(
                "Le nom ne peut pas contenir de chiffres."
            )

        if len(value) < 2:
            raise serializers.ValidationError(
                "Le nom doit contenir au moins 2 caractères."
            )

        return value

    # ============================================================
    # TÉLÉPHONE
    # ============================================================

    def validate_phone(self, value):
        if value is None:
            return value

        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                "Le numéro de téléphone ne peut pas être vide."
            )

        return value

    # ============================================================
    # ADRESSE
    # ============================================================

    def validate_address(self, value):
        if value is None:
            return value

        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                "L'adresse ne peut pas être vide."
            )

        return value

    # ============================================================
    # MOT DE PASSE TEMPORAIRE
    # ============================================================

    def get_temporary_password(self, obj):
        """
        Le mot de passe temporaire est stocké dans le context
        du serializer et jamais dans le modèle User.
        """

        return self.context.get("temporary_password")

    # ============================================================
    # RÔLE
    # ============================================================

    def validate_role(self, value):
        request = self.context.get("request")

        if not request or not request.user.is_authenticated:
            raise serializers.ValidationError(
                "Vous devez être connecté pour créer un utilisateur."
            )

        current_user = request.user

        # --------------------------------------------------------
        # SUPER_ADMIN
        # --------------------------------------------------------

        if value == RoleChoices.SUPER_ADMIN:
            if (
                current_user.role != RoleChoices.SUPER_ADMIN
                or not current_user.is_superuser
            ):
                raise serializers.ValidationError(
                    "Seul un Super Admin peut créer un Super Admin."
                )

        # --------------------------------------------------------
        # ADMIN
        # --------------------------------------------------------

        if value == RoleChoices.ADMIN:
            if (
                current_user.role != RoleChoices.SUPER_ADMIN
                or not current_user.is_superuser
            ):
                raise serializers.ValidationError(
                    "Seul un Super Admin peut créer un Admin."
                )

        return value

    # ============================================================
    # VALIDATION GLOBALE
    # ============================================================

    def validate(self, attrs):
        role = attrs.get(
            "role",
            RoleChoices.CLIENT,
        )

        password = attrs.get("password")

        # --------------------------------------------------------
        # CLIENT
        # --------------------------------------------------------

        if role == RoleChoices.CLIENT and not password:
            raise serializers.ValidationError({
                "password": (
                    "Le mot de passe est obligatoire "
                    "pour un client."
                )
            })

        # --------------------------------------------------------
        # SUPER_ADMIN
        # --------------------------------------------------------

        if role == RoleChoices.SUPER_ADMIN and not password:
            raise serializers.ValidationError({
                "password": (
                    "Le mot de passe est obligatoire "
                    "pour un Super Admin."
                )
            })

        # --------------------------------------------------------
        # VALIDATION DU MOT DE PASSE
        # --------------------------------------------------------

        if password:
            try:
                validate_password(password)
            except serializers.ValidationError:
                raise
            except Exception as exc:
                raise serializers.ValidationError({
                    "password": [
                        str(exc)
                    ]
                })

        return attrs

    # ============================================================
    # CRÉATION
    # ============================================================

    def create(self, validated_data):
        import secrets
        import string

        password = validated_data.pop(
            "password",
            None,
        )

        role = validated_data.get(
            "role",
            RoleChoices.CLIENT,
        )

        # ========================================================
        # PERSONNEL INTERNE
        # ========================================================

        if role in INTERNAL_ROLES:

            # Aucun mot de passe fourni :
            # génération d'un mot de passe temporaire.
            if not password:
                alphabet = (
                    string.ascii_letters
                    + string.digits
                )

                password = "KJ-" + "".join(
                    secrets.choice(alphabet)
                    for _ in range(12)
                )

            # Flags métier.
            validated_data["force_password_change"] = True
            validated_data["is_email_verified"] = True

            user = User.objects.create_user(
                password=password,
                **validated_data,
            )

            # Le mot de passe temporaire n'est jamais
            # enregistré dans la base de données.
            self.context["temporary_password"] = password

            return user

        # ========================================================
        # SUPER_ADMIN
        # ========================================================

        if role == RoleChoices.SUPER_ADMIN:

            if not password:
                raise serializers.ValidationError({
                    "password": (
                        "Le mot de passe est obligatoire "
                        "pour un Super Admin."
                    )
                })

            validated_data["force_password_change"] = False
            validated_data["is_email_verified"] = True

            user = User.objects.create_user(
                password=password,
                **validated_data,
            )

            self.context["temporary_password"] = None

            return user

        # ========================================================
        # CLIENT
        # ========================================================

        if not password:
            raise serializers.ValidationError({
                "password": (
                    "Le mot de passe est obligatoire "
                    "pour un client."
                )
            })

        validated_data["force_password_change"] = False

        user = User.objects.create_user(
            password=password,
            **validated_data,
        )

        self.context["temporary_password"] = None

        return user



# ============================================================
# AGENT CREATE CLIENT
# ============================================================

class AgentCreateClientSerializer(serializers.ModelSerializer):
    """
    Création d'un CLIENT par un AGENT.

    L'Agent ne peut créer que des CLIENTS.
    Le rôle n'est jamais fourni par le frontend.
    Le mot de passe est généré automatiquement.
    """

    temporary_password = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "email",
            "first_name",
            "last_name",
            "phone",
            "address",
            "driving_license_number",
            "driving_license_expiry",
            "id_document_type",
            "id_document_number",
            "temporary_password",
        ]

        read_only_fields = [
            "temporary_password",
        ]

        extra_kwargs = {
            "email": {
                "required": True,
                "error_messages": {
                    "required": "L'adresse email est obligatoire.",
                    "blank": "L'adresse email est obligatoire.",
                    "invalid": "Veuillez saisir une adresse email valide.",
                },
            },
            "first_name": {
                "required": True,
                "error_messages": {
                    "required": "Le prénom est obligatoire.",
                    "blank": "Le prénom est obligatoire.",
                },
            },
            "last_name": {
                "required": True,
                "error_messages": {
                    "required": "Le nom est obligatoire.",
                    "blank": "Le nom est obligatoire.",
                },
            },
        }

    # ========================================================
    # EMAIL
    # ========================================================

    def validate_email(self, value):
        email = value.strip().lower()

        if User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError(
                "Un compte avec cette adresse email existe déjà."
            )

        return email

    # ========================================================
    # PRÉNOM
    # ========================================================

    def validate_first_name(self, value):
        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                "Le prénom est obligatoire."
            )

        if any(char.isdigit() for char in value):
            raise serializers.ValidationError(
                "Le prénom ne peut pas contenir de chiffres."
            )

        if len(value) < 2:
            raise serializers.ValidationError(
                "Le prénom doit contenir au moins 2 caractères."
            )

        return value

    # ========================================================
    # NOM
    # ========================================================

    def validate_last_name(self, value):
        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                "Le nom est obligatoire."
            )

        if any(char.isdigit() for char in value):
            raise serializers.ValidationError(
                "Le nom ne peut pas contenir de chiffres."
            )

        if len(value) < 2:
            raise serializers.ValidationError(
                "Le nom doit contenir au moins 2 caractères."
            )

        return value

    # ========================================================
    # TÉLÉPHONE
    # ========================================================

    def validate_phone(self, value):
        if value is None:
            return value

        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                "Le numéro de téléphone ne peut pas être vide."
            )

        return value

    # ========================================================
    # ADRESSE
    # ========================================================

    def validate_address(self, value):
        if value is None:
            return value

        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                "L'adresse ne peut pas être vide."
            )

        return value

    # ========================================================
    # PERMIS
    # ========================================================

    def validate_driving_license_number(self, value):
        if value is None:
            return value

        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                "Le numéro de permis de conduire ne peut pas être vide."
            )

        if User.objects.filter(
            driving_license_number=value
        ).exists():
            raise serializers.ValidationError(
                "Ce numéro de permis de conduire est déjà "
                "associé à un autre compte."
            )

        return value

    # ========================================================
    # PIÈCE D'IDENTITÉ
    # ========================================================

    def validate_id_document_number(self, value):
        if value is None:
            return value

        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                "Le numéro de pièce d'identité ne peut pas être vide."
            )

        if User.objects.filter(
            id_document_number=value
        ).exists():
            raise serializers.ValidationError(
                "Ce numéro de pièce d'identité est déjà "
                "associé à un autre compte."
            )

        return value

    # ========================================================
    # VALIDATION GLOBALE
    # ========================================================

    def validate(self, attrs):
        license_number = attrs.get("driving_license_number")
        license_expiry = attrs.get("driving_license_expiry")

        id_document_type = attrs.get("id_document_type")
        id_document_number = attrs.get("id_document_number")

        # ----------------------------------------------------
        # PERMIS
        # ----------------------------------------------------

        if license_number and not license_expiry:
            raise serializers.ValidationError({
                "driving_license_expiry": (
                    "La date d'expiration du permis est obligatoire "
                    "lorsqu'un numéro de permis est renseigné."
                )
            })

        if license_expiry:
            if license_expiry <= timezone.localdate():
                raise serializers.ValidationError({
                    "driving_license_expiry": (
                        "Le permis de conduire doit être valide."
                    )
                })

        # ----------------------------------------------------
        # PIÈCE D'IDENTITÉ
        # ----------------------------------------------------

        if id_document_number and not id_document_type:
            raise serializers.ValidationError({
                "id_document_type": (
                    "Le type de pièce d'identité est obligatoire "
                    "lorsqu'un numéro de pièce est renseigné."
                )
            })

        if id_document_type and not id_document_number:
            raise serializers.ValidationError({
                "id_document_number": (
                    "Le numéro de pièce d'identité est obligatoire "
                    "lorsqu'un type de pièce est sélectionné."
                )
            })

        # ----------------------------------------------------
        # TÉLÉPHONE / ADRESSE
        # ----------------------------------------------------

        if address := attrs.get("address"):
            if not attrs.get("phone"):
                raise serializers.ValidationError({
                    "phone": (
                        "Le numéro de téléphone est obligatoire "
                        "lorsqu'une adresse est renseignée."
                    )
                })

        if phone := attrs.get("phone"):
            if not attrs.get("address"):
                raise serializers.ValidationError({
                    "address": (
                        "L'adresse est obligatoire "
                        "lorsqu'un numéro de téléphone est renseigné."
                    )
                })

        return attrs

    # ========================================================
    # TEMPORARY PASSWORD
    # ========================================================

    def get_temporary_password(self, obj):
        return self.context.get("temporary_password")

    # ========================================================
    # CREATE
    # ========================================================

    def create(self, validated_data):
        import secrets
        import string

        alphabet = string.ascii_letters + string.digits

        password = "KJ-" + "".join(
            secrets.choice(alphabet)
            for _ in range(12)
        )

        validated_data["role"] = RoleChoices.CLIENT
        validated_data["force_password_change"] = False
        validated_data["is_email_verified"] = True
        validated_data["oauth_only"] = False

        user = User.objects.create_user(
            password=password,
            **validated_data,
        )

        self.context["temporary_password"] = password

        return user
class RoleChangeSerializer(serializers.Serializer):
    role = serializers.ChoiceField(
        choices=RoleChoices.choices
    )

    def validate_role(self, value):
        request = self.context.get("request")

        if not request or not request.user.is_authenticated:
            raise serializers.ValidationError(
                "Vous devez être connecté."
            )

        current_user = request.user

        if value in [
            RoleChoices.ADMIN,
            RoleChoices.SUPER_ADMIN,
        ]:
            if (
                current_user.role != RoleChoices.SUPER_ADMIN
                or not current_user.is_superuser
            ):
                raise serializers.ValidationError(
                    "Seul un Super Admin peut attribuer ce rôle."
                )

        return value


class ChangeRoleWithReasonSerializer(serializers.Serializer):
    """Changement de rôle avec motif d'audit."""

    role = serializers.ChoiceField(
        choices=RoleChoices.choices
    )

    reason = serializers.CharField(
        max_length=500,
        required=False,
        allow_blank=True,
    )

    def validate_role(self, value):
        request = self.context.get("request")

        if not request or not request.user.is_authenticated:
            raise serializers.ValidationError(
                "Vous devez être connecté."
            )

        current_user = request.user

        if value in [
            RoleChoices.ADMIN,
            RoleChoices.SUPER_ADMIN,
        ]:
            if (
                current_user.role != RoleChoices.SUPER_ADMIN
                or not current_user.is_superuser
            ):
                raise serializers.ValidationError(
                    "Seul un Super Admin peut attribuer ce rôle."
                )

        return value


# ============================================================
# LOGIN
# ============================================================
# ============================================================
# LOGIN
# ============================================================

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(
        write_only=True
    )

    def validate(self, attrs):
        user = User.objects.filter(
            email=attrs["email"],
            deleted_at__isnull=True,
        ).first()

        if not user or not user.check_password(
            attrs["password"]
        ):
            raise serializers.ValidationError(
                "Email ou mot de passe incorrect."
            )

        if not user.is_active:
            raise serializers.ValidationError(
                "Cet utilisateur est inactif."
            )

        if user.oauth_only:
            raise serializers.ValidationError(
                "Cet utilisateur doit se connecter avec Google."
            )

        # ----------------------------------------------------
        # VÉRIFICATION EMAIL — CLIENT
        # ----------------------------------------------------

        if (
            user.role == RoleChoices.CLIENT
            and not user.is_email_verified
        ):
            raise serializers.ValidationError(
                "Veuillez vérifier votre adresse email "
                "avant de vous connecter."
            )

        attrs["user"] = user

        return attrs

# ============================================================
# CHANGE PASSWORD
# ============================================================

class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(
        write_only=True
    )

    new_password = serializers.CharField(
        write_only=True,
        min_length=8,
    )

    confirm_password = serializers.CharField(
        write_only=True,
        min_length=8,
    )

    def validate(self, attrs):
        request = self.context.get("request")

        if (
            not request
            or not request.user.is_authenticated
        ):
            raise serializers.ValidationError(
                "Vous devez être connecté."
            )

        user = request.user

        current_password = attrs["current_password"]
        new_password = attrs["new_password"]
        confirm_password = attrs["confirm_password"]

        if not user.check_password(current_password):
            raise serializers.ValidationError({
                "current_password": (
                    "Mot de passe actuel incorrect."
                )
            })

        if new_password != confirm_password:
            raise serializers.ValidationError({
                "confirm_password": (
                    "Les mots de passe ne correspondent pas."
                )
            })

        if current_password == new_password:
            raise serializers.ValidationError({
                "new_password": (
                    "Le nouveau mot de passe doit être différent."
                )
            })

        validate_password(
            new_password,
            user=user,
        )

        attrs["user"] = user

        return attrs


# ============================================================
# PASSWORD RESET
# ============================================================

class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()


class ResetPasswordSerializer(serializers.Serializer):
    token = serializers.CharField(
        max_length=255
    )

    new_password = serializers.CharField(
        write_only=True,
        min_length=8,
    )

    confirm_password = serializers.CharField(
        write_only=True
    )

    def validate(self, attrs):
        if (
            attrs["new_password"]
            != attrs["confirm_password"]
        ):
            raise serializers.ValidationError({
                "confirm_password": (
                    "Les mots de passe ne correspondent pas."
                )
            })

        reset_token = PasswordResetToken.objects.filter(
            token=attrs["token"]
        ).first()

        if not reset_token or not reset_token.is_valid():
            raise serializers.ValidationError({
                "token": "Token invalide ou expiré."
            })

        validate_password(
            attrs["new_password"],
            user=reset_token.user,
        )

        attrs["reset_token"] = reset_token
        attrs["user"] = reset_token.user

        return attrs


class ResetPasswordValidateTokenSerializer(
    serializers.Serializer
):
    token = serializers.CharField(
        max_length=255
    )

    def validate_token(self, value):
        reset_token = PasswordResetToken.objects.filter(
            token=value
        ).first()

        if not reset_token:
            raise serializers.ValidationError(
                "Token invalide."
            )

        if not reset_token.is_valid():
            raise serializers.ValidationError(
                "Token expiré."
            )

        return value


# ============================================================
# OAUTH
# ============================================================

class GoogleLoginSerializer(serializers.Serializer):
    id_token = serializers.CharField(
        write_only=True
    )

    def validate_id_token(self, value):
        try:
            from users.token_service import (
                GoogleTokenService
            )

            return GoogleTokenService.verify_token(value)

        except Exception as exc:
            raise serializers.ValidationError(
                f"Token Google invalide: {exc}"
            )


# ============================================================
# SOCIAL ACCOUNT
# ============================================================

class SocialAccountReadSerializer(
    serializers.ModelSerializer
):
    provider_display = serializers.SerializerMethodField()

    class Meta:
        model = SocialAccount

        fields = [
            "id",
            "provider",
            "provider_display",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
        ]

    def get_provider_display(self, obj):
        return dict(
            SocialProviderChoices.choices
        ).get(
            obj.provider,
            obj.provider,
        )


class SocialAccountWriteSerializer(
    serializers.ModelSerializer
):
    id_token = serializers.CharField(
        write_only=True,
        required=False,
    )

    class Meta:
        model = SocialAccount

        fields = [
            "provider",
            "uid",
            "id_token",
        ]

    def validate(self, attrs):
        if (
            attrs.get("provider")
            != SocialProviderChoices.GOOGLE
        ):
            raise serializers.ValidationError({
                "provider": (
                    "Seul Google est supporté."
                )
            })

        if not attrs.get("id_token"):
            raise serializers.ValidationError({
                "id_token": "Requis."
            })

        return attrs


class LinkSocialAccountSerializer(
    serializers.Serializer
):
    provider = serializers.ChoiceField(
        choices=SocialProviderChoices.choices
    )

    uid = serializers.CharField(
        max_length=255
    )

    def validate(self, attrs):
        exists = SocialAccount.objects.filter(
            provider=attrs["provider"],
            uid=attrs["uid"],
        ).exists()

        if exists:
            raise serializers.ValidationError({
                "uid": (
                    "Ce compte social est déjà lié "
                    "à un utilisateur."
                )
            })

        return attrs


# ============================================================
# USER DETAILS
# ============================================================

class UserEligibilitySerializer(
    serializers.ModelSerializer
):
    role_display = serializers.SerializerMethodField()
    eligibility = serializers.SerializerMethodField()

    class Meta:
        model = User

        fields = [
            "id",
            "email",
            "role",
            "role_display",
            "eligibility",
        ]

    def get_role_display(self, obj):
        return dict(
            RoleChoices.choices
        ).get(
            obj.role,
            obj.role,
        )

    def get_eligibility(self, obj):
        return obj.is_eligible_for_rental()


class UserDetailedSerializer(
    serializers.ModelSerializer
):
    role_display = serializers.SerializerMethodField()
    driving_license_valid = serializers.SerializerMethodField()
    eligibility = serializers.SerializerMethodField()
    full_name = serializers.SerializerMethodField()

    social_accounts = SocialAccountReadSerializer(
        many=True,
        read_only=True,
    )

    class Meta:
        model = User

        fields = [
            "id",
            "email",
            "first_name",
            "last_name",
            "full_name",
            "phone",
            "address",
            "role",
            "role_display",
            "driving_license_number",
            "driving_license_expiry",
            "driving_license_valid",
            "id_document_type",
            "id_document_number",
            "is_active",
            "oauth_only",
            "is_email_verified",
            "force_password_change",
            "eligibility",
            "social_accounts",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
            "role_display",
            "driving_license_valid",
            "eligibility",
            "full_name",
            "oauth_only",
            "is_email_verified",
            "force_password_change",
            "social_accounts",
        ]

    def get_role_display(self, obj):
        return dict(
            RoleChoices.choices
        ).get(
            obj.role,
            obj.role,
        )

    def get_driving_license_valid(self, obj):
        return obj.has_valid_driving_license()

    def get_eligibility(self, obj):
        return obj.is_eligible_for_rental()

    def get_full_name(self, obj):
        return obj.get_full_name()


# ============================================================
# EMAIL VERIFICATION
# ============================================================

class EmailVerificationSerializer(
    serializers.Serializer
):
    token = serializers.CharField(
        max_length=255
    )

    def validate_token(self, value):
        verification_token = (
            EmailVerificationToken.objects
            .filter(token=value)
            .first()
        )

        if not verification_token:
            raise serializers.ValidationError(
                "Token invalide."
            )

        if not verification_token.is_valid():
            raise serializers.ValidationError(
                "Token expiré."
            )

        return value


# ============================================================
# SOFT DELETE / AUDIT
# ============================================================

class SoftDeletedUserSerializer(
    serializers.ModelSerializer
):
    full_name = serializers.SerializerMethodField()
    deleted_by_email = serializers.SerializerMethodField()

    class Meta:
        model = User

        fields = [
            "id",
            "email",
            "first_name",
            "last_name",
            "full_name",
            "role",
            "deleted_at",
            "deleted_by_email",
            "created_at",
        ]

    def get_full_name(self, obj):
        return obj.get_full_name()

    def get_deleted_by_email(self, obj):
        return (
            obj.deleted_by.email
            if obj.deleted_by
            else "inconnu"
        )

class AuditHistorySerializer(serializers.Serializer):
    history_id = serializers.IntegerField()
    history_date = serializers.DateTimeField()
    history_type = serializers.CharField()

    history_type_display = (
        serializers.SerializerMethodField()
    )

    history_user_email = (
        serializers.SerializerMethodField()
    )

    history_change_reason = serializers.CharField(
        allow_null=True
    )

    changed_fields = (
        serializers.SerializerMethodField()
    )

    def get_history_type_display(self, obj):
        return {
            "+": "Création",
            "~": "Modification",
            "-": "Suppression",
        }.get(
            obj.history_type,
            obj.history_type,
        )

    def get_history_user_email(self, obj):
        return (
            obj.history_user.email
            if obj.history_user
            else "système"
        )

    def get_changed_fields(self, obj):
        if obj.history_type == "+":
            return []

        try:
            previous = obj.prev_record
        except Exception:
            return []

        if not previous:
            return []

        delta = obj.diff_against(previous)

        return [
            {
                "field": change.field,
                "old": (
                    str(change.old)
                    if change.old is not None
                    else "—"
                ),
                "new": (
                    str(change.new)
                    if change.new is not None
                    else "—"
                ),
            }
            for change in delta.changes
            if change.field
            not in ["password", "last_login"]
        ]

class ClientProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "first_name",
            "last_name",
            "phone",
            "address",
            "id_document_type",
            "id_document_number",
            "driving_license_number",
            "driving_license_expiry",
        ]
        read_only_fields = ["id", "email"]

    # ============================================================
    # PRÉNOM
    # ============================================================

    def validate_first_name(self, value):
        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                "Le prénom est obligatoire."
            )

        return value

    # ============================================================
    # NOM
    # ============================================================

    def validate_last_name(self, value):
        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                "Le nom est obligatoire."
            )

        return value

    # ============================================================
    # TÉLÉPHONE
    # ============================================================

    def validate_phone(self, value):
        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                "Le numéro de téléphone est obligatoire."
            )

        return value

    # ============================================================
    # ADRESSE
    # ============================================================

    def validate_address(self, value):
        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                "L'adresse est obligatoire."
            )

        return value

    # ============================================================
    # TYPE DE PIÈCE D'IDENTITÉ
    # ============================================================

    def validate_id_document_type(self, value):
        allowed_types = {
            "PASSPORT",
            "ID_CARD",
            "DRIVER_LICENSE",
        }

        if value not in allowed_types:
            raise serializers.ValidationError(
                "Le type de pièce d'identité sélectionné est invalide."
            )

        return value

    # ============================================================
    # NUMÉRO DE PIÈCE D'IDENTITÉ
    # ============================================================

    def validate_id_document_number(self, value):
        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                "Le numéro de pièce d'identité est obligatoire."
            )

        queryset = User.objects.filter(
            id_document_number=value
        )

        # Modification : ne pas considérer son propre numéro
        if self.instance:
            queryset = queryset.exclude(
                pk=self.instance.pk
            )

        if queryset.exists():
            raise serializers.ValidationError(
                "Ce numéro de pièce d'identité est déjà "
                "associé à un autre compte."
            )

        return value

    # ============================================================
    # NUMÉRO DE PERMIS
    # ============================================================

    def validate_driving_license_number(self, value):
        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                "Le numéro de permis de conduire est obligatoire."
            )

        queryset = User.objects.filter(
            driving_license_number=value
        )

        # Modification : ne pas considérer son propre numéro
        if self.instance:
            queryset = queryset.exclude(
                pk=self.instance.pk
            )

        if queryset.exists():
            raise serializers.ValidationError(
                "Ce numéro de permis de conduire est déjà "
                "associé à un autre compte."
            )

        return value

    # ============================================================
    # VALIDATION GLOBALE
    # ============================================================

    def validate(self, attrs):
        user = self.instance

        if user and user.role != RoleChoices.CLIENT:
            raise serializers.ValidationError({
                "detail": (
                    "Ce profil est réservé aux utilisateurs "
                    "ayant le rôle CLIENT."
                )
            })

        # Valeurs finales : nouvelles valeurs ou valeurs existantes
        license_number = attrs.get(
            "driving_license_number",
            getattr(user, "driving_license_number", None),
        )

        license_expiry = attrs.get(
            "driving_license_expiry",
            getattr(user, "driving_license_expiry", None),
        )

        phone = attrs.get(
            "phone",
            getattr(user, "phone", None),
        )

        address = attrs.get(
            "address",
            getattr(user, "address", None),
        )

        id_document_type = attrs.get(
            "id_document_type",
            getattr(user, "id_document_type", None),
        )

        id_document_number = attrs.get(
            "id_document_number",
            getattr(user, "id_document_number", None),
        )

        # --------------------------------------------------------
        # PERMIS
        # --------------------------------------------------------

        if license_number and not license_expiry:
            raise serializers.ValidationError({
                "driving_license_expiry": (
                    "La date d'expiration du permis est obligatoire "
                    "lorsqu'un numéro de permis est renseigné."
                )
            })

        if license_expiry:
            from django.utils import timezone

            if license_expiry <= timezone.localdate():
                raise serializers.ValidationError({
                    "driving_license_expiry": (
                        "Le permis de conduire doit être valide."
                    )
                })

        # --------------------------------------------------------
        # PIÈCE D'IDENTITÉ
        # --------------------------------------------------------

        if id_document_number and not id_document_type:
            raise serializers.ValidationError({
                "id_document_type": (
                    "Le type de pièce d'identité est obligatoire "
                    "lorsqu'un numéro de pièce est renseigné."
                )
            })

        if id_document_type and not id_document_number:
            raise serializers.ValidationError({
                "id_document_number": (
                    "Le numéro de pièce d'identité est obligatoire "
                    "lorsqu'un type de pièce est sélectionné."
                )
            })

        # --------------------------------------------------------
        # ADRESSE / TÉLÉPHONE
        # --------------------------------------------------------

        if address and not phone:
            raise serializers.ValidationError({
                "phone": (
                    "Le numéro de téléphone est obligatoire "
                    "lorsqu'une adresse est renseignée."
                )
            })

        if phone and not address:
            raise serializers.ValidationError({
                "address": (
                    "L'adresse est obligatoire "
                    "lorsqu'un numéro de téléphone est renseigné."
                )
            })

        return attrs

    # ============================================================
    # UPDATE
    # ============================================================

    def update(self, instance, validated_data):

        password = validated_data.pop("password", None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if password:
            validate_password(password, user=instance)
            instance.set_password(password)

        instance.full_clean()

        try:
            instance.save()
        except IntegrityError as e:
            error_msg = str(e)
            if "driving_license_number" in error_msg:
                raise serializers.ValidationError({
                    "driving_license_number": (
                        "Ce numéro de permis est déjà "
                        "associé à un autre compte."
                    )
                })
            if "id_document_number" in error_msg:
                raise serializers.ValidationError({
                    "id_document_number": (
                        "Ce numéro de pièce d'identité est déjà "
                        "associé à un autre compte."
                    )
                })
            raise

        return instance