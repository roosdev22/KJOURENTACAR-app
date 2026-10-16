import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";

import type { ReactNode } from "react";

import { AuthProvider } from "./context/AuthProvider";
import { useAuth } from "./hooks/useAuth";

// ============================================================
// LAYOUT PUBLIC
// ============================================================

import Navbar from "./components/ui/Navbar";
import { Footer } from "./components/ui/Footer";

// ============================================================
// LAYOUTS PRIVÉS
// ============================================================

import AdminLayout from "./components/admin/AdminLayout";
import AgentLayout from "./components/agent/AgentLayout";
import GestionnaireLayout from "./components/gestionnaire/GestionnaireLayout";
import GestionnaireMaintenance from "./pages/gestionnaire/GestionnaireMaintenance";

// ============================================================
// PAGES PUBLIQUES
// ============================================================

import HomePage from "./pages/public/HomePage";
import ContactPage from "./pages/public/ContactPage";
import NotFoundPage from "./pages/public/NotFoundPage";

// ============================================================
// AUTHENTIFICATION
// ============================================================

import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import ChangePasswordPage from "./pages/auth/ChangePasswordPage";
import GoogleCallback from "./pages/GoogleCallback";

// ============================================================
// CLIENT
// ============================================================

import DashboardPage from "./pages/client/DashboardPage";
import ReservationPage from "./pages/client/ReservationPage";
import MyReservationsPage from "./pages/client/MyReservationsPage";
import ReservationDetailPage from "./pages/client/ReservationDetailPage";
import CompleteProfilePage from "./pages/client/CompleteProfilePage";

// ============================================================
// ADMIN
// ============================================================

import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import AdminUsers from "./pages/admin/AdminUsers";

// ============================================================
// GESTIONNAIRE
// ============================================================

import GestionnaireDashboard from "./pages/gestionnaire/GestionnaireDashboard";
import GestionnaireVehicles from "./pages/gestionnaire/GestionnaireVehicles";

// ============================================================
// AGENT
// ============================================================

import AgentDashboard from "./pages/agent/Agentdashboard";
import AgentPayments from "./pages/agent/AgentPayments";
import AgentVehicles from "./pages/agent/AgentVehicles";
import AgentReservations from "./pages/agent/AgentReservations";
import AgentCreateReservation from "./pages/agent/AgentCreateReservation";
import AgentReservationDetail from "./pages/agent/AgentReservationDetail";
import AgentLocations from "./pages/agent/AgentLocations";
import AgentVehicleReturns from "./pages/agent/AgentVehicleReturns";
import AgentContracts from "./pages/agent/AgentContracts";

// ============================================================
// TYPES
// ============================================================

type UserRole =
  | "CLIENT"
  | "AGENT"
  | "GESTIONNAIRE"
  | "ADMIN"
  | "SUPER_ADMIN";

// ============================================================
// PAGE PRINCIPALE PAR RÔLE
// ============================================================

const HOME_BY_ROLE: Record<UserRole, string> = {
  CLIENT: "/dashboard",
  AGENT: "/agent",
  GESTIONNAIRE: "/gestionnaire",
  ADMIN: "/admin",
  SUPER_ADMIN: "/admin",
};

// ============================================================
// LAYOUT PUBLIC
// ============================================================

function PublicLayout() {
  return (
    <>
      <Navbar />
      <Outlet />
      <Footer />
    </>
  );
}

// ============================================================
// PROTECTED ROUTE
// ============================================================

interface ProtectedRouteProps {
  children: ReactNode;
  roles?: UserRole[];
  allowForcedPasswordChange?: boolean;
}

function ProtectedRoute({
  children,
  roles,
  allowForcedPasswordChange = false,
}: ProtectedRouteProps) {
  const { isAuthenticated, user, isLoading } = useAuth();
  const location = useLocation();

  // ----------------------------------------------------------
  // CHARGEMENT
  // ----------------------------------------------------------

  if (isLoading) {
    return null;
  }

  // ----------------------------------------------------------
  // NON AUTHENTIFIÉ
  // ----------------------------------------------------------

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        state={{ from: location }}
        replace
      />
    );
  }

  // ----------------------------------------------------------
  // USER ABSENT
  // ----------------------------------------------------------

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // ----------------------------------------------------------
  // CHANGEMENT DE MOT DE PASSE OBLIGATOIRE
  // ----------------------------------------------------------

  if (
    user.force_password_change === true &&
    !allowForcedPasswordChange
  ) {
    return (
      <Navigate
        to="/change-password"
        state={{ from: location }}
        replace
      />
    );
  }

  // ----------------------------------------------------------
  // VÉRIFICATION DU RÔLE
  // ----------------------------------------------------------

  if (roles && !roles.includes(user.role as UserRole)) {
    const fallback =
      HOME_BY_ROLE[user.role as UserRole] ?? "/";

    return <Navigate to={fallback} replace />;
  }

  // ----------------------------------------------------------
  // ACCÈS AUTORISÉ
  // ----------------------------------------------------------

  return <>{children}</>;
}

// ============================================================
// APP CONTENT
// ============================================================

function AppContent() {
  return (
    <Routes>

      {/* ======================================================
          PUBLIC
      ====================================================== */}

      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/contact" element={<ContactPage />} />
      </Route>

      {/* ======================================================
          admin
      ====================================================== */}
      <Route
          path="/admin"
          element={
            <ProtectedRoute roles={["ADMIN", "SUPER_ADMIN"]}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboardPage />} />

          <Route path="users" element={<AdminUsers />} />

          <Route
            path="vehicles"
            element={<GestionnaireVehicles />}
          />

          <Route
            path="reservations"
            element={<AgentReservations />}
          />

          <Route
            path="payments"
            element={<AgentPayments />}
          />

          <Route
            path="locations"
            element={<AgentLocations />}
          />
    </Route>


 {/* ======================================================
          AUTHENTIFICATION
      ====================================================== */}

      <Route
        path="/login"
        element={<LoginPage />}
      />

      <Route
        path="/register"
        element={<RegisterPage />}
      />

      <Route
        path="/forgot-password"
        element={<ForgotPasswordPage />}
      />

      <Route
        path="/auth/google/callback"
        element={<GoogleCallback />}
      />

      {/* ======================================================
          CHANGEMENT MOT DE PASSE
      ====================================================== */}

      <Route
        path="/change-password"
        element={
          <ProtectedRoute allowForcedPasswordChange={true}>
            <ChangePasswordPage />
          </ProtectedRoute>
        }
      />

      {/* ======================================================
          CLIENT
      ====================================================== */}

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute roles={["CLIENT"]}>
            <DashboardPage />
          </ProtectedRoute>
        }
      />

      {/* ------------------------------------------------------
          CRÉER UNE RÉSERVATION
          /reservation
      ------------------------------------------------------ */}

      <Route
        path="/reservation"
        element={
          <ProtectedRoute roles={["CLIENT"]}>
            <ReservationPage />
          </ProtectedRoute>
        }
      />

      {/* ------------------------------------------------------
          MES RÉSERVATIONS
          /reservations
      ------------------------------------------------------ */}

      <Route
        path="/reservations"
        element={
          <ProtectedRoute roles={["CLIENT"]}>
            <MyReservationsPage />
          </ProtectedRoute>
        }
      />

      {/* ------------------------------------------------------
          DÉTAIL D'UNE RÉSERVATION
          /reservations/:id
      ------------------------------------------------------ */}

      <Route
        path="/reservations/:id"
        element={
          <ProtectedRoute roles={["CLIENT"]}>
            <ReservationDetailPage />
          </ProtectedRoute>
        }
      />

      {/* ------------------------------------------------------
          PROFIL
      ------------------------------------------------------ */}

      <Route
        path="/profile/complete"
        element={
          <ProtectedRoute roles={["CLIENT"]}>
            <CompleteProfilePage />
          </ProtectedRoute>
        }
      />

      {/* ============================================================
    AGENT DE LOCATION
============================================================ */}
<Route
  path="/agent"
  element={
    <ProtectedRoute roles={["AGENT","ADMIN", "SUPER_ADMIN"]}>
      <AgentLayout />
    </ProtectedRoute>
  }
>
  <Route
    index
    element={<AgentDashboard />}
  />

  <Route
    path="vehicles"
    element={<AgentVehicles />}
  />

  <Route
  path="paiements"
  element={<AgentPayments />}
/>

  <Route
    path="reservations"
    element={<AgentReservations />}
  />

  <Route
    path="reservations/create"
    element={<AgentCreateReservation />}
  />

  <Route
  path="locations"
  element={<AgentLocations />}
/>

<Route
  path="locations/returns"
  element={<AgentVehicleReturns />}
/>

  <Route path="contrats" element={<AgentContracts />} />

  <Route
    path="reservations/:id"
    element={<AgentReservationDetail />}
  />
</Route>

      {/* ======================================================
          GESTIONNAIRE
      ====================================================== */}

      <Route
        path="/gestionnaire"
        element={
          <ProtectedRoute roles={["GESTIONNAIRE"]}>
            <GestionnaireLayout />
          </ProtectedRoute>
        }
      >
        <Route
          index
          element={<GestionnaireDashboard />}
        />

        <Route
          path="maintenance"
          element={<GestionnaireMaintenance />}
        />

        <Route
          path="vehicles"
          element={<GestionnaireVehicles />}
        />
      </Route>

      {/* ======================================================
          404
      ====================================================== */}

      <Route
        path="*"
        element={<NotFoundPage />}
      />

    </Routes>
  );
}

// ============================================================
// APP ROOT
// ============================================================

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

