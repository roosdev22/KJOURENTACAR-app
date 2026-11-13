import { useState } from "react";
import { Link, Outlet } from "react-router-dom";
import { Menu, UserRound } from "lucide-react";

import GestionnaireSidebar from "./GestionnaireSidebar";
import NotificationBell from "../notifications/NotificationBell";

export default function GestionnaireLayout() {
  const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false);

  return (
    <div className="h-dvh overflow-hidden bg-kjou-mist font-kjou-body">
      <div className="flex h-full">
        <GestionnaireSidebar
          mobileOpen={mobileNavigationOpen}
          onMobileClose={() => setMobileNavigationOpen(false)}
        />

        <div className="flex flex-1 flex-col min-w-0">
          <header className="sticky top-0 z-20 flex shrink-0 items-center justify-between gap-3 border-b border-kjou-border bg-kjou-white px-4 py-3 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                aria-controls="gestionnaire-mobile-navigation"
                aria-expanded={mobileNavigationOpen}
                aria-label="Ouvrir la navigation"
                onClick={() => setMobileNavigationOpen(true)}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-kjou-control text-kjou-text transition hover:bg-kjou-mist focus-visible:outline-none focus-visible:ring-kjou focus-visible:ring-kjou-red focus-visible:ring-offset-kjou focus-visible:ring-offset-kjou-white lg:hidden"
              >
                <Menu className="h-5 w-5" aria-hidden="true" />
              </button>
              <p className="truncate font-kjou-display text-sm font-bold text-kjou-text sm:text-base">
                Espace gestionnaire
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              <NotificationBell variant="gestionnaire" />
              <Link
                to="/gestionnaire/settings"
                aria-label="Ouvrir mon compte et mes paramètres"
                className="inline-flex min-h-10 items-center gap-2 rounded-kjou-control px-2 text-sm font-semibold text-kjou-text transition hover:bg-kjou-mist focus-visible:outline-none focus-visible:ring-kjou focus-visible:ring-kjou-red focus-visible:ring-offset-kjou focus-visible:ring-offset-kjou-white sm:px-3"
              >
                <UserRound className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">Mon compte</span>
              </Link>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto">
            <div className="p-4 sm:p-6 lg:p-8">
              <Outlet />
            </div>
          </main>

        </div>
      </div>
    </div>
  );
}