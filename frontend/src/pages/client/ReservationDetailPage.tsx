import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AdminIcon, { type AdminIconName } from "../../components/admin/AdminIcon";

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
  icon: AdminIconName;
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
        icon: "clock",
        className:
          "border-[#F2D29B] bg-[#FFF8ED] text-[#A2650F]",
        iconClassName: "text-[#B7791F]",
      };

    case "CONFIRMED":
      return {
        label: "Confirmée",
        description:
          "Votre réservation a été confirmée par notre équipe.",
        icon: "check-circle",
        className:
          "border-[#B9E6D0] bg-[#EAF7F0] text-[#126A49]",
        iconClassName: "text-[#16845B]",
      };

    case "CANCELLED":
      return {
        label: "Annulée",
        description:
          "Cette réservation a été annulée.",
        icon: "x-circle",
        className:
          "border-[#F0B4BC] bg-[#FFF5F6] text-[#B4232F]",
        iconClassName: "text-[#B4232F]",
      };

    case "EN_COURS":
      return {
        label: "En cours",
        description:
          "La location correspondant à cette réservation est actuellement en cours.",
        icon: "car-front",
        className:
          "border-[#D5E3FA] bg-[#F1F6FF] text-[#2457A6]",
        iconClassName: "text-[#2457A6]",
      };

    case "TERMINEE":
      return {
        label: "Terminée",
        description:
          "La location correspondant à cette réservation est terminée.",
        icon: "check-circle",
        className:
          "border-[#E3E6E8] bg-[#F4F5F6] text-[#64748B]",
        iconClassName: "text-[#64748B]",
      };

    default:
      return {
        label: status,
        description: "",
        icon: "alert",
        className:
          "border-[#E3E6E8] bg-[#F4F5F6] text-[#64748B]",
        iconClassName: "text-[#64748B]",
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
  icon: AdminIconName;
  label: string;
  value: React.ReactNode;
}

function InfoItem({
  icon,
  label,
  value,
}: InfoItemProps) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#F4F5F6] text-[#64748B]">
        <AdminIcon name={icon} size={17} />
      </div>

      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-[#64748B]">
          {label}
        </p>

        <div className="mt-1 text-sm font-semibold text-[#202327]">
          {value}
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: AdminIconName;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-[#E3E6E8] bg-white shadow-sm">
      <div className="flex items-center gap-3 border-b border-[#E3E6E8] px-5 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#F4F5F6] text-[#64748B]">
          <AdminIcon name={icon} size={17} />
        </div>

        <h2 className="text-base font-semibold text-[#202327]">
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
      <main className="min-h-screen bg-[#F4F5F6] px-4 py-8">
        <div className="mx-auto flex min-h-[60vh] max-w-6xl items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-center">
            <AdminIcon name="loader" size={30} className="animate-spin text-[#64748B]" />

            <p className="text-sm text-[#64748B]">
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
      <main className="min-h-screen bg-[#F4F5F6] px-4 py-8">
        <div className="mx-auto max-w-4xl">
          <button
            type="button"
            onClick={() => navigate("/reservations")}
            className="mb-6 inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-[#64748B] transition hover:bg-white hover:text-[#202327] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B4232F]"
          >
            <AdminIcon name="arrow-left" size={17} />
            Retour à mes réservations
          </button>

          <div
            role="alert"
            className="rounded-2xl border border-[#F0B4BC] bg-[#FFF5F6] p-6"
          >
            <div className="flex items-start gap-3">
              <AdminIcon name="alert" size={20} className="mt-0.5 shrink-0 text-[#B4232F]" />

              <div>
                <h1 className="font-semibold text-[#202327]">
                  Impossible d'afficher la réservation
                </h1>

                <p className="mt-1 text-sm text-[#B4232F]">
                  {error ?? "La réservation demandée est introuvable."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // ----------------------------------------------------------
  // RENDER
  // ----------------------------------------------------------

  return (
    <main className="min-h-screen bg-[#F4F5F6] px-4 py-8">
      <div className="mx-auto max-w-6xl">
        {/* ================================================== */}
        {/* HEADER                                             */}
        {/* ================================================== */}

        <div className="mb-6">
          <button
            type="button"
            onClick={() => navigate("/reservations")}
            className="mb-5 inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-[#64748B] transition hover:bg-white hover:text-[#202327] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B4232F]"
          >
            <AdminIcon name="arrow-left" size={17} />
            Mes réservations
          </button>

          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#B4232F]">
                Dossier de location
              </p>

              <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#202327] sm:text-3xl">
                {reservation.numero}
              </h1>

              <p className="mt-2 text-sm text-[#64748B]">
                Créée le {formatDateTime(reservation.created_at)}
              </p>
            </div>

            <div
              className={`inline-flex w-fit items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold ${statusConfig.className}`}
            >
              <AdminIcon name={statusConfig.icon} size={17} className={statusConfig.iconClassName} />

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
            <AdminIcon name={statusConfig.icon} size={20} className={`mt-0.5 shrink-0 ${statusConfig.iconClassName}`} />

            <div>
              <h2 className="font-semibold">
                Suivi de la réservation
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

            <Section title="Période de location" icon="calendar-check">
              <div className="grid gap-5 sm:grid-cols-3">
                <InfoItem
                  icon="calendar-check"
                  label="Début"
                  value={formatDate(reservation.date_debut)}
                />

                <InfoItem
                  icon="calendar-check"
                  label="Fin"
                  value={formatDate(reservation.date_fin)}
                />

                <InfoItem
                  icon="clock"
                  label="Durée"
                  value={`${reservation.nombre_jours} jour${
                    reservation.nombre_jours > 1 ? "s" : ""
                  }`}
                />
              </div>
            </Section>

            {/* VEHICLES */}

            <Section title="Véhicules réservés" icon="car-front">
              <div className="space-y-4">
                {reservation.lignes.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center dark:border-slate-700">
                    <AdminIcon name="car-front" size={32} className="mx-auto text-[#64748B]" />

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
                            <AdminIcon name="car-front" size={21} className="text-[#64748B]" />
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
                          icon="credit-card"
                          label="Prix journalier"
                          value={formatMoney(
                            line.prix_journalier_unitaire
                          )}
                        />

                        <InfoItem
                          icon="shield"
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
              <Section title="Notes du client" icon="file">
                <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700 dark:text-slate-300">
                  {reservation.notes_client}
                </p>
              </Section>
            )}

            {/* CANCELLATION */}

            {reservation.statut === "CANCELLED" && (
              <Section title="Annulation" icon="x-circle">
                <div className="space-y-4">
                  <InfoItem
                    icon="clock"
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
              <Section title="Confirmation" icon="check-circle">
                <InfoItem
                  icon="check-circle"
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
                <AdminIcon name="credit-card" size={20} className="text-[#64748B]" />

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

            <Section title="Paiement" icon="credit-card">
              <div className="flex items-start gap-3">
                {reservation.paiement_reussi ? (
                  <>
                    <AdminIcon name="check-circle" size={20} className="mt-0.5 shrink-0 text-[#16845B]" />

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
                    <AdminIcon name="clock" size={20} className="mt-0.5 shrink-0 text-[#B7791F]" />

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

            <Section title="Informations" icon="file">
              <div className="space-y-5">
                <InfoItem
                  icon="file"
                  label="Numéro"
                  value={reservation.numero}
                />

                <InfoItem
                  icon="file"
                  label="Source"
                  value={
                    reservation.source_display ||
                    reservation.source
                  }
                />

                <InfoItem
                  icon="clock"
                  label="Créée le"
                  value={formatDateTime(
                    reservation.created_at
                  )}
                />

                <InfoItem
                  icon="clock"
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
                <AdminIcon name="shield" size={20} className="mt-0.5 shrink-0 text-[#16845B]" />

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