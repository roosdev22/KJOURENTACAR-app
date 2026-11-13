import {
  LayoutDashboard,
  Car,
  ClipboardList,
  CalendarDays,
  Wrench,
  Settings,
  LogOut,
  X,
} from "lucide-react";

import { useEffect, useRef } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

const menuItems = [
  { label: "Tableau de bord", icon: LayoutDashboard, to: "/gestionnaire" },
  { label: "Véhicules",       icon: Car,             to: "/gestionnaire/vehicles" },
  { label: "Locations",       icon: ClipboardList,   to: "/gestionnaire/rentals" },
  { label: "Réservations",    icon: CalendarDays,    to: "/gestionnaire/reservations" },
  { label: "Maintenance",     icon: Wrench,          to: "/gestionnaire/maintenance" },
];

interface GestionnaireSidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export default function GestionnaireSidebar({
  mobileOpen,
  onMobileClose,
}: GestionnaireSidebarProps) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const mobileDialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = mobileDialogRef.current;
    if (!dialog) return;

    if (mobileOpen && !dialog.open) {
      dialog.showModal();
    } else if (!mobileOpen && dialog.open) {
      dialog.close();
    }
  }, [mobileOpen]);

  const handleLogout = async () => {
    onMobileClose();
    await logout();
    navigate("/login");
  };

  return (
    <>
      <aside className="hidden h-full w-64 flex-col border-r border-white/10 bg-kjou-carbon font-kjou-body lg:flex">
        <SidebarBrand />
        <nav className="flex-1 overflow-y-auto px-3 py-6" aria-label="Navigation gestionnaire">
          <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-kjou-white/50">
            Gestion du parc
          </p>
          <NavigationItems />
        </nav>
        <SidebarFooter onLogout={handleLogout} />
      </aside>

      <dialog
        id="gestionnaire-mobile-navigation"
        ref={mobileDialogRef}
        aria-labelledby="gestionnaire-mobile-navigation-title"
        onCancel={(event) => {
          event.preventDefault();
          onMobileClose();
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            onMobileClose();
          }
        }}
        className="fixed inset-0 m-0 h-dvh max-h-none w-full max-w-none border-0 bg-transparent p-0 backdrop:bg-kjou-carbon/60 lg:hidden"
      >
        <div className="flex h-full w-[min(20rem,88vw)] flex-col bg-kjou-carbon font-kjou-body text-kjou-white shadow-xl">
          <div className="flex items-center justify-between border-b border-white/10 pr-3">
            <SidebarBrand />
            <button
              type="button"
              autoFocus
              onClick={onMobileClose}
              aria-label="Fermer la navigation"
              className="rounded-lg p-2 text-kjou-white/70 transition hover:bg-kjou-white/10 hover:text-kjou-white focus-visible:outline-none focus-visible:ring-kjou focus-visible:ring-kjou-white focus-visible:ring-offset-kjou focus-visible:ring-offset-kjou-carbon"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto px-3 py-6" aria-label="Navigation gestionnaire">
            <p
              id="gestionnaire-mobile-navigation-title"
              className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-kjou-white/50"
            >
              Gestion du parc
            </p>
            <NavigationItems onNavigate={onMobileClose} />
          </nav>
          <SidebarFooter onLogout={handleLogout} onNavigate={onMobileClose} />
        </div>
      </dialog>
    </>
  );
}

function SidebarBrand() {
  return (
    <div className="flex h-16 shrink-0 items-center gap-3 border-b border-white/10 px-5">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-kjou-red">
        <span className="font-kjou-display text-sm font-extrabold text-kjou-white">K</span>
      </div>
      <div>
        <p className="font-kjou-display text-sm font-extrabold text-kjou-white">K-JOU RENT A CAR</p>
        <p className="text-xs text-kjou-white/60">Gestion du parc</p>
      </div>
    </div>
  );
}

function NavigationItems({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="space-y-1">
      {menuItems.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/gestionnaire"}
            onClick={onNavigate}
            className={({ isActive }) =>
              [
                "flex items-center gap-3 rounded-lg px-3 py-2.5",
                "text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-kjou focus-visible:ring-kjou-white focus-visible:ring-offset-kjou focus-visible:ring-offset-kjou-carbon",
                isActive
                  ? "bg-kjou-white/10 text-kjou-white font-semibold"
                  : "text-kjou-white/70 hover:bg-kjou-white/5 hover:text-kjou-white",
              ].join(" ")
            }
          >
            <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
            <span>{item.label}</span>
          </NavLink>
        );
      })}
    </div>
  );
}

function SidebarFooter({
  onLogout,
  onNavigate,
}: {
  onLogout: () => Promise<void>;
  onNavigate?: () => void;
}) {
  return (
    <div className="space-y-1 border-t border-white/10 p-3">
      <NavLink
        to="/gestionnaire/settings"
        onClick={onNavigate}
        className={({ isActive }) =>
          [
            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-kjou focus-visible:ring-kjou-white focus-visible:ring-offset-kjou focus-visible:ring-offset-kjou-carbon",
            isActive
              ? "bg-kjou-white/10 text-kjou-white font-semibold"
              : "text-kjou-white/70 hover:bg-kjou-white/5 hover:text-kjou-white",
          ].join(" ")
        }
      >
        <Settings className="h-5 w-5" aria-hidden="true" />
        <span>Paramètres</span>
      </NavLink>

      <button
        type="button"
        onClick={() => void onLogout()}
        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-kjou-white/70 transition-colors hover:bg-kjou-white/5 hover:text-kjou-white focus-visible:outline-none focus-visible:ring-kjou focus-visible:ring-kjou-white focus-visible:ring-offset-kjou focus-visible:ring-offset-kjou-carbon"
      >
        <LogOut className="h-5 w-5" aria-hidden="true" />
        <span>Déconnexion</span>
      </button>
    </div>
  );
}