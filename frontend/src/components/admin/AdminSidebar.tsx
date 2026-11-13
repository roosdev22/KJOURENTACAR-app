import { useState } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import AdminIcon, { type AdminIconName } from "./AdminIcon";

const menuSections: {
  title: string;
  items: { label: string; href: string; icon: AdminIconName }[];
}[] = [
  {
    title: "OPÉRATIONS",
    items: [
      { label: "Tableau de bord", href: "/admin", icon: "dashboard" },
      { label: "Réservations", href: "/admin/reservations", icon: "reservation" },
      { label: "Locations", href: "/admin/locations", icon: "rental" },
      { label: "Véhicules", href: "/admin/vehicles", icon: "vehicle" },
    ],
  },
  {
    title: "FINANCES",
    items: [
      { label: "Paiements", href: "/admin/payments", icon: "payment" },
      { label: "Contrats", href: "/admin/contracts", icon: "contract" },
      { label: "Factures", href: "/admin/facturation", icon: "invoice" },
    ],
  },
  {
    title: "ADMINISTRATION",
    items: [
      { label: "Utilisateurs", href: "/admin/users", icon: "users" },
      { label: "Maintenance", href: "/admin/maintenance", icon: "maintenance" },
      { label: "Rapports", href: "/admin/reports", icon: "reports" },
      { label: "Notifications", href: "/admin/notifications", icon: "notifications" },
      { label: "Paramètres", href: "/admin/settings", icon: "settings" },
    ],
  },
];

export default function AdminSidebar() {
  const { logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const closeMobile = () => setMobileOpen(false);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between bg-kjou-carbon px-4 text-white lg:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Ouvrir le menu d’administration"
          aria-expanded={mobileOpen}
          aria-controls="admin-navigation"
          className="flex h-10 w-10 items-center justify-center rounded-lg text-white/80 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <AdminIcon name="menu" size={22} />
        </button>
        <div className="text-center">
          <p className="font-kjou-display text-sm font-bold tracking-wide">
            K-JOU
          </p>
          <p className="text-[10px] tracking-[0.12em] text-white/60">
            RENT A CAR
          </p>
        </div>
        <span className="h-10 w-10" aria-hidden="true" />
      </header>

      {mobileOpen && (
        <button
          type="button"
          aria-label="Fermer le menu d’administration"
          onClick={closeMobile}
          className="fixed inset-0 z-40 cursor-default bg-black/50 lg:hidden"
        />
      )}

      <aside
        id="admin-navigation"
        aria-label="Navigation administrateur"
        className={`fixed left-0 top-0 z-50 flex h-[100dvh] w-72 flex-col border-r border-white/10 bg-kjou-carbon text-white transition-transform duration-200 lg:sticky lg:z-auto lg:h-screen lg:shrink-0 lg:translate-x-0 ${
          collapsed ? "lg:w-20" : "lg:w-64"
        } ${
          mobileOpen
            ? "visible translate-x-0"
            : "invisible -translate-x-full lg:visible"
        }`}
      >
        <div className="flex h-[72px] shrink-0 items-center justify-between border-b border-white/10 px-5">
          <div className={`flex min-w-0 items-center gap-3 ${collapsed ? "lg:justify-center" : ""}`}>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-white/15 bg-white/5 font-kjou-display text-sm font-extrabold text-white">
              KJ
            </div>
            <div className={collapsed ? "lg:hidden" : ""}>
              <p className="font-kjou-display text-sm font-bold tracking-wide">
                K-JOU RENT A CAR
              </p>
              <p className="mt-0.5 text-[11px] text-white/50">
                Administration
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={closeMobile}
            aria-label="Fermer le menu"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-white/65 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white lg:hidden"
          >
            <AdminIcon name="close" size={19} />
          </button>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
          {menuSections.map((section) => (
            <div key={section.title}>
              <p
                className={`mb-2 px-3 text-[10px] font-semibold tracking-[0.14em] text-white/40 ${
                  collapsed ? "lg:hidden" : ""
                }`}
              >
                {section.title}
              </p>
              <div className="space-y-1">
                {section.items.map((item) => (
                  <NavLink
                    key={item.href}
                    to={item.href}
                    end={item.href === "/admin"}
                    onClick={closeMobile}
                    title={collapsed ? item.label : undefined}
                    className={({ isActive }) =>
                      `relative flex min-h-10 items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 ${
                        isActive
                          ? "bg-white/10 font-semibold text-white before:absolute before:inset-y-2 before:left-0 before:w-0.5 before:rounded-full before:bg-kjou-red"
                          : "font-medium text-white/65 hover:bg-white/[0.06] hover:text-white"
                      } ${collapsed ? "lg:justify-center lg:px-0" : ""}`
                    }
                  >
                    <AdminIcon name={item.icon} size={18} />
                    <span className={collapsed ? "lg:hidden" : ""}>
                      {item.label}
                    </span>
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="hidden shrink-0 px-3 pb-2 lg:block">
          <button
            type="button"
            onClick={() => setCollapsed((value) => !value)}
            aria-label={collapsed ? "Agrandir le menu" : "Réduire le menu"}
            aria-expanded={!collapsed}
            className="flex min-h-10 w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-white/55 transition hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
          >
            <AdminIcon
              name={collapsed ? "chevron-right" : "chevron-left"}
              size={17}
            />
            {!collapsed && <span className="text-xs">Réduire le menu</span>}
          </button>
        </div>

        <div className="shrink-0 border-t border-white/10 p-3">
          <button
            type="button"
            onClick={logout}
            title={collapsed ? "Déconnexion" : undefined}
            className={`flex min-h-10 w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/65 transition hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 ${
              collapsed ? "lg:justify-center lg:px-0" : ""
            }`}
          >
            <AdminIcon name="logout" size={18} />
            <span className={collapsed ? "lg:hidden" : ""}>Déconnexion</span>
          </button>
        </div>
      </aside>

      <div className="h-16 shrink-0 lg:hidden" aria-hidden="true" />
    </>
  );
}
