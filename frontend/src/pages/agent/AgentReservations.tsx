import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Eye,
  Filter,
  Loader2,
  RefreshCw,
  Search,
  UserRound,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";



import reservationService from "../../api/services/reservationService";
import type {
  Reservation,
  ReservationStatus,
} from "../../types/reservation";

// ============================================================
// KJOURENTACAR — AgentReservations
// Gestion des réservations côté agent
// ============================================================

// type PaymentFilter = "ALL" | "PAID" | "UNPAID";
type PaymentFilter = "ALL" | "WITH_PAYMENT" | "WITHOUT_PAYMENT";
type StatusFilter = "ALL" | ReservationStatus;

const STATUS_LABELS: Record<ReservationStatus, string> = {
  PENDING_VERIFICATION: "À valider",
  CONFIRMED: "Confirmée",
  CANCELLED: "Annulée",
  EN_COURS: "En cours",
  TERMINEE: "Terminée",
  EXPIRED: "Expirée",
};

function getStatusLabel(status: ReservationStatus) {
  return STATUS_LABELS[status] ?? status;
}

function getStatusClasses(status: ReservationStatus) {
  switch (status) {
    case "PENDING_VERIFICATION":
      return "bg-amber-50 text-amber-700 border-amber-200";

    case "EXPIRED":
      return "bg-slate-100 text-slate-600 border-slate-200";  

    case "CONFIRMED":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";

    case "CANCELLED":
      return "bg-red-50 text-red-700 border-red-200";

    case "EN_COURS":
      return "bg-blue-50 text-blue-700 border-blue-200";

    case "TERMINEE":
      return "bg-slate-100 text-slate-700 border-slate-200";

    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

function formatDate(value: string | null) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatAmount(value: string) {
  const amount = Number(value);

  if (Number.isNaN(amount)) {
    return `${value} HTG`;
  }

  return (
    new Intl.NumberFormat("fr-FR", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount) + " HTG"
  );
}

function getClientName(reservation: Reservation) {
  if (reservation.client_nom?.trim()) {
    return reservation.client_nom;
  }

  return "Client non renseigné";
}

function getVehicleCount(reservation: Reservation) {
  return reservation.lignes?.length ?? 0;
}

// ============================================================
// BADGE STATUT
// ============================================================

function StatusBadge({
  status,
}: {
  status: ReservationStatus;
}) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-full border px-2.5 py-1",
        "text-[11px] font-semibold whitespace-nowrap",
        getStatusClasses(status),
      ].join(" ")}
    >
      {getStatusLabel(status)}
    </span>
  );
}

// ============================================================
// BADGE PAIEMENT
// ============================================================

function PaymentBadge({
  paid,
}: {
  paid: boolean;
}) {
  if (paid) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
        <CheckCircle2 size={12} />
        Payée
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
      <CircleDollarSign size={12} />
      Non payée
    </span>
  );
}

// ============================================================
// PAGE
// ============================================================

export default function AgentReservations() {
  const navigate = useNavigate();

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("ALL");
  const [paymentFilter, setPaymentFilter] =
    useState<PaymentFilter>("ALL");

  const [currentPage, setCurrentPage] = useState(1);

  const [confirmingReservationId, setConfirmingReservationId] =
    useState<string | null>(null);

  const [confirmationError, setConfirmationError] =
    useState<string | null>(null);

  const [confirmationNotice, setConfirmationNotice] =
    useState<string | null>(null);

  const [confirmationNoticeType, setConfirmationNoticeType] =
    useState<"success" | "warning">("success");

  const ITEMS_PER_PAGE = 10;

  // ==========================================================
  // CHARGEMENT INITIAL
  // ==========================================================

  useEffect(() => {
    let isMounted = true;

    const loadInitialReservations = async () => {
      try {
        const data =
          await reservationService.getAllReservations();

        if (!isMounted) return;

        setReservations(data);
        setCurrentPage(1);
        setError(null);
      } catch (err) {
        console.error(
          "Erreur lors du chargement des réservations agent :",
          err
        );

        if (!isMounted) return;

        setError(
          "Impossible de charger les réservations. Vérifiez la connexion au serveur."
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadInitialReservations();

    return () => {
      isMounted = false;
    };
  }, []);

  // ==========================================================
  // FILTRAGE
  // ==========================================================

  const filteredReservations = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return reservations.filter((reservation) => {
      const matchesSearch =
        !normalizedSearch ||
        reservation.numero
          ?.toLowerCase()
          .includes(normalizedSearch) ||
        getClientName(reservation)
          .toLowerCase()
          .includes(normalizedSearch) ||
        reservation.lignes?.some((ligne) =>
          `${ligne.vehicule.brand} ${ligne.vehicule.model}`
            .toLowerCase()
            .includes(normalizedSearch)
        );

      const matchesStatus =
        statusFilter === "ALL" ||
        reservation.statut === statusFilter;

      const matchesPayment =
      paymentFilter === "ALL" ||
      (paymentFilter === "WITH_PAYMENT" &&
        reservation.paiement_reussi) ||
      (paymentFilter === "WITHOUT_PAYMENT" &&
        !reservation.paiement_reussi);

      return (
        matchesSearch &&
        matchesStatus &&
        matchesPayment
      );
    });
  }, [
    reservations,
    search,
    statusFilter,
    paymentFilter,
  ]);

  // ==========================================================
  // PAGINATION
  // ==========================================================

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredReservations.length / ITEMS_PER_PAGE
    )
  );

  const safeCurrentPage = Math.min(
    currentPage,
    totalPages
  );

  const paginatedReservations = useMemo(() => {
    const start =
      (safeCurrentPage - 1) * ITEMS_PER_PAGE;

    return filteredReservations.slice(
      start,
      start + ITEMS_PER_PAGE
    );
  }, [
    filteredReservations,
    safeCurrentPage,
  ]);

  // ==========================================================
  // STATISTIQUES
  // ==========================================================

  const statistics = useMemo(() => {
    return {
      total: reservations.length,

      pending: reservations.filter(
        (reservation) =>
          reservation.statut === "PENDING_VERIFICATION"
      ).length,

      paid: reservations.filter(
        (reservation) =>
          reservation.paiement_reussi
      ).length,

      unpaid: reservations.filter(
        (reservation) =>
          !reservation.paiement_reussi
      ).length,
    };
  }, [reservations]);

  // ==========================================================
  // CONFIRMER UNE RÉSERVATION
  // ==========================================================

// ==========================================================
// ACCÉDER AU PAIEMENT DE LA RÉSERVATION
// ==========================================================
  const handlePaymentReservation = (reservationId: string) => {
    navigate(`/agent/paiements?reservation=${reservationId}`);
  };

  

const handleConfirmReservation = async (
  reservationId: string
) => {
  setConfirmationError(null);
  setConfirmationNotice(null);
  setConfirmingReservationId(reservationId);

  try {
    const result =
      await reservationService.confirmReservation(reservationId);

    if (result.contract.generated) {
      setConfirmationNoticeType("success");
      setConfirmationNotice(
        `Réservation confirmée. Contrat ${
          result.contract.reference
            ? result.contract.reference + " "
            : ""
        }généré avec succès.`
      );
    } else {
      setConfirmationNoticeType("warning");
      setConfirmationNotice(
        result.contract.detail ??
          "Réservation confirmée, mais le contrat n'a pas été généré."
      );
    }
  } catch (err: unknown) {
    console.error(
      "Erreur lors de la confirmation de la réservation :",
      err
    );

    setConfirmationError(
      err instanceof Error
        ? err.message
        : "Impossible de confirmer la réservation."
    );

    setConfirmingReservationId(null);
    return;
  }

  try {
    const data = await reservationService.getAllReservations();
    setReservations(data);
  } catch (err: unknown) {
    console.error(
      "Réservation confirmée, mais actualisation impossible :",
      err
    );

    setConfirmationError(
      "Réservation confirmée, mais la liste n'a pas pu être actualisée. Cliquez sur Actualiser."
    );
  } finally {
    setConfirmingReservationId(null);
  }
};


  // ==========================================================
  // REFRESH MANUEL
  // ==========================================================

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      setError(null);
      setConfirmationError(null);
      setConfirmationError(null);
      setConfirmationNotice(null);

      const data =
        await reservationService.getAllReservations();

      setReservations(data);
    } catch (err) {
      console.error(
        "Erreur lors de l'actualisation des réservations agent :",
        err
      );

      setError(
        "Impossible d'actualiser les réservations. Vérifiez la connexion au serveur."
      );
    } finally {
      setIsRefreshing(false);
    }
  };

  // ==========================================================
  // LOADING
  // ==========================================================

  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2
            size={30}
            className="animate-spin text-red-600"
          />

          <p className="text-sm font-medium text-slate-500">
            Chargement des réservations...
          </p>
        </div>
      </div>
    );
  }

  // ==========================================================
  // ERREUR
  // ==========================================================

  if (error) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-slate-50 p-6">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-2xl border border-red-200 bg-white p-8 shadow-sm">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
                <AlertCircle size={24} />
              </div>

              <h2 className="text-lg font-bold text-slate-900">
                Erreur de chargement
              </h2>

              <p className="mt-2 max-w-md text-sm text-slate-500">
                {error}
              </p>

              <button
                type="button"
                onClick={() => void handleRefresh()}
                disabled={isRefreshing}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw
                  size={16}
                  className={
                    isRefreshing
                      ? "animate-spin"
                      : ""
                  }
                />
                Réessayer
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="min-h-[calc(100vh-64px)] bg-slate-50">
      <main className="mx-auto max-w-[1500px] px-4 py-5 sm:px-6 lg:px-8">

        {/* ====================================================
            HEADER
        ==================================================== */}

        <div className="mb-5 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <div className="h-7 w-1 rounded-full bg-red-600" />

              <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-red-600">
                Espace agent
              </span>
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-slate-950">
              Réservations
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Consultez et validez les réservations des clients.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void handleRefresh()}
              disabled={isRefreshing}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                size={16}
                className={
                  isRefreshing
                    ? "animate-spin"
                    : ""
                }
              />

              Actualiser
            </button>

            <button
              type="button"
              onClick={() =>
                navigate("/agent/reservations/create")
              }
              className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700"
            >
              Nouvelle réservation
            </button>
          </div>
        </div>

        {/* ====================================================
            MESSAGE ERREUR CONFIRMATION
        ==================================================== */}

        {confirmationError && (
          <div className="mb-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle
              size={18}
              className="mt-0.5 shrink-0"
            />

            <p>{confirmationError}</p>

            <button
              type="button"
              onClick={() => setConfirmationError(null)}
              className="ml-auto shrink-0 text-red-500 transition hover:text-red-700"
              title="Fermer"
            >
              <XCircle size={17} />
            </button>
          </div>
        )}

        {confirmationNotice && (
  <div
    role="status"
    className={[
      "mb-4 flex items-start gap-3 rounded-xl border px-4 py-3 text-sm",
      confirmationNoticeType === "success"
        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
        : "border-amber-200 bg-amber-50 text-amber-800",
    ].join(" ")}
  >
    {confirmationNoticeType === "success" ? (
      <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
    ) : (
      <AlertCircle size={18} className="mt-0.5 shrink-0" />
    )}

    <p>{confirmationNotice}</p>

    <button
      type="button"
      onClick={() => setConfirmationNotice(null)}
      className="ml-auto shrink-0"
      title="Fermer"
    >
      <XCircle size={17} />
    </button>
  </div>
)}

        {/* ====================================================
            STATISTIQUES
        ==================================================== */}

        <section className="mb-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Total
                </p>

                <p className="mt-2 text-2xl font-bold text-slate-950">
                  {statistics.total}
                </p>
              </div>

              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                <CalendarDays size={18} />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-600">
                  À valider
                </p>

                <p className="mt-2 text-2xl font-bold text-slate-950">
                  {statistics.pending}
                </p>
              </div>

              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <AlertCircle size={18} />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
                    Avec paiement
                  </p>

                <p className="mt-2 text-2xl font-bold text-slate-950">
                  {statistics.paid}
                </p>
              </div>

              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <CheckCircle2 size={18} />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Non payées
                </p>

                <p className="mt-2 text-2xl font-bold text-slate-950">
                  {statistics.unpaid}
                </p>
              </div>

              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                <CircleDollarSign size={18} />
              </div>
            </div>
          </div>
        </section>

        {/* ====================================================
            FILTRES
        ==================================================== */}

        <section className="mb-4 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center">

            {/* Recherche */}

            <div className="relative min-w-0 flex-1">
              <Search
                size={17}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Rechercher par numéro, client ou véhicule..."
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-red-400 focus:bg-white focus:ring-2 focus:ring-red-100"
              />
            </div>

            {/* Statut */}

            <div className="flex items-center gap-2">
              <Filter
                size={16}
                className="hidden text-slate-400 sm:block"
              />

              <select
                value={statusFilter}
                onChange={(event) => {
                  setStatusFilter(
                    event.target.value as StatusFilter
                  );
                  setCurrentPage(1);
                }}
                className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
              >
                <option value="ALL">
                  Tous les statuts
                </option>

                <option value="PENDING_VERIFICATION">
                  À valider
                </option>

                <option value="EXPIRED">
                    Expirées
                </option>

                <option value="CONFIRMED">
                  Confirmées
                </option>

                <option value="EN_COURS">
                  En cours
                </option>

                <option value="TERMINEE">
                  Terminées
                </option>

                <option value="CANCELLED">
                  Annulées
                </option>
              </select>

              {/* Paiement */}

              <select
                value={paymentFilter}
                onChange={(event) => {
                  setPaymentFilter(
                    event.target.value as PaymentFilter
                  );
                  setCurrentPage(1);
                }}
                className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
              >
                <option value="ALL">
                  Tous les paiements
                </option>

                <option value="WITH_PAYMENT">
                   Avec paiement
                </option>

                <option value="WITHOUT_PAYMENT">
                  Non payées
                </option>
              </select>
            </div>
          </div>
        </section>

        {/* ====================================================
            TABLE
        ==================================================== */}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          {/* Barre supérieure */}

          <div className="flex flex-col justify-between gap-2 border-b border-slate-100 px-4 py-3 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Liste des réservations
              </h2>

              <p className="mt-0.5 text-xs text-slate-400">
                {filteredReservations.length} réservation
                {filteredReservations.length !== 1
                  ? "s"
                  : ""}{" "}
                affichée
                {filteredReservations.length !== 1
                  ? "s"
                  : ""}
              </p>
            </div>
          </div>

          {paginatedReservations.length === 0 ? (
            <div className="flex min-h-[300px] flex-col items-center justify-center px-6 text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                <CalendarDays size={22} />
              </div>

              <h3 className="text-sm font-bold text-slate-900">
                Aucune réservation trouvée
              </h3>

              <p className="mt-1 max-w-sm text-xs text-slate-500">
                Aucune réservation ne correspond aux
                critères de recherche sélectionnés.
              </p>

              {(search ||
                statusFilter !== "ALL" ||
                paymentFilter !== "ALL") && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setStatusFilter("ALL");
                    setPaymentFilter("ALL");
                    setCurrentPage(1);
                  }}
                  className="mt-4 inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  <XCircle size={14} />
                  Réinitialiser les filtres
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1050px] text-left">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/80">
                      <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Réservation
                      </th>

                      <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Client
                      </th>

                      <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Véhicules
                      </th>

                      <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Période
                      </th>

                      <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Montant
                      </th>

                      <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Paiement
                      </th>

                      <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Statut
                      </th>

                      <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {paginatedReservations.map(
                      (reservation) => {
                        const isConfirming =
                          confirmingReservationId ===
                          reservation.id;

                        return (
                          <tr
                            key={reservation.id}
                            className="group transition hover:bg-slate-50/70"
                          >
                            {/* Réservation */}

                            <td className="px-4 py-3.5">
                              <div>
                                <p className="text-sm font-bold text-slate-900">
                                  {reservation.numero}
                                </p>

                                <p className="mt-0.5 text-[11px] text-slate-400">
                                  Créée le{" "}
                                  {formatDate(
                                    reservation.created_at
                                  )}
                                </p>
                              </div>
                            </td>

                            {/* Client */}

                            <td className="px-4 py-3.5">
                              <div className="flex items-center gap-2.5">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                                  <UserRound size={15} />
                                </div>

                                <div className="min-w-0">
                                  <p className="max-w-[170px] truncate text-sm font-semibold text-slate-800">
                                    {getClientName(
                                      reservation
                                    )}
                                  </p>

                                  <p className="text-[11px] text-slate-400">
                                    {reservation.source_display ??
                                      reservation.source}
                                  </p>
                                </div>
                              </div>
                            </td>

                            {/* Véhicules */}

                            <td className="px-4 py-3.5">
                              <div>
                                <p className="text-sm font-semibold text-slate-800">
                                  {getVehicleCount(
                                    reservation
                                  )}{" "}
                                  véhicule
                                  {getVehicleCount(
                                    reservation
                                  ) !== 1
                                    ? "s"
                                    : ""}
                                </p>

                                <p className="mt-0.5 max-w-[190px] truncate text-[11px] text-slate-400">
                                  {reservation.lignes
                                    ?.map(
                                      (ligne) =>
                                        `${ligne.vehicule.brand} ${ligne.vehicule.model}`
                                    )
                                    .join(", ") || "—"}
                                </p>
                              </div>
                            </td>

                            {/* Période */}

                            <td className="px-4 py-3.5">
                              <div>
                                <p className="text-xs font-semibold text-slate-800">
                                  {formatDate(
                                    reservation.date_debut
                                  )}
                                </p>

                                <p className="mt-0.5 text-[11px] text-slate-400">
                                  au{" "}
                                  {formatDate(
                                    reservation.date_fin
                                  )}
                                </p>

                                <p className="mt-1 text-[10px] font-medium text-slate-400">
                                  {reservation.nombre_jours}{" "}
                                  jour
                                  {reservation.nombre_jours !==
                                  1
                                    ? "s"
                                    : ""}
                                </p>
                              </div>
                            </td>

                            {/* Montant */}

                            <td className="px-4 py-3.5">
                              <p className="text-sm font-bold text-slate-900">
                                {formatAmount(
                                  reservation.montant_total
                                )}
                              </p>

                              <p className="mt-0.5 text-[10px] text-slate-400">
                                Caution :{" "}
                                {formatAmount(
                                  reservation.caution_totale
                                )}
                              </p>
                            </td>

                            {/* Paiement */}

                            <td className="px-4 py-3.5">
                              <PaymentBadge
                                paid={
                                  reservation.paiement_reussi
                                }
                              />
                            </td>

                            {/* Statut */}

                            <td className="px-4 py-3.5">
                              <StatusBadge
                                status={
                                  reservation.statut
                                }
                              />
                            </td>

                            {/* Action */}

                            <td className="px-4 py-3.5">
                              <div className="flex items-center justify-end gap-2">
                                      {reservation.statut === "PENDING_VERIFICATION" && (
                                        <>
                                          {!reservation.paiement_reussi ? (
                                            <button
                                              type="button"
                                              onClick={() =>
                                              handlePaymentReservation(reservation.id)
                                              }
                                              className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition hover:border-red-300 hover:bg-red-100"
                                              title="Enregistrer un paiement"
                                            >
                                              <CreditCard size={14} />
                                              Paiement
                                            </button>
                                          ) : (
                                            <button
                                              type="button"
                                              onClick={() =>
                                                void handleConfirmReservation(
                                                  reservation.id
                                                )
                                              }
                                              disabled={isConfirming}
                                              className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                                              title="Confirmer la réservation"
                                            >
                                              {isConfirming ? (
                                                <Loader2
                                                  size={14}
                                                  className="animate-spin"
                                                />
                                              ) : (
                                                <CheckCircle2 size={14} />
                                              )}

                                              {isConfirming
                                                ? "Confirmation..."
                                                : "Confirmer"}
                                            </button>
                                          )}
                                        </>
                                      )}

                                <button
                                  type="button"
                                  onClick={() =>
                                    navigate(
                                      `/agent/reservations/${reservation.id}`
                                    )
                                  }
                                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                                  title="Voir le détail"
                                >
                                  <Eye size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      }
                    )}
                  </tbody>
                </table>
              </div>

              {/* ==================================================
                  PAGINATION
              ================================================== */}

              <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-slate-400">
                  Page{" "}
                  <span className="font-semibold text-slate-600">
                    {safeCurrentPage}
                  </span>{" "}
                  sur{" "}
                  <span className="font-semibold text-slate-600">
                    {totalPages}
                  </span>
                </p>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={safeCurrentPage <= 1}
                    onClick={() =>
                      setCurrentPage((page) =>
                        Math.max(1, page - 1)
                      )
                    }
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft size={16} />
                  </button>

                  {Array.from(
                    { length: totalPages },
                    (_, index) => index + 1
                  )
                    .slice(
                      Math.max(
                        0,
                        safeCurrentPage - 3
                      ),
                      Math.min(
                        totalPages,
                        safeCurrentPage + 2
                      )
                    )
                    .map((page) => (
                      <button
                        key={page}
                        type="button"
                        onClick={() =>
                          setCurrentPage(page)
                        }
                        className={[
                          "h-8 min-w-8 rounded-lg px-2 text-xs font-semibold transition",
                          page === safeCurrentPage
                            ? "bg-red-600 text-white"
                            : "border border-slate-200 text-slate-600 hover:bg-slate-50",
                        ].join(" ")}
                      >
                        {page}
                      </button>
                    ))}

                  <button
                    type="button"
                    disabled={
                      safeCurrentPage >= totalPages
                    }
                    onClick={() =>
                      setCurrentPage((page) =>
                        Math.min(
                          totalPages,
                          page + 1
                        )
                      )
                    }
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  );
}