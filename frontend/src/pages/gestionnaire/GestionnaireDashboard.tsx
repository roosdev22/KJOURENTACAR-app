import {
  Car,
  CheckCircle2,
  Wrench,
  CircleOff,
  ClipboardList,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  UserRound,
  CalendarDays,
  Activity,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";

import { useEffect, useState } from "react";

import {
  vehicleService,
  type Vehicle,
} from "../../api/services/vehicleService";

import { useDisplayName } from "../../hooks/useDisplayName";

interface GestionnaireDashboardProps {
  onNavigateToVehicles?: () => void;
  onNavigateToRentals?: () => void;
}

const maintenanceItems = [
  { vehicle: "Toyota RAV4",    type: "Entretien", date: "02/09/2026", status: "J-2" },
  { vehicle: "Hyundai Tucson", type: "Vidange",   date: "04/09/2026", status: "J-4" },
  { vehicle: "Kia Sportage",   type: "Contrôle",  date: "07/09/2026", status: "J-7" },
];

const activities = [
  { type: "Location créée",      vehicle: "Toyota Corolla", time: "10:32", icon: CheckCircle2 },
  { type: "Retour confirmé",     vehicle: "Honda CR-V",     time: "09:15", icon: ClipboardList },
  { type: "Mise en maintenance", vehicle: "Nissan Qashqai", time: "Hier",  icon: Wrench },
];

export default function GestionnaireDashboard({
  onNavigateToVehicles,
  onNavigateToRentals,
}: GestionnaireDashboardProps) {
  const displayName = useDisplayName();

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadVehicles = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await vehicleService.getVehicles();
      setVehicles(data);
    } catch (err) {
      console.error("Erreur chargement véhicules dashboard:", err);
      setError("Impossible de charger les données du parc automobile.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    async function fetchInitial() {
      await loadVehicles();
    }
    void fetchInitial();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const total        = vehicles.length;
  const available    = vehicles.filter((v) => v.status === "AVAILABLE").length;
  const maintenance  = vehicles.filter((v) => v.status === "MAINTENANCE").length;
  const outOfService = vehicles.filter((v) => v.status === "OUT_OF_SERVICE").length;

  const availablePercentage    = total > 0 ? Math.round((available    / total) * 100) : 0;
  const maintenancePercentage  = total > 0 ? Math.round((maintenance  / total) * 100) : 0;
  const outOfServicePercentage = total > 0 ? Math.round((outOfService / total) * 100) : 0;

  const todayLabel = new Date().toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  if (loading && vehicles.length === 0) {
    return (
      <div className="bg-gray-50">
        <div className="space-y-6 pb-10">
          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <div className="space-y-3">
              <div className="h-4 w-40 animate-pulse rounded bg-gray-200" />
              <div className="h-8 w-72 animate-pulse rounded bg-gray-200" />
              <div className="h-4 w-full max-w-xl animate-pulse rounded bg-gray-100" />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-36 animate-pulse rounded-2xl border border-gray-200 bg-gray-50" />
            ))}
          </div>
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <div className="h-72 animate-pulse rounded-2xl bg-gray-100" />
            <div className="h-72 animate-pulse rounded-2xl bg-gray-100" />
          </div>
          <div className="h-72 animate-pulse rounded-2xl bg-gray-100" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50">
      <div className="space-y-6 pb-10">

        {/* HEADER */}
        <header className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-l-4 border-red-600 p-5 sm:p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

              <div className="min-w-0">
                <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-gray-400">
                  <ShieldCheck className="h-4 w-4 text-gray-400" />
                  Espace gestionnaire
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gray-100">
                    <UserRound className="h-6 w-6 text-gray-500" />
                  </div>
                  <div className="min-w-0">
                    <h1 className="truncate text-2xl font-black tracking-tight text-gray-900 sm:text-3xl">
                      Bonjour, {displayName}
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">
                      Bienvenue dans votre espace de gestion.
                    </p>
                  </div>
                </div>

                <p className="mt-4 max-w-2xl text-sm leading-6 text-gray-500">
                  Consultez l'état du parc automobile et suivez les principales activités de votre agence.
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-3">
                <div className="hidden items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 sm:flex">
                  <CalendarDays className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-semibold text-gray-600">{todayLabel}</span>
                </div>

                <button
                  type="button"
                  onClick={() => void loadVehicles()}
                  disabled={loading}
                  aria-label="Actualiser les données"
                  title="Actualiser"
                  className="cursor-pointer inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <RefreshCw className={`h-4 w-4 text-gray-500 ${loading ? "animate-spin" : ""}`} />
                  <span className="hidden sm:inline">Actualiser</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* ERREUR */}
        {error && (
          <div className="flex flex-col gap-4 rounded-xl border border-red-100 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-100">
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-red-900">Erreur de chargement</p>
                <p className="mt-0.5 text-xs text-red-500">{error}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => void loadVehicles()}
              className="cursor-pointer rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-red-700"
            >
              Réessayer
            </button>
          </div>
        )}

        {/* KPI */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <DashboardKpi
            title="Véhicules"
            value={total}
            description="Total du parc"
            icon={Car}
            iconColor="text-blue-500"
            iconBg="bg-blue-50"
          />
          <DashboardKpi
            title="Disponibles"
            value={available}
            description="Prêts à la location"
            icon={CheckCircle2}
            iconColor="text-emerald-500"
            iconBg="bg-emerald-50"
          />
          <DashboardKpi
            title="Maintenance"
            value={maintenance}
            description="Actuellement immobilisés"
            icon={Wrench}
            iconColor="text-orange-500"
            iconBg="bg-orange-50"
          />
          <DashboardKpi
            title="Hors service"
            value={outOfService}
            description="Indisponibles"
            icon={CircleOff}
            iconColor="text-red-500"
            iconBg="bg-red-50"
          />
        </div>

        {/* PARC + LOCATIONS */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">

          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-base font-bold text-gray-900">État du parc</h2>
                <p className="mt-1 text-sm text-gray-500">Répartition actuelle des véhicules</p>
              </div>
              <div className="rounded-xl bg-blue-50 p-3">
                <TrendingUp className="h-5 w-5 text-blue-500" />
              </div>
            </div>

            <div className="mt-7 space-y-5">
              <FleetProgress
                label="Disponibles"
                value={availablePercentage}
                count={available}
                indicatorClassName="bg-emerald-500"
                badgeClassName="bg-emerald-50 text-emerald-700"
              />
              <FleetProgress
                label="Maintenance"
                value={maintenancePercentage}
                count={maintenance}
                indicatorClassName="bg-orange-400"
                badgeClassName="bg-orange-50 text-orange-700"
              />
              <FleetProgress
                label="Hors service"
                value={outOfServicePercentage}
                count={outOfService}
                indicatorClassName="bg-red-400"
                badgeClassName="bg-red-50 text-red-600"
              />
            </div>

            <button
              type="button"
              onClick={onNavigateToVehicles}
              className="cursor-pointer mt-7 inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 transition hover:text-gray-900"
            >
              Gérer les véhicules <ArrowRight className="h-4 w-4" />
            </button>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-base font-bold text-gray-900">Locations du jour</h2>
                <p className="mt-1 text-sm text-gray-500">Activité opérationnelle</p>
              </div>
              <div className="rounded-xl bg-purple-50 p-3">
                <ClipboardList className="h-5 w-5 text-purple-500" />
              </div>
            </div>

            <div className="mt-8 grid grid-cols-3 divide-x divide-gray-100">
              <RentalStat value={8} label="En cours"    color="text-emerald-600" />
              <RentalStat value={3} label="À récupérer" color="text-orange-500"  />
              <RentalStat value={2} label="À rendre"    color="text-red-500"     />
            </div>

            <button
              type="button"
              onClick={onNavigateToRentals}
              className="cursor-pointer mt-8 inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 transition hover:text-gray-900"
            >
              Voir les locations <ArrowRight className="h-4 w-4" />
            </button>
          </section>
        </div>

        {/* MAINTENANCES */}
        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-gray-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div>
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-orange-50 p-2">
                  <Wrench className="h-4 w-4 text-orange-500" />
                </div>
                <h2 className="font-bold text-gray-900">Maintenances à prévoir</h2>
              </div>
              <p className="mt-1.5 text-sm text-gray-500">Prochaines interventions sur les véhicules</p>
            </div>
            <button
              type="button"
              className="cursor-pointer inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 transition hover:text-gray-900"
            >
              Voir tout <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left">
              <thead className="bg-gray-50">
                <tr className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                  <th className="px-6 py-3.5">Véhicule</th>
                  <th className="px-6 py-3.5">Intervention</th>
                  <th className="px-6 py-3.5">Date</th>
                  <th className="px-6 py-3.5">Échéance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {maintenanceItems.map((item) => (
                  <tr key={`${item.vehicle}-${item.date}`} className="transition hover:bg-gray-50/70">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100">
                          <Car className="h-4 w-4 text-gray-500" />
                        </div>
                        <span className="text-sm font-semibold text-gray-900">{item.vehicle}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{item.type}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{item.date}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-600">
                        <AlertTriangle className="h-3 w-3" />
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ACTIVITÉS */}
        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 p-5 sm:p-6">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-gray-100 p-2">
                <Activity className="h-4 w-4 text-gray-500" />
              </div>
              <h2 className="font-bold text-gray-900">Dernières activités</h2>
            </div>
            <p className="mt-1.5 text-sm text-gray-500">Activité récente du parc automobile</p>
          </div>

          <div className="divide-y divide-gray-100">
            {activities.map((activity) => {
              const Icon = activity.icon;
              return (
                <div
                  key={`${activity.type}-${activity.vehicle}`}
                  className="flex items-center gap-4 px-5 py-4 transition hover:bg-gray-50/70 sm:px-6"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100">
                    <Icon className="h-4 w-4 text-gray-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-gray-900">{activity.type}</p>
                    <p className="mt-0.5 truncate text-xs text-gray-500">{activity.vehicle}</p>
                  </div>
                  <span className="shrink-0 text-xs text-gray-400">{activity.time}</span>
                </div>
              );
            })}
          </div>
        </section>

      </div>
    </div>
  );
}

/* ============================================================
   KPI
   ============================================================ */

function DashboardKpi({ title, value, description, icon: Icon, iconColor, iconBg }: {
  title: string;
  value: number;
  description: string;
  icon: typeof Car;
  iconColor: string;
  iconBg: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-2 text-3xl font-black tracking-tight text-gray-900">{value}</p>
        </div>
        <div className={`rounded-xl p-3 ${iconBg}`}>
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
      </div>
      <p className="mt-3 text-xs text-gray-400">{description}</p>
    </div>
  );
}

/* ============================================================
   FLEET PROGRESS
   ============================================================ */

function FleetProgress({ label, value, count, indicatorClassName, badgeClassName }: {
  label: string;
  value: number;
  count: number;
  indicatorClassName: string;
  badgeClassName: string;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">{label}</span>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${badgeClassName}`}>
            {count}
          </span>
        </div>
        <span className="text-sm font-semibold text-gray-700">{value}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
        <div
          className={`h-full rounded-full transition-all duration-700 ${indicatorClassName}`}
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
    </div>
  );
}

/* ============================================================
   RENTAL STAT
   ============================================================ */

function RentalStat({ value, label, color }: {
  value: number;
  label: string;
  color: string;
}) {
  return (
    <div className="px-4 text-center first:pl-0 last:pr-0">
      <p className={`text-3xl font-black tracking-tight ${color}`}>{value}</p>
      <p className="mt-1.5 text-xs text-gray-500">{label}</p>
    </div>
  );
}