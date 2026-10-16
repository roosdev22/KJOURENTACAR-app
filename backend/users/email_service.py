# users/email_service.py

from django.conf import settings
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.html import strip_tags


class EmailService:
    """Service pour envoyer les emails."""

    @staticmethod
    def send_verification_email(user, verification_token):
        """Envoie l'email de vérification."""

        verification_url = (
            f"{settings.BACKEND_URL}/api/users/confirm-email/"
            f"{verification_token.token}/"
)

        context = {
            "user_name": user.get_full_name() or user.first_name,
            "email": user.email,
            "verification_url": verification_url,
            "expires_in_hours": 24,
        }

        html_message = render_to_string(
            "users/email/verification_email.html",
            context,
        )
        plain_message = strip_tags(html_message)

        send_mail(
            subject="Vérifiez votre adresse email - KJOURENTACAR",
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            html_message=html_message,
            fail_silently=False,
        )

    @staticmethod
    def send_reset_password_email(user, reset_token):
        """Envoie le lien de réinitialisation du mot de passe."""

        reset_url = (
            f"{settings.FRONTEND_URL}/auth/reset-password?token={reset_token.token}"
        )

        context = {
            "user_name": user.get_full_name() or user.first_name,
            "email": user.email,
            "reset_url": reset_url,
            "expires_in_hours": 24,
        }

        html_message = render_to_string(
            "users/email/reset_password.html",
            context,
        )
        plain_message = strip_tags(html_message)

        send_mail(
            subject="Réinitialiser votre mot de passe - KJOURENTACAR",
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            html_message=html_message,
            fail_silently=False,
        )

    @staticmethod
    def send_password_changed_confirmation(user):
        """Confirme que le mot de passe a été modifié."""

        context = {
            "user_name": user.get_full_name() or user.first_name,
            "email": user.email,
        }

        html_message = render_to_string(
            "users/email/password_changed.html",
            context,
        )
        plain_message = strip_tags(html_message)

        send_mail(
            subject="Votre mot de passe a été modifié - KJOURENTACAR",
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            html_message=html_message,
            fail_silently=False,
        )