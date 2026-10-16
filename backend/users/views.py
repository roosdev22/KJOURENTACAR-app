import logging

from django.db import IntegrityError, transaction
from django.utils import timezone

from users.email_service import EmailService
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError

from users.models import (
    User,
    RoleChoices,
    PasswordResetToken,
    EmailVerificationToken,
)

from users.permissions import (
    IsAuthenticatedAndActive,
    IsNotForcedPasswordChange,
    IsAdmin,
    IsSuperAdmin,
    CanCreateUser,
    CanChangeRole,
    CanManageUsers,
)

from users.serializers import (
    UserReadSerializer,
    UserWriteSerializer,
    UserDetailedSerializer,
    AdminCreateUserSerializer,
    AgentCreateClientSerializer,
    LoginSerializer,
    ChangePasswordSerializer,
    ClientProfileSerializer,
    RoleChangeSerializer,
    ChangeRoleWithReasonSerializer,
    ForgotPasswordSerializer,
    ResetPasswordSerializer,
    ResetPasswordValidateTokenSerializer,
    UserEligibilitySerializer,
    SoftDeletedUserSerializer,
    AuditHistorySerializer,
    EmailVerificationSerializer,
    GoogleLoginSerializer,
)
from django.conf import settings
from django.shortcuts import redirect

logger = logging.getLogger(__name__)


# ============================================================
# UTILITAIRE COOKIES JWT
# ============================================================

def set_auth_cookies(response, refresh):
    """
    Pose les tokens JWT en cookies HttpOnly.
    Le frontend ne peut jamais lire ces valeurs — protection XSS.
    Le navigateur les envoie automatiquement grâce à withCredentials.
    """
    response.set_cookie(
        "access_token",
        str(refresh.access_token),
        httponly=True,
        secure=False,           # True en production (HTTPS obligatoire)
        samesite="Lax",
        max_age=60 * 15,        # 15 minutes
    )
    response.set_cookie(
        "refresh_token",
        str(refresh),
        httponly=True,
        secure=False,
        samesite="Lax",
        max_age=60 * 60 * 24 * 7,  # 7 jours
    )
    return response


class UserViewSet(viewsets.ModelViewSet):
    """
    API principale des utilisateurs.

    Règles :

    CLIENT      — gestion de son propre profil, authentification normale.
    AGENT       — personnel interne, mot de passe temporaire à la première connexion.
    GESTIONNAIRE— personnel interne, mot de passe temporaire à la première connexion.
    ADMIN       — personnel interne, gestion des utilisateurs autorisés.
    SUPER_ADMIN — contrôle complet.
    """

    queryset = User.objects.all()

    def get_queryset(self):
        """
        Le manager User.objects masque déjà les utilisateurs soft-deleted.
        Pour la corbeille, l'action trash utilise all_objects.
        """
        return User.objects.all()
    def get_serializer_class(self):
        if self.action == "create_by_admin":
            return AdminCreateUserSerializer

        if self.action == "create_by_agent":
            return AgentCreateClientSerializer

        if self.action == "me":
            if self.request.method == "PATCH":
                return ClientProfileSerializer
            return UserDetailedSerializer

        if self.action in ["retrieve", "eligibility"]:
            return UserDetailedSerializer

        if self.action == "change_role":
            return ChangeRoleWithReasonSerializer

        if self.action == "login":
            return LoginSerializer

        if self.action == "change_password":
            return ChangePasswordSerializer

        if self.action == "forgot_password":
            return ForgotPasswordSerializer

        if self.action == "reset_password":
            return ResetPasswordSerializer

        if self.action == "validate_reset_token":
            return ResetPasswordValidateTokenSerializer

        if self.action == "verify_email":
            return EmailVerificationSerializer

        if self.action == "trash":
            return SoftDeletedUserSerializer

        if self.action == "audit_history":
            return AuditHistorySerializer

        if self.action == "google_login":
            return GoogleLoginSerializer

        if self.request.method in ["POST", "PUT", "PATCH"]:
            return UserWriteSerializer

        return UserReadSerializer

    def get_permissions(self):
            """
            Permissions centralisées — source unique de vérité.
            Principe : moindre privilège, tout fermé par défaut.
            """

            # ==========================================================
            # ROUTES PUBLIQUES
            # ==========================================================

            if self.action in {
                "login",
                "logout",
                "forgot_password",
                "reset_password",
                "validate_reset_token",
                "google_login",
                "verify_email",
                "token_refresh",
                "create",
                "confirm_email",          
            }:
                return [AllowAny()]

            # ==========================================================
            # CHANGEMENT DE MOT DE PASSE
            # Accessible même avec force_password_change=True
            # ==========================================================

            if self.action == "change_password":
                return [IsAuthenticatedAndActive()]

            # ==========================================================
            # PROFIL PERSONNEL
            # GET  → accessible même avec force_password_change=True
            # PATCH → bloqué si force_password_change=True
            # ==========================================================

            if self.action == "me":
                perms = [IsAuthenticatedAndActive()]
                if self.request.method == "PATCH":
                    perms.append(IsNotForcedPasswordChange())
                return perms

            # ==========================================================
            # ÉLIGIBILITÉ
            # ==========================================================

            if self.action == "eligibility":
                return [
                    IsAuthenticatedAndActive(),
                    IsNotForcedPasswordChange(),
                ]

            # ==========================================================
            # CRÉATION PAR ADMIN
            # ==========================================================

            if self.action == "create_by_admin":
                return [
                    IsAuthenticatedAndActive(),
                    IsNotForcedPasswordChange(),
                    CanCreateUser(),
                ]
            if self.action == "create_by_agent":
                return [
                    IsAuthenticatedAndActive(),
                    IsNotForcedPasswordChange(),
                    CanCreateUser(),
    ]
            # ==========================================================
            # MODIFICATION DU RÔLE
            # ==========================================================

            if self.action == "change_role":
                return [
                    IsAuthenticatedAndActive(),
                    IsNotForcedPasswordChange(),
                    CanChangeRole(),
                ]

            # ==========================================================
            # CORBEILLE / HISTORIQUE / SUPPRESSION / RESTAURATION
            # ==========================================================

            if self.action in {
                "trash",
                "audit_history",
                "restore",
                "destroy",
            }:
                return [
                    IsAuthenticatedAndActive(),
                    IsNotForcedPasswordChange(),
                    IsAdmin(),
                ]

            # ==========================================================
            # ACTIVATION / DÉSACTIVATION
            # ==========================================================

            if self.action in {"activate", "deactivate"}:
                return [
                    IsAuthenticatedAndActive(),
                    IsNotForcedPasswordChange(),
                    CanManageUsers(),
                ]

            # ==========================================================
            # CRUD ADMIN
            # ==========================================================

            if self.action in {
                "update",
                "partial_update",
                "retrieve",
                "list",
            }:
                return [
                    IsAuthenticatedAndActive(),
                    IsNotForcedPasswordChange(),
                    IsAdmin(),
                ]

            # ==========================================================
            # FALLBACK SÉCURISÉ
            # Toute action non listée = accès refusé par défaut.
            # ==========================================================

            return [
                IsAuthenticatedAndActive(),
                IsNotForcedPasswordChange(),
            ]

    # ========================================================
    # CREATE — INSCRIPTION CLIENT
    # ========================================================
    # ========================================================
    # CONFIRM EMAIL
    # ========================================================

    @action(
        detail=False,
        methods=["get"],
        url_path=r"confirm-email/(?P<token>[^/.]+)",
        permission_classes=[AllowAny],
    )
    @transaction.atomic
    def confirm_email(self, request, token):
        """
        Vérifie l'adresse email depuis le lien reçu par email,
        puis redirige l'utilisateur vers le frontend.
        """

        verification_token = (
            EmailVerificationToken.objects
            .select_related("user")
            .filter(token=token)
            .first()
        )

        if not verification_token:
            return redirect(
                f"{settings.FRONTEND_URL}/login?verification=invalid"
            )

        if verification_token.is_used:
            return redirect(
                f"{settings.FRONTEND_URL}/login?verification=already"
            )

        if verification_token.expires_at <= timezone.now():
            return redirect(
                f"{settings.FRONTEND_URL}/login?verification=expired"
            )

        user = verification_token.user

        user.is_email_verified = True

        user.save(
            update_fields=[
                "is_email_verified",
                "updated_at",
            ]
        )

        verification_token.is_used = True

        verification_token.save(
            update_fields=["is_used"]
        )

        return redirect(
            f"{settings.FRONTEND_URL}/login?verification=success"
        )

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        """
        Inscription publique d'un CLIENT.

        Après création du compte :
        1. Génère un token de vérification.
        2. Envoie l'email de vérification.
        3. Le compte reste non vérifié jusqu'à validation du lien.
        """

        serializer = self.get_serializer(
            data=request.data,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)

        user = serializer.save()

        # ----------------------------------------------------
        # Vérification email uniquement pour les CLIENTS
        # ----------------------------------------------------

        if user.role == RoleChoices.CLIENT and not user.is_email_verified:

            verification_token = EmailVerificationToken.create_token(user)

            EmailService.send_verification_email(
                user=user,
                verification_token=verification_token,
            )

            logger.info(
                "Email de vérification envoyé à %s",
                user.email,
            )

        return Response(
            {
                "message": (
                    "Compte créé avec succès. "
                    "Un email de vérification a été envoyé "
                    "à votre adresse email."
                ),
                "user": UserDetailedSerializer(
                    user,
                    context={"request": request},
                ).data,
            },
            status=status.HTTP_201_CREATED,
        )

    # ========================================================
    # LOGIN
    # ========================================================

    @action(detail=False, methods=["post"])
    def login(self, request):
        """
        Connexion traditionnelle.

        Le flag force_password_change est renvoyé au frontend.
        Si True, le frontend doit rediriger vers /change-password.
        Les tokens JWT sont posés en cookies HttpOnly — jamais exposés
        dans le body de la réponse.
        """

        serializer = LoginSerializer(
            data=request.data,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)

        user = serializer.validated_data["user"]
        refresh = RefreshToken.for_user(user)

        response = Response(
            {
                "message": "Connexion réussie.",
                "user": UserDetailedSerializer(
                    user, context={"request": request}
                ).data,
                "force_password_change": bool(user.force_password_change),
            },
            status=status.HTTP_200_OK,
        )

        return set_auth_cookies(response, refresh)

    # ========================================================
    # LOGOUT
    # ========================================================

    @action(detail=False, methods=["post"])
    def logout(self, request):
        """
        Déconnexion — efface les cookies JWT côté navigateur.
        Même si le token est déjà expiré, les cookies sont supprimés.
        """
        response = Response(
            {"message": "Déconnexion réussie."},
            status=status.HTTP_200_OK,
        )
        response.delete_cookie("access_token")
        response.delete_cookie("refresh_token")
        return response

    # ========================================================
    # TOKEN REFRESH
    # ========================================================

    @action(detail=False, methods=["post"])
    def token_refresh(self, request):
        """
        Renouvelle l'access token depuis le cookie refresh_token.
        Axios appelle cette route automatiquement sur réception d'un 401.
        """
        refresh_token = request.COOKIES.get("refresh_token")

        if not refresh_token:
            return Response(
                {"detail": "Token de rafraîchissement manquant."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        try:
            refresh = RefreshToken(refresh_token)
            response = Response(
                {"message": "Token rafraîchi."},
                status=status.HTTP_200_OK,
            )
            return set_auth_cookies(response, refresh)

        except TokenError:
            return Response(
                {"detail": "Session expirée. Veuillez vous reconnecter."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

    # ========================================================
    # ME
    # ========================================================

    @action(detail=False, methods=["get", "patch"])
    def me(self, request):
            """
            GET   → retourne le profil de l'utilisateur connecté.
            PATCH → met à jour le profil du CLIENT.

            Accessible même avec force_password_change=True pour GET.
            PATCH bloqué si force_password_change=True (via get_permissions).
            """

            if request.method == "PATCH":
                serializer = ClientProfileSerializer(
                    request.user,
                    data=request.data,
                    partial=True,
                    context={"request": request},
                )
                serializer.is_valid(raise_exception=True)
                serializer.save()

                return Response(
                    UserDetailedSerializer(
                        request.user,
                        context={"request": request},
                    ).data
                )

            return Response(
                UserDetailedSerializer(
                    request.user, context={"request": request}
                ).data
            )

    # ========================================================
    # CHANGE PASSWORD
    # ========================================================

    @action(detail=False, methods=["post"])
    @transaction.atomic
    def change_password(self, request):
        """
        Change le mot de passe de l'utilisateur connecté.

        Si force_password_change=True, cette action permet de
        remplacer le mot de passe temporaire par le définitif.
        Après réussite : force_password_change=False.
        """

        serializer = ChangePasswordSerializer(
            data=request.data,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)

        user = request.user
        user.set_password(serializer.validated_data["new_password"])
        user.force_password_change = False
        user.save(update_fields=["password", "force_password_change", "updated_at"])

        logger.info("Mot de passe changé pour l'utilisateur %s", user.email)

        return Response(
            {
                "message": "Mot de passe modifié avec succès.",
                "force_password_change": False,
            },
            status=status.HTTP_200_OK,
        )

    # ========================================================
    # CREATE BY ADMIN
        # ========================================================
    @action(detail=False, methods=["post"])
    @transaction.atomic
    def create_by_admin(self, request):
        """
        Création d'un utilisateur par ADMIN ou SUPER_ADMIN.

        Pour AGENT / GESTIONNAIRE / ADMIN :
        - pas de vérification email
        - mot de passe temporaire
        - force_password_change=True

        Pour CLIENT :
        - création classique.
        """

        serializer = AdminCreateUserSerializer(
            data=request.data,
            context={"request": request},
        )

        # ========================================================
        # VALIDATION DES DONNÉES
        # ========================================================

        serializer.is_valid(raise_exception=True)

        # ========================================================
        # CRÉATION DE L'UTILISATEUR
        # ========================================================

        try:
            # Savepoint interne.
            # Permet de récupérer proprement une IntegrityError
            # sans casser la transaction externe.
            with transaction.atomic():
                user = serializer.save()

        except IntegrityError as exc:

            error_message = str(exc).lower()

            # ====================================================
            # EMAIL DÉJÀ UTILISÉ
            # ====================================================

            if (
                "users_user_email_key" in error_message
                or "email" in error_message
            ):
                return Response(
                    {
                        "email": [
                            "Un compte avec cette adresse email "
                            "existe déjà."
                        ]
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # ====================================================
            # PERMIS DÉJÀ UTILISÉ
            # ====================================================

            if "driving_license_number" in error_message:
                return Response(
                    {
                        "driving_license_number": [
                            "Ce numéro de permis de conduire "
                            "est déjà utilisé."
                        ]
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # ====================================================
            # PIÈCE D'IDENTITÉ DÉJÀ UTILISÉE
            # ====================================================

            if "id_document_number" in error_message:
                return Response(
                    {
                        "id_document_number": [
                            "Ce numéro de pièce d'identité "
                            "est déjà utilisé."
                        ]
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # ====================================================
            # AUTRE ERREUR D'INTÉGRITÉ
            # ====================================================

            logger.exception(
                "Erreur d'intégrité lors de la création "
                "d'un utilisateur par %s",
                request.user.email,
            )

            return Response(
                {
                    "detail": (
                        "Impossible de créer l'utilisateur. "
                        "Certaines données sont déjà utilisées."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ========================================================
        # LOG
        # ========================================================

        logger.info(
            "Utilisateur %s créé par %s",
            user.email,
            request.user.email,
        )

        # ========================================================
        # RÉPONSE
        # ========================================================

        return Response(
            {
                "message": "Utilisateur créé avec succès.",
                "user": UserDetailedSerializer(
                    user,
                    context={"request": request},
                ).data,
                "temporary_password": serializer.context.get(
                    "temporary_password"
                ),
                "force_password_change": bool(
                    user.force_password_change
                ),
                "is_email_verified": bool(
                    user.is_email_verified
                ),
            },
            status=status.HTTP_201_CREATED,
        )
    # ========================================================
    # CHANGE ROLE
    # ========================================================

    @action(detail=True, methods=["patch"])
    @transaction.atomic
    def change_role(self, request, pk=None):
        """
        Modification du rôle d'un utilisateur.

        SUPER_ADMIN : tous les rôles.
        ADMIN       : CLIENT, AGENT, GESTIONNAIRE uniquement.
        Impossible  : modifier son propre rôle.
        """

        target = self.get_object()

        if target.pk == request.user.pk:
            return Response(
                {"detail": "Vous ne pouvez pas modifier votre propre rôle."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = ChangeRoleWithReasonSerializer(
            data=request.data,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)

        new_role = serializer.validated_data["role"]
        reason = serializer.validated_data.get("reason", "")
        current_user = request.user

        if current_user.role == RoleChoices.ADMIN and new_role in (
            RoleChoices.ADMIN,
            RoleChoices.SUPER_ADMIN,
        ):
            return Response(
                {"detail": "Un Admin ne peut pas attribuer le rôle Admin ou Super Admin."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if new_role == RoleChoices.SUPER_ADMIN:
            if current_user.role != RoleChoices.SUPER_ADMIN or not current_user.is_superuser:
                return Response(
                    {"detail": "Seul un Super Admin peut attribuer ce rôle."},
                    status=status.HTTP_403_FORBIDDEN,
                )

        old_role = target.role
        target.role = new_role

        if new_role in (RoleChoices.AGENT, RoleChoices.GESTIONNAIRE, RoleChoices.ADMIN):
            target.force_password_change = True
            target.is_email_verified = True

        elif new_role == RoleChoices.CLIENT:
            target.force_password_change = False

        elif new_role == RoleChoices.SUPER_ADMIN:
            target.force_password_change = False
            target.is_email_verified = True

        target.full_clean()

        target._change_reason = reason or f"Changement de rôle : {old_role} → {new_role}"
        target.save()

        return Response(
            {
                "message": "Rôle modifié avec succès.",
                "user": UserDetailedSerializer(
                    target, context={"request": request}
                ).data,
            },
            status=status.HTTP_200_OK,
        )

    # ========================================================
    # ACTIVATE
    # ========================================================

    @action(detail=True, methods=["post"])
    def activate(self, request, pk=None):
        user = self.get_object()
        user.is_active = True
        user._change_reason = "Activation du compte"
        user.save()

        return Response({"message": "Utilisateur activé avec succès."})

    # ========================================================
    # DEACTIVATE
    # ========================================================

    @action(detail=True, methods=["post"])
    def deactivate(self, request, pk=None):
        user = self.get_object()

        if user.pk == request.user.pk:
            return Response(
                {"detail": "Vous ne pouvez pas désactiver votre propre compte."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.is_active = False
        user._change_reason = "Désactivation du compte"
        user.save()

        return Response({"message": "Utilisateur désactivé avec succès."})

    # ========================================================
    # SOFT DELETE
    # ========================================================

    @action(detail=True, methods=["post"])
    @transaction.atomic
    def restore(self, request, pk=None):
        """
        Restaure un utilisateur soft-deleted.
        Un nouvel email est obligatoire car l'ancien a été anonymisé.
        """

        user = User.all_objects.filter(
            pk=pk,
            deleted_at__isnull=False
        ).first()

        if not user:
            return Response(
                {"detail": "Utilisateur supprimé introuvable."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Nouvel email obligatoire car l'ancien est anonymisé
        new_email = request.data.get("email", "").lower().strip()

        if not new_email:
            return Response(
                {"detail": "Un nouvel email est obligatoire pour restaurer ce compte."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Vérifier que le nouvel email n'est pas déjà utilisé
        if User.objects.filter(email=new_email).exists():
            return Response(
                {"detail": "Cet email est déjà utilisé par un autre compte."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.email      = new_email
        user.deleted_at = None
        user.deleted_by = None
        user.is_active  = True
        user._change_reason = "Restauration utilisateur"
        user.save()

        return Response(
            {
                "message": "Utilisateur restauré avec succès.",
                "user": UserDetailedSerializer(
                    user, context={"request": request}
                ).data,
            }
        )

    # ========================================================
    # TRASH
    # ========================================================

    @action(detail=False, methods=["get"])
    def trash(self, request):
        """Liste les utilisateurs soft-deleted."""

        users = (
            User.all_objects
            .filter(deleted_at__isnull=False)
            .order_by("-deleted_at")
        )

        serializer = SoftDeletedUserSerializer(users, many=True)
        return Response(serializer.data)

    # ========================================================
    # RESTORE
    # ========================================================

    # @action(detail=True, methods=["post"])
    # @transaction.atomic
    # def restore(self, request, pk=None):
    #     """Restaure un utilisateur soft-deleted."""

    #     user = User.all_objects.filter(pk=pk, deleted_at__isnull=False).first()

    #     if not user:
    #         return Response(
    #             {"detail": "Utilisateur supprimé introuvable."},
    #             status=status.HTTP_404_NOT_FOUND,
    #         )

    #     user.deleted_at = None
    #     user.deleted_by = None
    #     user.is_active = True
    #     user._change_reason = "Restauration utilisateur"
    #     user.save()

    #     return Response(
    #         {
    #             "message": "Utilisateur restauré avec succès.",
    #             "user": UserDetailedSerializer(
    #                 user, context={"request": request}
    #             ).data,
    #         }
    #     )


    # ========================================================
    # ELIGIBILITY
    # ========================================================

    @action(detail=False, methods=["get"])
    def eligibility(self, request):
        """Vérifie l'éligibilité du client à la location."""

        return Response(
            UserEligibilitySerializer(request.user).data
        )

    # ========================================================
    # AUDIT HISTORY
    # ========================================================

    @action(detail=True, methods=["get"])
    def audit_history(self, request, pk=None):
        """Retourne l'historique des modifications d'un utilisateur."""

        user = self.get_object()
        serializer = AuditHistorySerializer(user.history.all(), many=True)
        return Response(serializer.data)

    # ========================================================
    # FORGOT PASSWORD
    # ========================================================

    @action(detail=False, methods=["post"])
    def forgot_password(self, request):
        """
        Génère un token de réinitialisation.
        La réponse ne révèle jamais si l'adresse email existe.
        """

        serializer = ForgotPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data["email"]

        user = User.objects.filter(
            email=email,
            deleted_at__isnull=True,
            is_active=True,
        ).first()

        if user:
            PasswordResetToken.create_token(user)
            logger.info("Token de reset créé pour %s", user.email)

        return Response(
            {
                "message": (
                    "Si cette adresse existe, "
                    "un lien de réinitialisation a été envoyé."
                )
            }
        )

    # ========================================================
    # RESET PASSWORD
    # ========================================================

    @action(detail=False, methods=["post"])
    @transaction.atomic
    def reset_password(self, request):
        """Réinitialisation du mot de passe avec token."""

        serializer = ResetPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        reset_token = serializer.validated_data["reset_token"]
        user = serializer.validated_data["user"]

        user.set_password(serializer.validated_data["new_password"])
        user.force_password_change = False
        user.save(update_fields=["password", "force_password_change", "updated_at"])

        reset_token.mark_as_used()

        return Response({"message": "Mot de passe réinitialisé avec succès."})

    # ========================================================
    # VALIDATE RESET TOKEN
    # ========================================================

    @action(detail=False, methods=["post"])
    def validate_reset_token(self, request):
        serializer = ResetPasswordValidateTokenSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        return Response({"valid": True, "message": "Token valide."})

    # ========================================================
    # VERIFY EMAIL
    # ========================================================

    @action(detail=False, methods=["post"])
    @transaction.atomic
    def verify_email(self, request):
        """
        Vérification email pour les utilisateurs qui utilisent ce mécanisme.
        Le personnel administratif n'a pas besoin de cette étape.
        """

        serializer = EmailVerificationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        verification_token = (
            EmailVerificationToken.objects
            .select_related("user")
            .filter(token=serializer.validated_data["token"])
            .first()
        )

        if not verification_token:
            return Response(
                {"detail": "Token invalide."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = verification_token.user
        user.is_email_verified = True
        user.save(update_fields=["is_email_verified", "updated_at"])

        verification_token.is_used = True
        verification_token.save(update_fields=["is_used"])

        return Response({"message": "Adresse email vérifiée avec succès."})

    # ========================================================
    # GOOGLE LOGIN
    # ========================================================

    @action(detail=False, methods=["post"])
    @transaction.atomic
    def google_login(self, request):
        """
        Connexion Google.
        La validation du token est déléguée à GoogleTokenService.
        Les tokens JWT sont posés en cookies HttpOnly.
        """

        serializer = GoogleLoginSerializer(
            data=request.data,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)

        payload = serializer.validated_data["id_token"]
        email = payload.get("email")

        if not email:
            return Response(
                {"detail": "Email Google introuvable."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        email = email.lower()

        user = User.objects.filter(
            email=email,
            deleted_at__isnull=True,
        ).first()

        if not user:
            user = User.objects.create_user(
                email=email,
                password=None,
                oauth_only=True,
                is_email_verified=True,
                role=RoleChoices.CLIENT,
                first_name=payload.get("given_name", ""),
                last_name=payload.get("family_name", ""),
            )

        if not user.is_active:
            return Response(
                {"detail": "Cet utilisateur est inactif."},
                status=status.HTTP_403_FORBIDDEN,
            )

        refresh = RefreshToken.for_user(user)

        response = Response(
            {
                "message": "Connexion Google réussie.",
                "user": UserDetailedSerializer(
                    user, context={"request": request}
                ).data,
                "force_password_change": bool(user.force_password_change),
            }
        )

        return set_auth_cookies(response, refresh)

    # ========================================================
# CREATE CLIENT BY AGENT
# ========================================================

    @action(detail=False, methods=["post"])
    @transaction.atomic
    def create_by_agent(self, request):
        """
        Création d'un CLIENT par un AGENT.

        L'Agent ne peut créer que des clients.
        Le mot de passe est généré automatiquement.
        """

        serializer = AgentCreateClientSerializer(
            data=request.data,
            context={"request": request},
        )

        serializer.is_valid(raise_exception=True)

        try:
            with transaction.atomic():
                user = serializer.save()

        except IntegrityError as exc:
            error_message = str(exc).lower()

            if "email" in error_message:
                return Response(
                    {
                        "email": [
                            "Un compte avec cette adresse email "
                            "existe déjà."
                        ]
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if "driving_license_number" in error_message:
                return Response(
                    {
                        "driving_license_number": [
                            "Ce numéro de permis de conduire "
                            "est déjà utilisé."
                        ]
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if "id_document_number" in error_message:
                return Response(
                    {
                        "id_document_number": [
                            "Ce numéro de pièce d'identité "
                            "est déjà utilisé."
                        ]
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            logger.exception(
                "Erreur lors de la création d'un client par %s",
                request.user.email,
            )

            return Response(
                {
                    "detail": (
                        "Impossible de créer le client. "
                        "Certaines données sont déjà utilisées."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        logger.info(
            "Client %s créé par l'agent %s",
            user.email,
            request.user.email,
        )

        return Response(
            {
                "message": "Client créé avec succès.",
                "user": UserDetailedSerializer(
                    user,
                    context={"request": request},
                ).data,
                "temporary_password": serializer.context.get(
                    "temporary_password"
                ),
            },
            status=status.HTTP_201_CREATED,
        )

    # ========================================================
# LIST CLIENTS FOR AGENT
# ========================================================

    @action(detail=False, methods=["get"])
    def clients(self, request):
        """
        Retourne uniquement les clients accessibles à l'agent.
        Les utilisateurs soft-deleted sont déjà exclus par User.objects.
        """

        clients = (
            User.objects
            .filter(role=RoleChoices.CLIENT)
            .order_by("first_name", "last_name", "email")
        )

        serializer = UserReadSerializer(
            clients,
            many=True,
            context={"request": request},
        )

        return Response(serializer.data)