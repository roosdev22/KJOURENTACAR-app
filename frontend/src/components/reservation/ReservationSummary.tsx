import {
  CalendarDays,
  CarFront,
  Check,
  Clock3,
  Send,
  ShieldCheck,
} from "lucide-react";

import type { Vehicle } from "../../api/services/vehicleService";

interface ReservationSummaryProps {
  dateDebut: string;
  dateFin: string;
  selectedVehicles: Vehicle[];
  canSubmit: boolean;
  isSubmitting: boolean;
  onSubmit: () => void;
}

function formatDate(value: string): string {
  if (!value) return "—";

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatAmount(value: string | number | null | undefined): string {
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

export default function ReservationSummary({
  dateDebut,
  dateFin,
  selectedVehicles,
  canSubmit,
  isSubmitting,
  onSubmit,
}: ReservationSummaryProps) {
  return (
    <aside className="relative overflow-hidden rounded-[24px] border border-neutral-200/80 bg-white shadow-[0_18px_55px_rgba(0,0,0,0.07)]">

      {/* ======================================================
          PREMIUM ACCENT
      ====================================================== */}

      <div
        className="absolute left-0 right-0 top-0 h-[3px] bg-gradient-to-r from-red-600 via-red-500 to-red-700"
        aria-hidden="true"
      />

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="border-b border-neutral-100 px-5 pb-5 pt-6 sm:px-6">

        <div className="flex items-start justify-between gap-4">

          <div>
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-red-100 bg-red-50">
                <Send
                  size={12}
                  strokeWidth={2.2}
                  className="text-red-600"
                />
              </span>

              <p className="text-[8px] font-black uppercase tracking-[0.22em] text-red-600">
                04 · Résumé
              </p>
            </div>

            <h2 className="text-[21px] font-black tracking-[-0.035em] text-neutral-950">
              Votre demande
            </h2>

            <p className="mt-1.5 text-[10px] leading-4 text-neutral-400">
              Vérifiez les détails avant de continuer.
            </p>
          </div>

          {/* Reservation status */}

          <div className="hidden shrink-0 items-center gap-1.5 rounded-xl border border-neutral-200 bg-neutral-50 px-2.5 py-2 sm:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />

            <span className="text-[7px] font-black uppercase tracking-[0.12em] text-neutral-500">
              Prêt
            </span>
          </div>
        </div>
      </div>

      {/* ======================================================
          CONTENT
      ====================================================== */}

      <div className="p-5 sm:p-6">

        {/* ==================================================
            DATES
        ================================================== */}

        <div className="rounded-2xl border border-neutral-200/80 bg-neutral-50/70 p-4">

          <div className="mb-3 flex items-center gap-2">
            <CalendarDays
              size={13}
              strokeWidth={1.8}
              className="text-neutral-400"
            />

            <p className="text-[8px] font-black uppercase tracking-[0.18em] text-neutral-400">
              Période de location
            </p>
          </div>

          <div className="grid grid-cols-2">

            {/* Départ */}

            <div className="border-r border-neutral-200 pr-3">
              <p className="text-[7px] font-black uppercase tracking-[0.15em] text-neutral-400">
                Départ
              </p>

              <p className="mt-1.5 text-[11px] font-black leading-4 text-neutral-950">
                {formatDate(dateDebut)}
              </p>
            </div>

            {/* Retour */}

            <div className="pl-3">
              <p className="text-[7px] font-black uppercase tracking-[0.15em] text-neutral-400">
                Retour
              </p>

              <p className="mt-1.5 text-[11px] font-black leading-4 text-neutral-950">
                {formatDate(dateFin)}
              </p>
            </div>
          </div>
        </div>

        {/* ==================================================
            VEHICLES
        ================================================== */}

        <div className="mt-6">

          <div className="mb-4 flex items-center justify-between">

            <div className="flex items-center gap-2">
              <CarFront
                size={13}
                strokeWidth={1.8}
                className="text-neutral-400"
              />

              <p className="text-[8px] font-black uppercase tracking-[0.18em] text-neutral-400">
                Véhicules sélectionnés
              </p>
            </div>

            <span className="flex h-6 min-w-6 items-center justify-center rounded-lg bg-neutral-950 px-2 text-[8px] font-black text-white">
              {selectedVehicles.length}
            </span>
          </div>

          {selectedVehicles.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-neutral-50/50 px-4 py-8 text-center">

              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200 bg-white">
                <CarFront
                  size={16}
                  strokeWidth={1.4}
                  className="text-neutral-300"
                />
              </div>

              <p className="text-[10px] font-bold text-neutral-400">
                Aucun véhicule sélectionné.
              </p>

              <p className="mt-1 text-[8px] text-neutral-300">
                Sélectionnez un véhicule pour continuer.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-neutral-200/80">

              {selectedVehicles.map((vehicle, index) => (
                <div
                  key={vehicle.id}
                  className={[
                    "group flex items-center justify-between gap-3 bg-white px-3.5 py-3.5",
                    "transition-colors duration-200 hover:bg-neutral-50/80",
                    index !== selectedVehicles.length - 1
                      ? "border-b border-neutral-100"
                      : "",
                  ].join(" ")}
                >

                  {/* Vehicle information */}

                  <div className="flex min-w-0 items-center gap-3">

                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-neutral-200 bg-neutral-50 transition-colors group-hover:border-red-100 group-hover:bg-red-50">
                      <CarFront
                        size={14}
                        strokeWidth={1.7}
                        className="text-neutral-400 transition-colors group-hover:text-red-600"
                      />
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-[11px] font-black tracking-[-0.01em] text-neutral-950">
                        {vehicle.brand} {vehicle.model}
                      </p>

                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-[8px] font-medium text-neutral-400">
                          {vehicle.year}
                        </span>

                        <span className="h-1 w-1 rounded-full bg-neutral-300" />

                        <span className="text-[8px] font-bold uppercase tracking-[0.08em] text-emerald-600">
                          Sélectionné
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Price */}

                  <div className="shrink-0 text-right">
                    <p className="text-[11px] font-black text-neutral-900">
                      {formatAmount(vehicle.daily_rate)}
                    </p>

                    <p className="mt-0.5 text-[7px] font-medium uppercase tracking-[0.08em] text-neutral-400">
                      HTG / jour
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ==================================================
            SERVER CALCULATION NOTICE
        ================================================== */}

        <div className="mt-6 rounded-2xl border border-neutral-200 bg-neutral-50/60 p-4">

          <div className="flex items-start gap-3">

            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-neutral-200 bg-white">
              <ShieldCheck
                size={14}
                strokeWidth={1.7}
                className="text-neutral-500"
              />
            </div>

            <div className="min-w-0">
              <p className="text-[8px] font-black uppercase tracking-[0.13em] text-neutral-700">
                Calcul sécurisé
              </p>

              <p className="mt-1.5 text-[9px] leading-4 text-neutral-500">
                Le montant total, la caution et les règles de disponibilité
                sont calculés et vérifiés par le serveur lors de la création
                de la réservation.
              </p>
            </div>
          </div>
        </div>

        {/* ==================================================
            SUBMIT BUTTON
        ================================================== */}

        <button
          type="button"
          disabled={!canSubmit || isSubmitting}
          onClick={onSubmit}
          className={[
            "group relative mt-5 flex w-full items-center justify-between overflow-hidden rounded-2xl",
            "px-5 py-4",
            "text-[8px] font-black uppercase tracking-[0.14em]",
            "transition-all duration-300",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-red-600/30 focus-visible:ring-offset-2",
            "disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-400",

            canSubmit && !isSubmitting
              ? [
                  "bg-neutral-950 text-white",
                  "shadow-[0_10px_25px_rgba(0,0,0,0.16)]",
                  "hover:bg-red-600",
                  "hover:shadow-[0_12px_28px_rgba(220,38,38,0.22)]",
                ].join(" ")
              : "",
          ].join(" ")}
        >
          {/* Animated red accent */}

          {canSubmit && !isSubmitting && (
            <span
              className="absolute bottom-0 left-0 h-[2px] w-0 bg-white/40 transition-all duration-500 group-hover:w-full"
              aria-hidden="true"
            />
          )}

          <span className="flex items-center gap-2">
            {isSubmitting ? (
              <>
                <Clock3
                  size={12}
                  strokeWidth={2}
                  className="animate-pulse"
                />
                Envoi en cours...
              </>
            ) : (
              <>
                <Send
                  size={12}
                  strokeWidth={2}
                />
                Envoyer la réservation
              </>
            )}
          </span>

          <span
            className={[
              "flex h-7 w-7 items-center justify-center rounded-lg",
              "transition-all duration-300",

              canSubmit && !isSubmitting
                ? "bg-white/10 group-hover:bg-white/20"
                : "bg-neutral-200",
            ].join(" ")}
          >
            {canSubmit && !isSubmitting ? (
              <Check
                size={12}
                strokeWidth={2.5}
              />
            ) : (
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
            )}
          </span>
        </button>

        {/* ==================================================
            FOOTER TRUST
        ================================================== */}

        <div className="mt-4 flex items-center justify-center gap-2">
          <ShieldCheck
            size={10}
            strokeWidth={1.8}
            className="text-neutral-300"
          />

          <p className="text-[7px] font-bold uppercase tracking-[0.12em] text-neutral-300">
            Vérification sécurisée par K-JOU RENT A CAR
          </p>
        </div>
      </div>
    </aside>
  );
}


