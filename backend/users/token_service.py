# users/token_service.py
"""
Service pour valider les tokens OAuth2 Google.

Google: Validation réelle avec google-auth
"""

import jwt
import logging
from typing import Dict, Any
from django.conf import settings
from django.core.exceptions import ValidationError
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token as google_id_token

logger = logging.getLogger(__name__)


class GoogleTokenService:
    """
    Service pour valider les tokens Google OAuth2.
    
    Utilise google-auth (déjà dans requirements).
    """
    
    @staticmethod
    def verify_token(id_token: str) -> Dict[str, Any]:
        """
        Vérifie et décode un ID token Google.
        
        Args:
            id_token: Token JWT fourni par Google Sign-In
            
        Returns:
            {
                'sub': 'google_user_id',
                'email': 'user@example.com',
                'email_verified': True/False,
                'name': 'Jean Dupont',
                'given_name': 'Jean',
                'family_name': 'Dupont',
                'picture': 'https://...',
                'aud': 'client_id',
                'iss': 'https://accounts.google.com'
            }
            
        Raises:
            ValidationError: Token invalide/expiré
        """
        try:
            # ========== EN DEV: Accepter les tokens non vérifiés ==========
            if settings.DEBUG:
                logger.debug("DEBUG MODE: Skipping Google token signature verification")
                payload = jwt.decode(
                    id_token,
                    options={"verify_signature": False}
                )
            else:
                # ========== EN PROD: Vérifier la signature auprès de Google ==========
                payload = google_id_token.verify_oauth2_token(
                    id_token,
                    google_requests.Request(),
                    settings.GOOGLE_CLIENT_ID
                )
            
            # ========== Valider les claims obligatoires ==========
            if not payload.get('sub') or not payload.get('email'):
                raise ValidationError(
                    "Token Google incomplet (sub ou email manquant)"
                )
            
            # ========== Vérifier l'audience (client_id) ==========
            aud = payload.get('aud')
            if aud != settings.GOOGLE_CLIENT_ID:
                raise ValidationError(
                    f"Token audience ({aud}) ne correspond pas au CLIENT_ID"
                )
            
            logger.info(f"Google token verified for: {payload.get('email')}")
            return payload
        
        except ValidationError:
            raise
        except jwt.ExpiredSignatureError:
            logger.warning("Google token expired")
            raise ValidationError("Token Google expiré")
        except jwt.InvalidTokenError as e:
            logger.warning(f"Google token validation failed: {str(e)}")
            raise ValidationError(f"Token Google invalide: {str(e)}")
        except Exception as e:
            logger.error(f"Google token verification error: {str(e)}")
            raise ValidationError(f"Erreur lors de la vérification du token Google: {str(e)}")