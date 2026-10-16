import type { ReactNode } from "react";
import { Loader2, ShieldAlert } from "lucide-react";
import { Navigate, useLocation } from "react-router-dom";

import { useAuth } from "../../hooks/useAuth";

import type { UserRole } from "../../api/services/authService";

interface RequireRoleProps {
  allowedRoles: UserRole[];
  children: ReactNode;
}

// ============================================================
// REQUIRE ROLE
// ------------------------------------------------------------
// Protège une route selon le rôle de l'utilisateur connecté.
//
// Usage (ex. dans le routeur) :
//
//   <Route
//     path="/agent/dashboard"
//     element={
//       <RequireRole allowedRoles={RESERVATION_STAFF_ROLES}>
//         <AgentDashboard />
//       </RequireRole>
//     }
//   />
//
// Ne remplace jamais les permissions du backend : sert
// seulement à éviter d'afficher une page à quelqu'un qui n'y a
// pas accès (le backend refusera de toute façon les appels API
// correspondants).
// ============================================================

export function RequireRole({ allowedRoles, children }: RequireRoleProps) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 size={22} className="animate-spin text-black/30" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-700">
          <ShieldAlert size={22} />
        </div>

        <p className="text-sm font-bold text-gray-950">
          Accès non autorisé
        </p>

        <p className="max-w-sm text-xs text-black/50">
          Cette page est réservée au personnel autorisé. Contactez un
          administrateur si vous pensez qu'il s'agit d'une erreur.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}