import {
  CarFront,
  CheckCircle2,
  Clock3,
  Eye,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";

import type {
  Reservation,
  ReservationStatus,
} from "../../types/reservation";

interface ReservationCardProps {
  reservation: Reservation;
}

interface StatusConfig {
  label: string;
  icon: LucideIcon;
  className: string;
}

function getStatusConfig(status: ReservationStatus): StatusConfig {
  switch (status) {
    case "PENDING_VERIFICATION":
      return {
        label: "En attente de vérification",
        icon: Clock3,
        className:
          "border-amber-200 bg-amber-50 text-amber-700",
      };

    case "CONFIRMED":
      return {
        label: "Confirmée",
        icon: CheckCircle2,
        className:
          "border-emerald-200 bg-emerald-50 text-emerald-700",
      };

    case "CANCELLED":
      return {
        label: "Annulée",
        icon: XCircle,
        className:
          "border-red-200 bg-red-50 text-red-700",
      };

    case "EN_COURS":
      return {
        label: "En cours",
        icon: CarFront,
        className:
          "border-blue-200 bg-blue-50 text-blue-700",
      };

    case "TERMINEE":
      return {
        label: "Terminée",
        icon: CheckCircle2,
        className:
          "border-neutral-200 bg-neutral-100 text-neutral-600",
      };
  }
}

function formatDate(value: string): string {
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

function formatMoney(value: string): string {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return value;
  }

  return new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export default function ReservationCard({
  reservation,
}: ReservationCardProps) {
  const navigate = useNavigate();

  const status = getStatusConfig(reservation.statut);
  const StatusIcon = status.icon;

  const vehicleCount = reservation.lignes.length;

  function handleViewDetails(): void {
    navigate(`/reservations/${reservation.id}`);
  }

  return (
    <article
      className="
        group overflow-hidden rounded-3xl
        border border-neutral-200
        bg-white
        shadow-[0_8px_30px_rgba(0,0,0,0.04)]
        transition-all duration-300
        hover:-translate-y-0.5
        hover:border-neutral-300
        hover:shadow-[0_16px_45px_rgba(0,0,0,0.08)]
      "
    >
      {/* =========================================================
          HEADER
      ========================================================= */}

      <div className="border-b border-neutral-100 px-5 py-5 sm:px-6 sm:py-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <div
              className="
                flex h-12 w-12 shrink-0 items-center justify-center
                rounded-2xl bg-neutral-950
                shadow-sm
              "
            >
              <CarFront
                size={21}
                strokeWidth={2}
                className="text-white"
                aria-hidden="true"
              />
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400">
                  Réservation
                </p>

                <span className="h-1 w-1 rounded-full bg-neutral-300" />

                <p className="text-[10px] font-medium text-neutral-400">
                  Créée le {formatDate(reservation.created_at)}
                </p>
              </div>

              <h2 className="mt-1 break-all text-lg font-black tracking-tight text-neutral-950">
                {reservation.numero}
              </h2>
            </div>
          </div>

          <div
            className={[
              "inline-flex w-fit items-center gap-2 rounded-full border px-3.5 py-2",
              "text-xs font-bold",
              status.className,
            ].join(" ")}
          >
            <StatusIcon size={14} aria-hidden="true" />

            <span>
              {reservation.statut_display || status.label}
            </span>
          </div>
        </div>
      </div>

      {/* =========================================================
          PERIOD
      ========================================================= */}

      <div className="px-5 py-5 sm:px-6">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl bg-neutral-50 p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-neutral-400">
              Début
            </p>

            <p className="mt-2 text-sm font-black text-neutral-950">
              {formatDate(reservation.date_debut)}
            </p>
          </div>

          <div className="rounded-2xl bg-neutral-50 p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-neutral-400">
              Fin
            </p>

            <p className="mt-2 text-sm font-black text-neutral-950">
              {formatDate(reservation.date_fin)}
            </p>
          </div>

          <div className="rounded-2xl bg-neutral-50 p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-neutral-400">
              Durée
            </p>

            <p className="mt-2 text-sm font-black text-neutral-950">
              {reservation.nombre_jours}{" "}
              {reservation.nombre_jours > 1 ? "jours" : "jour"}
            </p>
          </div>

          <div className="rounded-2xl bg-neutral-50 p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-neutral-400">
              Véhicules
            </p>

            <p className="mt-2 text-sm font-black text-neutral-950">
              {vehicleCount}
            </p>
          </div>
        </div>
      </div>

      {/* =========================================================
          VEHICLES
      ========================================================= */}

      <div className="border-t border-neutral-100 px-5 py-5 sm:px-6">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-neutral-400">
            Véhicules réservés
          </p>

          {vehicleCount > 0 && (
            <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-[10px] font-bold text-neutral-500">
              {vehicleCount} véhicule
              {vehicleCount > 1 ? "s" : ""}
            </span>
          )}
        </div>

        {vehicleCount === 0 ? (
          <p className="mt-4 rounded-xl bg-neutral-50 px-4 py-3 text-xs text-neutral-500">
            Aucun véhicule associé à cette réservation.
          </p>
        ) : (
          <div className="mt-4 flex flex-wrap gap-2">
            {reservation.lignes.slice(0, 3).map((ligne) => (
              <span
                key={ligne.id}
                className="
                  inline-flex items-center gap-2
                  rounded-xl border border-neutral-200
                  bg-white px-3 py-2.5
                  text-xs font-bold text-neutral-700
                  shadow-sm
                "
              >
                <CarFront
                  size={14}
                  className="text-neutral-400"
                  aria-hidden="true"
                />

                <span>
                  {ligne.vehicule.brand} {ligne.vehicule.model}
                </span>
              </span>
            ))}

            {vehicleCount > 3 && (
              <span
                className="
                  inline-flex items-center
                  rounded-xl bg-neutral-950
                  px-3 py-2.5
                  text-xs font-black text-white
                "
              >
                +{vehicleCount - 3}{" "}
                {vehicleCount - 3 > 1 ? "autres" : "autre"}
              </span>
            )}
          </div>
        )}
      </div>

      {/* =========================================================
          FOOTER / PRICE
      ========================================================= */}

      <div className="border-t border-neutral-100 bg-neutral-50/70 px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-wrap gap-x-10 gap-y-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-neutral-400">
                Montant total
              </p>

              <p className="mt-1 text-xl font-black tracking-tight text-neutral-950">
                {formatMoney(reservation.montant_total)}
              </p>
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-neutral-400">
                Caution
              </p>

              <p className="mt-1 text-sm font-black text-neutral-800">
                {formatMoney(reservation.caution_totale)}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleViewDetails}
            className="
              inline-flex w-full items-center justify-center gap-2
              rounded-xl bg-neutral-950
              px-5 py-3
              text-xs font-black uppercase tracking-wide text-white
              shadow-sm
              transition-all duration-200
              hover:bg-red-600
              focus:outline-none
              focus:ring-2 focus:ring-red-600
              focus:ring-offset-2
              sm:w-auto
            "
          >
            <Eye size={16} aria-hidden="true" />
            Voir la réservation
          </button>
        </div>

        {/* =======================================================
            PAYMENT
        ======================================================= */}

        <div className="mt-5 flex items-center gap-2 border-t border-neutral-200/70 pt-4">
          <div
            className={[
              "flex h-7 w-7 items-center justify-center rounded-full",
              reservation.paiement_reussi
                ? "bg-emerald-100"
                : "bg-neutral-200",
            ].join(" ")}
          >
            <ShieldCheck
              size={14}
              className={
                reservation.paiement_reussi
                  ? "text-emerald-600"
                  : "text-neutral-500"
              }
              aria-hidden="true"
            />
          </div>

          <span
            className={[
              "text-xs font-bold",
              reservation.paiement_reussi
                ? "text-emerald-700"
                : "text-neutral-500",
            ].join(" ")}
          >
            {reservation.paiement_reussi
              ? "Paiement confirmé"
              : "Paiement non confirmé"}
          </span>
        </div>
      </div>
    </article>
  );
}