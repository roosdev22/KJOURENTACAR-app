import DashboardKpiCard from "./DashboardKpiCard";

import type {
  DashboardKpis,
} from "../../../api/services/adminDashboardService";

interface DashboardKpiGridProps {
  kpis: DashboardKpis;
  loading?: boolean;
}

function formatHTG(value: string): string {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return "0";
  }

  return new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 2,
  }).format(amount);
}

export default function DashboardKpiGrid({
  kpis,
  loading = false,
}: DashboardKpiGridProps) {
  const value = (amount: string | number) =>
    loading ? "…" : String(amount);

  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-kjou-border bg-kjou-border md:grid-cols-3 xl:grid-cols-6">
      <DashboardKpiCard
        label="Flotte"
        value={value(kpis.total_vehicles)}
        description="Véhicules"
      />

      <DashboardKpiCard
        label="Locations"
        value={value(kpis.active_rentals)}
        description="En cours"
      />

      <DashboardKpiCard
        label="Réservations"
        value={value(kpis.reservations)}
        description="Créées sur cette période"
      />

      <DashboardKpiCard
        label="Revenus"
        value={loading ? "…" : formatHTG(kpis.revenue_htg)}
        description="HTG · Nets sur la période"
      />

      <DashboardKpiCard
        label="Occupation"
        value={value(`${kpis.occupancy_rate}%`)}
        description="Véhicules en location"
      />

      <DashboardKpiCard
        label="Clients"
        value={value(kpis.active_clients)}
        description="Clients actifs"
      />
    </div>
  );
}