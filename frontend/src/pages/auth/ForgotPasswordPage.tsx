import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, AlertCircle, CheckCircle, ArrowLeft } from "lucide-react";
import { authService } from "../../api/services/authService";
import { getApiErrorMessage } from "../../utils/apiError";
export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [email, setEmail] = useState("");

const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  setLoading(true);
  setError("");

  if (!email) {
    setError("Veuillez entrer votre email.");
    setLoading(false);
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    setError("Email invalide.");
    setLoading(false);
    return;
  }

  try {
   
    await authService.requestPasswordReset(email);

    setSuccess(true);
    setEmail("");
    setTimeout(() => navigate("/login"), 3000);

  } catch (err: unknown) {
  setError(
    getApiErrorMessage(
      err,
      "Impossible d'envoyer le lien de réinitialisation. Veuillez réessayer."
    )
  );
} finally {
  setLoading(false);
}
};

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center p-6">
      <div className="w-full max-w-sm bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
        {/* Header avec Logo */}
        <div className="px-8 pt-8 pb-6 text-center">
          <Link to="/" className="inline-flex items-center gap-2 mb-6 group">
            <div className="w-10 h-10 bg-red-700 rounded-lg flex items-center justify-center shadow-md">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 17H3a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-2" />
                <circle cx="7" cy="17" r="2" />
                <circle cx="15" cy="17" r="2" />
                <path d="M5 9l2-4h6l2 4" />
              </svg>
            </div>
            <div>
              <div className="text-xl font-bold text-gray-900">
                SYGES<span className="text-red-700">KAR</span>
              </div>
            </div>
          </Link>
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">Mot de passe oublié</h1>
          <p className="text-sm text-gray-600">Nous vous enverrons un lien pour réinitialiser votre mot de passe</p>
        </div>

        {/* Formulaire */}
        <div className="px-8 pb-8">
          {/* Message d'erreur */}
          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm flex items-start gap-2">
              <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Message de succès */}
          {success ? (
            <div className="space-y-6">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
                <div className="flex justify-center mb-3">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle size={24} className="text-green-600" />
                  </div>
                </div>
                <h3 className="font-semibold text-green-900 mb-2">Email envoyé avec succès!</h3>
                <p className="text-sm text-green-700 mb-4">
                  Vérifiez votre boîte mail pour le lien de réinitialisation. Il expirera dans 24 heures.
                </p>
                <p className="text-xs text-green-600">
                  Redirection vers la connexion dans quelques secondes...
                </p>
              </div>
              
              <div className="space-y-3">
                <Link
                  to="/login"
                  className="w-full py-2.5 px-4 bg-red-700 hover:bg-red-800 text-white font-semibold rounded text-sm transition-all hover:shadow-md active:scale-95 flex items-center justify-center gap-2"
                >
                  <ArrowLeft size={16} />
                  Retour à la connexion
                </Link>
                <button
                  onClick={() => setSuccess(false)}
                  className="w-full py-2.5 px-4 border border-gray-300 text-gray-900 font-semibold rounded text-sm hover:bg-gray-50 transition-colors"
                >
                  Recommencer
                </button>
              </div>
            </div>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600 mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setError("");
                      }}
                      placeholder="votre@email.com"
                      className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded transition-all focus:outline-none focus:border-red-700 focus:ring-2 focus:ring-red-100"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Entrez l'adresse email associée à votre compte
                  </p>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 bg-red-700 hover:bg-red-800 text-white font-semibold rounded text-sm transition-all hover:shadow-md active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Envoi en cours...
                    </>
                  ) : (
                    <>
                      <Mail size={16} />
                      Envoyer le lien
                    </>
                  )}
                </button>
              </form>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-600 uppercase text-xs font-semibold">ou</span>
                </div>
              </div>

              {/* Back to Login */}
              <div className="space-y-3">
                <Link
                  to="/login"
                  className="w-full py-2.5 px-4 border border-gray-300 text-gray-900 font-semibold rounded text-sm hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                >
                  <ArrowLeft size={16} />
                  Retour à la connexion
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
