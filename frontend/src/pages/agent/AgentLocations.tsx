import {
  CalendarDays,
  CarFront,
  ChevronRight,
  Clock3,
  Loader2,
  RefreshCw,
  Search,
  UserRound,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import reservationService from "../../api/services/reservationService";
import type { Reservation } from "../../types/reservation";

interface AgentLocationsProps {
  navigationContext: "admin" | "agent";
}


// ============================================================
// KJOURENTACAR — AGENT
// LOCATIONS EN COURS
// ============================================================

export default function AgentLocations({
  navigationContext,
}: AgentLocationsProps) {
  const navigate = useNavigate();

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasLoadedSuccessfully, setHasLoadedSuccessfully] =
    useState(false);
  const [error, setError] = useState<string | null>(null);

  // ==========================================================
  // CHARGEMENT
  // ==========================================================
      // ==========================================================
  // CHARGEMENT
  // ==========================================================

  const loadLocations = useCallback(async () => {
    if (isLoading || isRefreshing) {
      return;
    }

    const initialLoad = !hasLoadedSuccessfully;

    try {
      if (initialLoad) {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }

      setError(null);

      const data =
        await reservationService.getAllReservations();

      setReservations(data);
      setHasLoadedSuccessfully(true);
    } catch (err: unknown) {
      console.error(
        "Erreur chargement locations :",
        err
      );

      setError(
        "Impossible de charger les locations en cours."
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [hasLoadedSuccessfully, isLoading, isRefreshing]);

  useEffect(() => {
    let cancelled = false;

    const loadInitialLocations = async () => {
      try {
        const data =
          await reservationService.getAllReservations();

        if (cancelled) {
          return;
        }

        setReservations(data);
        setHasLoadedSuccessfully(true);
        setError(null);
      } catch (err: unknown) {
        if (cancelled) {
          return;
        }

        console.error(
          "Erreur chargement locations :",
          err
        );

        setError(
          "Impossible de charger les locations en cours."
        );
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadInitialLocations();

    return () => {
      cancelled = true;
    };
  }, []);

  // ==========================================================
  // LOCATIONS EN COURS
  // ==========================================================

  const activeLocations = useMemo(() => {
    return reservations.filter(
      (reservation) =>
        reservation.statut === "EN_COURS"
    );
  }, [reservations]);

  // ==========================================================
  // RECHERCHE
  // ==========================================================

  const filteredLocations = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return activeLocations;
    }

    return activeLocations.filter((reservation) => {
      const reservationNumber =
        reservation.numero?.toLowerCase() ?? "";

      const clientName =
        reservation.client_nom?.toLowerCase() ?? "";

      const vehicleNames = reservation.lignes
        .map(
          (ligne) =>
            `${ligne.vehicule.brand} ${ligne.vehicule.model}`
        )
        .join(" ")
        .toLowerCase();

      return (
        reservationNumber.includes(query) ||
        clientName.includes(query) ||
        vehicleNames.includes(query)
      );
    });
  }, [activeLocations, search]);

  // ==========================================================
  // FORMAT DATE
  // ==========================================================

  const formatDate = (value: string) => {
    if (!value) return "—";

    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(value));
  };

  // ==========================================================
  // FORMAT DATE + HEURE
  // ==========================================================

  const formatDateTime = (value: string) => {
    if (!value) return "—";

    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  };

  // ==========================================================
  // OUVRIR LE RETOUR
  // ==========================================================

  const handleReturn = (reservationId: string) => {
    navigate(
      `/agent/locations/returns?reservation=${reservationId}`
    );
  };

  // ==========================================================
  // RENDU
  // ==========================================================

  return (
    <div className="space-y-6">

      {/* ================================================== */}
      {/* HEADER */}
      {/* ================================================== */}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black text-white">
              <CarFront size={20} />
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                Locations
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                Gestion des véhicules actuellement en location
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={loadLocations}
          disabled={isLoading || isRefreshing}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading || isRefreshing ? (
            <Loader2
              size={17}
              className="animate-spin"
            />
          ) : (
            <RefreshCw size={17} />
          )}

          {isRefreshing ? "Actualisation..." : "Actualiser"}
        </button>
      </div>

      {navigationContext === "admin" && (
        <p
          role="status"
          className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600"
        >
          Le détail des réservations et le traitement des retours ne
          disposent pas de routes dédiées dans l’espace Admin.
        </p>
      )}

      {/* ================================================== */}
      {/* STATS */}
      {/* ================================================== */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Locations en cours
              </p>

              <p className="mt-2 text-3xl font-bold text-gray-900">
                {hasLoadedSuccessfully ? activeLocations.length : "—"}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100 text-gray-700">
              <CarFront size={21} />
            </div>
          </div>
        </div>


        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Véhicules loués
              </p>

              <p className="mt-2 text-3xl font-bold text-gray-900">
                {hasLoadedSuccessfully
                  ? activeLocations.reduce(
                      (total, reservation) =>
                        total + reservation.lignes.length,
                      0,
                    )
                  : "—"}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100 text-gray-700">
              <CarFront size={21} />
            </div>
          </div>
        </div>


        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Retours à traiter
              </p>

              <p className="mt-2 text-sm font-semibold text-gray-700">
                Non déterminé
              </p>

              <p className="mt-1 text-xs text-gray-500">
                L’état des retours n’est pas fourni par cette liste.
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100 text-gray-700">
              <Clock3 size={21} />
            </div>
          </div>
        </div>

      </div>


      {/* ================================================== */}
      {/* ERREUR */}
      {/* ================================================== */}

      {error && (
        <div className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-red-700">{error}</p>
            {hasLoadedSuccessfully && (
              <p className="mt-1 text-sm text-red-700">
                Les données affichées proviennent du dernier chargement réussi
                et n’ont pas pu être actualisées.
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={loadLocations}
            disabled={isLoading || isRefreshing}
            className="shrink-0 self-start rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60 sm:self-auto"
          >
            Réessayer
          </button>
        </div>
      )}

      {isRefreshing && (
        <p role="status" className="text-sm text-gray-600">
          Actualisation en cours. Les lignes affichées proviennent du dernier
          chargement réussi.
        </p>
      )}


      {/* ================================================== */}
      {/* RECHERCHE */}
      {/* ================================================== */}

      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="relative max-w-xl">

          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />

          <input
            type="text"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Rechercher une réservation, un client ou un véhicule..."
            className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-400 focus:bg-white focus:ring-2 focus:ring-gray-100"
          />

        </div>
      </div>


      {/* ================================================== */}
      {/* LOADING */}
      {/* ================================================== */}

      {isLoading ? (
        <div className="flex min-h-[280px] items-center justify-center rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center gap-3 text-sm font-medium text-gray-500">
            <Loader2
              size={20}
              className="animate-spin"
            />

            Chargement des locations...
          </div>
        </div>
      ) : !hasLoadedSuccessfully ? null : filteredLocations.length === 0 ? (

        /* ================================================== */
        /* EMPTY STATE */
        /* ================================================== */

        <div className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white px-6 text-center shadow-sm">

          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-500">
            <CarFront size={25} />
          </div>

          <h2 className="mt-4 text-lg font-semibold text-gray-900">
            Aucune location en cours
          </h2>

          <p className="mt-1 max-w-md text-sm text-gray-500">
            {search
              ? "Aucune location ne correspond à votre recherche."
              : "Il n'y a actuellement aucun véhicule en location."}
          </p>

        </div>

      ) : (

        /* ================================================== */
        /* TABLE */
        /* ================================================== */

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

          <div className="overflow-x-auto">

            <table className="w-full min-w-[1000px]">

              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">

                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Réservation
                  </th>

                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Client
                  </th>

                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Véhicules
                  </th>

                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Départ
                  </th>

                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Retour prévu
                  </th>

                  <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Action
                  </th>

                </tr>
              </thead>


              <tbody className="divide-y divide-gray-100">

                {filteredLocations.map((reservation) => (

                  <tr
                    key={reservation.id}
                    className="transition hover:bg-gray-50"
                  >

                    {/* Réservation */}

                    <td className="px-5 py-4">
                      {navigationContext === "agent" ? (
                        <button
                          type="button"
                          onClick={() =>
                            navigate(
                              `/agent/reservations/${reservation.id}`
                            )
                          }
                          className="font-semibold text-gray-900 transition hover:text-red-600"
                        >
                          {reservation.numero}
                        </button>
                      ) : (
                        <span className="font-semibold text-gray-900">
                          {reservation.numero}
                        </span>
                      )}

                      <p className="mt-1 text-xs text-gray-500">
                        {reservation.date_debut
                          ? formatDateTime(
                              reservation.date_debut
                            )
                          : "—"}
                      </p>

                    </td>


                    {/* Client */}

                    <td className="px-5 py-4">

                      <div className="flex items-center gap-3">

                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
                          <UserRound size={17} />
                        </div>

                        <div className="min-w-0">

                          <p className="truncate text-sm font-semibold text-gray-900">
                            {reservation.client_nom ||
                              "Client inconnu"}
                          </p>

                          <p className="text-xs text-gray-500">
                            Client
                          </p>

                        </div>

                      </div>

                    </td>


                    {/* Véhicules */}

                    <td className="px-5 py-4">

                      <div className="space-y-1">

                        {reservation.lignes.map((ligne) => (

                          <div
                            key={ligne.id}
                            className="flex items-center gap-2 text-sm text-gray-700"
                          >
                            <CarFront
                              size={15}
                              className="shrink-0 text-gray-400"
                            />

                            <span>
                              {ligne.vehicule.brand}{" "}
                              {ligne.vehicule.model}
                            </span>
                          </div>

                        ))}

                      </div>

                    </td>


                    {/* Départ */}

                    <td className="px-5 py-4">

                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <CalendarDays
                          size={16}
                          className="text-gray-400"
                        />

                        {formatDate(
                          reservation.date_debut
                        )}
                      </div>

                    </td>


                    {/* Retour */}

                    <td className="px-5 py-4">

                      <div className="flex items-center gap-2">

                        <CalendarDays
                          size={16}
                          className="text-gray-400"
                        />

                        <div>
                          <p className="text-sm font-medium text-gray-700">
                            {formatDate(
                              reservation.date_fin
                            )}
                          </p>

                          <p className="text-xs text-gray-500">
                            {formatDateTime(
                              reservation.date_fin
                            )}
                          </p>
                        </div>

                      </div>

                    </td>


                    {/* Action */}

                    <td className="px-5 py-4">
                      {navigationContext === "agent" ? (
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() =>
                              handleReturn(reservation.id)
                            }
                            className="inline-flex items-center gap-2 rounded-xl bg-black px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800"
                          >
                            Gérer le retour
                            <ChevronRight size={16} />
                          </button>
                        </div>
                      ) : (
                        <span
                          aria-label="Aucune action de retour disponible dans l’espace Admin"
                          className="block text-right text-sm text-gray-500"
                        >
                          —
                        </span>
                      )}

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        </div>
      )}

    </div>
  );
}