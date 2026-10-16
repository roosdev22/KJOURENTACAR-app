import React, { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  Car,
  CheckCircle2,
  Clock3,
  CreditCard,
  FileText,
  Loader2,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import { reservationService } from "../../api/services/reservationService";
import type {
  Reservation,
  ReservationStatus,
} from "../../types/reservation";

// ============================================================
// HELPERS
// ============================================================

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatMoney(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return String(value);
  }

  return new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

// ============================================================
// STATUS
// ============================================================

interface StatusConfig {
  label: string;
  description: string;
  icon: React.ElementType;
  className: string;
  iconClassName: string;
}

function getStatusConfig(status: ReservationStatus): StatusConfig {
  switch (status) {
    case "PENDING_VERIFICATION":
      return {
        label: "En attente de vérification",
        description:
          "Votre réservation a bien été enregistrée et attend la vérification de notre équipe.",
        icon: Clock3,
        className:
          "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300",
        iconClassName: "text-amber-600 dark:text-amber-400",
      };

    case "CONFIRMED":
      return {
        label: "Confirmée",
        description:
          "Votre réservation a été confirmée par notre équipe.",
        icon: CheckCircle2,
        className:
          "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300",
        iconClassName: "text-emerald-600 dark:text-emerald-400",
      };

    case "CANCELLED":
      return {
        label: "Annulée",
        description:
          "Cette réservation a été annulée.",
        icon: XCircle,
        className:
          "border-red-200 bg-red-50 text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300",
        iconClassName: "text-red-600 dark:text-red-400",
      };

    case "EN_COURS":
      return {
        label: "En cours",
        description:
          "La location correspondant à cette réservation est actuellement en cours.",
        icon: Car,
        className:
          "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-300",
        iconClassName: "text-blue-600 dark:text-blue-400",
      };

    case "TERMINEE":
      return {
        label: "Terminée",
        description:
          "La location correspondant à cette réservation est terminée.",
        icon: CheckCircle2,
        className:
          "border-slate-200 bg-slate-50 text-slate-800 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-300",
        iconClassName: "text-slate-600 dark:text-slate-400",
      };

    default:
      return {
        label: status,
        description: "",
        icon: AlertCircle,
        className:
          "border-slate-200 bg-slate-50 text-slate-800 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-300",
        iconClassName: "text-slate-600 dark:text-slate-400",
      };
  }
}

// ============================================================
// ERROR
// ============================================================

function getErrorMessage(error: unknown): string {
  const axiosError = error as {
    response?: {
      data?: {
        detail?: string;
        message?: string;
        error?: string;
      };
    };
    message?: string;
  };

  const responseData = axiosError?.response?.data;

  if (responseData?.detail) {
    return responseData.detail;
  }

  if (responseData?.message) {
    return responseData.message;
  }

  if (responseData?.error) {
    return responseData.error;
  }

  if (axiosError?.message) {
    return axiosError.message;
  }

  return "Impossible de charger cette réservation.";
}

// ============================================================
// SMALL UI COMPONENTS
// ============================================================

interface InfoItemProps {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
}

function InfoItem({
  icon: Icon,
  label,
  value,
}: InfoItemProps) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </div>

      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
          {label}
        </p>

        <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
          {value}
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-4 dark:border-slate-800">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
          <Icon
            className="h-4 w-4 text-slate-700 dark:text-slate-300"
            aria-hidden="true"
          />
        </div>

        <h2 className="text-base font-semibold text-slate-900 dark:text-white">
          {title}
        </h2>
      </div>

      <div className="p-5">{children}</div>
    </section>
  );
}

// ============================================================
// PAGE
// ============================================================

const ReservationDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ----------------------------------------------------------
  // LOAD RESERVATION
  // ----------------------------------------------------------

  useEffect(() => {
    let mounted = true;

    async function loadReservation() {
      if (!id) {
        if (mounted) {
          setError("Identifiant de réservation invalide.");
          setLoading(false);
        }

        return;
      }

      try {
        setLoading(true);
        setError(null);

        const data = await reservationService.getReservation(id);

        if (!mounted) return;

        setReservation(data);
      } catch (err) {
        if (!mounted) return;

        setReservation(null);
        setError(getErrorMessage(err));
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadReservation();

    return () => {
      mounted = false;
    };
  }, [id]);

  // ----------------------------------------------------------
  // STATUS
  // ----------------------------------------------------------

  const statusConfig = useMemo(() => {
    if (!reservation) return null;

    return getStatusConfig(reservation.statut);
  }, [reservation]);

  // ----------------------------------------------------------
  // LOADING
  // ----------------------------------------------------------

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-8 dark:bg-slate-950">
        <div className="mx-auto flex min-h-[60vh] max-w-6xl items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-center">
            <Loader2
              className="h-8 w-8 animate-spin text-slate-600 dark:text-slate-300"
              aria-hidden="true"
            />

            <p className="text-sm text-slate-600 dark:text-slate-400">
              Chargement de la réservation...
            </p>
          </div>
        </div>
      </main>
    );
  }

  // ----------------------------------------------------------
  // ERROR
  // ----------------------------------------------------------

  if (error || !reservation || !statusConfig) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-8 dark:bg-slate-950">
        <div className="mx-auto max-w-4xl">
          <button
            type="button"
            onClick={() => navigate("/reservations")}
            className="mb-6 inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Retour à mes réservations
          </button>

          <div
            role="alert"
            className="rounded-2xl border border-red-200 bg-red-50 p-6 dark:border-red-900/50 dark:bg-red-950/20"
          >
            <div className="flex items-start gap-3">
              <AlertCircle
                className="mt-0.5 h-5 w-5 shrink-0 text-red-600 dark:text-red-400"
                aria-hidden="true"
              />

              <div>
                <h1 className="font-semibold text-red-900 dark:text-red-300">
                  Impossible d'afficher la réservation
                </h1>

                <p className="mt-1 text-sm text-red-700 dark:text-red-400">
                  {error ?? "La réservation demandée est introuvable."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const StatusIcon = statusConfig.icon;

  // ----------------------------------------------------------
  // RENDER
  // ----------------------------------------------------------

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 dark:bg-slate-950">
      <div className="mx-auto max-w-6xl">
        {/* ================================================== */}
        {/* HEADER                                             */}
        {/* ================================================== */}

        <div className="mb-6">
          <button
            type="button"
            onClick={() => navigate("/reservations")}
            className="mb-5 inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Mes réservations
          </button>

          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Réservation
              </p>

              <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                {reservation.numero}
              </h1>

              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Créée le {formatDateTime(reservation.created_at)}
              </p>
            </div>

            <div
              className={`inline-flex w-fit items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold ${statusConfig.className}`}
            >
              <StatusIcon
                className={`h-4 w-4 ${statusConfig.iconClassName}`}
                aria-hidden="true"
              />

              {reservation.statut_display || statusConfig.label}
            </div>
          </div>
        </div>

        {/* ================================================== */}
        {/* STATUS BANNER                                      */}
        {/* ================================================== */}

        <div
          className={`mb-6 rounded-2xl border p-5 ${statusConfig.className}`}
        >
          <div className="flex items-start gap-3">
            <StatusIcon
              className={`mt-0.5 h-5 w-5 shrink-0 ${statusConfig.iconClassName}`}
              aria-hidden="true"
            />

            <div>
              <h2 className="font-semibold">
                {statusConfig.label}
              </h2>

              {statusConfig.description && (
                <p className="mt-1 text-sm opacity-90">
                  {statusConfig.description}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ================================================== */}
        {/* MAIN GRID                                          */}
        {/* ================================================== */}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          {/* ================================================= */}
          {/* LEFT                                             */}
          {/* ================================================= */}

          <div className="space-y-6">
            {/* PERIOD */}

            <Section title="Période de location" icon={CalendarDays}>
              <div className="grid gap-5 sm:grid-cols-3">
                <InfoItem
                  icon={CalendarDays}
                  label="Début"
                  value={formatDate(reservation.date_debut)}
                />

                <InfoItem
                  icon={CalendarDays}
                  label="Fin"
                  value={formatDate(reservation.date_fin)}
                />

                <InfoItem
                  icon={Clock3}
                  label="Durée"
                  value={`${reservation.nombre_jours} jour${
                    reservation.nombre_jours > 1 ? "s" : ""
                  }`}
                />
              </div>
            </Section>

            {/* VEHICLES */}

            <Section title="Véhicules réservés" icon={Car}>
              <div className="space-y-4">
                {reservation.lignes.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center dark:border-slate-700">
                    <Car
                      className="mx-auto h-8 w-8 text-slate-400"
                      aria-hidden="true"
                    />

                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                      Aucun véhicule associé à cette réservation.
                    </p>
                  </div>
                ) : (
                  reservation.lignes.map((line) => (
                    <div
                      key={line.id}
                      className="rounded-xl border border-slate-200 p-4 dark:border-slate-800"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex min-w-0 items-start gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
                            <Car
                              className="h-5 w-5 text-slate-600 dark:text-slate-300"
                              aria-hidden="true"
                            />
                          </div>

                          <div className="min-w-0">
                            <h3 className="font-semibold text-slate-900 dark:text-white">
                              {line.vehicule.brand}{" "}
                              {line.vehicule.model}
                            </h3>

                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                              {line.vehicule.status}
                            </p>
                          </div>
                        </div>

                        <div className="text-left sm:text-right">
                          <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                            Sous-total
                          </p>

                          <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
                            {formatMoney(line.sous_total)}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-3 border-t border-slate-200 pt-4 sm:grid-cols-2 dark:border-slate-800">
                        <InfoItem
                          icon={CreditCard}
                          label="Prix journalier"
                          value={formatMoney(
                            line.prix_journalier_unitaire
                          )}
                        />

                        <InfoItem
                          icon={ShieldCheck}
                          label="Caution"
                          value={formatMoney(line.caution_unitaire)}
                        />
                      </div>

                      {line.notes && (
                        <div className="mt-4 rounded-lg bg-slate-50 p-3 dark:bg-slate-800/50">
                          <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                            Note
                          </p>

                          <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
                            {line.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </Section>

            {/* CLIENT NOTES */}

            {reservation.notes_client && (
              <Section title="Notes du client" icon={FileText}>
                <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700 dark:text-slate-300">
                  {reservation.notes_client}
                </p>
              </Section>
            )}

            {/* CANCELLATION */}

            {reservation.statut === "CANCELLED" && (
              <Section title="Annulation" icon={XCircle}>
                <div className="space-y-4">
                  <InfoItem
                    icon={Clock3}
                    label="Date d'annulation"
                    value={formatDateTime(
                      reservation.date_annulation
                    )}
                  />

                  {reservation.motif_annulation && (
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Motif
                      </p>

                      <p className="mt-1 text-sm leading-6 text-slate-700 dark:text-slate-300">
                        {reservation.motif_annulation}
                      </p>
                    </div>
                  )}
                </div>
              </Section>
            )}

            {/* CONFIRMATION */}

            {reservation.date_confirmation && (
              <Section title="Confirmation" icon={CheckCircle2}>
                <InfoItem
                  icon={CheckCircle2}
                  label="Date de confirmation"
                  value={formatDateTime(
                    reservation.date_confirmation
                  )}
                />
              </Section>
            )}
          </div>

          {/* ================================================= */}
          {/* RIGHT                                            */}
          {/* ================================================= */}

          <aside className="space-y-6">
            {/* TOTAL */}

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center gap-2">
                <CreditCard
                  className="h-5 w-5 text-slate-600 dark:text-slate-300"
                  aria-hidden="true"
                />

                <h2 className="font-semibold text-slate-900 dark:text-white">
                  Récapitulatif financier
                </h2>
              </div>

              <div className="mt-5 space-y-4">
                <div className="flex items-center justify-between gap-4 text-sm">
                  <span className="text-slate-500 dark:text-slate-400">
                    Location
                  </span>

                  <span className="font-semibold text-slate-900 dark:text-white">
                    {formatMoney(reservation.montant_total)}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4 text-sm">
                  <span className="text-slate-500 dark:text-slate-400">
                    Caution
                  </span>

                  <span className="font-semibold text-slate-900 dark:text-white">
                    {formatMoney(reservation.caution_totale)}
                  </span>
                </div>

                <div className="border-t border-slate-200 pt-4 dark:border-slate-800">
                  <div className="flex items-end justify-between gap-4">
                    <span className="font-semibold text-slate-900 dark:text-white">
                      Total
                    </span>

                    <span className="text-2xl font-bold text-slate-900 dark:text-white">
                      {formatMoney(reservation.montant_total)}
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* PAYMENT */}

            <Section title="Paiement" icon={CreditCard}>
              <div className="flex items-start gap-3">
                {reservation.paiement_reussi ? (
                  <>
                    <CheckCircle2
                      className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400"
                      aria-hidden="true"
                    />

                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">
                        Paiement réussi
                      </p>

                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Le paiement associé à cette réservation a été
                        enregistré avec succès.
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <Clock3
                      className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400"
                      aria-hidden="true"
                    />

                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">
                        Paiement non effectué
                      </p>

                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Aucun paiement réussi n'est actuellement
                        associé à cette réservation.
                      </p>
                    </div>
                  </>
                )}
              </div>
            </Section>

            {/* RESERVATION META */}

            <Section title="Informations" icon={FileText}>
              <div className="space-y-5">
                <InfoItem
                  icon={FileText}
                  label="Numéro"
                  value={reservation.numero}
                />

                <InfoItem
                  icon={FileText}
                  label="Source"
                  value={
                    reservation.source_display ||
                    reservation.source
                  }
                />

                <InfoItem
                  icon={Clock3}
                  label="Créée le"
                  value={formatDateTime(
                    reservation.created_at
                  )}
                />

                <InfoItem
                  icon={Clock3}
                  label="Mise à jour"
                  value={formatDateTime(
                    reservation.updated_at
                  )}
                />
              </div>
            </Section>

            {/* SECURITY */}

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-900/50">
              <div className="flex items-start gap-3">
                <ShieldCheck
                  className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400"
                  aria-hidden="true"
                />

                <div>
                  <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Réservation sécurisée
                  </h2>

                  <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                    Les informations affichées correspondent aux
                    données enregistrées par KJOURRENTACAR.
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
};
export default ReservationDetailPage;