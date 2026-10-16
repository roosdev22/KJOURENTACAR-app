import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  KeyRound,
} from "lucide-react";

import type { AxiosError } from "axios";

import { authService } from "../../api/services/authService";
import { useAuth } from "../../hooks/useAuth";

// ============================================================
// TYPES
// ============================================================

interface DjangoErrorResponse {
  detail?: string;
  error?: string;
  current_password?: string | string[];
  new_password?: string | string[];
  confirm_password?: string | string[];
}

// ============================================================
// PAGE CHANGEMENT MOT DE PASSE
// ============================================================

export default function ChangePasswordPage() {
  const navigate = useNavigate();

  const {
    user,
    updateUser,
  } = useAuth();

  // ==========================================================
  // FORM DATA
  // ==========================================================

  const [formData, setFormData] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  // ==========================================================
  // STATES
  // ==========================================================

  const [showCurrent, setShowCurrent] =
    useState(false);

  const [showNew, setShowNew] =
    useState(false);

  const [showConfirm, setShowConfirm] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  // ==========================================================
  // CHANGEMENT DES CHAMPS
  // ==========================================================

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const {
      name,
      value,
    } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  };

  // ==========================================================
  // MESSAGE ERREUR DJANGO
  // ==========================================================

  const getErrorMessage = (
    err: AxiosError<DjangoErrorResponse>
  ): string => {
    const data = err.response?.data;

    if (!data) {
      return (
        "Impossible de joindre le serveur. " +
        "Vérifiez votre connexion."
      );
    }

    if (typeof data.detail === "string") {
      return data.detail;
    }

    if (typeof data.error === "string") {
      return data.error;
    }

    if (data.current_password) {
      return Array.isArray(
        data.current_password
      )
        ? data.current_password[0]
        : data.current_password;
    }

    if (data.new_password) {
      return Array.isArray(
        data.new_password
      )
        ? data.new_password[0]
        : data.new_password;
    }

    if (data.confirm_password) {
      return Array.isArray(
        data.confirm_password
      )
        ? data.confirm_password[0]
        : data.confirm_password;
    }

    return (
      "Impossible de modifier le mot de passe."
    );
  };

  // ==========================================================
  // REDIRECTION SELON LE ROLE
  // ==========================================================

  const redirectAfterPasswordChange = (
    role: string
  ) => {
    switch (role) {
      // ------------------------------------------------------
      // CLIENT
      // ------------------------------------------------------

      case "CLIENT":
        navigate("/dashboard", {
          replace: true,
        });
        break;

      // ------------------------------------------------------
      // AGENT
      // ------------------------------------------------------

      case "AGENT":
        navigate("/gestionnaire", {
          replace: true,
        });
        break;

      // ------------------------------------------------------
      // GESTIONNAIRE
      // ------------------------------------------------------

      case "GESTIONNAIRE":
        navigate("/gestionnaire", {
          replace: true,
        });
        break;

      // ------------------------------------------------------
      // ADMIN
      // SUPER_ADMIN
      // ------------------------------------------------------

      case "ADMIN":
      case "SUPER_ADMIN":
        navigate("/admin", {
          replace: true,
        });
        break;

      // ------------------------------------------------------
      // ROLE INCONNU
      // ------------------------------------------------------

      default:
        navigate("/", {
          replace: true,
        });
    }
  };

  // ==========================================================
  // SOUMISSION
  // ==========================================================

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    const {
      current_password,
      new_password,
      confirm_password,
    } = formData;

    // --------------------------------------------------------
    // USER ABSENT
    // --------------------------------------------------------

    if (!user) {
      setError(
        "Utilisateur non authentifié."
      );

      return;
    }

    // --------------------------------------------------------
    // VALIDATION
    // --------------------------------------------------------

    if (
      !current_password ||
      !new_password ||
      !confirm_password
    ) {
      setError(
        "Veuillez remplir tous les champs."
      );

      return;
    }

    // --------------------------------------------------------
    // LONGUEUR
    // --------------------------------------------------------

    if (new_password.length < 8) {
      setError(
        "Le nouveau mot de passe doit contenir au moins 8 caractères."
      );

      return;
    }

    // --------------------------------------------------------
    // CONFIRMATION
    // --------------------------------------------------------

    if (
      new_password !== confirm_password
    ) {
      setError(
        "La confirmation du nouveau mot de passe ne correspond pas."
      );

      return;
    }

    // --------------------------------------------------------
    // ANCIEN / NOUVEAU
    // --------------------------------------------------------

    if (
      current_password === new_password
    ) {
      setError(
        "Le nouveau mot de passe doit être différent de l'ancien."
      );

      return;
    }

    // ========================================================
    // API
    // ========================================================

    try {
      setLoading(true);

      await authService.changePassword({
        current_password,
        new_password,
        confirm_password,
      });

      // ======================================================
      // MISE À JOUR AUTH CONTEXT
      // ======================================================

      updateUser({
        ...user,
        force_password_change: false,
      });

      // ======================================================
      // MESSAGE SUCCÈS
      // ======================================================

      setSuccess(
        "Votre mot de passe a été modifié avec succès."
      );

      // ======================================================
      // REDIRECTION
      // ======================================================

      setTimeout(() => {
        redirectAfterPasswordChange(
          user.role
        );
      }, 1000);

    } catch (err) {
      const axiosError =
        err as AxiosError<DjangoErrorResponse>;

      setError(
        getErrorMessage(axiosError)
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // INTERFACE
  // ==========================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center p-6">

      <div className="w-full max-w-md bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">

        {/* ====================================================
            HEADER
        ==================================================== */}

        <div className="px-8 pt-8 pb-6 text-center border-b border-gray-100">

          <div className="flex justify-center mb-4">
            <div className="w-14 h-14 bg-red-700 rounded-xl flex items-center justify-center shadow-md">
              <KeyRound
                size={28}
                className="text-white"
              />
            </div>
          </div>

          <h1 className="text-2xl font-semibold text-gray-900">
            Changer votre mot de passe
          </h1>

          <p className="mt-2 text-sm text-gray-600">
            Pour des raisons de sécurité, vous devez
            remplacer votre mot de passe temporaire
            avant d'accéder à votre espace.
          </p>
        </div>

        {/* ====================================================
            FORMULAIRE
        ==================================================== */}

        <div className="px-8 py-8">

          {/* ==================================================
              INFORMATIONS UTILISATEUR
          ================================================== */}

          {user && (
            <div className="mb-5 p-3 bg-gray-50 border border-gray-200 rounded-lg">

              <p className="text-xs text-gray-500">
                Compte connecté
              </p>

              <p className="text-sm font-medium text-gray-900 mt-1">
                {user.first_name}{" "}
                {user.last_name}
              </p>

              <p className="text-xs text-gray-500">
                {user.email}
              </p>

              <p className="text-xs text-gray-500 mt-1">
                Rôle :{" "}
                <span className="font-semibold">
                  {user.role}
                </span>
              </p>
            </div>
          )}

          {/* ==================================================
              ERREUR
          ================================================== */}

          {error && (
            <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-start gap-2">

              <AlertCircle
                size={17}
                className="mt-0.5 shrink-0"
              />

              <span>{error}</span>
            </div>
          )}

          {/* ==================================================
              SUCCÈS
          ================================================== */}

          {success && (
            <div className="mb-5 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm flex items-start gap-2">

              <CheckCircle
                size={17}
                className="mt-0.5 shrink-0"
              />

              <span>{success}</span>
            </div>
          )}

          {/* ==================================================
              FORM
          ================================================== */}

          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >

            {/* ==================================================
                MOT DE PASSE ACTUEL
            ================================================== */}

            <div>

              <label
                htmlFor="current_password"
                className="block text-xs font-semibold uppercase tracking-wide text-gray-600 mb-2"
              >
                Mot de passe temporaire
              </label>

              <div className="relative">

                <Lock
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500"
                />

                <input
                  id="current_password"
                  name="current_password"
                  type={
                    showCurrent
                      ? "text"
                      : "password"
                  }
                  value={
                    formData.current_password
                  }
                  onChange={handleChange}
                  disabled={loading}
                  autoComplete="current-password"
                  placeholder="Votre mot de passe temporaire"
                  className="w-full pl-10 pr-11 py-2.5 text-sm border border-gray-300 rounded-lg transition-all focus:outline-none focus:border-red-700 focus:ring-2 focus:ring-red-100 disabled:bg-gray-100"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowCurrent(
                      (prev) => !prev
                    )
                  }
                  disabled={loading}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 disabled:opacity-50"
                  aria-label={
                    showCurrent
                      ? "Masquer le mot de passe"
                      : "Afficher le mot de passe"
                  }
                >
                  {showCurrent ? (
                    <EyeOff size={17} />
                  ) : (
                    <Eye size={17} />
                  )}
                </button>

              </div>
            </div>

            {/* ==================================================
                NOUVEAU MOT DE PASSE
            ================================================== */}

            <div>

              <label
                htmlFor="new_password"
                className="block text-xs font-semibold uppercase tracking-wide text-gray-600 mb-2"
              >
                Nouveau mot de passe
              </label>

              <div className="relative">

                <Lock
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500"
                />

                <input
                  id="new_password"
                  name="new_password"
                  type={
                    showNew
                      ? "text"
                      : "password"
                  }
                  value={
                    formData.new_password
                  }
                  onChange={handleChange}
                  disabled={loading}
                  autoComplete="new-password"
                  placeholder="Nouveau mot de passe"
                  className="w-full pl-10 pr-11 py-2.5 text-sm border border-gray-300 rounded-lg transition-all focus:outline-none focus:border-red-700 focus:ring-2 focus:ring-red-100 disabled:bg-gray-100"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowNew(
                      (prev) => !prev
                    )
                  }
                  disabled={loading}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 disabled:opacity-50"
                  aria-label={
                    showNew
                      ? "Masquer le mot de passe"
                      : "Afficher le mot de passe"
                  }
                >
                  {showNew ? (
                    <EyeOff size={17} />
                  ) : (
                    <Eye size={17} />
                  )}
                </button>

              </div>

              <p className="mt-1.5 text-xs text-gray-400">
                Minimum 8 caractères.
              </p>
            </div>

            {/* ==================================================
                CONFIRMATION
            ================================================== */}

            <div>

              <label
                htmlFor="confirm_password"
                className="block text-xs font-semibold uppercase tracking-wide text-gray-600 mb-2"
              >
                Confirmer le nouveau mot de passe
              </label>

              <div className="relative">

                <Lock
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500"
                />

                <input
                  id="confirm_password"
                  name="confirm_password"
                  type={
                    showConfirm
                      ? "text"
                      : "password"
                  }
                  value={
                    formData.confirm_password
                  }
                  onChange={handleChange}
                  disabled={loading}
                  autoComplete="new-password"
                  placeholder="Confirmez votre nouveau mot de passe"
                  className="w-full pl-10 pr-11 py-2.5 text-sm border border-gray-300 rounded-lg transition-all focus:outline-none focus:border-red-700 focus:ring-2 focus:ring-red-100 disabled:bg-gray-100"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowConfirm(
                      (prev) => !prev
                    )
                  }
                  disabled={loading}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 disabled:opacity-50"
                  aria-label={
                    showConfirm
                      ? "Masquer le mot de passe"
                      : "Afficher le mot de passe"
                  }
                >
                  {showConfirm ? (
                    <EyeOff size={17} />
                  ) : (
                    <Eye size={17} />
                  )}
                </button>

              </div>
            </div>

            {/* ==================================================
                BOUTON
            ================================================== */}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-red-700 hover:bg-red-800 text-white font-semibold rounded-lg text-sm transition-all hover:shadow-md active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />

                  Modification en cours...
                </>
              ) : (
                <>
                  <KeyRound size={16} />

                  Modifier le mot de passe
                </>
              )}
            </button>
          </form>

          {/* ==================================================
              SÉCURITÉ
          ================================================== */}

          <div className="mt-6 pt-5 border-t border-gray-100">

            <p className="text-xs text-gray-500 text-center">
              Votre nouveau mot de passe remplacera
              définitivement le mot de passe temporaire.
              Vous pourrez ensuite accéder à votre espace.
            </p>

          </div>
        </div>
      </div>
    </div>
  );
}

