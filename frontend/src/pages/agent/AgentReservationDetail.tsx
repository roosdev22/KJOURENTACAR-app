import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  CarFront,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  FileText,
  Loader2,
  PlayCircle,
  ShieldCheck,
  UserRound,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import reservationService from "../../api/services/reservationService";
import type {
  ReservationStatus,
  Reservation,
} from "../../types/reservation";
// ============================================================
// KJOURENTACAR — AgentReservationDetail
// Détail + actions opérationnelles d'une réservation
// ============================================================

const STATUS_LABELS: Record<ReservationStatus, string> = {
  PENDING_VERIFICATION: "À valider",
  CONFIRMED: "Confirmée",
  CANCELLED: "Annulée",
  EN_COURS: "En cours",
  TERMINEE: "Terminée",
  EXPIRED: "Expirée",

};

function formatDate(value: string | null) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatDateTime(value: string | null) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatAmount(value: string | null) {
  if (value === null || value === undefined) {
    return "—";
  }

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

function getStatusClasses(status: ReservationStatus) {
  switch (status) {
    case "PENDING_VERIFICATION":
      return "border-amber-200 bg-amber-50 text-amber-700";

    case "CONFIRMED":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";

    case "EN_COURS":
      return "border-blue-200 bg-blue-50 text-blue-700";

    case "TERMINEE":
      return "border-slate-200 bg-slate-100 text-slate-700";

    case "CANCELLED":
      return "border-red-200 bg-red-50 text-red-700";

    default:
      return "border-slate-200 bg-slate-100 text-slate-600";
  }
}

// ============================================================
// STATUS BADGE
// ============================================================

function StatusBadge({
  status,
}: {
  status: ReservationStatus;
}) {
  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 rounded-full border",
        "px-3 py-1.5 text-xs font-bold",
        getStatusClasses(status),
      ].join(" ")}
    >
      {status === "CONFIRMED" && (
        <CheckCircle2 size={14} />
      )}

      {status === "PENDING_VERIFICATION" && (
        <Clock3 size={14} />
      )}

      {status === "EN_COURS" && (
        <PlayCircle size={14} />
      )}

      {status === "TERMINEE" && (
        <CheckCircle2 size={14} />
      )}

      {status === "CANCELLED" && (
        <XCircle size={14} />
      )}

      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

// ============================================================
// INFO ITEM
// ============================================================

function InfoItem({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CalendarDays;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
        <Icon size={17} />
      </div>

      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          {label}
        </p>

        <p className="mt-1 text-sm font-semibold text-slate-800">
          {value}
        </p>
      </div>
    </div>
  );
}

// ============================================================
// PAGE
// ============================================================

export default function AgentReservationDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [reservation, setReservation] =
    useState<Reservation | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<
    string | null
  >(null);

  const [error, setError] = useState<string | null>(
    null
  );

  const [actionError, setActionError] = useState<
    string | null
  >(null);

  const [showCancelForm, setShowCancelForm] =
    useState(false);

  const [cancelReason, setCancelReason] =
    useState("");

  // ==========================================================
  // CHARGEMENT
  // ==========================================================

    useEffect(() => {
    let isMounted = true;

    const loadReservation = async () => {
        if (!id) {
        if (isMounted) {
            setError("Identifiant de réservation invalide.");
            setIsLoading(false);
        }
        return;
        }

        try {
        const data = await reservationService.getReservation(id);

        if (!isMounted) {
            return;
        }

        setReservation(data);
        setError(null);
        } catch (err) {
        console.error(
            "Erreur lors du chargement de la réservation :",
            err
        );

        if (!isMounted) {
            return;
        }

        setError("Impossible de charger cette réservation.");
        } finally {
        if (isMounted) {
            setIsLoading(false);
        }
        }
    };

    void loadReservation();

    return () => {
        isMounted = false;
    };
    }, [id]);
  // ==========================================================
  // ACTIONS
  // ==========================================================

  const handleConfirm = async () => {
    if (!reservation) return;

    try {
      setActionLoading("confirm");
      setActionError(null);

      const updated =
        await reservationService.confirmReservation(
          reservation.id
        );

      setReservation(updated);
    } catch (err) {
      console.error(
        "Erreur lors de la confirmation :",
        err
      );

      setActionError(
        "Impossible de confirmer cette réservation. Vérifiez le paiement, l'éligibilité du client et la disponibilité des véhicules."
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleStart = async () => {
    if (!reservation) return;

    try {
      setActionLoading("start");
      setActionError(null);

      const updated =
        await reservationService.startReservation(
          reservation.id
        );

      setReservation(updated);
    } catch (err) {
      console.error(
        "Erreur lors du démarrage de la réservation :",
        err
      );

      setActionError(
        "Impossible de démarrer cette location."
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleComplete = async () => {
    if (!reservation) return;

    try {
      setActionLoading("complete");
      setActionError(null);

      const updated =
        await reservationService.completeReservation(
          reservation.id
        );

      setReservation(updated);
    } catch (err) {
      console.error(
        "Erreur lors de la terminaison de la réservation :",
        err
      );

      setActionError(
        "Impossible de terminer cette location."
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async () => {
    if (!reservation) return;

    const reason = cancelReason.trim();

    if (!reason) {
      setActionError(
        "Veuillez indiquer le motif de l'annulation."
      );
      return;
    }

    try {
      setActionLoading("cancel");
      setActionError(null);

      const updated =
        await reservationService.cancelReservation(
          reservation.id,
          {
            motif_annulation: reason,
          }
        );

      setReservation(updated);
      setShowCancelForm(false);
      setCancelReason("");
    } catch (err) {
      console.error(
        "Erreur lors de l'annulation :",
        err
      );

      setActionError(
        "Impossible d'annuler cette réservation."
      );
    } finally {
      setActionLoading(null);
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
            Chargement de la réservation...
          </p>
        </div>
      </div>
    );
  }

  // ==========================================================
  // ERREUR
  // ==========================================================

  if (error || !reservation) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-slate-50 p-6">
        <div className="mx-auto max-w-4xl">
          <button
            type="button"
            onClick={() =>
              navigate("/agent/reservations")
            }
            className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-red-600"
          >
            <ArrowLeft size={17} />
            Retour aux réservations
          </button>

          <div className="rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
              <AlertCircle size={24} />
            </div>

            <h2 className="text-lg font-bold text-slate-900">
              Réservation introuvable
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
              {error ??
                "Cette réservation n'existe pas ou n'est plus accessible."}
            </p>

            <button
              type="button"
              onClick={() =>
                navigate("/agent/reservations")
              }
              className="mt-5 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
            >
              Retour à la liste
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================
  // CONDITIONS ACTIONS
  // ==========================================================

  const canConfirm =
    reservation.statut === "PENDING_VERIFICATION";

  const canStart =
    reservation.statut === "CONFIRMED";

  const canComplete =
    reservation.statut === "EN_COURS";

  const canCancel =
    reservation.est_annulable &&
    reservation.statut !== "CANCELLED" &&
    reservation.statut !== "TERMINEE";

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#F4F5F6]">
      <main className="mx-auto max-w-[1400px] px-4 py-5 sm:px-6 lg:px-8">

        {/* ====================================================
            HEADER
        ==================================================== */}

        <div className="mb-5">
          <button
            type="button"
            onClick={() =>
              navigate("/agent/reservations")
            }
            className="mb-4 inline-flex items-center gap-2 text-xs font-semibold text-slate-500 transition hover:text-[#B4232F]"
          >
            <ArrowLeft size={16} />
            Retour aux réservations
          </button>

          <div className="rounded-2xl border border-[#E3E6E8] bg-white p-5 shadow-sm">
            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <div className="h-7 w-1 rounded-full bg-[#B4232F]" />

                  <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#B4232F]">
                    Détail réservation
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-2xl font-bold tracking-tight text-slate-950">
                    {reservation.numero}
                  </h1>

                <StatusBadge
                  status={reservation.statut}
                />
              </div>

              <p className="mt-1 text-sm text-slate-500">
                Créée le{" "}
                {formatDateTime(
                  reservation.created_at
                )}
              </p>
            </div>

            {/* Actions principales */}

            <div className="flex flex-wrap items-center gap-2">

              {canConfirm && (
                <button
                  type="button"
                  disabled={actionLoading !== null}
                  onClick={handleConfirm}
                  className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {actionLoading === "confirm" ? (
                    <Loader2
                      size={16}
                      className="animate-spin"
                    />
                  ) : (
                    <CheckCircle2 size={16} />
                  )}

                  Valider la réservation
                </button>
              )}

              {canStart && (
                <button
                  type="button"
                  disabled={actionLoading !== null}
                  onClick={handleStart}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {actionLoading === "start" ? (
                    <Loader2
                      size={16}
                      className="animate-spin"
                    />
                  ) : (
                    <PlayCircle size={16} />
                  )}

                  Démarrer la location
                </button>
              )}

              {canComplete && (
                <button
                  type="button"
                  disabled={actionLoading !== null}
                  onClick={handleComplete}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {actionLoading === "complete" ? (
                    <Loader2
                      size={16}
                      className="animate-spin"
                    />
                  ) : (
                    <CheckCircle2 size={16} />
                  )}

                  Terminer la location
                </button>
              )}

              {canCancel && (
                <button
                  type="button"
                  disabled={actionLoading !== null}
                  onClick={() =>
                    setShowCancelForm(true)
                  }
                  className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-bold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                >
                  <XCircle size={16} />
                  Annuler
                </button>
              )}
            </div>
          </div>
        </div>
        </div>

        {/* ====================================================
            ERREUR ACTION
        ==================================================== */}

        {actionError && (
          <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm text-red-700">
            <AlertCircle
              size={18}
              className="mt-0.5 shrink-0"
            />

            <div>
              <p className="font-bold">
                Action impossible
              </p>

              <p className="mt-0.5 text-xs leading-5">
                {actionError}
              </p>
            </div>
          </div>
        )}

        {/* ====================================================
            ANNULATION
        ==================================================== */}

        {showCancelForm && (
          <section className="mb-5 rounded-2xl border border-red-200 bg-white p-5 shadow-sm">
            <div className="mb-4">
              <h2 className="text-sm font-bold text-slate-900">
                Annuler la réservation
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Le motif sera enregistré dans l'historique
                de la réservation.
              </p>
            </div>

            <textarea
              value={cancelReason}
              onChange={(event) =>
                setCancelReason(event.target.value)
              }
              rows={3}
              placeholder="Motif de l'annulation..."
              className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-red-400 focus:bg-white focus:ring-2 focus:ring-red-100"
            />

            <div className="mt-3 flex justify-end gap-2">
              <button
                type="button"
                disabled={actionLoading !== null}
                onClick={() => {
                  setShowCancelForm(false);
                  setCancelReason("");
                }}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Fermer
              </button>

              <button
                type="button"
                disabled={actionLoading !== null}
                onClick={handleCancel}
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60"
              >
                {actionLoading === "cancel" && (
                  <Loader2
                    size={15}
                    className="animate-spin"
                  />
                )}

                Confirmer l'annulation
              </button>
            </div>
          </section>
        )}

        {/* ====================================================
            INFORMATIONS PRINCIPALES
        ==================================================== */}

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">

          {/* COLONNE PRINCIPALE */}

          <div className="space-y-5">

            {/* Période */}

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    Période de location
                  </h2>

                  <p className="mt-1 text-xs text-slate-400">
                    Informations opérationnelles
                  </p>
                </div>

                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-red-600">
                  <CalendarDays size={18} />
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-3">
                <InfoItem
                  icon={CalendarDays}
                  label="Départ"
                  value={formatDate(
                    reservation.date_debut
                  )}
                />

                <InfoItem
                  icon={CalendarDays}
                  label="Retour prévu"
                  value={formatDate(
                    reservation.date_fin
                  )}
                />

                <InfoItem
                  icon={Clock3}
                  label="Durée"
                  value={`${reservation.nombre_jours} jour${
                    reservation.nombre_jours !== 1
                      ? "s"
                      : ""
                  }`}
                />
              </div>
            </section>

            {/* Véhicules */}

            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-5 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">
                      Véhicules réservés
                    </h2>

                    <p className="mt-1 text-xs text-slate-400">
                      {reservation.lignes.length} véhicule
                      {reservation.lignes.length !== 1
                        ? "s"
                        : ""}
                    </p>
                  </div>

                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                    <CarFront size={18} />
                  </div>
                </div>
              </div>

              <div className="divide-y divide-slate-100">
                {reservation.lignes.map((ligne) => (
                  <div
                    key={ligne.id}
                    className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                        <CarFront size={20} />
                      </div>

                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900">
                          {ligne.vehicule.brand}{" "}
                          {ligne.vehicule.model}
                        </p>

                        <p className="mt-0.5 text-xs text-slate-400">
                          Tarif journalier :{" "}
                          {formatAmount(
                            ligne.prix_journalier_unitaire
                          )}
                        </p>

                        {ligne.notes && (
                          <p className="mt-1 text-xs text-slate-500">
                            Note : {ligne.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="text-left sm:text-right">
                      <p className="text-sm font-bold text-slate-900">
                        {formatAmount(
                          ligne.sous_total
                        )}
                      </p>

                      <p className="mt-0.5 text-[11px] text-slate-400">
                        Caution :{" "}
                        {formatAmount(
                          ligne.caution_unitaire
                        )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Notes */}

            {(reservation.notes_client ||
              reservation.notes_agent ||
              reservation.motif_annulation) && (
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                    <FileText size={18} />
                  </div>

                  <div>
                    <h2 className="text-sm font-bold text-slate-900">
                      Notes et observations
                    </h2>

                    <p className="mt-0.5 text-xs text-slate-400">
                      Informations liées à la réservation
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {reservation.notes_client && (
                    <div className="rounded-xl bg-slate-50 p-3.5">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Note du client
                      </p>

                      <p className="mt-1.5 text-sm leading-6 text-slate-700">
                        {reservation.notes_client}
                      </p>
                    </div>
                  )}

                  {reservation.notes_agent && (
                    <div className="rounded-xl bg-slate-50 p-3.5">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Note de l'agent
                      </p>

                      <p className="mt-1.5 text-sm leading-6 text-slate-700">
                        {reservation.notes_agent}
                      </p>
                    </div>
                  )}

                  {reservation.motif_annulation && (
                    <div className="rounded-xl border border-red-100 bg-red-50 p-3.5">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-red-500">
                        Motif d'annulation
                      </p>

                      <p className="mt-1.5 text-sm leading-6 text-red-700">
                        {reservation.motif_annulation}
                      </p>
                    </div>
                  )}
                </div>
              </section>
            )}
          </div>

          {/* ==================================================
              COLONNE DROITE
          ================================================== */}

          <aside className="space-y-5">

            {/* Client */}

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                  <UserRound size={19} />
                </div>

                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Client
                  </p>

                  <h2 className="mt-0.5 truncate text-sm font-bold text-slate-900">
                    {reservation.client_nom ||
                      "Client non renseigné"}
                  </h2>
                </div>
              </div>

              <div className="space-y-3 border-t border-slate-100 pt-4">
                <InfoItem
                  icon={UserRound}
                  label="Source"
                  value={
                    reservation.source_display ??
                    reservation.source
                  }
                />

                {reservation.created_by_nom && (
                  <InfoItem
                    icon={ShieldCheck}
                    label="Créée par"
                    value={
                      reservation.created_by_nom
                    }
                  />
                )}

                {reservation.validated_by && (
                  <InfoItem
                    icon={CheckCircle2}
                    label="Validée par"
                    value={
                      reservation.validated_by.nom
                    }
                  />
                )}
              </div>
            </section>

            {/* Paiement */}

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <div
                  className={[
                    "flex h-10 w-10 items-center justify-center rounded-xl",
                    reservation.paiement_reussi
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-amber-50 text-amber-600",
                  ].join(" ")}
                >
                  <CircleDollarSign size={20} />
                </div>

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Paiement
                  </p>

                  <p
                    className={[
                      "mt-0.5 text-sm font-bold",
                      reservation.paiement_reussi
                        ? "text-emerald-700"
                        : "text-amber-700",
                    ].join(" ")}
                  >
                    {reservation.paiement_reussi
                      ? "Paiement réussi"
                      : "Paiement non effectué"}
                  </p>
                </div>
              </div>

              <div className="space-y-3 border-t border-slate-100 pt-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-slate-500">
                    Location
                  </span>

                  <span className="text-sm font-bold text-slate-900">
                    {formatAmount(
                      reservation.montant_total
                    )}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-slate-500">
                    Caution
                  </span>

                  <span className="text-sm font-semibold text-slate-700">
                    {formatAmount(
                      reservation.caution_totale
                    )}
                  </span>
                </div>

                <div className="border-t border-slate-100 pt-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-bold text-slate-700">
                      Total
                    </span>

                    <span className="text-base font-bold text-red-600">
                      {formatAmount(
                        reservation.montant_total
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* Sécurité / workflow */}

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-red-600">
                  <ShieldCheck size={18} />
                </div>

                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    Contrôle opérationnel
                  </h2>

                  <p className="mt-0.5 text-xs text-slate-400">
                    État actuel du dossier
                  </p>
                </div>
              </div>

              <div className="space-y-2.5">
                <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2.5">
                  <span className="text-xs text-slate-500">
                    Modifiable
                  </span>

                  <span
                    className={
                      reservation.est_modifiable
                        ? "text-xs font-bold text-emerald-600"
                        : "text-xs font-bold text-slate-500"
                    }
                  >
                    {reservation.est_modifiable
                      ? "Oui"
                      : "Non"}
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2.5">
                  <span className="text-xs text-slate-500">
                    Annulable
                  </span>

                  <span
                    className={
                      reservation.est_annulable
                        ? "text-xs font-bold text-emerald-600"
                        : "text-xs font-bold text-slate-500"
                    }
                  >
                    {reservation.est_annulable
                      ? "Oui"
                      : "Non"}
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2.5">
                  <span className="text-xs text-slate-500">
                    Paiement
                  </span>

                  <span
                    className={
                      reservation.paiement_reussi
                        ? "text-xs font-bold text-emerald-600"
                        : "text-xs font-bold text-amber-600"
                    }
                  >
                    {reservation.paiement_reussi
                      ? "Réussi"
                      : "En attente"}
                  </span>
                </div>
              </div>
            </section>
          </aside>
        </div>

        {/* ====================================================
            FOOTER INFO
        ==================================================== */}

        <div className="mt-5 flex flex-col justify-between gap-2 border-t border-slate-200 pt-4 text-[11px] text-slate-400 sm:flex-row">
          <span>
            Dernière mise à jour :{" "}
            {formatDateTime(reservation.updated_at)}
          </span>

          <span>
            ID : {reservation.id}
          </span>
        </div>
      </main>
    </div>
  );
}