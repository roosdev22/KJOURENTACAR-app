
 
import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../api/services/authService";
import { useAuth } from "../hooks/useAuth";

export default function GoogleCallback() {
  const navigate = useNavigate();
  const { login } = useAuth();

  // useRef évite que le useEffect s'exécute deux fois en React StrictMode
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const error = params.get("error");

    // L'utilisateur a annulé sur la page Google
    if (error || !code) {
      navigate("/login?error=google_cancelled");
      return;
    }

    authService
      .loginWithGoogle(code)
      .then((user) => {
        // Met à jour AuthContext avec les données utilisateur
        login(user);

        // Redirection selon le rôle défini dans RoleChoices Django
        if (user.role === "CLIENT") {
          navigate("/dashboard");
        } else {
          // AGENT, MANAGER, ADMIN, SUPER_ADMIN → panel admin
          navigate("/admin");
        }
      })
      .catch(() => {
        navigate("/login?error=google_failed");
      });
  }, [login, navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 gap-4">
      <div className="w-10 h-10 border-4 border-red-700 border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-gray-500">Connexion Google en cours...</p>
    </div>
  );
}