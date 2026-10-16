import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Car,
  CreditCard,
  UserCircle,
  HelpCircle,
  Settings,
  CalendarDays,
  AlertCircle,
  LogOut,
} from "lucide-react";

import type { NavLinkProps } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";


const NAV_ITEMS = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/reserver", icon: Car, label: "Réserver" },
];

const ACCOUNT_ITEMS = [
  { to: "/reservations", icon: CalendarDays, label: "Mes réservations" },
  { to: "/paiements", icon: CreditCard, label: "Paiements" },
  { to: "/profil", icon: UserCircle, label: "Mon profil" },
];

const SUPPORT_ITEMS = [
  { to: "/aide", icon: HelpCircle, label: "Aide" },
  { to: "/parametres", icon: Settings, label: "Paramètres" },
];


// ============================================================
// CALCUL DU PROFIL — même logique que ReservationPage
// ============================================================

const PROFILE_FIELDS = [
  "phone",
  "address",
  "driving_license_number",
  "driving_license_expiry",
  "id_document_type",
  "id_document_number",
] as const;

function computeProfileCompletion(
  user: Record<string, unknown> | null
): number {
  if (!user) return 0;

  const filled = PROFILE_FIELDS.filter((field) => {
    const value = user[field];
    return value !== null && value !== undefined && value !== "";
  }).length;

  return Math.round((filled / PROFILE_FIELDS.length) * 100);
}


// ============================================================
// INITIALES
// ============================================================

function getInitials(user: Record<string, unknown> | null): string {
  if (!user) return "?";

  const firstName = typeof user.first_name === "string" ? user.first_name : "";
  const lastName  = typeof user.last_name  === "string" ? user.last_name  : "";

  const initials = `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();
  return initials || "?";
}

function getDisplayName(user: Record<string, unknown> | null): string {
  if (!user) return "";

  const firstName = typeof user.first_name === "string" ? user.first_name : "";
  const lastName  = typeof user.last_name  === "string" ? user.last_name  : "";

  return `${firstName} ${lastName[0] ? lastName[0] + "." : ""}`.trim();
}


// ============================================================
// LINK CLASS
// ============================================================

const linkClass: NavLinkProps["className"] = ({ isActive }) =>
  [
    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
    isActive
      ? "bg-red-600 text-white"
      : "text-gray-400 hover:bg-black/10 hover:text-black",
  ].join(" ");


// ============================================================
// COMPONENT
// ============================================================

export default function Sidebar() {
  const { user, logout } = useAuth();

  const userRecord = user as Record<string, unknown> | null;

  const profileComplete = computeProfileCompletion(userRecord);
  const initials        = getInitials(userRecord);
  const displayName     = getDisplayName(userRecord);
  const role            = typeof userRecord?.role === "string"
    ? userRecord.role
    : "Client";

  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-64 flex-col bg-white">

      {/* Logo */}
      <div className="flex h-16 items-center border-b border-neutral-100 px-5">
        <span className="text-lg font-bold tracking-tight text-neutral-900">
          KJOUR<span className="text-red-500">RENT</span>ACAR
        </span>
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-6 overflow-y-auto px-3 py-5">

        <div className="flex flex-col gap-1">
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} className={linkClass}>
              <Icon size={18} aria-hidden />
              {label}
            </NavLink>
          ))}
        </div>

        <div>
          <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-widest text-gray-500">
            Mon compte
          </p>
          <div className="flex flex-col gap-1">
            {ACCOUNT_ITEMS.map(({ to, icon: Icon, label }) => (
              <NavLink key={to} to={to} className={linkClass}>
                <Icon size={18} aria-hidden />
                {label}
              </NavLink>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-widest text-gray-500">
            Support
          </p>
          <div className="flex flex-col gap-1">
            {SUPPORT_ITEMS.map(({ to, icon: Icon, label }) => (
              <NavLink key={to} to={to} className={linkClass}>
                <Icon size={18} aria-hidden />
                {label}
              </NavLink>
            ))}
          </div>
        </div>

      </nav>

      {/* ======================================================
          PROFIL INCOMPLET — affiché seulement si < 100 %
      ====================================================== */}

      {profileComplete < 100 && (
        <div className="mx-3 mb-3 rounded-xl border border-amber-100 bg-amber-50 p-4">
          <div className="mb-1 flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0 text-amber-500" />
            <p className="text-xs font-semibold text-amber-800">
              Profil incomplet
            </p>
          </div>

          <p className="mb-3 text-[11px] leading-relaxed text-amber-700">
            Complétez votre profil pour accéder à toutes les fonctionnalités.
          </p>

          {/* Barre de progression */}
          <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-amber-200">
            <div
              className="h-full rounded-full bg-amber-500 transition-all duration-500"
              style={{ width: `${profileComplete}%` }}
            />
          </div>

          <NavLink
            to="/profil/completer"
            className="block rounded-lg bg-amber-500 px-3 py-2 text-center text-xs font-semibold text-white transition-colors hover:bg-amber-600"
          >
            Compléter mon profil · {profileComplete}%
          </NavLink>
        </div>
      )}

      {/* ======================================================
          USER + LOGOUT
      ====================================================== */}

      <div className="border-t border-neutral-100 px-3 py-4">
        <div className="flex items-center justify-between">

          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white">
              {initials}
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-900">
                {displayName}
              </p>
              <p className="text-[11px] capitalize text-gray-500">
                {role.toLowerCase()}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => void logout?.()}
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
            aria-label="Déconnexion"
          >
            <LogOut size={16} />
          </button>

        </div>
      </div>

    </aside>
  );
}