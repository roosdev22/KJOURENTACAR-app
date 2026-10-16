import os
from pathlib import Path
from datetime import timedelta

BASE_DIR = Path(__file__).resolve().parent.parent


# ============================================================
# SÉCURITÉ & ENVIRONNEMENT
# ============================================================

SECRET_KEY = os.getenv("SECRET_KEY")

DEBUG = os.getenv("DEBUG", "False") == "True"

ALLOWED_HOSTS = os.getenv(
    "ALLOWED_HOSTS",
    "127.0.0.1,localhost,backend,django_backend",
).split(",")


# ============================================================
# URLS APPLICATION
# ============================================================

# URL du frontend React/Vite
FRONTEND_URL = os.getenv(
    "FRONTEND_URL",
    "http://localhost:3000",
)

# URL du backend Django
# Utilisée notamment dans les emails de vérification
BACKEND_URL = os.getenv(
    "BACKEND_URL",
    "http://localhost:8000",
)


# ============================================================
# APPLICATIONS
# ============================================================

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",

    # Packages tiers
    "rest_framework",
    "rest_framework_simplejwt",
    "rest_framework_simplejwt.token_blacklist",
    "corsheaders",
    "django_extensions",
    "simple_history",

    # Applications du projet
    "vehicles",
    "users",
    "reservations",
    "payments",
    "contracts",
    "maintenance",
]


# ============================================================
# MIDDLEWARE
# ============================================================

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "simple_history.middleware.HistoryRequestMiddleware",
]


# ============================================================
# CONFIGURATION PRINCIPALE
# ============================================================

ROOT_URLCONF = "config.urls"

WSGI_APPLICATION = "config.wsgi.application"


# ============================================================
# TEMPLATES
# ============================================================

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]


# ============================================================
# BASE DE DONNÉES
# ============================================================

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": os.getenv("DB_NAME", ""),
        "USER": os.getenv("DB_USER", ""),
        "PASSWORD": os.getenv("DB_PASSWORD", ""),
        "HOST": os.getenv("DB_HOST", ""),
        "PORT": os.getenv("DB_PORT", "5432"),
    }
}


# ============================================================
# CUSTOM USER MODEL
# ============================================================

AUTH_USER_MODEL = "users.User"


# ============================================================
# DJANGO REST FRAMEWORK
# ============================================================

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "users.authentication.CookieJWTAuthentication",
    ),

    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],

    "DEFAULT_PAGINATION_CLASS": (
        "rest_framework.pagination.PageNumberPagination"
    ),

    "PAGE_SIZE": 20,

    "DEFAULT_FILTER_BACKENDS": [
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ],
}


# ============================================================
# SIMPLE JWT
# ============================================================

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(hours=7),
    # À passer à timedelta(minutes=15) en production

    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),

    "ROTATE_REFRESH_TOKENS": True,

    "BLACKLIST_AFTER_ROTATION": True,

    "UPDATE_LAST_LOGIN": True,

    "AUTH_HEADER_TYPES": ("Bearer",),

    "ALGORITHM": "HS256",

    "SIGNING_KEY": SECRET_KEY,

    "USER_ID_FIELD": "id",

    "USER_ID_CLAIM": "user_id",

    "JTI_CLAIM": "jti",
}


# ============================================================
# COOKIES JWT
# ============================================================

JWT_COOKIE_ACCESS_MAX_AGE = int(
    timedelta(hours=7).total_seconds()
)

JWT_COOKIE_REFRESH_MAX_AGE = int(
    timedelta(days=7).total_seconds()
)


# ============================================================
# GOOGLE OAUTH2
# ============================================================

GOOGLE_CLIENT_ID = os.getenv(
    "GOOGLE_CLIENT_ID",
    "",
)


# ============================================================
# CORS
# ============================================================

_cors_raw = os.getenv(
    "CORS_ALLOWED_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000",
)

CORS_ALLOWED_ORIGINS = [
    origin.strip()
    for origin in _cors_raw.split(",")
    if origin.strip()
]

CORS_ALLOW_CREDENTIALS = True

CORS_ALLOW_HEADERS = [
    "accept",
    "accept-encoding",
    "authorization",
    "content-type",
    "dnt",
    "origin",
    "user-agent",
    "x-csrftoken",
    "x-requested-with",
]


# ============================================================
# SESSIONS & COOKIES
# ============================================================

SESSION_COOKIE_SECURE = not DEBUG
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = "Lax"

CSRF_COOKIE_SECURE = not DEBUG
CSRF_COOKIE_HTTPONLY = False
CSRF_COOKIE_SAMESITE = "Lax"


# ============================================================
# EMAIL — SMTP
# ============================================================

EMAIL_BACKEND = os.getenv(
    "EMAIL_BACKEND",
    "django.core.mail.backends.console.EmailBackend",
)

EMAIL_HOST = os.getenv(
    "EMAIL_HOST",
    "smtp.gmail.com",
)

EMAIL_PORT = os.getenv(
    "EMAIL_PORT",
    "587",
)

EMAIL_USE_TLS = os.getenv(
    "EMAIL_USE_TLS",
    "True",
)

EMAIL_HOST_USER = os.getenv(
    "EMAIL_HOST_USER",
    "",
)

EMAIL_HOST_PASSWORD = os.getenv(
    "EMAIL_HOST_PASSWORD",
    "",
)

DEFAULT_FROM_EMAIL = os.getenv(
    "DEFAULT_FROM_EMAIL",
    "noreply@kjourentacar.com",
)


# ============================================================
# VALIDATION DES MOTS DE PASSE
# ============================================================

AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": (
            "django.contrib.auth.password_validation."
            "UserAttributeSimilarityValidator"
        ),
    },
    {
        "NAME": (
            "django.contrib.auth.password_validation."
            "MinimumLengthValidator"
        ),
        "OPTIONS": {
            "min_length": 8,
        },
    },
    {
        "NAME": (
            "django.contrib.auth.password_validation."
            "CommonPasswordValidator"
        ),
    },
    {
        "NAME": (
            "django.contrib.auth.password_validation."
            "NumericPasswordValidator"
        ),
    },
]


# ============================================================
# INTERNATIONALISATION
# ============================================================

LANGUAGE_CODE = "fr-fr"

TIME_ZONE = "America/Port-au-Prince"

USE_I18N = True
USE_TZ = True


# ============================================================
# FICHIERS STATIQUES
# ============================================================

STATIC_URL = "static/"

STATIC_ROOT = BASE_DIR / "staticfiles"

STORAGES = {
    "default": {
        "BACKEND": "django.core.files.storage.FileSystemStorage",
    },

    "staticfiles": {
        "BACKEND": (
            "whitenoise.storage."
            "CompressedManifestStaticFilesStorage"
        ),
    },
}


# ============================================================
# FICHIERS MEDIA
# ============================================================

MEDIA_ROOT = BASE_DIR / "media"

MEDIA_URL = "/media/"


# ============================================================
# LOGGING
# ============================================================

LOGGING = {
    "version": 1,

    "disable_existing_loggers": False,

    "formatters": {
        "verbose": {
            "format": (
                "{levelname} {asctime} {module} "
                "{process:d} {thread:d} {message}"
            ),
            "style": "{",
        },

        "simple": {
            "format": "{levelname} {asctime} {name} {message}",
            "style": "{",
        },
    },

    "filters": {
        "require_debug_false": {
            "()": "django.utils.log.RequireDebugFalse",
        },

        "require_debug_true": {
            "()": "django.utils.log.RequireDebugTrue",
        },
    },

    "handlers": {
        "console": {
            "level": "DEBUG" if DEBUG else "INFO",
            "class": "logging.StreamHandler",
            "formatter": "simple",
        },

        "file": {
            "level": "WARNING",
            "class": "logging.FileHandler",
            "filename": BASE_DIR / "logs" / "django.log",
            "formatter": "verbose",
        },
    },

    "loggers": {
        "django": {
            "handlers": [
                "console",
                "file",
            ],
            "level": "INFO",
            "propagate": False,
        },

        "users": {
            "handlers": [
                "console",
                "file",
            ],
            "level": "DEBUG" if DEBUG else "INFO",
            "propagate": False,
        },
    },
}

# ============================================================
# STOCKAGE PRIVÉ DES CONTRATS
# ============================================================

PRIVATE_MEDIA_ROOT = BASE_DIR / "private_media"
PRIVATE_MEDIA_ROOT.mkdir(parents=True, exist_ok=True)
# ============================================================
# DOSSIER LOGS
# ============================================================

LOGS_DIR = BASE_DIR / "logs"

LOGS_DIR.mkdir(
    exist_ok=True
)


# ============================================================
# SECURITY SETTINGS — PRODUCTION
# ============================================================

if not DEBUG:
    SECURE_SSL_REDIRECT = True

    SECURE_HSTS_SECONDS = 31536000

    SECURE_HSTS_INCLUDE_SUBDOMAINS = True

    SECURE_HSTS_PRELOAD = True

    SECURE_BROWSER_XSS_FILTER = True

# ============================================================
# CELERY
# ============================================================

CELERY_BROKER_URL = os.getenv(
    "CELERY_BROKER_URL",
    "redis://redis:6379/0",
)

CELERY_RESULT_BACKEND = os.getenv(
    "CELERY_RESULT_BACKEND",
    "redis://redis:6379/1",
)

CELERY_ACCEPT_CONTENT = [
    "json",
]

CELERY_TASK_SERIALIZER = "json"

CELERY_RESULT_SERIALIZER = "json"

CELERY_TIMEZONE = TIME_ZONE

CELERY_ENABLE_UTC = True

CELERY_BEAT_SCHEDULE = {
    "expire-reservations-hourly": {
        "task": "reservations.expire_reservations",
        "schedule": 5 * 60,
    },
}