import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AlertCircle, ArrowLeft, CheckCircle, LockKeyhole } from "lucide-react";
import { authService } from "../../api/services/authService";
import type { AxiosError } from "axios";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(Boolean(token));
  const [tokenValid, setTokenValid] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // La validation est déclenchée explicitement pour éviter
  // un setState dans un effet React.
 

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    event.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);

    try {
      await authService.confirmPasswordReset({
        token,
        new_password: password,
        confirm_password: confirmPassword,
      });

      setSuccess(true);
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      const axiosError = err as AxiosError<{ detail?: string }>;
      const responseData = axiosError.response?.data;

      if (responseData && typeof responseData === "object") {
        const detail = responseData.detail;
        setError(
          typeof detail === "string"
            ? detail
            : "Impossible de réinitialiser le mot de passe. Vérifiez le lien et les informations saisies.",
        );
      } else if (!axiosError.response) {
        setError("Impossible de joindre le serveur. Vérifiez votre connexion.");
      } else {
        setError(
          "Impossible de réinitialiser le mot de passe. Vérifiez le lien et les informations saisies.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  
  useEffect(() => {
    let cancelled = false;

    if (!token) {
      void Promise.resolve().then(() => {
        if (!cancelled) {
          setError("Le lien de réinitialisation est incomplet.");
          setValidating(false);
        }
      });

      return () => {
        cancelled = true;
      };
    }

    const validateToken = async (): Promise<void> => {
      try {
        await authService.validateResetToken(token);

        if (!cancelled) {
          setTokenValid(true);
          setError("");
        }
      } catch {
        if (!cancelled) {
          setTokenValid(false);
          setError(
            "Ce lien est invalide ou a expiré. Demandez un nouveau lien.",
          );
        }
      } finally {
        if (!cancelled) {
          setValidating(false);
        }
      }
    };

    void validateToken();

    return () => {
      cancelled = true;
    };
  }, [token]);


  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 p-6">
      <section className="w-full max-w-md overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
        <header className="px-8 pb-6 pt-8 text-center">
          <Link to="/" className="mb-6 inline-flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-700 text-white">
              <LockKeyhole size={20} />
            </div>
            <span className="text-xl font-bold text-gray-900">
              K-JOU <span className="text-red-700">RENT A CAR</span>
            </span>
          </Link>

          <h1 className="mb-2 text-2xl font-semibold text-gray-900">
            Réinitialiser le mot de passe
          </h1>
          <p className="text-sm text-gray-600">
            Choisissez un nouveau mot de passe pour votre compte.
          </p>
        </header>

        <div className="px-8 pb-8">
          {error && (
            <div
              role="alert"
              className="mb-5 flex items-start gap-2 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700"
            >
              <AlertCircle size={17} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success ? (
            <div className="space-y-5 text-center">
              <div className="rounded-lg border border-green-200 bg-green-50 p-5">
                <CheckCircle className="mx-auto mb-3 text-green-600" size={32} />
                <h2 className="mb-2 font-semibold text-green-900">
                  Mot de passe modifié
                </h2>
                <p className="text-sm text-green-800">
                  Votre mot de passe a été réinitialisé. Vous pouvez maintenant vous connecter.
                </p>
              </div>

              <button
                type="button"
                onClick={() => navigate("/login", { replace: true })}
                className="flex w-full items-center justify-center rounded bg-red-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-800"
              >
                Aller à la connexion
              </button>
            </div>
          ) : validating ? (
            <p className="py-6 text-center text-sm text-gray-600">
              Vérification du lien de réinitialisation...
            </p>
          ) : tokenValid ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="new-password"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Nouveau mot de passe
                </label>
                <input
                  id="new-password"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded border border-gray-300 px-3 py-3 text-sm outline-none focus:border-red-700 focus:ring-2 focus:ring-red-100"
                  placeholder="Au moins 8 caractères"
                />
              </div>

              <div>
                <label
                  htmlFor="confirm-password"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Confirmer le mot de passe
                </label>
                <input
                  id="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className="w-full rounded border border-gray-300 px-3 py-3 text-sm outline-none focus:border-red-700 focus:ring-2 focus:ring-red-100"
                  placeholder="Saisissez à nouveau le mot de passe"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center rounded bg-red-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Réinitialisation..." : "Enregistrer le nouveau mot de passe"}
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              <Link
                to="/forgot-password"
                className="flex w-full items-center justify-center rounded bg-red-700 px-4 py-3 text-sm font-semibold text-white hover:bg-red-800"
              >
                Demander un nouveau lien
              </Link>
            </div>
          )}

          <Link
            to="/login"
            className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-red-700"
          >
            <ArrowLeft size={16} />
            Retour à la connexion
          </Link>
        </div>
      </section>
    </main>
  );
}
