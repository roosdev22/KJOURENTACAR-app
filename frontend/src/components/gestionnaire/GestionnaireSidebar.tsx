import {
  LayoutDashboard,
  Car,
  ClipboardList,
  CalendarDays,
  Wrench,
  BarChart3,
  Settings,
  LogOut,
} from "lucide-react";

import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

const menuItems = [
  { label: "Tableau de bord", icon: LayoutDashboard, to: "/gestionnaire" },
  { label: "Véhicules",       icon: Car,             to: "/gestionnaire/vehicles" },
  { label: "Locations",       icon: ClipboardList,   to: "/gestionnaire/rentals" },
  { label: "Réservations",    icon: CalendarDays,    to: "/gestionnaire/reservations" },
  { label: "Maintenance",     icon: Wrench,          to: "/gestionnaire/maintenance" },
  { label: "Rapports",        icon: BarChart3,       to: "/gestionnaire/reports" },
];

export default function GestionnaireSidebar() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <aside className="hidden lg:flex w-64 h-full flex-col border-r border-gray-200 bg-white">

      {/* EN-TÊTE */}
      <div className="flex h-16 items-center gap-3 border-b border-gray-200 px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-600">
          <span className="text-sm font-black text-white">K</span>
        </div>
        <div>
          <p className="text-sm font-black text-gray-900">K-JOU RENT A CAR</p>
          <p className="text-xs text-gray-400">Gestion du parc</p>
        </div>
      </div>

      {/* NAVIGATION */}
      <nav className="flex-1 overflow-y-auto px-3 py-6">
        <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
          Gestion du parc
        </p>

        <div className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/gestionnaire"}
                className={({ isActive }) =>
                  [
                    "flex items-center gap-3 rounded-lg px-3 py-2.5",
                    "text-sm font-medium transition-colors",
                    isActive
                      ? "bg-red-50 text-red-700 font-semibold"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
                  ].join(" ")
                }
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>

      {/* BAS DE SIDEBAR */}
      <div className="border-t border-gray-200 p-3 space-y-1">
        <NavLink
          to="/gestionnaire/settings"
          className={({ isActive }) =>
            [
              "flex items-center gap-3 rounded-lg px-3 py-2.5",
              "text-sm font-medium transition-colors",
              isActive
                ? "bg-red-50 text-red-700 font-semibold"
                : "text-black/65 hover:bg-black/5 hover:text-black",
            ].join(" ")
          }
        >
          <Settings className="h-5 w-5" />
          <span>Paramètres</span>
        </NavLink>

        <button
          type="button"
          onClick={() => void handleLogout()}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
        >
          <LogOut className="h-5 w-5" />
          <span>Déconnexion</span>
        </button>
      </div>

    </aside>
  );
}