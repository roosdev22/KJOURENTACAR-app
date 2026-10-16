import {
  CalendarDays,
  CarFront,
  ChevronRight,
  Mail,
} from "lucide-react";

import AgentReservationStatus from "./AgentReservationStatus";
import AgentPaymentStatus from "./AgentPaymentStatus";
import AgentReservationActions from "./AgentReservationActions";

import type { Reservation } from "../../../types/reservation";

interface AgentReservationTableProps {
  reservations: Reservation[];
  onView: (reservation: Reservation) => void;
  onValidate?: (reservation: Reservation) => void;
  onEdit?: (reservation: Reservation) => void;
  onCancel?: (reservation: Reservation) => void;
}

// ============================================================
// FORMAT DATE
// ============================================================

function formatDate(value: string) {
  if (!value) return "—";

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
  }).format(date);
}

// ============================================================
// FORMAT MONTANT
// ------------------------------------------------------------
// L'API Django retourne les montants sous forme de string.
// Exemple : "12500.00"
// ============================================================

function formatAmount(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return "0";
  }

  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return "0";
  }

  return new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// ============================================================
// INITIALLES CLIENT
// ============================================================

function getClientInitials(name: string) {
  if (!name) return "?";

  const parts = name.trim().split(/\s+/);

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${
    parts[parts.length - 1][0]
  }`.toUpperCase();
}

// ============================================================
// VÉHICULES
// ============================================================

function getVehicleLabel(reservation: Reservation) {
  const first = reservation.lignes[0]?.vehicule;

  if (!first) {
    return "Aucun véhicule";
  }

  const main = `${first.brand} ${first.model}`;

  if (reservation.lignes.length === 1) {
    return main;
  }

  const remaining = reservation.lignes.length - 1;

  return `${main} + ${remaining} autre${
    remaining > 1 ? "s" : ""
  }`;
}

// ============================================================
// STATUT PAIEMENT
// ------------------------------------------------------------
// Ton Reservation actuel expose uniquement paiement_reussi.
// On ne prétend donc pas connaître PENDING / FAILED.
// ============================================================

function getPaymentStatus(
  reservation: Reservation
): "SUCCEEDED" | "PENDING" | "FAILED" | "NONE" {
  return reservation.paiement_reussi
    ? "SUCCEEDED"
    : "NONE";
}

// ============================================================
// TABLE
// ============================================================

export default function AgentReservationTable({
  reservations,
  onView,
  onValidate,
  onEdit,
  onCancel,
}: AgentReservationTableProps) {
  // ==========================================================
  // ÉTAT VIDE
  // ==========================================================

  if (reservations.length === 0) {
    return (
      <section className="overflow-hidden rounded-xl border border-black/[0.07] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
        <div className="px-5 py-14 text-center">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-black/[0.04] text-black/35">
            <CalendarDays className="h-5 w-5" />
          </div>

          <p className="mt-3 text-sm font-semibold text-black">
            Aucune réservation
          </p>

          <p className="mx-auto mt-1 max-w-md text-xs text-black/40">
            Aucune réservation ne correspond aux critères
            sélectionnés.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section
      className="
        overflow-hidden
        rounded-xl
        border
        border-black/[0.07]
        bg-white
        shadow-[0_1px_2px_rgba(0,0,0,0.02)]
      "
    >
      {/* ========================================================
          DESKTOP
      ======================================================== */}

      <div className="hidden lg:block">
        {/* ======================================================
            SCROLL CONTAINER

            - horizontal
            - vertical
            - scroll fluide
        ====================================================== */}

        <div
          className="
            max-h-[620px]
            overflow-x-auto
            overflow-y-auto
            overscroll-contain
            scroll-smooth
          "
          style={{
            scrollbarWidth: "thin",
          }}
        >
          <table className="w-full min-w-[1180px] border-collapse">
            {/* ==================================================
                HEADER STICKY
            ================================================== */}

            <thead className="sticky top-0 z-10">
              <tr className="border-b border-black/[0.07] bg-[#fafafa]/95 backdrop-blur-sm">
                <th className="whitespace-nowrap px-5 py-3 text-left text-[10px] font-bold uppercase tracking-[0.14em] text-black/35">
                  Réservation
                </th>

                <th className="whitespace-nowrap px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.14em] text-black/35">
                  Client
                </th>

                <th className="whitespace-nowrap px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.14em] text-black/35">
                  Véhicules
                </th>

                <th className="whitespace-nowrap px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.14em] text-black/35">
                  Dates
                </th>

                <th className="whitespace-nowrap px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.14em] text-black/35">
                  Paiement
                </th>

                <th className="whitespace-nowrap px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.14em] text-black/35">
                  Statut
                </th>

                <th className="whitespace-nowrap px-4 py-3 text-right text-[10px] font-bold uppercase tracking-[0.14em] text-black/35">
                  Total
                </th>

                <th className="w-24 px-3 py-3" />
              </tr>
            </thead>

            {/* ==================================================
                BODY
            ================================================== */}

            <tbody>
              {reservations.map((reservation, index) => (
                <tr
                  key={reservation.id}
                  onClick={() => onView(reservation)}
                  className="
                    group
                    cursor-pointer
                    border-b
                    border-black/[0.05]
                    transition-all
                    duration-200
                    ease-out
                    last:border-b-0
                    hover:bg-[#fafafa]
                  "
                  style={{
                    animation: `agentReservationRowIn 360ms ease-out ${
                      Math.min(index * 35, 280)
                    }ms both`,
                  }}
                >
                  {/* ==================================================
                      RÉSERVATION
                  ================================================== */}

                  <td className="px-5 py-4">
                    <div>
                      <p className="text-xs font-bold text-black">
                        {reservation.numero}
                      </p>

                      <p className="mt-1 text-[10px] text-black/35">
                        {reservation.source === "CLIENT"
                          ? "Créée par le client"
                          : "Créée par un agent"}
                      </p>
                    </div>
                  </td>

                  {/* ==================================================
                      CLIENT
                  ================================================== */}

                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="
                          flex
                          h-8
                          w-8
                          shrink-0
                          items-center
                          justify-center
                          rounded-full
                          bg-black/[0.05]
                          text-[10px]
                          font-bold
                          text-black/55
                          transition-transform
                          duration-200
                          group-hover:scale-105
                        "
                      >
                        {getClientInitials(
                          reservation.client_nom
                        )}
                      </div>

                      <div className="min-w-0">
                        <p className="max-w-[170px] truncate text-xs font-semibold text-black">
                          {reservation.client_nom}
                        </p>

                        <p className="mt-0.5 flex items-center gap-1 text-[10px] text-black/35">
                          <Mail className="h-3 w-3 shrink-0" />

                          <span>
                            Client K-JOU RENT A CAR
                          </span>
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* ==================================================
                      VÉHICULES
                  ================================================== */}

                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <div
                        className="
                          flex
                          h-8
                          w-8
                          shrink-0
                          items-center
                          justify-center
                          rounded-lg
                          bg-red-50
                          text-red-700
                          transition-transform
                          duration-200
                          group-hover:scale-105
                        "
                      >
                        <CarFront className="h-3.5 w-3.5" />
                      </div>

                      <div className="min-w-0">
                        <p className="max-w-[180px] truncate text-xs font-semibold text-black">
                          {getVehicleLabel(reservation)}
                        </p>

                        <p className="mt-0.5 text-[10px] text-black/35">
                          {reservation.lignes.length} véhicule
                          {reservation.lignes.length > 1
                            ? "s"
                            : ""}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* ==================================================
                      DATES
                  ================================================== */}

                  <td className="px-4 py-4">
                    <div className="flex items-start gap-2">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-black/[0.04] text-black/45">
                        <CalendarDays className="h-3.5 w-3.5" />
                      </div>

                      <div className="min-w-0">
                        <p className="whitespace-nowrap text-xs font-semibold text-black">
                          {formatDate(
                            reservation.date_debut
                          )}
                        </p>

                        <div className="mt-0.5 flex items-center gap-1 whitespace-nowrap text-[10px] text-black/35">
                          <span>au</span>

                          <span>
                            {formatDate(
                              reservation.date_fin
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* ==================================================
                      PAIEMENT
                  ================================================== */}

                  <td className="px-4 py-4">
                    <AgentPaymentStatus
                      status={getPaymentStatus(reservation)}
                    />
                  </td>

                  {/* ==================================================
                      STATUT
                  ================================================== */}

                  <td className="px-4 py-4">
                    <AgentReservationStatus
                      status={reservation.statut}
                    />
                  </td>

                  {/* ==================================================
                      TOTAL
                  ================================================== */}

                  <td className="px-4 py-4 text-right">
                    <div>
                      <p className="whitespace-nowrap text-xs font-bold text-black">
                        {formatAmount(
                          reservation.montant_total
                        )}{" "}
                        HTG
                      </p>

                      {Number(
                        reservation.caution_totale
                      ) > 0 && (
                        <p className="mt-0.5 whitespace-nowrap text-[10px] text-black/35">
                          Caution :{" "}
                          {formatAmount(
                            reservation.caution_totale
                          )}{" "}
                          HTG
                        </p>
                      )}
                    </div>
                  </td>

                  {/* ==================================================
                      ACTIONS
                  ================================================== */}

                  <td
                    className="px-3 py-4"
                    onClick={(event) =>
                      event.stopPropagation()
                    }
                  >
                    <div className="flex items-center justify-end gap-1">
                      <AgentReservationActions
                        status={reservation.statut}
                        onView={() =>
                          onView(reservation)
                        }
                        onValidate={
                          onValidate
                            ? () => onValidate(reservation)
                            : undefined
                        }
                        onEdit={
                          onEdit
                            ? () => onEdit(reservation)
                            : undefined
                        }
                        onCancel={
                          onCancel
                            ? () => onCancel(reservation)
                            : undefined
                        }
                      />

                      <button
                        type="button"
                        onClick={() =>
                          onView(reservation)
                        }
                        aria-label={`Voir ${reservation.numero}`}
                        className="
                          flex
                          h-8
                          w-8
                          items-center
                          justify-center
                          rounded-lg
                          text-black/30
                          transition-all
                          duration-200
                          hover:bg-black/[0.05]
                          hover:text-black
                        "
                      >
                        <ChevronRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================
          MOBILE / TABLET
      ======================================================== */}

      <div className="lg:hidden">
        <div className="divide-y divide-black/[0.06]">
          {reservations.map((reservation, index) => (
            <article
              key={reservation.id}
              onClick={() => onView(reservation)}
              className="
                cursor-pointer
                px-4
                py-4
                transition-all
                duration-200
                ease-out
                hover:bg-[#fafafa]
                active:bg-black/[0.02]
              "
              style={{
                animation: `agentReservationRowIn 360ms ease-out ${
                  Math.min(index * 35, 280)
                }ms both`,
              }}
            >
              {/* ==================================================
                  TOP
              ================================================== */}

              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-black">
                    {reservation.numero}
                  </p>

                  <p className="mt-1 text-[10px] text-black/35">
                    {reservation.source === "CLIENT"
                      ? "Créée par le client"
                      : "Créée par un agent"}
                  </p>
                </div>

                <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-black/25 transition-transform duration-200" />
              </div>

              {/* ==================================================
                  CLIENT
              ================================================== */}

              <div className="mt-4 flex items-center gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black/[0.05] text-[10px] font-bold text-black/55">
                  {getClientInitials(
                    reservation.client_nom
                  )}
                </div>

                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-black">
                    {reservation.client_nom}
                  </p>

                  <p className="mt-0.5 flex items-center gap-1 truncate text-[10px] text-black/35">
                    <Mail className="h-3 w-3 shrink-0" />

                    <span>Client K-JOU RENT A CAR</span>
                  </p>
                </div>
              </div>

              {/* ==================================================
                  VÉHICULE + DATES
              ================================================== */}

              <div className="mt-4 grid grid-cols-2 gap-3">
                {/* Vehicle */}

                <div className="flex min-w-0 items-center gap-2">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-700">
                    <CarFront className="h-3.5 w-3.5" />
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-[11px] font-semibold text-black">
                      {getVehicleLabel(reservation)}
                    </p>

                    <p className="mt-0.5 text-[10px] text-black/35">
                      {reservation.lignes.length} véhicule
                      {reservation.lignes.length > 1
                        ? "s"
                        : ""}
                    </p>
                  </div>
                </div>

                {/* Dates */}

                <div className="flex min-w-0 items-center gap-2">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-black/[0.04] text-black/45">
                    <CalendarDays className="h-3.5 w-3.5" />
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-[11px] font-semibold text-black">
                      {formatDate(
                        reservation.date_debut
                      )}
                    </p>

                    <p className="mt-0.5 truncate text-[10px] text-black/35">
                      au{" "}
                      {formatDate(
                        reservation.date_fin
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* ==================================================
                  STATUS
              ================================================== */}

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <AgentReservationStatus
                  status={reservation.statut}
                />

                <AgentPaymentStatus
                  status={getPaymentStatus(reservation)}
                />
              </div>

              {/* ==================================================
                  TOTAL + ACTIONS
              ================================================== */}

              <div className="mt-4 flex items-end justify-between gap-3">
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-black/30">
                    Total
                  </p>

                  <p className="mt-0.5 text-sm font-bold text-black">
                    {formatAmount(
                      reservation.montant_total
                    )}{" "}
                    HTG
                  </p>

                  {Number(
                    reservation.caution_totale
                  ) > 0 && (
                    <p className="mt-0.5 text-[10px] text-black/35">
                      Caution :{" "}
                      {formatAmount(
                        reservation.caution_totale
                      )}{" "}
                      HTG
                    </p>
                  )}
                </div>

                <div
                  className="flex items-center gap-1"
                  onClick={(event) =>
                    event.stopPropagation()
                  }
                >
                  <AgentReservationActions
                    status={reservation.statut}
                    onView={() =>
                      onView(reservation)
                    }
                    onValidate={
                      onValidate
                        ? () => onValidate(reservation)
                        : undefined
                    }
                    onEdit={
                      onEdit
                        ? () => onEdit(reservation)
                        : undefined
                    }
                    onCancel={
                      onCancel
                        ? () => onCancel(reservation)
                        : undefined
                    }
                  />

                  <button
                    type="button"
                    onClick={() =>
                      onView(reservation)
                    }
                    aria-label={`Voir ${reservation.numero}`}
                    className="
                      flex
                      h-8
                      w-8
                      items-center
                      justify-center
                      rounded-lg
                      text-black/30
                      transition-all
                      duration-200
                      hover:bg-black/[0.05]
                      hover:text-black
                    "
                  >
                    <ChevronRight className="h-4 w-4 transition-transform duration-200 hover:translate-x-0.5" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* ========================================================
          ANIMATION DES LIGNES
      ======================================================== */}

      <style>{`
        @keyframes agentReservationRowIn {
          from {
            opacity: 0;
            transform: translateY(5px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </section>
  );
}