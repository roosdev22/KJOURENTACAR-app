
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CarFront,
  CalendarDays,
  RefreshCw,
  Search,
  UserRound,
} from "lucide-react";

import reservationService from "../../api/services/reservationService";
import type { Reservation } from "../../types/reservation";

const formatDate = (value: string): string => {
  if (!value) return "—";

  const date = new Date(`${value.slice(0, 10)}T12:00:00`);

  return Number.isNaN(date.getTime())
    ? "—"
    : new Intl.DateTimeFormat("fr-FR").format(date);
};

const formatMoney = (value: string): string => {
  const amount = Number(value);

  return Number.isFinite(amount)
    ? `${new Intl.NumberFormat("fr-FR", {
        maximumFractionDigits: 2,
      }).format(amount)} HTG`
    : `${value} HTG`;
};

export default function GestionnaireLocations() {
  const [locations, setLocations] = useState<Reservation[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadLocations = useCallback(async () => {
    setError("");

    try {
      const reservations = await reservationService.getAllReservations();

      setLocations(
        reservations.filter(
          (reservation) => reservation.statut === "EN_COURS",
        ),
      );
    } catch {
      setError("Impossible de charger les locations. Réessaie.");
    }
  }, []);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const reservations = await reservationService.getAllReservations();

        if (active) {
          setLocations(
            reservations.filter(
              (reservation) => reservation.statut === "EN_COURS",
            ),
          );
          setError("");
        }
      } catch {
        if (active) {
          setError("Impossible de charger les locations. Réessaie.");
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, []);

  const filteredLocations = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("fr");

    return locations.filter((reservation) => {
      const vehicles = reservation.lignes
        .map(
          (line) =>
            `${line.vehicule.brand} ${line.vehicule.model}`,
        )
        .join(" ");

      return (
        !query ||
        reservation.numero.toLocaleLowerCase("fr").includes(query) ||
        reservation.client_nom.toLocaleLowerCase("fr").includes(query) ||
        vehicles.toLocaleLowerCase("fr").includes(query)
      );
    });
  }, [locations, search]);

  const refresh = async () => {
    setRefreshing(true);

    try {
      await loadLocations();
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <RefreshCw className="h-6 w-6 animate-spin text-red-600" />
        <span className="ml-3 text-sm text-slate-600">
          Chargement des locations...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Locations en cours</h1>
          <p className="mt-1 text-sm text-slate-500">
            Suivi des véhicules actuellement en location.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void refresh()}
          disabled={refreshing}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw
            className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
          />
          Actualiser
        </button>
      </div>

      {error && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Locations en cours</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {locations.length}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Véhicules loués</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {locations.reduce(
              (total, reservation) => total + reservation.lignes.length,
              0,
            )}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Paiements réussis</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {locations.filter((reservation) => reservation.paiement_reussi).length}
          </p>
        </div>
      </div>

      <div className="relative rounded-xl border border-slate-200 bg-white p-4">
        <Search className="absolute left-7 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Rechercher par référence, client ou véhicule..."
          className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
        />
      </div>

      {filteredLocations.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white px-6 py-14 text-center">
          <CarFront className="mx-auto h-9 w-9 text-slate-300" />
          <p className="mt-3 font-medium text-slate-700">
            Aucune location en cours
          </p>
          <p className="mt-1 text-sm text-slate-500">
            {search
              ? "Aucun résultat ne correspond à ta recherche."
              : "Les réservations actuellement en cours apparaîtront ici."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {filteredLocations.map((reservation) => (
            <article
              key={reservation.id}
              className="rounded-xl border border-slate-200 bg-white p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Réservation
                  </p>
                  <h2 className="mt-1 text-lg font-bold text-slate-900">
                    {reservation.numero}
                  </h2>
                </div>
                <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">
                  En cours
                </span>
              </div>

              <div className="mt-5 space-y-4">
                <div className="flex items-start gap-3">
                  <UserRound className="mt-0.5 h-4 w-4 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-500">Client</p>
                    <p className="font-medium text-slate-800">
                      {reservation.client_nom || "—"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CalendarDays className="mt-0.5 h-4 w-4 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-500">Période prévue</p>
                    <p className="font-medium text-slate-800">
                      {formatDate(reservation.date_debut)} —{" "}
                      {formatDate(reservation.date_fin)}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CarFront className="mt-0.5 h-4 w-4 text-slate-400" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-slate-500">
                      Véhicules ({reservation.lignes.length})
                    </p>
                    <ul className="mt-1 space-y-1">
                      {reservation.lignes.map((line) => (
                        <li
                          key={line.id}
                          className="text-sm font-medium text-slate-800"
                        >
                          {line.vehicule.brand} {line.vehicule.model}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                <span className="text-sm text-slate-500">Montant total</span>
                <span className="font-bold text-slate-900">
                  {formatMoney(reservation.montant_total)}
                </span>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
