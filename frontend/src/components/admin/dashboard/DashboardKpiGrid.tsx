import {
  CarFront,
  KeyRound,
  CalendarDays,
  Wallet,
  ChartNoAxesCombined,
  Users,
} from "lucide-react";

import DashboardKpiCard from "./DashboardKpiCard";

export default function DashboardKpiGrid() {
  return (
    <div
      className="
        grid
        grid-cols-2
        md:grid-cols-3
        xl:grid-cols-6
        gap-3
      "
    >
      <DashboardKpiCard
        label="Flotte"
        value="24"
        description="Véhicules"
        icon={CarFront}
        color="blue"
      />

      <DashboardKpiCard
        label="Locations"
        value="12"
        description="En cours"
        icon={KeyRound}
        color="orange"
      />

      <DashboardKpiCard
        label="Réservations"
        value="18"
        description="Cette période"
        icon={CalendarDays}
        color="purple"
      />

      <DashboardKpiCard
        label="Revenus"
        value="125 400"
        description="HTG · Cette période"
        icon={Wallet}
        color="green"
        trend="+12,5%"
      />

      <DashboardKpiCard
        label="Occupation"
        value="78%"
        description="Taux moyen"
        icon={ChartNoAxesCombined}
        color="red"
        trend="+6%"
      />

      <DashboardKpiCard
        label="Clients"
        value="86"
        description="Clients actifs"
        icon={Users}
        color="indigo"
      />
    </div>
  );
}