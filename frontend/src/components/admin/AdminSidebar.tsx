import { useState } from "react";
import {
  LayoutDashboard,
  CalendarDays,
  KeyRound,
  Car,
  CreditCard,
  FileText,
  Receipt,
  Users,
  Wrench,
  BarChart3,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

const menuSections = [
  {
    title: "OPÉRATIONNEL",
    items: [
      {
        label: "Dashboard",
        href: "/admin",
        icon: LayoutDashboard,
      },
      {
        label: "Réservations",
        href: "/admin/reservations",
        icon: CalendarDays,
      },
      {
        label: "Locations",
        href: "/admin/locations",
        icon: KeyRound,
      },
      {
        label: "Véhicules",
        href: "/admin/vehicles",
        icon: Car,
      },
    ],
  },
  {
    title: "FINANCIER",
    items: [
      {
        label: "Paiements",
        href: "/admin/payments",
        icon: CreditCard,
      },
      {
        label: "Contrats",
        href: "/admin/contracts",
        icon: FileText,
      },
      {
        label: "Factures",
        href: "/admin/invoices",
        icon: Receipt,
      },
    ],
  },
  {
    title: "CLIENTS & MAINTENANCE",
    items: [
      {
        label: "Utilisateurs",
        href: "/admin/users",
        icon: Users,
      },
      {
        label: "Maintenance",
        href: "/admin/maintenance",
        icon: Wrench,
      },
    ],
  },
  {
    title: "SYSTÈME",
    items: [
      {
        label: "Rapports",
        href: "/admin/reports",
        icon: BarChart3,
      },
      {
        label: "Notifications",
        href: "/admin/notifications",
        icon: Bell,
      },
      {
        label: "Paramètres",
        href: "/admin/settings",
        icon: Settings,
      },
    ],
  },
];

export default function AdminSidebar() {
  const { logout } = useAuth();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const closeMobile = () => {
    setMobileOpen(false);
  };

  return (
    <>
      {/* =========================
          MOBILE HEADER
      ========================== */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 h-16 bg-white border-b border-black/10 flex items-center justify-between px-4">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-lg hover:bg-black/5 transition"
          aria-label="Ouvrir le menu"
        >
          <Menu size={22} />
        </button>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-red-700 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">K</span>
          </div>

          <span className="font-bold text-sm">SYGESKAR</span>
        </div>

        <div className="w-8" />
      </header>

      {/* =========================
          MOBILE OVERLAY
      ========================== */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-[1px]"
          onClick={closeMobile}
        />
      )}

      {/* =========================
          SIDEBAR
      ========================== */}
      <aside
        className={`
          fixed lg:sticky
          top-0 left-0
          z-50
          h-screen
          bg-white
          border-r border-black/10
          flex flex-col
          transition-all duration-300
          
          ${collapsed ? "lg:w-20" : "lg:w-64"}
          
          w-64
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
        `}
      >
        {/* =========================
            LOGO
        ========================== */}
        <div
          className={`
            h-20
            flex
            items-center
            border-b border-black/5
            ${collapsed ? "lg:justify-center px-3" : "px-5"}
          `}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 shrink-0 bg-red-700 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">K</span>
            </div>

            <div className={collapsed ? "lg:hidden" : ""}>
              <span className="block font-bold text-black text-sm">
                SYGESKAR
              </span>

              <span className="block text-[11px] text-black/40">
                Administration
              </span>
            </div>
          </div>

          {/* MOBILE CLOSE */}
          <button
            onClick={closeMobile}
            className="lg:hidden ml-auto p-2 rounded-lg hover:bg-black/5"
            aria-label="Fermer le menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* =========================
            NAVIGATION
        ========================== */}
        <nav className="flex-1 overflow-y-auto px-3 py-5">
          {menuSections.map((section) => (
            <div key={section.title} className="mb-6">
              {/* Section title */}
              <p
                className={`
                  px-3 mb-2
                  text-[10px]
                  font-bold
                  tracking-wider
                  text-black/40
                  ${collapsed ? "lg:hidden" : ""}
                `}
              >
                {section.title}
              </p>

              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;

                  return (
                    <NavLink
                      key={item.href}
                      to={item.href}
                      end={item.href === "/admin"}
                      onClick={closeMobile}
                      title={collapsed ? item.label : undefined}
                      className={({ isActive }) =>
                        `
                        flex items-center
                        gap-3
                        px-3 py-2.5
                        rounded-lg
                        text-sm
                        transition-colors
                        ${
                          isActive
                            ? "bg-red-50 text-red-700 font-semibold"
                            : "text-black/65 hover:bg-black/5 hover:text-black font-medium"
                        }
                        ${collapsed ? "lg:justify-center" : ""}
                        `
                      }
                    >
                      <Icon size={18} strokeWidth={1.8} />

                      <span className={collapsed ? "lg:hidden" : ""}>
                        {item.label}
                      </span>
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* =========================
            COLLAPSE BUTTON
        ========================== */}
        <div className="hidden lg:block px-3 pb-2">
          <button
            onClick={() => setCollapsed((value) => !value)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-black/50 hover:bg-black/5 hover:text-black transition"
            title={collapsed ? "Agrandir le menu" : "Réduire le menu"}
          >
            {collapsed ? (
              <ChevronRight size={18} />
            ) : (
              <>
                <ChevronLeft size={18} />
                <span className="text-xs">Réduire le menu</span>
              </>
            )}
          </button>
        </div>

        {/* =========================
            LOGOUT
        ========================== */}
        <div className="p-3 border-t border-black/5">
          <button
            onClick={logout}
            className={`
              w-full
              flex
              items-center
              gap-3
              px-3 py-2.5
              rounded-lg
              text-black/60
              hover:bg-red-50
              hover:text-red-700
              font-medium
              text-sm
              transition-colors
              ${collapsed ? "lg:justify-center" : ""}
            `}
            title={collapsed ? "Déconnexion" : undefined}
          >
            <LogOut size={18} strokeWidth={1.8} />

            <span className={collapsed ? "lg:hidden" : ""}>
              Déconnexion
            </span>
          </button>
        </div>
      </aside>

      {/* =========================
          MOBILE SPACING
      ========================== */}
      <div className="lg:hidden h-16" />
    </>
  );
}