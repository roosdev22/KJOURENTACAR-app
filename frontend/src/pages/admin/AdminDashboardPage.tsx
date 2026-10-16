import { useState } from "react";

import DashboardPeriodSelector from "../../components/admin/dashboard/DashboardPeriodSelector";
import type {
  DashboardPeriod,
} from "../../components/admin/dashboard/DashboardPeriodSelector";

import DashboardKpiGrid from "../../components/admin/dashboard/DashboardKpiGrid";
import DashboardActions from "../../components/admin/dashboard/DashboardActions";
import PerformanceOverview from "../../components/admin/dashboard/PerformanceOverview";
import FleetStatus from "../../components/admin/dashboard/FleetStatus";
import UpcomingRentals from "../../components/admin/dashboard/UpcomingRentals";

export default function AdminDashboardPage() {
  const [period, setPeriod] =
    useState<DashboardPeriod>("week");

  return (
    <div className="space-y-5 sm:space-y-6">

      {/* =========================================
          EN-TÊTE DU DASHBOARD
      ========================================= */}

      <header
        className="
          flex
          flex-col
          gap-3
          sm:flex-row
          sm:items-center
          sm:justify-between
        "
      >
        {/* Titre */}
        <div>
          <h1
            className="
              text-xl
              sm:text-2xl
              font-bold
              text-black
            "
          >
            Tableau de bord
          </h1>

          <p
            className="
              mt-1
              text-xs
              sm:text-sm
              text-black/45
            "
          >
            Vue d'ensemble de votre activité de location
          </p>
        </div>

        {/* Sélecteur de période */}
        <DashboardPeriodSelector
          period={period}
          onChange={setPeriod}
        />
      </header>


      {/* =========================================
          INDICATEURS PRINCIPAUX
      ========================================= */}

      <section aria-label="Indicateurs principaux">
        <DashboardKpiGrid />
      </section>


      {/* =========================================
          ACTIONS À TRAITER
      ========================================= */}

      <section aria-label="Actions à traiter">
         <DashboardActions /> 
      </section>


      {/* =========================================
          PERFORMANCE + ÉTAT DE LA FLOTTE
      ========================================= */}

      <section
        className="
          grid
          grid-cols-1
          xl:grid-cols-2
          gap-5
        "
        aria-label="Performance et état de la flotte"
      >
        <PerformanceOverview />

        <FleetStatus />
      </section>


      {/* =========================================
          PROCHAINES LOCATIONS
      ========================================= */}

      <section aria-label="Prochaines locations">
        <UpcomingRentals />
      </section>

    </div>
  );
}