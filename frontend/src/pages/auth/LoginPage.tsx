import { useState } from "react";

import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  Mail,
  Lock,
  AlertCircle,
  LogIn as LogInIcon,
  CheckCircle,
} from "lucide-react";

import { GoogleLogin } from "@react-oauth/google";
import type { AxiosError } from "axios";

import { authService } from "../../api/services/authService";
import { useAuth } from "../../hooks/useAuth";

// ============================================================
// TYPES
// ============================================================

type DjangoErrorData = {
  email_verified?: boolean;
  force_password_change?: boolean;
  error?: string;
  detail?: string;
};

type LoginLocationState = {
  from?: {
    pathname?: string;
  };
  registered?: boolean;
  email?: string;
};

// ============================================================
// PAGE LOGIN
// ============================================================

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const { login } = useAuth();

  const locationState =
    location.state as LoginLocationState | null;

  // Destination initiale
  const from =
    locationState?.from?.pathname ?? "/dashboard";

  // ==========================================================
  // STATES
  // ==========================================================

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] =
    useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    remember: false,
  });

  // ==========================================================
  // GESTION DES ERREURS DJANGO
  // ==========================================================

  function getDjangoErrorMessage(
    error: AxiosError<DjangoErrorData>
  ): string {
    const data = error.response?.data;
    const status = error.response?.status;

    // --------------------------------------------------------
    // PAS DE RÉPONSE SERVEUR
    // --------------------------------------------------------

    if (!error.response) {
      return (
        "Impossible de joindre le serveur. " +
        "Vérifiez votre connexion."
      );
    }

    // --------------------------------------------------------
    // 401
    // --------------------------------------------------------

    if (status === 401) {
      return "Email ou mot de passe incorrect.";
    }

    // --------------------------------------------------------
    // 403
    // --------------------------------------------------------

    if (status === 403) {
      if (data?.email_verified === false) {
        return (
          "Votre email n'est pas vérifié. " +
          "Consultez votre boîte mail."
        );
      }

      if (data?.force_password_change === true) {
        return (
          "Vous devez changer votre mot de passe " +
          "avant de continuer."
        );
      }

      if (data?.error) {
        return data.error;
      }

      if (data?.detail) {
        return data.detail;
      }

      return "Accès refusé.";
    }

    // --------------------------------------------------------
    // ERREURS PERSONNALISÉES
    // --------------------------------------------------------

    if (data?.error) {
      return data.error;
    }

    if (data?.detail) {
      return data.detail;
    }

    return "Erreur de connexion. Veuillez réessayer.";
  }

  // ==========================================================
  // CHANGEMENT DES CHAMPS
  // ==========================================================

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const {
      name,
      value,
      type,
      checked,
    } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));

    setError("");
  };

  // ==========================================================
  // REDIRECTION SELON LE ROLE
  // ==========================================================

  const redirectUser = (
    role: string
  ) => {
    switch (role) {
      // ------------------------------------------------------
      // CLIENT
      // ------------------------------------------------------

      case "CLIENT":
        navigate(from, {
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
      // SUPER ADMIN
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
        setError(
          "Rôle utilisateur non reconnu."
        );

        navigate("/", {
          replace: true,
        });
    }
  };

  // ==========================================================
  // CONNEXION GOOGLE
  // ==========================================================

  const handleGoogleLogin = async (
    credential: string
  ) => {
    try {
      setLoading(true);
      setError("");

      /*
       * IMPORTANT :
       *
       * Google ne décide jamais du rôle.
       *
       * Si un compte Google n'existe pas encore,
       * le backend doit obligatoirement le créer
       * avec le rôle CLIENT.
       *
       * Les rôles :
       * - AGENT
       * - GESTIONNAIRE
       * - ADMIN
       * - SUPER_ADMIN
       *
       * doivent être attribués uniquement par le
       * système interne autorisé.
       */

      const user =
        await authService.loginWithGoogle(
          credential
        );

      // ------------------------------------------------------
      // AUTH CONTEXT
      // ------------------------------------------------------

      login(user);

      // ------------------------------------------------------
      // MOT DE PASSE OBLIGATOIRE
      // ------------------------------------------------------

      if (
        user.force_password_change === true
      ) {
        navigate("/change-password", {
          replace: true,
        });

        return;
      }

      // ------------------------------------------------------
      // REDIRECTION
      // ------------------------------------------------------

      redirectUser(user.role);
    } catch (error) {
      console.error(
        "Erreur connexion Google :",
        error
      );

      setError(
        "Impossible de se connecter avec Google."
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // CONNEXION CLASSIQUE
  // ==========================================================

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setLoading(true);
    setError("");

    // --------------------------------------------------------
    // VALIDATION CHAMPS
    // --------------------------------------------------------

    if (
      !formData.email.trim() ||
      !formData.password
    ) {
      setError(
        "Veuillez remplir tous les champs."
      );

      setLoading(false);
      return;
    }

    // --------------------------------------------------------
    // VALIDATION EMAIL
    // --------------------------------------------------------

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        formData.email.trim()
      )
    ) {
      setError("Email invalide.");

      setLoading(false);
      return;
    }

    // --------------------------------------------------------
    // VALIDATION PASSWORD
    // --------------------------------------------------------

    if (formData.password.length < 8) {
      setError(
        "Le mot de passe doit contenir au moins 8 caractères."
      );

      setLoading(false);
      return;
    }

    try {
      // ------------------------------------------------------
      // AUTHENTIFICATION
      // ------------------------------------------------------

      const user =
        await authService.login({
          email: formData.email.trim(),
          password: formData.password,
        });

      // ------------------------------------------------------
      // AUTH CONTEXT
      // ------------------------------------------------------

      login(user);

      // ------------------------------------------------------
      // CHANGEMENT DE MOT DE PASSE OBLIGATOIRE
      // ------------------------------------------------------

      /*
       * Cas typique :
       *
       * SUPER_ADMIN crée :
       *
       * AGENT
       * GESTIONNAIRE
       * ADMIN
       *
       * avec un mot de passe temporaire.
       *
       * Le backend renvoie :
       *
       * force_password_change = true
       *
       * L'utilisateur n'a alors accès à aucun espace privé
       * avant de changer son mot de passe.
       */

      if (
        user.force_password_change === true
      ) {
        navigate("/change-password", {
          replace: true,
        });

        return;
      }

      // ------------------------------------------------------
      // REDIRECTION SELON ROLE
      // ------------------------------------------------------

      redirectUser(user.role);
    } catch (err) {
      setError(
        getDjangoErrorMessage(
          err as AxiosError<DjangoErrorData>
        )
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center p-6">
      <div className="w-full max-w-sm bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">

        {/* ==================================================
            HEADER
        ================================================== */}

        <div className="px-8 pt-8 pb-6 text-center">

          <Link
            to="/"
            className="inline-flex items-center gap-2 mb-6 group"
          >
            <div className="w-10 h-10 bg-red-700 rounded-lg flex items-center justify-center shadow-md">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 17H3a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-2" />

                <circle
                  cx="7"
                  cy="17"
                  r="2"
                />

                <circle
                  cx="15"
                  cy="17"
                  r="2"
                />

                <path d="M5 9l2-4h6l2 4" />
              </svg>
            </div>

            <div className="text-xl font-bold text-gray-900">
              SYGES
              <span className="text-red-700">
                KAR
              </span>
            </div>
          </Link>

          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            Connexion
          </h1>

          <p className="text-sm text-gray-600">
            Bienvenue sur K-JOU RENT A CAR
          </p>
        </div>

        {/* ==================================================
            FORMULAIRE
        ================================================== */}

        <div className="px-8 pb-8">

          {/* ERREUR */}

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm flex items-start gap-2">
              <AlertCircle
                size={16}
                className="mt-0.5 flex-shrink-0"
              />

              <span>{error}</span>
            </div>
          )}

          {/* INSCRIPTION RÉUSSIE */}

          {locationState?.registered && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded text-green-700 text-sm flex items-start gap-2">
              <CheckCircle
                size={16}
                className="mt-0.5 flex-shrink-0"
              />

              <span>
                Compte créé avec succès !
                Vérifiez votre boîte mail
                {locationState.email
                  ? ` (${locationState.email})`
                  : ""}{" "}
                avant de vous connecter.
              </span>
            </div>
          )}

          {/* FORM */}

          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >
            {/* EMAIL */}

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600 mb-2">
                Email
              </label>

              <div className="relative">
                <Mail
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500"
                />

                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="exemple@email.com"
                  autoComplete="email"
                  disabled={loading}
                  className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded transition-all focus:outline-none focus:border-red-700 focus:ring-2 focus:ring-red-100 disabled:bg-gray-100"
                />
              </div>
            </div>

            {/* PASSWORD */}

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600 mb-2">
                Mot de passe
              </label>

              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500"
                />

                <input
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  disabled={loading}
                  className="w-full pl-10 pr-10 py-2 text-sm border border-gray-300 rounded transition-all focus:outline-none focus:border-red-700 focus:ring-2 focus:ring-red-100 disabled:bg-gray-100"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      (prev) => !prev
                    )
                  }
                  disabled={loading}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 disabled:opacity-50"
                  aria-label={
                    showPassword
                      ? "Masquer le mot de passe"
                      : "Afficher le mot de passe"
                  }
                >
                  {showPassword ? (
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />

                      <line
                        x1="1"
                        y1="1"
                        x2="23"
                        y2="23"
                      />
                    </svg>
                  ) : (
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />

                      <circle
                        cx="12"
                        cy="12"
                        r="3"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* OPTIONS */}

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="remember"
                  checked={
                    formData.remember
                  }
                  onChange={handleChange}
                  disabled={loading}
                  className="w-4 h-4 accent-red-700 rounded cursor-pointer"
                />

                <span className="text-gray-600">
                  Se souvenir de moi
                </span>
              </label>

              <Link
                to="/forgot-password"
                className="text-red-700 hover:text-red-800 font-medium transition-colors"
              >
                Mot de passe oublié ?
              </Link>
            </div>

            {/* BOUTON */}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-red-700 hover:bg-red-800 text-white font-semibold rounded text-sm transition-all hover:shadow-md active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Connexion en cours...
                </>
              ) : (
                <>
                  <LogInIcon size={16} />
                  Se connecter
                </>
              )}
            </button>
          </form>

          {/* DIVIDER */}

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>

            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-600 uppercase text-xs font-semibold">
                ou
              </span>
            </div>
          </div>

          {/* GOOGLE */}

          <div className="flex justify-center">
            <GoogleLogin
              theme="outline"
              size="large"
              shape="rectangular"
              width="300"
              text="continue_with"
              onSuccess={async (
                credentialResponse
              ) => {
                if (
                  !credentialResponse.credential
                ) {
                  setError(
                    "Impossible de récupérer le token Google."
                  );

                  return;
                }

                await handleGoogleLogin(
                  credentialResponse.credential
                );
              }}
              onError={() => {
                setError(
                  "Connexion Google annulée."
                );
              }}
            />
          </div>

          {/* INSCRIPTION */}

          <div className="mt-6 pt-6 border-t border-gray-300 text-center text-sm text-gray-600">
            Pas encore de compte ?{" "}

            <Link
              to="/register"
              className="text-red-700 font-semibold hover:underline transition-colors"
            >
              Créer un compte
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

