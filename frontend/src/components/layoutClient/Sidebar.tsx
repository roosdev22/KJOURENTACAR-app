import { NavLink } from "react-router-dom";
import AdminIcon, { type AdminIconName } from "../admin/AdminIcon";
import type { NavLinkProps } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";


const NAV_ITEMS = [
  { to: "/dashboard", icon: "dashboard", label: "Dashboard" },
  { to: "/reservation", icon: "car-front", label: "Réserver" },
];

const ACCOUNT_ITEMS = [
  { to: "/reservations", icon: "calendar-check", label: "Mes réservations" },
  { to: "/paiements", icon: "credit-card", label: "Paiements" },
  { to: "/profil", icon: "user-round", label: "Mon profil" },
];

const SUPPORT_ITEMS = [
  { to: "/aide", icon: "help-circle", label: "Aide" },
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
  const initials = getInitials(userRecord);
  const displayName = getDisplayName(userRecord);
  const role = typeof userRecord?.role === "string" ? userRecord.role : "Client";

  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-64 flex-col bg-[#17191C] text-white shadow-[12px_0_30px_rgba(23,25,28,0.10)]">
      <div className="flex h-20 items-center border-b border-white/10 px-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#B4232F] text-sm font-black text-white shadow-sm">
            K
          </div>
          <div>
            <p className="text-lg font-black tracking-tight text-white">
              K-JOU
            </p>
            <p className="text-[10px] uppercase tracking-[0.22em] text-white/50">
              Rent A Car
            </p>
          </div>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-6 overflow-y-auto px-3 py-5">
        <div className="flex flex-col gap-1">
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} className={linkClass}>
              <AdminIcon name={Icon as AdminIconName} size={18} />
              {label}
            </NavLink>
          ))}
        </div>

        <div>
          <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">
            Mon compte
          </p>
          <div className="flex flex-col gap-1">
            {ACCOUNT_ITEMS.map(({ to, icon: Icon, label }) => (
              <NavLink key={to} to={to} className={linkClass}>
                <AdminIcon name={Icon as AdminIconName} size={18} />
                {label}
              </NavLink>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">
            Support
          </p>
          <div className="flex flex-col gap-1">
            {SUPPORT_ITEMS.map(({ to, icon: Icon, label }) => (
              <NavLink key={to} to={to} className={linkClass}>
                <AdminIcon name={Icon as AdminIconName} size={18} />
                {label}
              </NavLink>
            ))}
          </div>
        </div>
      </nav>

      {profileComplete < 100 && (
        <div className="mx-3 mb-3 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4">
          <div className="mb-1 flex items-center gap-2">
            <AdminIcon name="alert" size={15} className="shrink-0 text-amber-300" />
            <p className="text-xs font-semibold text-amber-100">Profil incomplet</p>
          </div>

          <p className="mb-3 text-[11px] leading-relaxed text-amber-100/80">
            Complétez votre profil pour accéder à toutes les fonctionnalités.
          </p>

          <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-amber-400 transition-all duration-500"
              style={{ width: `${profileComplete}%` }}
            />
          </div>

          <NavLink
            to="/profile/complete"
            className="block rounded-lg bg-amber-400 px-3 py-2 text-center text-xs font-semibold text-[#17191C] transition-colors hover:bg-amber-300"
          >
            Compléter mon profil · {profileComplete}%
          </NavLink>
        </div>
      )}

      <div className="border-t border-white/10 px-3 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#B4232F] text-xs font-bold text-white">
              {initials}
            </div>
            <div>
              <p className="text-sm font-medium text-white">{displayName}</p>
              <p className="text-[11px] capitalize text-white/55">{role.toLowerCase()}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => void logout?.()}
            className="rounded-lg p-1.5 text-white/60 transition-colors hover:bg-white/5 hover:text-white"
            aria-label="Déconnexion"
          >
            <AdminIcon name="logout" size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}