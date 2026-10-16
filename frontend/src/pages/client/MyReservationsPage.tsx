import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Loader2,
  RefreshCw,
  XCircle,
} from "lucide-react";

import reservationService from "../../api/services/reservationService";
import ReservationCard from "../../components/reservation/ReservationCard";

import type {
  Reservation,
  ReservationStatus,
} from "../../types/reservation";

type ReservationFilter = "ALL" | ReservationStatus;

export default function MyReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [filter, setFilter] =
    useState<ReservationFilter>("ALL");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ============================================================
  // CHARGEMENT INITIAL
  // ============================================================

  useEffect(() => {
    let cancelled = false;

    async function fetchReservations(): Promise<void> {
      try {
        const data =
          await reservationService.getMyReservations();

        if (cancelled) {
          return;
        }

        setReservations(data);
        setError(null);
      } catch (err: unknown) {
        if (cancelled) {
          return;
        }

        console.error(
          "[MyReservationsPage] Erreur lors du chargement :",
          err
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

  // ============================================================
  // ACTUALISATION MANUELLE
  // ============================================================

  async function loadReservations(): Promise<void> {
    if (isLoading) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data =
        await reservationService.getMyReservations();

      setReservations(data);
    } catch (err: unknown) {
      console.error(
        "[MyReservationsPage] Erreur lors de l'actualisation :",
        err
      );

      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }

  // ============================================================
  // FILTRAGE
  // ============================================================

  const filteredReservations = useMemo(() => {
    if (filter === "ALL") {
      return reservations;
    }

    return reservations.filter(
      (reservation) => reservation.statut === filter
    );
  }, [reservations, filter]);

  // ============================================================
  // COMPTEURS
  // ============================================================

  const counts = useMemo(() => {
    let pending = 0;
    let confirmed = 0;
    let active = 0;
    let completed = 0;
    let cancelled = 0;

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
      }
    }

    return {
      all: reservations.length,
      pending,
      confirmed,
      active,
      completed,
      cancelled,
    };
  }, [reservations]);

  // ============================================================
  // FILTRES
  // ============================================================

  const filters: Array<{
    value: ReservationFilter;
    label: string;
    count: number;
  }> = [
    {
      value: "ALL",
      label: "Toutes",
      count: counts.all,
    },
    {
      value: "PENDING_VERIFICATION",
      label: "En attente",
      count: counts.pending,
    },
    {
      value: "CONFIRMED",
      label: "Confirmées",
      count: counts.confirmed,
    },
    {
      value: "EN_COURS",
      label: "En cours",
      count: counts.active,
    },
    {
      value: "TERMINEE",
      label: "Terminées",
      count: counts.completed,
    },
    {
      value: "CANCELLED",
      label: "Annulées",
      count: counts.cancelled,
    },
  ];

  // ============================================================
  // RENDU
  // ============================================================

  return (
    <main className="min-h-screen bg-[#F7F7F7] text-[#111111]">
      {/* =====================================================
          HEADER
      ===================================================== */}

      <section className="border-b border-[#E5E5E5] bg-white">
        <div className="mx-auto max-w-7xl px-6 py-10 sm:px-8 lg:px-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#CC0000]">
                Espace client
              </p>

              <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
                Mes réservations
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#666666]">
                Retrouvez ici toutes vos demandes de
                réservation et suivez leur évolution.
              </p>
            </div>

            <button
              type="button"
              onClick={() => void loadReservations()}
              disabled={isLoading}
              aria-label="Actualiser les réservations"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#DCDCDC] bg-white px-4 py-3 text-sm font-bold text-[#333333] transition hover:border-[#BBBBBB] hover:bg-[#F7F7F7] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                size={17}
                className={
                  isLoading ? "animate-spin" : undefined
                }
                aria-hidden="true"
              />

              Actualiser
            </button>
          </div>
        </div>
      </section>

      {/* =====================================================
          CONTENU
      ===================================================== */}

      <section className="mx-auto max-w-7xl px-6 py-8 sm:px-8 lg:px-10">
        {/* ===================================================
            FILTRES
        =================================================== */}

        <div className="mb-8 overflow-x-auto">
          <div className="flex min-w-max gap-2 rounded-2xl border border-[#E3E3E3] bg-white p-2">
            {filters.map((item) => {
              const isActive = filter === item.value;

              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setFilter(item.value)}
                  aria-pressed={isActive}
                  className={[
                    "inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition",
                    isActive
                      ? "bg-[#111111] text-white"
                      : "text-[#666666] hover:bg-[#F3F3F3] hover:text-[#111111]",
                  ].join(" ")}
                >
                  {item.label}

                  <span
                    className={[
                      "rounded-full px-2 py-0.5 text-[10px] font-black",
                      isActive
                        ? "bg-white/15 text-white"
                        : "bg-[#F1F1F1] text-[#666666]",
                    ].join(" ")}
                  >
                    {item.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ===================================================
            CHARGEMENT
        =================================================== */}

        {isLoading && (
          <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-[#E3E3E3] bg-white">
            <div className="flex flex-col items-center gap-3 text-center">
              <Loader2
                size={30}
                className="animate-spin text-[#CC0000]"
                aria-hidden="true"
              />

              <p className="text-sm font-bold text-[#666666]">
                Chargement de vos réservations...
              </p>
            </div>
          </div>
        )}

        {/* ===================================================
            ERREUR
        =================================================== */}

        {!isLoading && error && (
          <div
            role="alert"
            className="rounded-2xl border border-[#F1C7C7] bg-white p-8 text-center"
          >
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#FDECEC]">
              <XCircle
                size={26}
                className="text-[#B42318]"
                aria-hidden="true"
              />
            </div>

            <h2 className="mt-4 text-lg font-black">
              Impossible de charger vos réservations
            </h2>

            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-[#666666]">
              {error}
            </p>

            <button
              type="button"
              onClick={() => void loadReservations()}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#CC0000] px-5 py-3 text-sm font-black text-white transition hover:bg-[#A80000] focus:outline-none focus:ring-2 focus:ring-[#CC0000] focus:ring-offset-2"
            >
              <RefreshCw
                size={17}
                aria-hidden="true"
              />

              Réessayer
            </button>
          </div>
        )}

        {/* ===================================================
            ÉTAT VIDE
        =================================================== */}

        {!isLoading &&
          !error &&
          filteredReservations.length === 0 && (
            <div className="rounded-2xl border border-[#E3E3E3] bg-white px-6 py-16 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#F3F3F3]">
                <CalendarDays
                  size={30}
                  className="text-[#777777]"
                  aria-hidden="true"
                />
              </div>

              <h2 className="mt-5 text-xl font-black">
                {filter === "ALL"
                  ? "Aucune réservation"
                  : "Aucune réservation dans cette catégorie"}
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#666666]">
                {filter === "ALL"
                  ? "Vous n'avez encore effectué aucune réservation."
                  : "Aucune réservation ne correspond au filtre sélectionné."}
              </p>
            </div>
          )}

        {/* ===================================================
            LISTE DES RÉSERVATIONS
        =================================================== */}

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
      </section>
    </main>
  );
}

// ============================================================
// GESTION DES ERREURS API
// ============================================================

function getErrorMessage(error: unknown): string {
  if (!error || typeof error !== "object") {
    return "Impossible de charger vos réservations.";
  }

  const candidate = error as {
    response?: {
      data?: unknown;
    };
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

  if (
    typeof candidate.message === "string" &&
    candidate.message.trim()
  ) {
    return candidate.message.trim();
  }

  return "Impossible de charger vos réservations.";
}