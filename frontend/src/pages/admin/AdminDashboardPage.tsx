import { useEffect, useState } from "react";

import DashboardPeriodSelector from "../../components/admin/dashboard/DashboardPeriodSelector";
import type { DashboardPeriod } from "../../components/admin/dashboard/DashboardPeriodSelector";

import DashboardKpiGrid from "../../components/admin/dashboard/DashboardKpiGrid";
import DashboardActions from "../../components/admin/dashboard/DashboardActions";
import PerformanceOverview from "../../components/admin/dashboard/PerformanceOverview";
import FleetStatus from "../../components/admin/dashboard/FleetStatus";
import UpcomingRentals from "../../components/admin/dashboard/UpcomingRentals";

import adminDashboardService from "../../api/services/adminDashboardService";
import type {
  AdminDashboardData,
} from "../../api/services/adminDashboardService";

export default function AdminDashboardPage() {
  const [period, setPeriod] = useState<DashboardPeriod>("week");
  const [dashboard, setDashboard] =
    useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      setLoading(true);
      setErrorMessage("");

      try {
        const result = await adminDashboardService.getDashboard(period);

        if (!cancelled) {
          setDashboard(result);
        }
      } catch {
        if (!cancelled) {
          setErrorMessage(
            "Impossible de charger les données du tableau de bord. Vérifiez votre connexion et vos droits d'accès.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadDashboard();

    return () => {
      cancelled = true;
    };
  }, [period, reloadKey]);

  const currentDashboard =
    dashboard?.period === period ? dashboard : null;

  return (
    <div className="space-y-6 xl:space-y-7">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-kjou-red">
            Pilotage
          </p>
          <h1 className="font-kjou-display text-2xl font-bold tracking-tight text-kjou-text sm:text-[30px]">
            Tableau de bord
          </h1>

          <p className="mt-1 text-sm text-kjou-muted">
            Synthèse de l’activité de location sur la période sélectionnée.
          </p>
        </div>

        <DashboardPeriodSelector
          period={period}
          onChange={setPeriod}
        />
      </header>

      {errorMessage && (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-kjou-card border border-red-200 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex-1 space-y-1">
            <p className="text-sm text-red-800">{errorMessage}</p>
            {currentDashboard && (
              <p className="text-sm text-red-800">
                Les données affichées proviennent du dernier chargement réussi
                et n’ont pas pu être actualisées.
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={() => setReloadKey((key) => key + 1)}
            className="self-start rounded-kjou-control bg-kjou-red px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-kjou-red-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kjou-red focus-visible:ring-offset-2 sm:self-auto"
          >
            Réessayer
          </button>
        </div>
      )}

      {loading && currentDashboard && (
        <p role="status" className="text-sm text-kjou-muted">
          Actualisation des données du tableau de bord...
        </p>
      )}

      <section aria-label="Actions rapides">
        <DashboardActions />
      </section>

      {loading && !currentDashboard && (
        <p
          role="status"
          className="text-sm text-kjou-muted"
        >
          Chargement des données du tableau de bord...
        </p>
      )}

      {currentDashboard && (
        <>
          <section aria-label="Indicateurs principaux">
            <DashboardKpiGrid
              kpis={currentDashboard.kpis}
              loading={loading}
            />
          </section>

          <section
            className="grid grid-cols-1 gap-5 xl:grid-cols-2"
            aria-label="Performance et état de la flotte"
          >
            <PerformanceOverview
              performance={currentDashboard.performance}
              loading={loading}
            />

            <FleetStatus
              fleet={currentDashboard.fleet}
              loading={loading}
            />
          </section>

          <section aria-label="Prochaines locations">
            <UpcomingRentals
              rentals={currentDashboard.upcoming_rentals}
              loading={loading}
            />
          </section>
        </>
      )}
    </div>
  );
}