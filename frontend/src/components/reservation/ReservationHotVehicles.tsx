import {
  ArrowUpRight,
  CarFront,
  Check,
  Sparkles,
} from "lucide-react";

import type { Vehicle } from "../../api/services/vehicleService";

// ============================================================
// TYPES
// ============================================================

interface ReservationHotVehiclesProps {
  vehicles: Vehicle[];
  selectedVehicleIds: string[];
  onVehicleSelect: (vehicle: Vehicle) => void;
  disabled?: boolean;
}

// ============================================================
// HELPERS
// ============================================================

function getVehicleImage(vehicle: Vehicle): string | null {
  const primaryImage = vehicle.images.find(
    (image) => image.is_primary
  );

  if (primaryImage?.image_url) {
    return primaryImage.image_url;
  }

  const firstImage = vehicle.images[0];

  return firstImage?.image_url ?? null;
}

function formatPrice(value: string): string {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return value;
  }

  return new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

// ============================================================
// COMPONENT
// ============================================================

export default function ReservationHotVehicles({
  vehicles,
  selectedVehicleIds,
  onVehicleSelect,
  disabled = false,
}: ReservationHotVehiclesProps) {
  const recommendedVehicles = vehicles.slice(0, 4);

  if (recommendedVehicles.length === 0) {
    return null;
  }

  return (
    <section className="relative overflow-hidden border-y border-neutral-200/70 bg-white py-12 sm:py-14 lg:py-16">
      {/* ======================================================
          BACKGROUND DETAILS
      ====================================================== */}

      <div
        className="pointer-events-none absolute -left-32 top-20 h-72 w-72 rounded-full bg-red-600/[0.035] blur-3xl"
        aria-hidden="true"
      />

      <div
        className="pointer-events-none absolute -right-32 bottom-0 h-80 w-80 rounded-full bg-neutral-900/[0.025] blur-3xl"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-[1380px] px-4 sm:px-6 lg:px-8">

        {/* ==================================================
            HEADER
        ================================================== */}

        <div className="mb-8 flex flex-col gap-5 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">

            {/* Eyebrow */}

            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-red-100 bg-red-50">
                <Sparkles
                  size={13}
                  strokeWidth={2.4}
                  className="text-red-600"
                />
              </span>

              <span className="text-[9px] font-black uppercase tracking-[0.24em] text-red-600">
                Notre sélection
              </span>
            </div>

            {/* Title */}

            <h2 className="text-[26px] font-black leading-[1.05] tracking-[-0.035em] text-neutral-950 sm:text-3xl lg:text-[34px]">
              Des véhicules
              <br className="sm:hidden" /> sélectionnés pour vous.
            </h2>

            <p className="mt-3 max-w-xl text-[12px] leading-5 text-neutral-500 sm:text-[13px]">
              Découvrez une sélection de véhicules disponibles,
              soigneusement choisis pour faciliter votre réservation.
            </p>
          </div>

          {/* Right metadata */}

          <div className="flex shrink-0 items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-neutral-400">
                Disponibilité
              </p>

              <p className="mt-1 text-[12px] font-black text-neutral-900">
                Sélection en temps réel
              </p>
            </div>

            <div className="h-10 w-px bg-neutral-200" />

            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200 bg-neutral-50">
              <CarFront
                size={16}
                strokeWidth={1.7}
                className="text-neutral-500"
              />
            </div>
          </div>
        </div>

        {/* ==================================================
            VEHICLES GRID
        ================================================== */}

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {recommendedVehicles.map((vehicle, index) => {
            const isSelected = selectedVehicleIds.includes(vehicle.id);
            const imageUrl = getVehicleImage(vehicle);

            return (
              <button
                key={vehicle.id}
                type="button"
                disabled={disabled}
                onClick={() => onVehicleSelect(vehicle)}
                aria-pressed={isSelected}
                className={[
                  "group relative w-full overflow-hidden rounded-[22px] border bg-white text-left",
                  "transition-all duration-500 ease-out",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-red-600/30 focus-visible:ring-offset-4",

                  isSelected
                    ? [
                        "border-red-600",
                        "shadow-[0_20px_55px_rgba(220,38,38,0.13)]",
                      ].join(" ")
                    : [
                        "border-neutral-200/80",
                        "shadow-[0_8px_35px_rgba(0,0,0,0.045)]",
                        "hover:-translate-y-1.5",
                        "hover:border-neutral-300",
                        "hover:shadow-[0_22px_55px_rgba(0,0,0,0.10)]",
                      ].join(" "),

                  disabled
                    ? "cursor-not-allowed opacity-50"
                    : "cursor-pointer",
                ].join(" ")}
              >
                {/* ==================================================
                    IMAGE AREA
                ================================================== */}

                <div className="relative aspect-[1.28/1] overflow-hidden bg-neutral-100">

                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={`${vehicle.brand} ${vehicle.model}`}
                      className={[
                        "h-full w-full object-cover",
                        "transition-transform duration-700 ease-out",
                        "group-hover:scale-[1.055]",
                      ].join(" ")}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <CarFront
                        size={42}
                        strokeWidth={1}
                        className="text-neutral-300"
                      />
                    </div>
                  )}

                  {/* Premium image overlay */}

                  <div
                    className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/[0.03] to-black/10"
                    aria-hidden="true"
                  />

                  {/* Top line */}

                  <div
                    className={[
                      "absolute left-0 right-0 top-0 h-[2px]",
                      "bg-red-600",
                      "transition-transform duration-500",
                      isSelected
                        ? "scale-x-100"
                        : "origin-left scale-x-0 group-hover:scale-x-100",
                    ].join(" ")}
                    aria-hidden="true"
                  />

                  {/* ==================================================
                      INDEX
                  ================================================== */}

                  <div className="absolute left-3.5 top-3.5 flex h-7 min-w-7 items-center justify-center rounded-lg border border-white/20 bg-black/25 px-2 backdrop-blur-md">
                    <span className="text-[8px] font-black tracking-[0.12em] text-white">
                      0{index + 1}
                    </span>
                  </div>

                  {/* ==================================================
                      AVAILABILITY
                  ================================================== */}

                  <div className="absolute right-3.5 top-3.5 flex items-center gap-1.5 rounded-lg border border-white/25 bg-black/25 px-2.5 py-1.5 backdrop-blur-md">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    </span>

                    <span className="text-[7px] font-black uppercase tracking-[0.14em] text-white">
                      Disponible
                    </span>
                  </div>

                  {/* ==================================================
                      SELECTED STATE
                  ================================================== */}

                  {isSelected && (
                    <div className="absolute bottom-3.5 left-3.5 flex items-center gap-2 rounded-xl bg-red-600 px-3 py-2 text-white shadow-[0_8px_22px_rgba(220,38,38,0.30)]">
                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white/20">
                        <Check
                          size={10}
                          strokeWidth={3}
                        />
                      </span>

                      <span className="text-[7px] font-black uppercase tracking-[0.13em]">
                        Sélectionné
                      </span>
                    </div>
                  )}

                  {/* Bottom hover action */}

                  {!isSelected && (
                    <div className="absolute bottom-3.5 right-3.5 flex h-9 w-9 translate-y-2 items-center justify-center rounded-xl border border-white/20 bg-black/25 text-white opacity-0 backdrop-blur-md transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                      <ArrowUpRight
                        size={15}
                        strokeWidth={1.8}
                      />
                    </div>
                  )}
                </div>

                {/* ==================================================
                    CONTENT
                ================================================== */}

                <div className="p-4 sm:p-[18px]">

                  {/* Vehicle identity */}

                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">

                      <p className="mb-1 text-[8px] font-black uppercase tracking-[0.18em] text-red-600">
                        {vehicle.category_display ?? vehicle.category}
                      </p>

                      <h3 className="truncate text-[15px] font-black tracking-[-0.02em] text-neutral-950">
                        {vehicle.brand} {vehicle.model}
                      </h3>
                    </div>

                    <div
                      className={[
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                        "border transition-all duration-300",
                        isSelected
                          ? "border-red-100 bg-red-50 text-red-600"
                          : "border-neutral-200 bg-neutral-50 text-neutral-400 group-hover:border-red-100 group-hover:bg-red-50 group-hover:text-red-600",
                      ].join(" ")}
                    >
                      <CarFront
                        size={14}
                        strokeWidth={1.7}
                      />
                    </div>
                  </div>

                  {/* Divider */}

                  <div className="my-4 h-px bg-neutral-100" />

                  {/* Bottom information */}

                  <div className="flex items-end justify-between gap-3">

                    {/* Price */}

                    <div>
                      <p className="text-[8px] font-bold uppercase tracking-[0.14em] text-neutral-400">
                        Tarif journalier
                      </p>

                      <div className="mt-1 flex items-baseline gap-1">
                        <span className="text-[19px] font-black tracking-[-0.03em] text-neutral-950">
                          {formatPrice(vehicle.daily_rate)}
                        </span>

                        <span className="text-[9px] font-medium text-neutral-400">
                          HTG / jour
                        </span>
                      </div>
                    </div>

                    {/* CTA */}

                    <span
                      className={[
                        "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl px-3",
                        "text-[7px] font-black uppercase tracking-[0.12em]",
                        "transition-all duration-300",

                        isSelected
                          ? [
                              "bg-red-600 text-white",
                              "shadow-[0_7px_18px_rgba(220,38,38,0.22)]",
                            ].join(" ")
                          : [
                              "border border-neutral-200 bg-neutral-950 text-white",
                              "shadow-[0_5px_15px_rgba(0,0,0,0.10)]",
                              "group-hover:bg-red-600",
                              "group-hover:border-red-600",
                              "group-hover:shadow-[0_8px_20px_rgba(220,38,38,0.20)]",
                            ].join(" "),
                      ].join(" ")}
                    >
                      {isSelected ? (
                        <>
                          <Check
                            size={10}
                            strokeWidth={3}
                          />
                          Choisi
                        </>
                      ) : (
                        <>
                          Choisir
                          <ArrowUpRight
                            size={10}
                            strokeWidth={2.5}
                          />
                        </>
                      )}
                    </span>
                  </div>
                </div>

                {/* ==================================================
                    SELECTED FRAME
                ================================================== */}

                {isSelected && (
                  <div
                    className="pointer-events-none absolute inset-0 rounded-[22px] ring-1 ring-inset ring-red-600"
                    aria-hidden="true"
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* ==================================================
            FOOTER NOTE
        ================================================== */}

        <div className="mt-6 flex items-center justify-center gap-2">
          <span className="h-px w-8 bg-neutral-200" />

          <p className="text-[8px] font-bold uppercase tracking-[0.16em] text-neutral-400">
            Sélectionnez un ou plusieurs véhicules
          </p>

          <span className="h-px w-8 bg-neutral-200" />
        </div>
      </div>
    </section>
  );
}