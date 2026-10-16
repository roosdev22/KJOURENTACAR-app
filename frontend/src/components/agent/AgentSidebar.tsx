import { useState } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import {
  LayoutDashboard,
  CalendarDays,
  PlusCircle,
  KeyRound,
  CarFront,
  Clock3,
  CreditCard,
  FileText,
  Users,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
} from "lucide-react";

interface MenuItem {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  end?: boolean;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

const menuSections: MenuSection[] = [
  {
    title: "OPÉRATIONNEL",
    items: [
      {
        label: "Dashboard",
        path: "/agent",
        icon: LayoutDashboard,
        end: true,
      },
      {
        label: "Réservations",
        path: "/agent/reservations",
        icon: CalendarDays,
      },
      {
        label: "Nouvelle réservation",
        path: "/agent/reservations/create",
        icon: PlusCircle,
      },
      {
        label: "Locations",
        path: "/agent/locations",
        icon: KeyRound,
      },
      {
      label: "Paiements",
      path: "/agent/paiements",
      icon: CreditCard,
     },

      {
      label: "Contrats",
      path: "/agent/contrats",
      icon: FileText,
      },
      {
        label: "Retours véhicules",
        path: "/agent/locations/returns",
        icon: RotateCcw,
      },
    ],
  },
  {
    title: "PARC AUTOMOBILE",
    items: [
      {
        label: "Véhicules",
        path: "/agent/vehicles",
        icon: CarFront,
      },
      {
        label: "Disponibilités",
        path: "/agent/availability",
        icon: Clock3,
      },
    ],
  },
  {
    title: "CLIENTS",
    items: [
      {
        label: "Clients",
        path: "/agent/clients",
        icon: Users,
      },
    ],
  },
  {
    title: "SYSTÈME",
    items: [
      {
        label: "Notifications",
        path: "/agent/notifications",
        icon: Bell,
      },
      {
        label: "Paramètres",
        path: "/agent/settings",
        icon: Settings,
      },
    ],
  },
];

export default function AgentSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  
  const { logout } = useAuth();
  const sidebarWidth = collapsed ? "lg:w-20" : "lg:w-64";

  return (
    <>
      {/* ============================================================
          MOBILE TOP BAR
      ============================================================ */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 h-16 bg-white border-b border-black/10 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-red-700 text-white flex items-center justify-center font-bold shadow-sm">
            K
          </div>

          <div>
            <p className="text-sm font-bold text-black tracking-tight">
              K-JOU RENT A CAR
            </p>
            <p className="text-[10px] uppercase tracking-wider text-black/40 font-semibold">
              Agent de location
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen((value) => !value)}
          className="w-10 h-10 rounded-lg border border-black/10 flex items-center justify-center text-black/70 hover:bg-black/5 transition"
          aria-label={mobileOpen ? "Fermer le menu" : "Ouvrir le menu"}
        >
          {mobileOpen ? (
            <X className="w-5 h-5" />
          ) : (
            <Menu className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* ============================================================
          MOBILE OVERLAY
      ============================================================ */}
      {mobileOpen && (
        <button
          type="button"
          aria-label="Fermer le menu"
          onClick={() => setMobileOpen(false)}
          className="lg:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]"
        />
      )}

      {/* ============================================================
          SIDEBAR
      ============================================================ */}
      <aside
        className={`
          fixed lg:sticky
          top-0 left-0
          z-50 lg:z-30
          h-screen
          bg-white
          border-r border-black/10
          transition-all duration-300
          ${sidebarWidth}
          ${
            mobileOpen
              ? "translate-x-0 w-64"
              : "-translate-x-full lg:translate-x-0"
          }
        `}
      >
        <div className="h-full flex flex-col">
          {/* ========================================================
              LOGO
          ======================================================== */}
          <div
            className={`
              h-20
              px-4
              flex items-center
              border-b border-black/5
              ${collapsed ? "lg:justify-center" : ""}
            `}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="shrink-0 w-9 h-9 rounded-lg bg-red-700 text-white flex items-center justify-center font-bold shadow-sm">
                K
              </div>

              {!collapsed && (
                <div className="min-w-0">
                  <p className="text-sm font-bold text-black tracking-tight truncate">
                    K-JOU RENT A CAR
                  </p>

                  <p className="text-[10px] uppercase tracking-wider text-black/40 font-semibold">
                    Agent de location
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ========================================================
              NAVIGATION
          ======================================================== */}
          <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-6">
            {menuSections.map((section) => (
              <div key={section.title}>
                {!collapsed && (
                  <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-black/40">
                    {section.title}
                  </p>
                )}

                <div className="space-y-1">
                  {section.items.map((item) => {
                    const Icon = item.icon;

                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        end={item.end}
                        onClick={() => setMobileOpen(false)}
                        title={collapsed ? item.label : undefined}
                        className={({ isActive }) =>
                          `
                          group
                          flex items-center
                          ${collapsed ? "lg:justify-center" : ""}
                          gap-3
                          px-3
                          py-2.5
                          rounded-lg
                          text-sm
                          transition-all duration-200
                          ${
                            isActive
                              ? "bg-red-50 text-red-700 font-semibold"
                              : "text-black/65 hover:bg-black/[0.04] hover:text-black"
                          }
                        `
                        }
                      >
                        {({ isActive }) => (
                          <>
                            <Icon
                              className={`
                                shrink-0
                                w-[18px]
                                h-[18px]
                                ${
                                  isActive
                                    ? "text-red-700"
                                    : "text-black/50 group-hover:text-black/70"
                                }
                              `}
                            />

                            {!collapsed && (
                              <>
                                <span className="flex-1 truncate">
                                  {item.label}
                                </span>

                                {item.badge !== undefined && (
                                  <span
                                    className={`
                                      min-w-5 h-5 px-1.5
                                      rounded-full
                                      flex items-center justify-center
                                      text-[10px] font-bold
                                      ${
                                        isActive
                                          ? "bg-red-700 text-white"
                                          : "bg-red-50 text-red-700"
                                      }
                                    `}
                                  >
                                    {item.badge}
                                  </span>
                                )}
                              </>
                            )}
                          </>
                        )}
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* ========================================================
              DESKTOP COLLAPSE
          ======================================================== */}
          <div className="hidden lg:block px-3 pb-3">
            <button
              type="button"
              onClick={() => setCollapsed((value) => !value)}
              className="
                w-full
                flex items-center justify-center
                gap-2
                py-2.5
                rounded-lg
                border border-black/10
                text-black/50
                hover:text-black
                hover:bg-black/[0.03]
                transition
              "
              aria-label={
                collapsed
                  ? "Développer la barre latérale"
                  : "Réduire la barre latérale"
              }
            >
              {collapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <>
                  <ChevronLeft className="w-4 h-4" />
                  <span className="text-xs font-medium">Réduire</span>
                </>
              )}
            </button>
          </div>

          {/* ========================================================
              LOGOUT
          ======================================================== */}
          <div className="p-3 border-t border-black/5">
            <button
              type="button"   onClick={() => void logout()}
              className={`
                group
                w-full
                flex items-center
                ${collapsed ? "lg:justify-center" : ""}
                gap-3
                px-3
                py-2.5
                rounded-lg
                text-sm
                text-black/60
                hover:bg-red-50
                hover:text-red-700
                transition
              `}
              title={collapsed ? "Déconnexion" : undefined}
            >
              <LogOut className="w-[18px] h-[18px] shrink-0" />

              {!collapsed && (
                <span className="font-medium">Déconnexion</span>
              )}
            </button>
          </div>
        </div>
      </aside>

      {/* ============================================================
          MOBILE SPACER
      ============================================================ */}
      <div className="lg:hidden h-16" />
    </>
  );
}