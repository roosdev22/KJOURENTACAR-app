import axios from "axios";

type ApiErrorData = {
  detail?: unknown;
  error?: unknown;
  non_field_errors?: unknown;
  email_verified?: unknown;
  force_password_change?: unknown;
  [key: string]: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function firstMessage(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const message = firstMessage(item);

      if (message) {
        return message;
      }
    }
  }

  return null;
}

export function getApiErrorMessage(
  error: unknown,
  fallback = "Une erreur est survenue. Veuillez réessayer."
): string {
  if (!axios.isAxiosError<ApiErrorData>(error)) {
    return fallback;
  }

  const response = error.response;
  const status = response?.status;
  const data = response?.data;

  // Le serveur n'a pas répondu.
  if (!response) {
    if (error.code === "ECONNABORTED") {
      return "Le serveur met trop de temps à répondre. Réessayez.";
    }

    return (
      "Impossible de joindre le serveur. " +
      "Vérifiez votre connexion."
    );
  }

  // Protection contre les réponses inattendues.
  if (!isRecord(data)) {
    if (status !== undefined && status >= 500) {
      return (
        "Une erreur interne est survenue. " +
        "Veuillez réessayer plus tard."
      );
    }

    return fallback;
  }

  // Messages métier spécifiques à l'authentification.
  if (data.email_verified === false) {
    return (
      "Votre email n'est pas vérifié. " +
      "Consultez votre boîte mail."
    );
  }

  if (data.force_password_change === true) {
    return (
      "Vous devez changer votre mot de passe " +
      "avant de continuer."
    );
  }

  // Erreurs générales renvoyées par Django REST Framework.
  const nonFieldMessage = firstMessage(data.non_field_errors);

  if (nonFieldMessage) {
    return nonFieldMessage;
  }

  const detailMessage = firstMessage(data.detail);

  if (detailMessage) {
    return detailMessage;
  }

  const errorMessage = firstMessage(data.error);

  if (errorMessage) {
    return errorMessage;
  }

  // Erreurs de validation des champs.
  const ignoredKeys = new Set([
    "detail",
    "error",
    "non_field_errors",
    "email_verified",
    "force_password_change",
  ]);

  const fieldMessages: string[] = [];

  for (const [field, value] of Object.entries(data)) {
    if (ignoredKeys.has(field)) {
      continue;
    }

    const message = firstMessage(value);

    if (message) {
      fieldMessages.push(`${field} : ${message}`);
    }
  }

  if (fieldMessages.length > 0) {
    return fieldMessages.join(" — ");
  }

  if (status === 401) {
    return "Authentification refusée. Vérifiez vos informations.";
  }

  if (status === 403) {
    return "Vous n'avez pas l'autorisation d'effectuer cette action.";
  }

  if (status === 404) {
    return "La ressource demandée est introuvable.";
  }

  if (status !== undefined && status >= 500) {
    return (
      "Une erreur interne est survenue. " +
      "Veuillez réessayer plus tard."
    );
  }

  return fallback;
}