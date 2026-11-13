
import { useEffect, useMemo, useState } from "react";
import AdminIcon, { type AdminIconName } from "../../components/admin/AdminIcon";
import reservationService from "../../api/services/reservationService";
import ReservationCard from "../../components/reservation/ReservationCard";

import type {
  Reservation,
  ReservationStatus,
} from "../../types/reservation";

type ReservationFilter = "ALL" | ReservationStatus;

const filters: Array<{
  value: ReservationFilter;
  label: string;
}> = [
  { value: "ALL", label: "Toutes" },
  { value: "PENDING_VERIFICATION", label: "En attente" },
  { value: "CONFIRMED", label: "Confirmées" },
  { value: "EN_COURS", label: "En cours" },
  { value: "TERMINEE", label: "Terminées" },
  { value: "CANCELLED", label: "Annulées" },
  { value: "EXPIRED", label: "Expirées" },
];

function getErrorMessage(error: unknown): string {
  if (!error || typeof error !== "object") {
    return "Impossible de charger vos réservations.";
  }

  const candidate = error as {
    response?: { data?: unknown };
    message?: string;
  };

  const data = candidate.response?.data;

  if (data && typeof data === "object") {
    const payload = data as Record<string, unknown>;

    if (
      typeof payload.detail === "string" &&
      payload.detail.trim()
    ) {
      return payload.detail.trim();
    }

    if (
      typeof payload.message === "string" &&
      payload.message.trim()
    ) {
      return payload.message.trim();
    }
  }

  return candidate.message?.trim() ||
    "Impossible de charger vos réservations.";
}

function StatCard({
  label,
  value,
  description,
  icon: Icon,
  accent = false,
}: {
  label: string;
  value: number;
  description: string;
  icon: AdminIconName;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-5 transition duration-200 hover:-translate-y-0.5 hover:shadow-md ${
        accent
          ? "border-slate-900 bg-slate-950 text-white shadow-sm"
          : "border-slate-200 bg-white text-slate-950 shadow-sm"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p
            className={`text-xs font-semibold ${
              accent ? "text-slate-400" : "text-slate-500"
            }`}
          >
            {label}
          </p>
          <p className="mt-3 text-3xl font-bold tracking-tight">
            {value}
          </p>
        </div>

        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${
            accent
              ? "bg-red-600 text-white"
              : "bg-red-50 text-red-600"
          }`}
        >
          <AdminIcon name={Icon} size={20} />
        </div>
      </div>

      <p
        className={`mt-4 text-xs ${
          accent ? "text-slate-400" : "text-slate-500"
        }`}
      >
        {description}
      </p>
    </div>
  );
}

export default function MyReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [filter, setFilter] =
    useState<ReservationFilter>("ALL");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchReservations(): Promise<void> {
      try {
        const data =
          await reservationService.getMyReservations();

        if (cancelled) return;

        setReservations(data);
        setError(null);
      } catch (err: unknown) {
        if (cancelled) return;

        console.error(
          "[MyReservationsPage] Erreur lors du chargement :",
          err,
        );

        setError(getErrorMessage(err));
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void fetchReservations();

    return () => {
      cancelled = true;
    };
  }, []);

  async function loadReservations(): Promise<void> {
    if (isLoading || isRefreshing) return;

    setIsRefreshing(true);
    setError(null);

    try {
      const data =
        await reservationService.getMyReservations();

      setReservations(data);
    } catch (err: unknown) {
      console.error(
        "[MyReservationsPage] Erreur lors de l'actualisation :",
        err,
      );

      setError(getErrorMessage(err));
    } finally {
      setIsRefreshing(false);
    }
  }

  const counts = useMemo(() => {
  let pending = 0;
  let confirmed = 0;
  let active = 0;
  let completed = 0;
  let cancelled = 0;
  let expired = 0;

  for (const reservation of reservations) {
    switch (reservation.statut) {
      case "PENDING_VERIFICATION":
        pending += 1;
        break;
      case "CONFIRMED":
        confirmed += 1;
        break;
      case "EN_COURS":
        active += 1;
        break;
      case "TERMINEE":
        completed += 1;
        break;
      case "CANCELLED":
        cancelled += 1;
        break;
      case "EXPIRED":
        expired += 1;
        break;
    }
  }

  return {
    all: reservations.length,
    pending,
    confirmed,
    active,
    completed,
    cancelled,
    expired,
  };
}, [reservations]);

  const filteredReservations = useMemo(() => {
    if (filter === "ALL") return reservations;

    return reservations.filter(
      (reservation) => reservation.statut === filter,
    );
  }, [reservations, filter]);

  const filterCounts: Record<ReservationFilter, number> = {
  ALL: counts.all,
  PENDING_VERIFICATION: counts.pending,
  CONFIRMED: counts.confirmed,
  EN_COURS: counts.active,
  TERMINEE: counts.completed,
  CANCELLED: counts.cancelled,
  EXPIRED: counts.expired,
};

  return (
    <main className="min-h-screen bg-[#F5F6F8] text-slate-950">
      {/* En-tête premium */}
      <section className="relative isolate overflow-hidden bg-slate-950 text-white">
        <div className="pointer-events-none absolute -right-20 -top-32 -z-10 h-80 w-80 rounded-full border border-white/[0.07]" />
        <div className="pointer-events-none absolute -right-4 -top-16 -z-10 h-56 w-56 rounded-full border border-white/[0.07]" />
        <div className="pointer-events-none absolute bottom-0 right-1/3 -z-10 h-40 w-40 rounded-full bg-red-600/10 blur-3xl" />

        <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10 lg:px-10">
          <div className="flex flex-col justify-between gap-7 md:flex-row md:items-end">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-px w-8 bg-red-500" />
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-red-400">
                  K-JOU RENT A CAR
                </p>
              </div>

              <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl lg:text-[42px]">
                Mes réservations
                <span className="text-red-500">.</span>
              </h1>

              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">
                Retrouvez vos demandes de location, consultez leur
                statut et suivez chaque étape de vos réservations.
              </p>

              <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-400">
                <span className="inline-flex items-center gap-2">
                  <AdminIcon name="shield" size={16} className="text-red-400" />
                  Espace client sécurisé
                </span>
                <span className="inline-flex items-center gap-2">
                  <AdminIcon name="calendar-check" size={16} />
                  Suivi de vos locations
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => void loadReservations()}
              disabled={isLoading || isRefreshing}
              className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 self-start rounded-xl border border-white/15 bg-white/[0.06] px-4 text-sm font-semibold text-white transition hover:border-white/30 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50 md:self-auto"
              aria-label="Actualiser les réservations"
            >
              <AdminIcon
                name="refresh"
                size={16}
                className={isRefreshing ? "animate-spin" : ""}
              />
              {isRefreshing ? "Actualisation..." : "Actualiser"}
            </button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl space-y-7 px-5 py-7 sm:px-8 sm:py-9 lg:px-10">
        {/* Indicateurs */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Total des réservations"
            value={counts.all}
            description="Toutes vos demandes enregistrées"
            icon="calendar-check"
            accent
          />
          <StatCard
            label="En attente"
            value={counts.pending}
            description="Demandes en cours de vérification"
            icon="clock"
          />
          <StatCard
            label="Confirmées"
            value={counts.confirmed + counts.active}
            description="Réservations confirmées ou en cours"
            icon="check-circle"
          />
          <StatCard
            label="Terminées"
            value={counts.completed}
            description="Locations arrivées à leur terme"
            icon="shield"
          />
        </div>

        {/* Liste et filtres */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-red-600">
                  Votre historique
                </p>
                <h2 className="mt-1.5 text-lg font-bold tracking-tight text-slate-950">
                  Toutes vos locations
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {filteredReservations.length} résultat
                  {filteredReservations.length !== 1 ? "s" : ""}
                  {filter !== "ALL" ? " dans cette catégorie" : ""}
                </p>
              </div>

              <div className="flex items-center gap-2 self-start rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                <span className="h-2 w-2 rounded-full bg-red-600" />
                <span className="text-xs font-semibold text-slate-600">
                  Suivi des réservations
                </span>
              </div>
            </div>

            <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
              {filters.map((item) => {
                const isActive = filter === item.value;

                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setFilter(item.value)}
                    aria-pressed={isActive}
                    className={`inline-flex shrink-0 items-center gap-2 rounded-xl border px-3.5 py-2.5 text-xs font-semibold transition ${
                      isActive
                        ? "border-slate-950 bg-slate-950 text-white shadow-sm"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    {item.label}
                    <span
                      className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                        isActive
                          ? "bg-white/15 text-white"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {filterCounts[item.value]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-4 sm:p-6">
            {/* Chargement */}
            {isLoading && (
              <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-slate-100 bg-slate-50/60 px-5 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-red-100 bg-white shadow-sm">
                  <AdminIcon name="loader" size={24} className="animate-spin text-red-600" />
                </div>
                <p className="mt-4 text-sm font-semibold text-slate-800">
                  Chargement de vos réservations
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Récupération de votre historique...
                </p>
              </div>
            )}

            {/* Erreur */}
            {!isLoading && error && (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50/60 px-5 py-10 text-center"
              >
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-red-100 bg-white text-red-600">
                  <AdminIcon name="x-circle" size={24} />
                </div>
                <h3 className="mt-4 text-base font-bold text-slate-950">
                  Impossible de charger les réservations
                </h3>
                <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-600">
                  {error}
                </p>
                <button
                  type="button"
                  onClick={() => void loadReservations()}
                  disabled={isRefreshing}
                  className="mt-5 inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
                >
                  <AdminIcon
                    name="refresh"
                    size={16}
                    className={isRefreshing ? "animate-spin" : ""}
                  />
                  Réessayer
                </button>
              </div>
            )}

            {/* Aucun résultat */}
            {!isLoading && !error && filteredReservations.length === 0 && (
              <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-5 py-12 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 shadow-sm">
                  <AdminIcon name="calendar-check" size={28} />
                </div>

                <h3 className="mt-4 text-base font-bold text-slate-950">
                  {filter === "ALL"
                    ? "Aucune réservation pour le moment"
                    : "Aucun résultat dans cette catégorie"}
                </h3>

                <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                  {filter === "ALL"
                    ? "Vos demandes de location apparaîtront ici dès que vous aurez effectué une réservation."
                    : "Essayez un autre filtre pour consulter vos autres réservations."}
                </p>

                {filter !== "ALL" && (
                  <button
                    type="button"
                    onClick={() => setFilter("ALL")}
                    className="mt-5 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                  >
                    Voir toutes les réservations
                    <AdminIcon name="arrow-up-right" size={16} />
                  </button>
                )}
              </div>
            )}

            {/* Cartes existantes */}
            {!isLoading &&
              !error &&
              filteredReservations.length > 0 && (
                <div className="space-y-4">
                  {filteredReservations.map((reservation) => (
                    <ReservationCard
                      key={reservation.id}
                      reservation={reservation}
                    />
                  ))}
                </div>
              )}
          </div>

          {!isLoading && !error && reservations.length > 0 && (
            <div className="flex flex-col justify-between gap-2 border-t border-slate-100 bg-slate-50/70 px-5 py-3.5 sm:flex-row sm:items-center sm:px-6">
              <p className="text-xs text-slate-500">
                Historique de vos réservations personnelles
              </p>
              <p className="text-xs font-medium text-slate-600">
                {counts.cancelled} réservation
                {counts.cancelled !== 1 ? "s" : ""} annulée
                {counts.cancelled !== 1 ? "s" : ""}
              </p>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
