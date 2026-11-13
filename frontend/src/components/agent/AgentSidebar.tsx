import { useState } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import {
  LayoutDashboard,
  CalendarDays,
  PlusCircle,
  KeyRound,
  CarFront,
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
      <div className="fixed left-0 right-0 top-0 z-40 flex h-16 items-center justify-between border-b border-white/10 bg-[#17191C] px-4 lg:hidden">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#B4232F] text-sm font-black text-white shadow-sm">
            K
          </div>

          <div>
            <p className="text-sm font-bold tracking-tight text-white">
              K-JOU RENT A CAR
            </p>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/50">
              Agent de location
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen((value) => !value)}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/80 transition hover:bg-white/10"
          aria-label={mobileOpen ? "Fermer le menu" : "Ouvrir le menu"}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <button
          type="button"
          aria-label="Fermer le menu"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-[#17191C]/55 backdrop-blur-[2px] lg:hidden"
        />
      )}

      <aside
        className={`
          fixed left-0 top-0 z-50 h-screen border-r border-white/10 bg-[#17191C] text-white transition-all duration-300 lg:sticky
          ${sidebarWidth}
          ${mobileOpen ? "w-64 translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        <div className="flex h-full flex-col">
          <div className={`flex h-20 items-center border-b border-white/10 px-4 ${collapsed ? "lg:justify-center" : ""}`}>
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#B4232F] text-sm font-black text-white shadow-sm">
                K
              </div>

              {!collapsed && (
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold tracking-tight text-white">
                    K-JOU RENT A CAR
                  </p>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/50">
                    Agent de location
                  </p>
                </div>
              )}
            </div>
          </div>

          <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
            {menuSections.map((section) => (
              <div key={section.title}>
                {!collapsed && (
                  <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">
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
                          `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200 ${collapsed ? "lg:justify-center" : ""} ${
                            isActive
                              ? "bg-[#B4232F] text-white shadow-[0_10px_24px_rgba(180,35,47,0.25)]"
                              : "text-white/70 hover:bg-white/5 hover:text-white"
                          }`
                        }
                      >
                        {({ isActive }) => (
                          <>
                            <Icon className={`h-[18px] w-[18px] shrink-0 ${isActive ? "text-white" : "text-white/60 group-hover:text-white"}`} />

                            {!collapsed && (
                              <>
                                <span className="flex-1 truncate">{item.label}</span>

                                {item.badge !== undefined && (
                                  <span
                                    className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold ${
                                      isActive ? "bg-white text-[#B4232F]" : "bg-[#B4232F]/20 text-white"
                                    }`}
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

          <div className="hidden px-3 pb-3 lg:block">
            <button
              type="button"
              onClick={() => setCollapsed((value) => !value)}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-2.5 text-xs font-medium text-white/70 transition hover:bg-white/10 hover:text-white"
              aria-label={collapsed ? "Développer la barre latérale" : "Réduire la barre latérale"}
            >
              {collapsed ? <ChevronRight className="h-4 w-4" /> : <><ChevronLeft className="h-4 w-4" /><span>Réduire</span></>}
            </button>
          </div>

          <div className="border-t border-white/10 p-3">
            <button
              type="button"
              onClick={() => void logout()}
              className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/70 transition hover:bg-[#B4232F]/10 hover:text-white ${collapsed ? "lg:justify-center" : ""}`}
              title={collapsed ? "Déconnexion" : undefined}
            >
              <LogOut className="h-[18px] w-[18px] shrink-0" />

              {!collapsed && <span className="font-medium">Déconnexion</span>}
            </button>
          </div>
        </div>
      </aside>

      <div className="lg:hidden h-16" />
    </>
  );
}