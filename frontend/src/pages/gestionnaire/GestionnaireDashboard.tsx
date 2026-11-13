import {
  ArrowRight,
  RefreshCw,
  UserRound,
  CalendarDays,
  ShieldCheck,
} from "lucide-react";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import {
  vehicleService,
  type Vehicle,
} from "../../api/services/vehicleService";
import reservationService from "../../api/services/reservationService";
import maintenanceService from "../../api/services/maintenanceService";
import type { Reservation } from "../../types/reservation";
import type { Maintenance } from "../../types/maintenance";
import { MAINTENANCE_STATUS_LABELS } from "../../types/maintenance";

import { useDisplayName } from "../../hooks/useDisplayName";

function formatMaintenanceDate(value: string): string {
  if (!value) return "—";

  const date = new Date(`${value.slice(0, 10)}T12:00:00`);
  return Number.isNaN(date.getTime())
    ? "—"
    : new Intl.DateTimeFormat("fr-FR").format(date);
}

export default function GestionnaireDashboard() {
  const displayName = useDisplayName();

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [maintenances, setMaintenances] = useState<Maintenance[]>([]);
  const [vehiclesLoading, setVehiclesLoading] = useState(true);
  const [reservationsLoading, setReservationsLoading] = useState(true);
  const [maintenancesLoading, setMaintenancesLoading] = useState(true);
  const [vehiclesError, setVehiclesError] = useState<string | null>(null);
  const [reservationsError, setReservationsError] = useState<string | null>(null);
  const [maintenancesError, setMaintenancesError] = useState<string | null>(null);

  const loadVehicles = useCallback(async () => {
    try {
      const data = await vehicleService.getVehicles();
      setVehicles(data);
    } catch (err) {
      console.error("Erreur chargement véhicules dashboard:", err);
      setVehiclesError("Impossible de charger les données du parc automobile.");
    } finally {
      setVehiclesLoading(false);
    }
  }, []);

  const loadReservations = useCallback(async () => {
    try {
      const data = await reservationService.getAllReservations();
      setReservations(data);
    } catch (err) {
      console.error("Erreur chargement locations dashboard:", err);
      setReservationsError("Impossible de charger les données des réservations.");
    } finally {
      setReservationsLoading(false);
    }
  }, []);

  const loadMaintenances = useCallback(async () => {
    try {
      const data = await maintenanceService.getAll();
      setMaintenances(data);
    } catch (err) {
      console.error("Erreur chargement maintenance dashboard:", err);
      setMaintenancesError("Impossible de charger les données de maintenance.");
    } finally {
      setMaintenancesLoading(false);
    }
  }, []);

  const refreshDashboard = useCallback(async () => {
    await Promise.all([
      loadVehicles(),
      loadReservations(),
      loadMaintenances(),
    ]);
  }, [loadMaintenances, loadReservations, loadVehicles]);

  const handleRefresh = useCallback(() => {
    setVehiclesLoading(true);
    setReservationsLoading(true);
    setMaintenancesLoading(true);
    setVehiclesError(null);
    setReservationsError(null);
    setMaintenancesError(null);
    void refreshDashboard();
  }, [refreshDashboard]);

  useEffect(() => {
    void Promise.resolve().then(refreshDashboard);
  }, [refreshDashboard]);

  const total        = vehicles.length;
  const available    = vehicles.filter((v) => v.status === "AVAILABLE").length;
  const maintenance  = vehicles.filter((v) => v.status === "MAINTENANCE").length;
  const outOfService = vehicles.filter((v) => v.status === "OUT_OF_SERVICE").length;

  const availablePercentage    = total > 0 ? Math.round((available    / total) * 100) : 0;
  const maintenancePercentage  = total > 0 ? Math.round((maintenance  / total) * 100) : 0;
  const outOfServicePercentage = total > 0 ? Math.round((outOfService / total) * 100) : 0;
  const ongoingReservations = useMemo(
    () => reservations.filter((reservation) => reservation.statut === "EN_COURS"),
    [reservations],
  );
  const {
    plannedMaintenanceCount,
    plannedMaintenancePreview,
    maintenanceRecordCount,
  } = useMemo(() => {
    const planned = maintenances
      .filter((item) => item.status === "PLANNED")
      .sort((left, right) => left.scheduled_date.localeCompare(right.scheduled_date));

    return {
      plannedMaintenanceCount: planned.length,
      plannedMaintenancePreview: planned.slice(0, 3),
      maintenanceRecordCount: maintenances.length,
    };
  }, [maintenances]);
  const isRefreshing =
    vehiclesLoading || reservationsLoading || maintenancesLoading;

  const todayLabel = new Date().toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="bg-kjou-mist font-kjou-body">
      <div className="space-y-kjou-section pb-10">

        {/* HEADER */}
        <header className="overflow-hidden rounded-kjou-card border border-kjou-border bg-kjou-white shadow-sm">
          <div className="border-l-4 border-kjou-red p-kjou-page-sm sm:p-kjou-page">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

              <div className="min-w-0">
                <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-kjou-muted">
                  <ShieldCheck className="h-4 w-4 text-kjou-muted" />
                  Espace gestionnaire
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gray-100">
                    <UserRound className="h-6 w-6 text-gray-500" />
                  </div>
                  <div className="min-w-0">
                    <h1 className="truncate font-kjou-display text-kjou-page-compact font-extrabold tracking-tight text-kjou-text sm:text-kjou-page">
                      Bonjour, {displayName}
                    </h1>
                    <p className="mt-1 text-sm text-kjou-muted">
                      Bienvenue dans votre espace de gestion.
                    </p>
                  </div>
                </div>

                <p className="mt-4 max-w-2xl text-sm leading-6 text-kjou-muted">
                  Consultez l'état du parc automobile et suivez les principales opérations de votre agence.
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-3">
                <div className="hidden items-center gap-2 rounded-kjou-control border border-kjou-border bg-kjou-mist px-4 py-2.5 sm:flex">
                  <CalendarDays className="h-4 w-4 text-kjou-muted" />
                  <span className="text-sm font-semibold text-kjou-text">{todayLabel}</span>
                </div>

                <button
                  type="button"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  aria-label="Actualiser les données"
                  title="Actualiser"
                  className="cursor-pointer inline-flex h-11 items-center justify-center gap-2 rounded-kjou-control border border-kjou-border bg-kjou-white px-4 text-sm font-semibold text-kjou-text shadow-sm transition hover:border-kjou-muted/40 hover:bg-kjou-mist focus-visible:outline-none focus-visible:ring-kjou focus-visible:ring-kjou-red focus-visible:ring-offset-kjou focus-visible:ring-offset-kjou-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <RefreshCw className={`h-4 w-4 text-kjou-muted ${isRefreshing ? "animate-spin" : ""}`} />
                  <span className="hidden sm:inline">Actualiser</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* PARC + LOCATIONS */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">

          <section className="rounded-kjou-card border border-kjou-border bg-kjou-white p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="font-kjou-display text-kjou-section font-bold text-kjou-text">État du parc</h2>
                <p className="mt-1 text-sm text-kjou-muted">Répartition parmi les véhicules chargés</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-medium text-kjou-muted">Véhicules chargés</p>
                <p className="font-kjou-display text-3xl font-extrabold tracking-tight text-kjou-text">
                  {vehiclesLoading && vehicles.length === 0
                    ? "…"
                    : vehiclesError && vehicles.length === 0
                      ? "—"
                      : total}
                </p>
              </div>
            </div>

            {vehiclesError && (
              <div role="alert" className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-kjou-control border border-status-danger/20 bg-status-danger/5 p-3 text-sm text-status-danger">
                <span>{vehiclesError}</span>
                <button
                  type="button"
                  onClick={() => {
                    setVehiclesLoading(true);
                    setVehiclesError(null);
                    void loadVehicles();
                  }}
                  className="rounded-kjou-control px-2 py-1 font-semibold underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-kjou focus-visible:ring-status-danger"
                >
                  Réessayer
                </button>
              </div>
            )}

            {vehiclesLoading && vehicles.length === 0 ? (
              <p role="status" className="mt-6 text-sm text-kjou-muted">
                Chargement des véhicules…
              </p>
            ) : vehicles.length === 0 && !vehiclesError ? (
              <p role="status" className="mt-6 rounded-kjou-control bg-kjou-mist p-4 text-sm text-kjou-muted">
                Aucun véhicule n’est présent dans les résultats chargés.
              </p>
            ) : vehicles.length > 0 ? (
              <div className="mt-7 space-y-5">
                <FleetProgress
                  label="Disponibles"
                  value={availablePercentage}
                  count={available}
                  indicatorClassName="bg-status-success"
                />
                <FleetProgress
                  label="Maintenance"
                  value={maintenancePercentage}
                  count={maintenance}
                  indicatorClassName="bg-status-warning"
                />
                <FleetProgress
                  label="Hors service"
                  value={outOfServicePercentage}
                  count={outOfService}
                  indicatorClassName="bg-status-danger"
                />
              </div>
            ) : null}

            <Link
              to="/gestionnaire/vehicles"
              className="mt-7 inline-flex items-center gap-1.5 text-sm font-semibold text-kjou-text transition hover:text-kjou-red focus-visible:outline-none focus-visible:ring-kjou focus-visible:ring-kjou-red focus-visible:ring-offset-kjou focus-visible:ring-offset-kjou-white"
            >
              Gérer les véhicules <ArrowRight className="h-4 w-4" />
            </Link>
          </section>

          <section className="rounded-kjou-card border border-kjou-border bg-kjou-white p-5 sm:p-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-kjou-display text-kjou-section font-bold text-kjou-text">Locations en cours</h2>
                <p className="mt-1 text-sm text-kjou-muted">Réservations au statut « En cours » dans les résultats chargés</p>
              </div>
            </div>

            <div aria-busy={reservationsLoading} className="mt-6 min-h-24">
              {reservationsLoading ? (
                <p role="status" className="text-sm text-kjou-muted">
                  Chargement des réservations…
                </p>
              ) : reservationsError ? (
                <div role="alert" className="rounded-kjou-control border border-status-danger/20 bg-status-danger/5 p-3 text-sm text-status-danger">
                  <p>{reservationsError}</p>
                  <button
                    type="button"
                    onClick={() => {
                      setReservationsLoading(true);
                      setReservationsError(null);
                      void loadReservations();
                    }}
                    className="mt-2 font-semibold underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-kjou focus-visible:ring-status-danger"
                  >
                    Réessayer
                  </button>
                </div>
              ) : reservations.length === 0 ? (
                <p role="status" className="text-sm text-kjou-muted">
                  Aucune réservation n’est présente dans les résultats chargés.
                </p>
              ) : (
                <>
                  <p className="font-kjou-display text-4xl font-extrabold tracking-tight text-kjou-text">
                    {ongoingReservations.length}
                  </p>
                  <p className="mt-1 text-sm text-kjou-muted">
                    {ongoingReservations.length === 1
                      ? "location en cours parmi les résultats chargés"
                        : "locations en cours parmi les résultats chargés"}
                  </p>
                </>
              )}
            </div>

            <p className="mt-4 text-xs leading-5 text-kjou-muted">
              Les listes sont paginées par l’API ; ce nombre ne représente que les résultats chargés. Les volumes « À récupérer » et « À rendre » ne sont pas fournis par les données disponibles.
            </p>

            <Link
              to="/gestionnaire/rentals"
              className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-kjou-text transition hover:text-kjou-red focus-visible:outline-none focus-visible:ring-kjou focus-visible:ring-kjou-red focus-visible:ring-offset-kjou focus-visible:ring-offset-kjou-white"
            >
              Voir les locations <ArrowRight className="h-4 w-4" />
            </Link>
          </section>
        </div>

        {/* MAINTENANCES */}
        <section className="overflow-hidden rounded-kjou-card border border-kjou-border bg-kjou-white">
          <div className="flex flex-col gap-4 border-b border-kjou-border p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div>
              <h2 className="font-kjou-display text-kjou-section font-bold text-kjou-text">Maintenances planifiées</h2>
              <p className="mt-1.5 text-sm text-kjou-muted">Interventions planifiées parmi les résultats chargés</p>
            </div>
            <Link
              to="/gestionnaire/maintenance"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-kjou-text transition hover:text-kjou-red focus-visible:outline-none focus-visible:ring-kjou focus-visible:ring-kjou-red focus-visible:ring-offset-kjou focus-visible:ring-offset-kjou-white"
            >
              Voir le registre <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {maintenancesError && (
            <div role="alert" className="m-5 flex flex-wrap items-center justify-between gap-3 rounded-kjou-control border border-status-danger/20 bg-status-danger/5 p-3 text-sm text-status-danger sm:m-6">
              <span>{maintenancesError}</span>
              <button
                type="button"
                onClick={() => {
                  setMaintenancesLoading(true);
                  setMaintenancesError(null);
                  void loadMaintenances();
                }}
                className="rounded-kjou-control px-2 py-1 font-semibold underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-kjou focus-visible:ring-status-danger"
              >
                Réessayer
              </button>
            </div>
          )}

          {maintenancesLoading ? (
            <p role="status" className="p-5 text-sm text-kjou-muted sm:p-6">
              Chargement des maintenances…
            </p>
          ) : maintenancesError ? null : maintenanceRecordCount === 0 ? (
            <p role="status" className="p-5 text-sm text-kjou-muted sm:p-6">
              Aucune maintenance n’est présente dans les résultats chargés.
            </p>
          ) : plannedMaintenanceCount === 0 ? (
            <p role="status" className="p-5 text-sm text-kjou-muted sm:p-6">
              Aucune maintenance planifiée parmi les résultats chargés.
            </p>
          ) : (
            <>
              {plannedMaintenanceCount > plannedMaintenancePreview.length && (
                <p className="px-5 pt-4 text-xs text-kjou-muted sm:px-6">
                  Affichage de {plannedMaintenancePreview.length} interventions sur {plannedMaintenanceCount} planifiées parmi les résultats chargés.
                </p>
              )}
              <div className="overflow-x-auto">
                <table className="w-full min-w-[620px] text-left">
                  <thead className="bg-kjou-mist">
                    <tr className="text-xs font-semibold uppercase tracking-wider text-kjou-muted">
                      <th scope="col" className="px-5 py-3.5 sm:px-6">Véhicule</th>
                      <th scope="col" className="px-5 py-3.5 sm:px-6">Intervention</th>
                      <th scope="col" className="px-5 py-3.5 sm:px-6">Date prévue</th>
                      <th scope="col" className="px-5 py-3.5 sm:px-6">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-kjou-border">
                    {plannedMaintenancePreview.map((item) => (
                      <tr key={item.id} className="transition hover:bg-kjou-mist/60">
                        <td className="px-5 py-4 text-sm font-semibold text-kjou-text sm:px-6">
                          {item.vehicle_display || "Véhicule"}
                        </td>
                        <td className="px-5 py-4 text-sm text-kjou-muted sm:px-6">
                          {item.title}
                        </td>
                        <td className="px-5 py-4 text-sm text-kjou-muted sm:px-6">
                          {formatMaintenanceDate(item.scheduled_date)}
                        </td>
                        <td className="px-5 py-4 sm:px-6">
                          <span className="inline-flex rounded-kjou-control bg-kjou-mist px-2.5 py-1 text-xs font-semibold text-kjou-text">
                            {MAINTENANCE_STATUS_LABELS[item.status]}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>

        {/* ACTIVITÉS */}
        <section className="rounded-kjou-card border border-kjou-border bg-kjou-white p-5 sm:p-6">
          <h2 className="font-kjou-display text-kjou-section font-bold text-kjou-text">
            Activité opérationnelle
          </h2>
          <p role="status" className="mt-2 text-sm leading-6 text-kjou-muted">
            Le flux d’activité n’est pas disponible dans les sources actuelles. Consultez les pages des réservations, locations et maintenances pour leurs données à jour.
          </p>
        </section>

      </div>
    </div>
  );
}

/* ============================================================
   FLEET PROGRESS
   ============================================================ */

function FleetProgress({ label, value, count, indicatorClassName }: {
  label: string;
  value: number;
  count: number;
  indicatorClassName: string;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-kjou-text">{label}</span>
          <span className="rounded-kjou-control bg-kjou-mist px-2 py-0.5 text-xs font-semibold text-kjou-text">
            {count}
          </span>
        </div>
        <span className="text-sm font-semibold text-kjou-text">{value}%</span>
      </div>
      <div
        role="progressbar"
        aria-label={`Part des véhicules ${label.toLocaleLowerCase("fr")}`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={value}
        className="h-1.5 overflow-hidden rounded-full bg-kjou-mist"
      >
        <div
          className={`h-full rounded-full transition-all duration-700 ${indicatorClassName}`}
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
    </div>
  );
}