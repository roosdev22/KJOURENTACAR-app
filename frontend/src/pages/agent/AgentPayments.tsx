import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Banknote,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  CreditCard,
  Loader2,
  RefreshCw,
  Search,
  WalletCards,
  XCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import { reservationService } from "../../api/services/reservationService";
import paymentService, {
  type Payment,
  type PaymentCurrency,
  type PaymentMethod,
  type PaymentSummary,
} from "../../api/services/paymentService";
import type { Reservation } from "../../types/reservation";

type PaymentForm = {
  montant: string;
  methode: PaymentMethod;
  devise: PaymentCurrency;
  reference: string;
  notes: string;
};

const PAGE_SIZE = 8;

const INITIAL_FORM: PaymentForm = {
  montant: "",
  methode: "CASH",
  devise: "HTG",
  reference: "",
  notes: "",
};

const METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH: "Espèces",
  MONCASH: "MonCash",
  NATCASH: "NatCash",
};

const STATUS_LABELS: Record<Payment["statut"], string> = {
  PENDING: "En attente",
  SUCCEEDED: "Réussi",
  FAILED: "Échoué",
  CANCELLED: "Annulé",
  REFUNDED: "Remboursé",
};

const RESERVATION_STATUS_LABELS: Record<string, string> = {
  PENDING_VERIFICATION: "En attente de validation",
  CONFIRMED: "Confirmée",
  CANCELLED: "Annulée",
  EN_COURS: "En cours",
  TERMINEE: "Terminée",
};

function formatDate(value: string | null | undefined): string {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function formatShortDate(value: string | null | undefined): string {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "short",
  }).format(date);
}

function formatAmount(
  value: string | number | null | undefined,
  currency: PaymentCurrency,
): string {
  if (value === null || value === undefined || value === "") {
    return `— ${currency}`;
  }

  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return `${value} ${currency}`;
  }

  return `${new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)} ${currency}`;
}

function formatExchangeRate(
  value: string | number | null | undefined,
): string {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  const rate = Number(value);

  if (!Number.isFinite(rate)) {
    return "—";
  }

  return `1 USD = ${new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(rate)} HTG`;
}

function getClientName(reservation: Reservation): string {
  if (reservation.client_nom) {
    return reservation.client_nom;
  }

  return "Client non renseigné";
}

function getReservationTotal(reservation: Reservation): string {
  return reservation.montant_total ?? "—";
}

function getVehicleName(reservation: Reservation): string {
  const vehicle = reservation.lignes?.[0]?.vehicule;

  if (!vehicle) {
    return "Véhicule non renseigné";
  }

  const brand = vehicle.brand?.trim() ?? "";
  const model = vehicle.model?.trim() ?? "";

  const name = `${brand} ${model}`.trim();

  return name || "Véhicule non renseigné";
}

function getVehicleCount(reservation: Reservation): number {
  return reservation.lignes?.length ?? 0;
}

function areVehiclesAvailable(reservation: Reservation): boolean {
  const lines = reservation.lignes ?? [];

  if (lines.length === 0) {
    return false;
  }

  return lines.every(
    (line) => line.vehicule?.status === "AVAILABLE",
  );
}

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data: unknown = error.response?.data;

    if (typeof data === "string" && data.trim()) {
      return data;
    }

    if (typeof data === "object" && data !== null) {
      const record = data as Record<string, unknown>;

      if (typeof record.detail === "string") {
        return record.detail;
      }

      for (const value of Object.values(record)) {
        if (typeof value === "string" && value.trim()) {
          return value;
        }

        if (Array.isArray(value) && value.length > 0) {
          const first = value[0];

          if (typeof first === "string" && first.trim()) {
            return first;
          }
        }
      }
    }

    if (error.message) {
      return error.message;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Une erreur inattendue est survenue.";
}

function PaymentStatusBadge({ status }: { status: Payment["statut"] }) {
  const config: Record<
    Payment["statut"],
    {
      className: string;
      icon: typeof CheckCircle2;
    }
  > = {
    PENDING: {
      className: "bg-amber-50 text-amber-700 ring-amber-200",
      icon: Loader2,
    },
    SUCCEEDED: {
      className: "bg-emerald-50 text-emerald-700 ring-emerald-200",
      icon: CheckCircle2,
    },
    FAILED: {
      className: "bg-red-50 text-red-700 ring-red-200",
      icon: XCircle,
    },
    CANCELLED: {
      className: "bg-slate-100 text-slate-600 ring-slate-200",
      icon: XCircle,
    },
    REFUNDED: {
      className: "bg-purple-50 text-purple-700 ring-purple-200",
      icon: RefreshCw,
    },
  };

  const current = config[status];
  const Icon = current.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${current.className}`}
    >
      <Icon
        className={`h-3.5 w-3.5 ${
          status === "PENDING" ? "animate-spin" : ""
        }`}
      />
      {STATUS_LABELS[status]}
    </span>
  );
}

function ReservationStatusBadge({
  status,
}: {
  status: Reservation["statut"];
}) {
  const isPending = status === "PENDING_VERIFICATION";
  const isConfirmed = status === "CONFIRMED";
  const isCancelled = status === "CANCELLED";
  const isActive = status === "EN_COURS";
  const isFinished = status === "TERMINEE";

  let className =
    "bg-slate-100 text-slate-600 ring-slate-200";

  if (isPending) {
    className = "bg-amber-50 text-amber-700 ring-amber-200";
  } else if (isConfirmed) {
    className = "bg-emerald-50 text-emerald-700 ring-emerald-200";
  } else if (isCancelled) {
    className = "bg-red-50 text-red-700 ring-red-200";
  } else if (isActive) {
    className = "bg-blue-50 text-blue-700 ring-blue-200";
  } else if (isFinished) {
    className = "bg-slate-100 text-slate-600 ring-slate-200";
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${className}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status in RESERVATION_STATUS_LABELS
        ? RESERVATION_STATUS_LABELS[status]
        : status}
    </span>
  );
}

function SummaryCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof CircleDollarSign;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {label}
          </p>

          <p className="mt-2 text-xl font-bold text-slate-900">
            {value}
          </p>
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 text-red-600">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function ConfirmationCondition({
  checked,
  label,
  detail,
}: {
  checked: boolean;
  label: string;
  detail?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div
        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
          checked
            ? "bg-emerald-100 text-emerald-700"
            : "bg-red-100 text-red-700"
        }`}
      >
        {checked ? (
          <CheckCircle2 className="h-4 w-4" />
        ) : (
          <XCircle className="h-4 w-4" />
        )}
      </div>

      <div className="min-w-0">
        <p
          className={`text-sm font-semibold ${
            checked ? "text-slate-800" : "text-red-700"
          }`}
        >
          {label}
        </p>

        {detail && (
          <p className="mt-0.5 text-xs text-slate-500">
            {detail}
          </p>
        )}
      </div>
    </div>
  );
}

export default function AgentPayments() {
  const navigate = useNavigate();

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [selectedReservationId, setSelectedReservationId] = useState<
    string | null
  >(null);

  const [summary, setSummary] = useState<PaymentSummary | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);

  const [reservationSearch, setReservationSearch] = useState("");
  const [paymentSearch, setPaymentSearch] = useState("");

  const [page, setPage] = useState(1);

  const [form, setForm] = useState<PaymentForm>(INITIAL_FORM);

  const [loadingReservations, setLoadingReservations] =
    useState(true);
  const [loadingPaymentData, setLoadingPaymentData] =
    useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadReservations = async () => {
      setLoadingReservations(true);
      setError(null);

      try {
        const data = await reservationService.getAllReservations();

        if (!isMounted) {
          return;
        }

        setReservations(data);

        if (data.length > 0) {
          setSelectedReservationId(
            (current) => current ?? data[0].id,
          );
        }
      } catch (err: unknown) {
        if (!isMounted) {
          return;
        }

        setError(getErrorMessage(err));
      } finally {
        if (isMounted) {
          setLoadingReservations(false);
        }
      }
    };

    void loadReservations();

    return () => {
      isMounted = false;
    };
  }, []);

  const selectedReservation = useMemo(
    () =>
      reservations.find(
        (reservation) => reservation.id === selectedReservationId,
      ) ?? null,
    [reservations, selectedReservationId],
  );

  const filteredReservations = useMemo(() => {
    const query = reservationSearch.trim().toLowerCase();

    if (!query) {
      return reservations;
    }

    return reservations.filter((reservation) => {
      const numero = reservation.numero?.toLowerCase() ?? "";
      const client = getClientName(reservation).toLowerCase();

      return (
        numero.includes(query) ||
        client.includes(query)
      );
    });
  }, [reservations, reservationSearch]);

  const filteredPayments = useMemo(() => {
    const query = paymentSearch.trim().toLowerCase();

    if (!query) {
      return payments;
    }

    return payments.filter((payment) => {
      const reference =
        payment.reference?.toLowerCase() ?? "";

      const method =
        METHOD_LABELS[payment.methode].toLowerCase();

      const status =
        STATUS_LABELS[payment.statut].toLowerCase();

      return (
        reference.includes(query) ||
        method.includes(query) ||
        status.includes(query)
      );
    });
  }, [payments, paymentSearch]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredPayments.length / PAGE_SIZE),
  );

  const safePage = Math.min(page, totalPages);

  const paginatedPayments = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;

    return filteredPayments.slice(
      start,
      start + PAGE_SIZE,
    );
  }, [filteredPayments, safePage]);

  const paymentReceived = useMemo(() => {
    if (summary) {
      return Number(summary.montant_paye) > 0;
    }

    return payments.some(
      (payment) => payment.statut === "SUCCEEDED",
    );
  }, [summary, payments]);

  const paymentProgress = useMemo(() => {
    if (!summary) {
      return 0;
    }

    const total = Number(summary.montant_total);
    const paid = Number(summary.montant_paye);

    if (!Number.isFinite(total) || total <= 0) {
      return 0;
    }

    if (!Number.isFinite(paid) || paid <= 0) {
      return 0;
    }

    return Math.min(100, Math.max(0, (paid / total) * 100));
  }, [summary]);

  const vehiclesAvailable = useMemo(() => {
    if (!selectedReservation) {
      return false;
    }

    return areVehiclesAvailable(selectedReservation);
  }, [selectedReservation]);

  const canAttemptConfirmation =
    selectedReservation?.statut === "PENDING_VERIFICATION" &&
    paymentReceived &&
    !confirming;

  const loadPaymentData = async (
    reservationId: string,
  ): Promise<void> => {
    const [summaryData, paymentData] = await Promise.all([
      paymentService.getPaymentSummary(reservationId),
      paymentService.getReservationPayments(reservationId),
    ]);

    setSummary(summaryData);
    setPayments(paymentData);
  };

  useEffect(() => {
    if (!selectedReservationId) {
      return;
    }

    let isMounted = true;

    const loadSelectedPaymentData = async () => {
      setLoadingPaymentData(true);
      setError(null);
      setSuccess(null);

      try {
        const reservationId = String(
          selectedReservationId,
        );

        const [summaryData, paymentData] =
          await Promise.all([
            paymentService.getPaymentSummary(reservationId),
            paymentService.getReservationPayments(
              reservationId,
            ),
          ]);

        if (!isMounted) {
          return;
        }

        setSummary(summaryData);
        setPayments(paymentData);
        setPage(1);
      } catch (err: unknown) {
        if (!isMounted) {
          return;
        }

        setSummary(null);
        setPayments([]);
        setError(getErrorMessage(err));
      } finally {
        if (isMounted) {
          setLoadingPaymentData(false);
        }
      }
    };

    void loadSelectedPaymentData();

    return () => {
      isMounted = false;
    };
  }, [selectedReservationId]);

  const refreshPaymentData = async () => {
    if (!selectedReservationId) {
      return;
    }

    setRefreshing(true);
    setError(null);

    try {
      const reservationId = String(
        selectedReservationId,
      );

      await loadPaymentData(reservationId);

      const reservationData =
        await reservationService.getAllReservations();

      setReservations(reservationData);
      setPage(1);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setRefreshing(false);
    }
  };

  const handleMethodChange = (
    methode: PaymentMethod,
  ) => {
    setForm((current) => ({
      ...current,
      methode,
      devise:
        methode === "CASH"
          ? current.devise
          : "HTG",
    }));
  };

  const handleCurrencyChange = (
    devise: PaymentCurrency,
  ) => {
    setForm((current) => ({
      ...current,
      devise,
    }));
  };

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!selectedReservationId) {
      setError(
        "Veuillez sélectionner une réservation.",
      );
      return;
    }

    if (!form.montant.trim()) {
      setError(
        "Veuillez saisir le montant du paiement.",
      );
      return;
    }

    const amount = Number(form.montant);

    if (!Number.isFinite(amount) || amount <= 0) {
      setError(
        "Le montant doit être supérieur à zéro.",
      );
      return;
    }

    if (
      form.methode !== "CASH" &&
      form.devise !== "HTG"
    ) {
      setError(
        "MonCash et NatCash doivent être enregistrés en HTG.",
      );
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      /*
       * Le frontend ne décide pas du statut du paiement.
       *
       * Pour CASH, le backend doit router cette création
       * vers PaymentService.register_cash_payment(), afin
       * que le paiement soit immédiatement SUCCEEDED.
       *
       * Pour MONCASH/NATCASH, le backend crée un paiement
       * PENDING qui sera confirmé après vérification du
       * fournisseur.
       */
      await paymentService.createPayment({
        reservation: selectedReservationId,
        montant: form.montant,
        methode: form.methode,
        devise: form.devise,
        reference:
          form.reference.trim() || undefined,
        notes:
          form.notes.trim() || undefined,
      });

      setForm((current) => ({
        ...current,
        montant: "",
        reference: "",
        notes: "",
      }));

      setSuccess(
        form.methode === "CASH"
          ? "Le paiement en espèces a été enregistré."
          : "Le paiement a été enregistré et reste en attente de vérification.",
      );

      await refreshPaymentData();
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmReservation = async () => {
    if (!selectedReservationId) {
      setError(
        "Veuillez sélectionner une réservation.",
      );
      return;
    }

    if (!selectedReservation) {
      setError(
        "La réservation sélectionnée est introuvable.",
      );
      return;
    }

    if (
      selectedReservation.statut !==
      "PENDING_VERIFICATION"
    ) {
      setError(
        "Cette réservation ne peut plus être confirmée depuis cet état.",
      );
      return;
    }

    if (!paymentReceived) {
      setError(
        "La réservation nécessite au moins un paiement réussi avant confirmation.",
      );
      return;
    }

    setConfirming(true);
    setError(null);
    setSuccess(null);

    try {
      /*
       * Le backend reste la source de vérité.
       *
       * Il revérifie notamment :
       * - le statut PENDING_VERIFICATION ;
       * - l'existence d'au moins un paiement SUCCEEDED ;
       * - l'éligibilité du client ;
       * - la disponibilité des véhicules.
       */
      const confirmedReservation =
        await reservationService.confirmReservation(
          selectedReservationId,
        );

      setReservations((current) =>
        current.map((reservation) =>
          reservation.id ===
          confirmedReservation.id
            ? confirmedReservation
            : reservation,
        ),
      );

      setSuccess(
        `La réservation ${confirmedReservation.numero} a été confirmée avec succès.`,
      );

      await loadPaymentData(
        selectedReservationId,
      );
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setConfirming(false);
    }
  };

  const handleSelectReservation = (
    reservationId: string,
  ) => {
    setSelectedReservationId(reservationId);
    setSuccess(null);
    setError(null);
    setPaymentSearch("");
    setPage(1);
    setSummary(null);
    setPayments([]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-600 text-white shadow-sm">
              <CreditCard className="h-5 w-5" />
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Paiements
              </h1>

              <p className="text-sm text-slate-500">
                Enregistrer et consulter les paiements
                des réservations
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void refreshPaymentData()}
          disabled={
            !selectedReservationId || refreshing
          }
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw
            className={`h-4 w-4 ${
              refreshing ? "animate-spin" : ""
            }`}
          />
          Actualiser
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

          <div className="flex-1">{error}</div>

          <button
            type="button"
            onClick={() => setError(null)}
            className="text-red-600 transition hover:text-red-800"
            aria-label="Fermer"
          >
            <XCircle className="h-5 w-5" />
          </button>
        </div>
      )}

      {success && (
        <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />

          <div className="flex-1">{success}</div>

          <button
            type="button"
            onClick={() => setSuccess(null)}
            className="text-emerald-600 transition hover:text-emerald-800"
            aria-label="Fermer"
          >
            <XCircle className="h-5 w-5" />
          </button>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        {/* Reservations */}
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold text-slate-900">
                  Réservations
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Sélectionnez une réservation
                </p>
              </div>

              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                {reservations.length}
              </span>
            </div>

            <div className="relative mt-4">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                type="text"
                value={reservationSearch}
                onChange={(event) =>
                  setReservationSearch(
                    event.target.value,
                  )
                }
                placeholder="N° réservation ou client..."
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-red-400 focus:bg-white focus:ring-2 focus:ring-red-100"
              />
            </div>
          </div>

          <div className="max-h-[620px] overflow-y-auto p-3">
            {loadingReservations ? (
              <div className="flex items-center justify-center py-12 text-slate-500">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Chargement...
              </div>
            ) : filteredReservations.length === 0 ? (
              <div className="px-4 py-12 text-center">
                <CreditCard className="mx-auto h-8 w-8 text-slate-300" />

                <p className="mt-3 text-sm font-medium text-slate-600">
                  Aucune réservation
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredReservations.map(
                  (reservation) => {
                    const selected =
                      reservation.id ===
                      selectedReservationId;

                    return (
                      <button
                        key={reservation.id}
                        type="button"
                        onClick={() =>
                          handleSelectReservation(
                            reservation.id,
                          )
                        }
                        className={`w-full rounded-xl border p-4 text-left transition ${
                          selected
                            ? "border-red-300 bg-red-50 shadow-sm"
                            : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p
                              className={`truncate text-sm font-bold ${
                                selected
                                  ? "text-red-700"
                                  : "text-slate-900"
                              }`}
                            >
                              {reservation.numero}
                            </p>

                            <p className="mt-1 truncate text-sm text-slate-600">
                              {getClientName(
                                reservation,
                              )}
                            </p>
                          </div>

                          {reservation.paiement_reussi && (
                            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                          )}
                        </div>

                        <div className="mt-3 flex items-center justify-between gap-3">
                          <span className="text-xs text-slate-500">
                            {reservation.statut_display ??
                              RESERVATION_STATUS_LABELS[
                                reservation.statut
                              ] ??
                              reservation.statut}
                          </span>

                          <span className="text-xs font-semibold text-slate-800">
                            {getReservationTotal(
                              reservation,
                            ) !== "—"
                              ? formatAmount(
                                  getReservationTotal(
                                    reservation,
                                  ),
                                  "HTG",
                                )
                              : "—"}
                          </span>
                        </div>
                      </button>
                    );
                  },
                )}
              </div>
            )}
          </div>
        </section>

        {/* Payment workspace */}
        <div className="min-w-0 space-y-6">
          {!selectedReservation ? (
            <section className="flex min-h-[420px] items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white">
              <div className="px-6 text-center">
                <WalletCards className="mx-auto h-12 w-12 text-slate-300" />

                <h2 className="mt-4 text-lg font-semibold text-slate-800">
                  Sélectionnez une réservation
                </h2>

                <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                  Choisissez une réservation dans la
                  liste pour consulter son résumé financier
                  et enregistrer un paiement.
                </p>
              </div>
            </section>
          ) : (
            <>
              {/* Selected reservation */}
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-md bg-red-50 px-2.5 py-1 text-sm font-bold text-red-700">
                          {selectedReservation.numero}
                        </span>

                        <ReservationStatusBadge
                          status={
                            selectedReservation.statut
                          }
                        />
                      </div>

                      <p className="mt-2 text-sm text-slate-500">
                        ID :{" "}
                        <span className="font-mono text-xs">
                          {selectedReservation.id}
                        </span>
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        navigate(
                          `/agent/reservations/${selectedReservation.id}`,
                        )
                      }
                      className="inline-flex shrink-0 items-center justify-center rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      Voir la réservation
                    </button>
                  </div>

                  <div className="grid gap-4 border-t border-slate-100 pt-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                        Client
                      </p>

                      <p className="mt-1 text-sm font-semibold text-slate-800">
                        {getClientName(
                          selectedReservation,
                        )}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                        Véhicule
                      </p>

                      <p className="mt-1 text-sm font-semibold text-slate-800">
                        {getVehicleName(
                          selectedReservation,
                        )}
                      </p>

                      {getVehicleCount(
                        selectedReservation,
                      ) > 1 && (
                        <p className="mt-0.5 text-xs text-slate-500">
                          {
                            getVehicleCount(
                              selectedReservation,
                            )
                          }{" "}
                          véhicules
                        </p>
                      )}
                    </div>

                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                        Location
                      </p>

                      <p className="mt-1 text-sm font-semibold text-slate-800">
                        {formatShortDate(
                          selectedReservation.date_debut,
                        )}{" "}
                        →{" "}
                        {formatShortDate(
                          selectedReservation.date_fin,
                        )}
                      </p>

                      <p className="mt-0.5 text-xs text-slate-500">
                        {selectedReservation.nombre_jours}{" "}
                        jour
                        {selectedReservation.nombre_jours >
                        1
                          ? "s"
                          : ""}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                        Créée le
                      </p>

                      <p className="mt-1 text-sm font-semibold text-slate-800">
                        {formatDate(
                          selectedReservation.created_at,
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Summary */}
              {loadingPaymentData ? (
                <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white py-10 shadow-sm">
                  <Loader2 className="mr-2 h-5 w-5 animate-spin text-red-600" />

                  <span className="text-sm text-slate-500">
                    Chargement des données financières...
                  </span>
                </div>
              ) : summary ? (
                <>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <SummaryCard
                      label="Montant total"
                      value={formatAmount(
                        summary.montant_total,
                        "HTG",
                      )}
                      icon={CircleDollarSign}
                    />

                    <SummaryCard
                      label="Montant payé"
                      value={formatAmount(
                        summary.montant_paye,
                        "HTG",
                      )}
                      icon={CheckCircle2}
                    />

                    <SummaryCard
                      label="Montant restant"
                      value={formatAmount(
                        summary.montant_restant,
                        "HTG",
                      )}
                      icon={WalletCards}
                    />

                    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                            État
                          </p>

                          <p className="mt-2 text-base font-bold text-slate-900">
                            {summary.est_entierement_paye
                              ? "Entièrement payé"
                              : "Paiement restant"}
                          </p>
                        </div>

                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                            summary.est_entierement_paye
                              ? "bg-emerald-50 text-emerald-600"
                              : "bg-amber-50 text-amber-600"
                          }`}
                        >
                          {summary.est_entierement_paye ? (
                            <CheckCircle2 className="h-5 w-5" />
                          ) : (
                            <WalletCards className="h-5 w-5" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Financial progress */}
                  <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">
                          Situation financière
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          Progression calculée à partir du
                          résumé financier fourni par le
                          backend.
                        </p>
                      </div>

                      <span className="text-sm font-bold text-slate-800">
                        {paymentProgress.toFixed(0)} %
                      </span>
                    </div>

                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-red-600 transition-all duration-300"
                        style={{
                          width: `${paymentProgress}%`,
                        }}
                      />
                    </div>
                  </section>
                </>
              ) : null}

              {/* Create payment */}
              <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-red-600">
                      <Banknote className="h-5 w-5" />
                    </div>

                    <div>
                      <h2 className="font-semibold text-slate-900">
                        Enregistrer un paiement
                      </h2>

                      <p className="text-xs text-slate-500">
                        Les règles financières sont
                        appliquées par le backend
                      </p>
                    </div>
                  </div>
                </div>

                <form
                  onSubmit={handleSubmit}
                  className="p-5"
                >
                  <div className="grid gap-5 md:grid-cols-2">
                    {/* Method */}
                    <div>
                      <label
                        htmlFor="payment-method"
                        className="mb-2 block text-sm font-semibold text-slate-700"
                      >
                        Méthode de paiement
                      </label>

                      <select
                        id="payment-method"
                        value={form.methode}
                        onChange={(event) =>
                          handleMethodChange(
                            event.target
                              .value as PaymentMethod,
                          )
                        }
                        disabled={submitting}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="CASH">
                          Espèces
                        </option>

                        <option value="MONCASH">
                          MonCash
                        </option>

                        <option value="NATCASH">
                          NatCash
                        </option>
                      </select>
                    </div>

                    {/* Currency */}
                    <div>
                      <label
                        htmlFor="payment-currency"
                        className="mb-2 block text-sm font-semibold text-slate-700"
                      >
                        Devise
                      </label>

                      <select
                        id="payment-currency"
                        value={form.devise}
                        onChange={(event) =>
                          handleCurrencyChange(
                            event.target
                              .value as PaymentCurrency,
                          )
                        }
                        disabled={
                          submitting ||
                          form.methode !== "CASH"
                        }
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="HTG">
                          Gourde (HTG)
                        </option>

                        <option
                          value="USD"
                          disabled={
                            form.methode !== "CASH"
                          }
                        >
                          Dollar américain (USD)
                        </option>
                      </select>

                      {form.methode !== "CASH" && (
                        <p className="mt-1.5 text-xs text-slate-500">
                          MonCash et NatCash sont
                          enregistrés en HTG. La vérification
                          fournisseur sera gérée par le
                          backend.
                        </p>
                      )}
                    </div>

                    {/* Amount */}
                    <div>
                      <label
                        htmlFor="payment-amount"
                        className="mb-2 block text-sm font-semibold text-slate-700"
                      >
                        Montant
                      </label>

                      <div className="relative">
                        <input
                          id="payment-amount"
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={form.montant}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              montant:
                                event.target.value,
                            }))
                          }
                          disabled={submitting}
                          placeholder="0.00"
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 pr-16 text-sm text-slate-800 outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                        />

                        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                          {form.devise}
                        </span>
                      </div>
                    </div>

                    {/* Reference */}
                    <div>
                      <label
                        htmlFor="payment-reference"
                        className="mb-2 block text-sm font-semibold text-slate-700"
                      >
                        Référence
                        <span className="ml-1 font-normal text-slate-400">
                          (facultative)
                        </span>
                      </label>

                      <input
                        id="payment-reference"
                        type="text"
                        maxLength={100}
                        value={form.reference}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            reference:
                              event.target.value,
                          }))
                        }
                        disabled={submitting}
                        placeholder="Référence de transaction"
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    </div>

                    {/* Notes */}
                    <div className="md:col-span-2">
                      <label
                        htmlFor="payment-notes"
                        className="mb-2 block text-sm font-semibold text-slate-700"
                      >
                        Notes
                        <span className="ml-1 font-normal text-slate-400">
                          (facultatives)
                        </span>
                      </label>

                      <textarea
                        id="payment-notes"
                        rows={3}
                        value={form.notes}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            notes:
                              event.target.value,
                          }))
                        }
                        disabled={submitting}
                        placeholder="Informations complémentaires..."
                        className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    </div>
                  </div>

                  <div className="mt-5 flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-end">
                    <button
                      type="button"
                      onClick={() =>
                        setForm(INITIAL_FORM)
                      }
                      disabled={submitting}
                      className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Réinitialiser
                    </button>

                    <button
                      type="submit"
                      disabled={
                        submitting ||
                        loadingPaymentData ||
                        selectedReservation.statut !==
                          "PENDING_VERIFICATION"
                      }
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Enregistrement...
                        </>
                      ) : (
                        <>
                          <CreditCard className="h-4 w-4" />
                          Enregistrer le paiement
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </section>

              {/* Payment history */}
              <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="font-semibold text-slate-900">
                        Historique des paiements
                      </h2>

                      <p className="mt-1 text-xs text-slate-500">
                        {payments.length} paiement
                        {payments.length > 1
                          ? "s"
                          : ""}
                      </p>
                    </div>

                    <div className="relative w-full sm:w-64">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                      <input
                        type="text"
                        value={paymentSearch}
                        onChange={(event) => {
                          setPaymentSearch(
                            event.target.value,
                          );
                          setPage(1);
                        }}
                        placeholder="Rechercher..."
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-red-400 focus:bg-white focus:ring-2 focus:ring-red-100"
                      />
                    </div>
                  </div>
                </div>

                {loadingPaymentData ? (
                  <div className="flex items-center justify-center py-12 text-slate-500">
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Chargement...
                  </div>
                ) : paginatedPayments.length === 0 ? (
                  <div className="px-6 py-12 text-center">
                    <CreditCard className="mx-auto h-9 w-9 text-slate-300" />

                    <p className="mt-3 text-sm font-semibold text-slate-700">
                      Aucun paiement
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Aucun paiement n'est encore
                      enregistré pour cette réservation.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[1000px] text-left">
                        <thead className="bg-slate-50">
                          <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                            <th className="px-5 py-3 font-semibold">
                              Référence
                            </th>

                            <th className="px-5 py-3 font-semibold">
                              Montant
                            </th>

                            <th className="px-5 py-3 font-semibold">
                              Méthode
                            </th>

                            <th className="px-5 py-3 font-semibold">
                              Taux de change
                            </th>

                            <th className="px-5 py-3 font-semibold">
                              Montant HTG
                            </th>

                            <th className="px-5 py-3 font-semibold">
                              Statut
                            </th>

                            <th className="px-5 py-3 font-semibold">
                              Date
                            </th>
                          </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100">
                          {paginatedPayments.map(
                            (payment) => (
                              <tr
                                key={payment.uuid}
                                className="transition hover:bg-slate-50"
                              >
                                <td className="px-5 py-4">
                                  <div>
                                    <p className="text-sm font-semibold text-slate-800">
                                      {payment.reference ||
                                        "Sans référence"}
                                    </p>

                                    <p className="mt-1 font-mono text-[11px] text-slate-400">
                                      {payment.uuid.slice(
                                        0,
                                        8,
                                      )}
                                      ...
                                    </p>
                                  </div>
                                </td>

                                <td className="px-5 py-4">
                                  <span className="text-sm font-bold text-slate-900">
                                    {formatAmount(
                                      payment.montant,
                                      payment.devise,
                                    )}
                                  </span>
                                </td>

                                <td className="px-5 py-4">
                                  <span className="text-sm font-medium text-slate-700">
                                    {
                                      METHOD_LABELS[
                                        payment.methode
                                      ]
                                    }
                                  </span>
                                </td>

                                <td className="px-5 py-4">
                                  <span className="text-sm text-slate-600">
                                    {payment.devise ===
                                    "USD"
                                      ? formatExchangeRate(
                                          payment.taux_change,
                                        )
                                      : "—"}
                                  </span>
                                </td>

                                <td className="px-5 py-4">
                                  <span className="text-sm font-semibold text-slate-800">
                                    {formatAmount(
                                      payment.montant_htg,
                                      "HTG",
                                    )}
                                  </span>
                                </td>

                                <td className="px-5 py-4">
                                  <PaymentStatusBadge
                                    status={
                                      payment.statut
                                    }
                                  />
                                </td>

                                <td className="px-5 py-4 text-sm text-slate-500">
                                  {formatDate(
                                    payment.date_paiement,
                                  )}
                                </td>
                              </tr>
                            ),
                          )}
                        </tbody>
                      </table>
                    </div>

                    <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-xs text-slate-500">
                        Page {safePage} sur{" "}
                        {totalPages}
                      </p>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setPage(
                              Math.max(
                                1,
                                safePage - 1,
                              ),
                            )
                          }
                          disabled={safePage <= 1}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Précédent
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setPage(
                              Math.min(
                                totalPages,
                                safePage + 1,
                              ),
                            )
                          }
                          disabled={
                            safePage >= totalPages
                          }
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Suivant
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </section>

              {/* Confirmation conditions */}
              <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 px-5 py-4">
                  <div>
                    <h2 className="font-semibold text-slate-900">
                      Conditions de confirmation
                    </h2>

                    <p className="mt-1 text-xs text-slate-500">
                      La confirmation finale est
                      toujours validée par le backend.
                    </p>
                  </div>
                </div>

                <div className="p-5">
                  <div className="space-y-4">
                    <ConfirmationCondition
                      checked={paymentReceived}
                      label="Paiement reçu"
                      detail={
                        paymentReceived
                          ? "Au moins un paiement réussi est enregistré."
                          : "Aucun paiement réussi n'est enregistré."
                      }
                    />

                    <ConfirmationCondition
                      checked={
                        selectedReservation.statut ===
                          "PENDING_VERIFICATION" &&
                        paymentReceived
                      }
                      label="Réservation prête pour validation"
                      detail={
                        selectedReservation.statut ===
                        "PENDING_VERIFICATION"
                          ? "La réservation est actuellement en attente de validation."
                          : "La réservation n'est plus dans l'état permettant une confirmation."
                      }
                    />

                    <ConfirmationCondition
                      checked={vehiclesAvailable}
                      label="Véhicule disponible"
                      detail={
                        vehiclesAvailable
                          ? "Les véhicules actuellement retournés par l'API sont disponibles."
                          : "La disponibilité définitive sera également revérifiée par le backend."
                      }
                    />

                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                      <p className="text-xs leading-5 text-slate-600">
                        L'éligibilité du client et la
                        disponibilité définitive des véhicules
                        ne sont pas décidées par cette interface.
                        Le backend les vérifie au moment de la
                        confirmation.
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 border-t border-slate-100 pt-5">
                    <button
                      type="button"
                      onClick={() =>
                        void handleConfirmReservation()
                      }
                      disabled={!canAttemptConfirmation}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 sm:w-auto"
                    >
                      {confirming ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Confirmation...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4" />
                          Confirmer la réservation
                        </>
                      )}
                    </button>

                    {!paymentReceived &&
                      selectedReservation.statut ===
                        "PENDING_VERIFICATION" && (
                        <p className="mt-3 text-xs text-amber-700">
                          Un paiement réussi est nécessaire
                          avant de pouvoir demander la
                          confirmation.
                        </p>
                      )}

                    {selectedReservation.statut ===
                      "CONFIRMED" && (
                      <p className="mt-3 text-xs text-emerald-700">
                        Cette réservation est déjà confirmée.
                      </p>
                    )}
                  </div>
                </div>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}