
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CarFront,
  CheckCircle2,
  Clock,
  RefreshCw,
  Search,
  XCircle,
} from "lucide-react";

import reservationService from "../../api/services/reservationService";
import type {
  Reservation,
  ReservationStatus,
} from "../../types/reservation";

const STATUS_LABELS: Record<ReservationStatus, string> = {
  PENDING_VERIFICATION: "En attente de vérification",
  CONFIRMED: "Confirmée",
  CANCELLED: "Annulée",
  EN_COURS: "En cours",
  TERMINEE: "Terminée",
  EXPIRED: "Expirée",
};

const STATUS_STYLES: Record<ReservationStatus, string> = {
  PENDING_VERIFICATION: "bg-amber-50 text-amber-700",
  CONFIRMED: "bg-blue-50 text-blue-700",
  CANCELLED: "bg-red-50 text-red-700",
  EN_COURS: "bg-violet-50 text-violet-700",
  TERMINEE: "bg-emerald-50 text-emerald-700",
  EXPIRED: "bg-slate-100 text-slate-600",
};

const formatDate = (value: string): string => {
  if (!value) return "—";

  const date = new Date(`${value.slice(0, 10)}T12:00:00`);

  return Number.isNaN(date.getTime())
    ? "—"
    : new Intl.DateTimeFormat("fr-FR").format(date);
};

const formatMoney = (value: string): string => {
  const amount = Number(value);

  if (!Number.isFinite(amount)) return `${value} HTG`;

  return `${new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 2,
  }).format(amount)} HTG`;
};

export default function GestionnaireReservations() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("TOUS");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadReservations = useCallback(async () => {
    setError("");

    try {
      const data = await reservationService.getAllReservations();
      setReservations(data);
    } catch {
      setError("Impossible de charger les réservations. Réessaie.");
    }
  }, []);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const data = await reservationService.getAllReservations();

        if (active) {
          setReservations(data);
          setError("");
        }
      } catch {
        if (active) {
          setError("Impossible de charger les réservations. Réessaie.");
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

  const filteredReservations = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("fr");

    return reservations.filter((reservation) => {
      const vehicles = reservation.lignes
        .map(
          (line) =>
            `${line.vehicule.brand} ${line.vehicule.model}`,
        )
        .join(" ");

      const matchesSearch =
        !query ||
        reservation.numero.toLocaleLowerCase("fr").includes(query) ||
        reservation.client_nom.toLocaleLowerCase("fr").includes(query) ||
        vehicles.toLocaleLowerCase("fr").includes(query);

      const matchesStatus =
        statusFilter === "TOUS" ||
        reservation.statut === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [reservations, search, statusFilter]);

  const stats = useMemo(
    () => ({
      total: reservations.length,
      pending: reservations.filter(
        (reservation) =>
          reservation.statut === "PENDING_VERIFICATION",
      ).length,
      active: reservations.filter(
        (reservation) => reservation.statut === "EN_COURS",
      ).length,
      paid: reservations.filter(
        (reservation) => reservation.paiement_reussi,
      ).length,
    }),
    [reservations],
  );

  const refresh = async () => {
    setRefreshing(true);

    try {
      await loadReservations();
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <RefreshCw className="h-6 w-6 animate-spin text-red-600" />
        <span className="ml-3 text-sm text-slate-600">
          Chargement des réservations...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Réservations
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Consultation et suivi des réservations du parc automobile.
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
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total" value={stats.total} icon={<CalendarDays />} />
        <StatCard label="En attente" value={stats.pending} icon={<Clock />} />
        <StatCard label="Locations en cours" value={stats.active} icon={<CarFront />} />
        <StatCard label="Paiements réussis" value={stats.paid} icon={<CheckCircle2 />} />
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Rechercher par numéro, client ou véhicule..."
            className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-red-400"
          aria-label="Filtrer par statut"
        >
          <option value="TOUS">Tous les statuts</option>
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="font-semibold text-slate-900">
            Liste des réservations
          </h2>
          <span className="text-sm text-slate-500">
            {filteredReservations.length} résultat(s)
          </span>
        </div>

        {filteredReservations.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <CalendarDays className="mx-auto h-9 w-9 text-slate-300" />
            <p className="mt-3 font-medium text-slate-700">
              Aucune réservation trouvée
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Modifie les critères de recherche ou le filtre.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">Référence</th>
                  <th className="px-5 py-3 font-semibold">Client</th>
                  <th className="px-5 py-3 font-semibold">Véhicules</th>
                  <th className="px-5 py-3 font-semibold">Période</th>
                  <th className="px-5 py-3 font-semibold">Montant</th>
                  <th className="px-5 py-3 font-semibold">Paiement</th>
                  <th className="px-5 py-3 font-semibold">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredReservations.map((reservation) => (
                  <tr key={reservation.id} className="hover:bg-slate-50">
                    <td className="px-5 py-4 font-semibold text-slate-900">
                      {reservation.numero}
                    </td>
                    <td className="px-5 py-4 text-slate-700">
                      {reservation.client_nom || "—"}
                    </td>
                    <td className="px-5 py-4 text-slate-700">
                      <div className="max-w-64 space-y-1">
                        {reservation.lignes.map((line) => (
                          <div key={line.id}>
                            {line.vehicule.brand} {line.vehicule.model}
                          </div>
                        ))}
                        {reservation.lignes.length === 0 && "Aucun véhicule"}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      <div>{formatDate(reservation.date_debut)}</div>
                      <div className="mt-1 text-xs text-slate-400">
                        au {formatDate(reservation.date_fin)}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 font-medium text-slate-800">
                      {formatMoney(reservation.montant_total)}
                    </td>
                    <td className="px-5 py-4">
                      {reservation.paiement_reussi ? (
                        <span className="inline-flex items-center gap-1.5 text-emerald-700">
                          <CheckCircle2 className="h-4 w-4" />
                          Réussi
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-amber-700">
                          <XCircle className="h-4 w-4" />
                          Non confirmé
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[reservation.statut]}`}
                      >
                        {reservation.statut_display ||
                          STATUS_LABELS[reservation.statut]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600 [&>svg]:h-5 [&>svg]:w-5">
        {icon}
      </div>
      <div>
        <p className="text-sm text-slate-500">{label}</p>
        <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
      </div>
    </div>
  );
}
