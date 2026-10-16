"""
KJOURENTACAR — Authentification JWT par cookie

Dans notre architecture, le JWT est stocké dans un cookie
HttpOnly — JavaScript ne peut pas le lire pour le mettre
dans un header. Le navigateur l'envoie automatiquement
dans les cookies de la requête.

Cette classe étend JWTAuthentication pour lire le token
depuis request.COOKIES["access_token"] au lieu du header.
"""

import logging

from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError

logger = logging.getLogger(__name__)


class CookieJWTAuthentication(JWTAuthentication):
    """
    Authentification JWT via cookie HttpOnly.

    Ordre de lecture :
    1. Cookie "access_token" (notre méthode principale)
    2. Header "Authorization: Bearer" (fallback pour Postman/tests)
    """

    def authenticate(self, request):
        # Essai 1 — lire depuis le cookie HttpOnly
        access_token = request.COOKIES.get("access_token")

        if access_token:
            try:
                validated_token = self.get_validated_token(access_token)
                user = self.get_user(validated_token)

                # Vérifie que le compte est toujours actif et non supprimé.
                # Nécessaire car un token valide peut appartenir à un compte
                # désactivé après son émission.
                if not user.is_active or getattr(user, "deleted_at", None) is not None:
                    return None

                return (user, validated_token)

            except (InvalidToken, TokenError) as e:
                # Token invalide ou expiré — on essaie le header
                logger.debug("Cookie JWT invalide : %s", str(e))

        # Essai 2 — fallback sur le header Authorization (Postman, tests)
        return super().authenticate(request)