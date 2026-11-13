import type { ReactNode } from "react";

import AdminIcon from "../admin/AdminIcon";
import type {
  Vehicle,
  VehicleCategory,
} from "../../api/services/vehicleService";

// ============================================================
// TYPES
// ============================================================

interface ReservationVehicleGridProps {
  vehicles: Vehicle[];
  selectedCategory: VehicleCategory | "ALL";
  selectedVehicleIds: string[];
  onVehicleSelect: (vehicle: Vehicle) => void;
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  onResetFilters: () => void;
  loading?: boolean;
  disabled?: boolean;
}

// ============================================================
// LABELS
// ============================================================

const categoryLabels: Record<VehicleCategory, string> = {
  ECONOMIQUE: "Économique",
  COMPACTE: "Compacte",
  BERLINE: "Berline",
  SUV: "SUV",
  PICKUP: "Pickup",
  MINIVAN: "Minivan",
  VAN: "Van",
  LUXE: "Luxe",
  SPORT: "Sport",
  AUTRE: "Autre",
};

const transmissionLabels: Record<string, string> = {
  MANUAL: "Manuelle",
  AUTOMATIC: "Automatique",
};

const fuelLabels: Record<string, string> = {
  GASOLINE: "Essence",
  DIESEL: "Diesel",
  HYBRID: "Hybride",
  ELECTRIC: "Électrique",
  LPG: "GPL",
  OTHER: "Autre",
};

// ============================================================
// HELPERS
// ============================================================

function getCategoryLabel(category: Vehicle["category"]): string {
  return categoryLabels[category as VehicleCategory] ?? category;
}

function getTransmissionLabel(value: string): string {
  return transmissionLabels[value] ?? value;
}

function getFuelLabel(value: string): string {
  return fuelLabels[value] ?? value;
}

function getVehicleImage(vehicle: Vehicle): string | null {
  const primaryImage = vehicle.images.find((image) => image.is_primary);
  return primaryImage?.image_url ?? vehicle.images[0]?.image_url ?? null;
}

function formatAmount(
  value: string | number | null | undefined,
): string {
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

function formatMileage(
  value: string | number | null | undefined,
): string {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  const mileage = Number(value);

  if (!Number.isFinite(mileage)) {
    return String(value);
  }

  return `${new Intl.NumberFormat("fr-FR").format(mileage)} km`;
}

// ============================================================
// FEATURE
// ============================================================

function Feature({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-neutral-100 bg-neutral-50 text-neutral-500 transition-colors duration-200 group-hover:border-neutral-200">
        {icon}
      </div>

      <div className="min-w-0">
        <p className="truncate text-[9px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
          {label}
        </p>

        <p className="mt-0.5 truncate text-[11px] font-bold text-neutral-800">
          {value}
        </p>
      </div>
    </div>
  );
}

// ============================================================
// SKELETON
// ============================================================

function VehicleSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
      <div className="aspect-[16/8] animate-pulse bg-neutral-100" />

      <div className="space-y-4 p-4">
        <div className="h-2 w-20 animate-pulse rounded bg-neutral-200" />

        <div className="h-5 w-2/3 animate-pulse rounded bg-neutral-200" />

        <div className="grid grid-cols-2 gap-3">
          <div className="h-8 animate-pulse rounded-lg bg-neutral-100" />
          <div className="h-8 animate-pulse rounded-lg bg-neutral-100" />
          <div className="h-8 animate-pulse rounded-lg bg-neutral-100" />
          <div className="h-8 animate-pulse rounded-lg bg-neutral-100" />
        </div>

        <div className="h-9 w-36 animate-pulse rounded-lg bg-neutral-200" />
      </div>
    </div>
  );
}

// ============================================================
// COMPONENT
// ============================================================

export default function ReservationVehicleGrid({
  vehicles,
  selectedCategory,
  selectedVehicleIds,
  onVehicleSelect,
  searchQuery,
  onSearchQueryChange,
  onResetFilters,
  loading = false,
  disabled = false,
}: ReservationVehicleGridProps) {
  const availableVehicles = vehicles.filter(
    (vehicle) => vehicle.status === "AVAILABLE",
  );
  const normalizedSearch = searchQuery.trim().toLocaleLowerCase("fr");

  const filteredVehicles = availableVehicles.filter((vehicle) => {
    const matchesCategory =
      selectedCategory === "ALL" ||
      vehicle.category === selectedCategory;
    const matchesSearch =
      !normalizedSearch ||
      `${vehicle.brand} ${vehicle.model} ${vehicle.category_display ?? vehicle.category}`
        .toLocaleLowerCase("fr")
        .includes(normalizedSearch);

    return matchesCategory && matchesSearch;
  });

  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <section className="bg-neutral-50">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-6">
            <div className="h-2 w-24 animate-pulse rounded bg-neutral-200" />

            <div className="mt-3 h-7 w-56 animate-pulse rounded bg-neutral-200" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <VehicleSkeleton key={index} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  // ==========================================================
  // EMPTY
  // ==========================================================

  if (filteredVehicles.length === 0) {
    return (
      <section className="bg-neutral-50">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-[#E3E6E8] bg-white px-6 py-12 text-center shadow-sm">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl border border-neutral-200 bg-neutral-50">
              <AdminIcon name="car-front" size={19} className="text-neutral-400" />
            </div>

            <span className="mx-auto mt-4 block h-[2px] w-10 bg-[#B4232F]" />

            <h3 className="mt-4 text-xl font-bold tracking-tight text-[#202327]">
              {vehicles.length === 0
                ? "Aucun véhicule disponible"
                : "Aucun résultat pour ces critères"}
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#64748B]">
              {vehicles.length === 0
                ? "Aucun véhicule n'est actuellement proposé à la réservation."
                : "Aucun véhicule disponible ne correspond à la recherche et à la catégorie sélectionnées."}
            </p>
            {vehicles.length > 0 && (
              <button
                type="button"
                onClick={onResetFilters}
                className="mt-5 rounded-lg border border-[#E3E6E8] px-4 py-2 text-sm font-semibold text-[#202327] transition hover:border-[#B4232F] hover:text-[#B4232F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B4232F] focus-visible:ring-offset-2"
              >
                Effacer les filtres
              </button>
            )}
          </div>
        </div>
      </section>
    );
  }

  // ==========================================================
  // GRID
  // ==========================================================

  return (
    <section className="bg-neutral-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

        {/* ====================================================
            HEADER
        ==================================================== */}

        <div className="mb-6 flex items-end justify-between gap-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-[2px] w-7 bg-red-600" />

              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#B4232F]">
                Parc automobile
              </p>
            </div>

            <h2 className="mt-2 text-2xl font-bold tracking-tight text-[#202327] sm:text-[26px]">
              Choisissez votre véhicule
            </h2>

            <p className="mt-1 text-sm text-[#64748B]">
              Consultez les équipements et tarifs, puis choisissez le véhicule à réserver.
            </p>
          </div>

          <div className="flex w-full items-center gap-2 rounded-xl border border-[#E3E6E8] bg-white px-3.5 py-2.5 sm:w-auto">
            <AdminIcon name="search" size={17} className="shrink-0 text-[#64748B]" />
            <label className="sr-only" htmlFor="vehicle-search">
              Rechercher un véhicule
            </label>
            <input
              id="vehicle-search"
              type="search"
              value={searchQuery}
              onChange={(event) => onSearchQueryChange(event.target.value)}
              placeholder="Marque, modèle ou catégorie"
              disabled={disabled}
              className="min-w-0 flex-1 bg-transparent text-sm text-[#202327] outline-none placeholder:text-[#64748B] focus-visible:ring-0 disabled:cursor-not-allowed sm:w-56"
            />
            <span className="hidden border-l border-[#E3E6E8] pl-3 text-xs font-semibold text-[#64748B] sm:block">
              {filteredVehicles.length} disponible{filteredVehicles.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        {/* ====================================================
            VEHICLES
        ==================================================== */}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredVehicles.map((vehicle) => {
            const selected = selectedVehicleIds.includes(vehicle.id);
            const image = getVehicleImage(vehicle);

            return (
              <article
                key={vehicle.id}
                className={[
                  "group relative overflow-hidden rounded-2xl border bg-white",
                  "transition-all duration-300",
                  selected
                    ? [
                        "border-red-600",
                        "shadow-[0_10px_30px_rgba(220,38,38,0.10)]",
                      ].join(" ")
                    : [
                        "border-neutral-200",
                        "shadow-[0_4px_18px_rgba(0,0,0,0.035)]",
                        "hover:-translate-y-0.5",
                        "hover:border-neutral-300",
                        "hover:shadow-[0_12px_30px_rgba(0,0,0,0.07)]",
                      ].join(" "),
                ].join(" ")}
              >

                {/* ==================================================
                    IMAGE
                ================================================== */}

                <div className="relative aspect-[16/8] overflow-hidden rounded-t-2xl bg-neutral-100">
                  {image ? (
                    <img
                      src={image}
                      alt={`${vehicle.brand} ${vehicle.model}`}
                      className={[
                        "h-full w-full object-cover",
                        "transition-transform duration-700",
                        "group-hover:scale-[1.04]",
                      ].join(" ")}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/80">
                        <AdminIcon name="car-front" size={25} className="text-neutral-300" />
                      </div>
                    </div>
                  )}

                  {/* IMAGE OVERLAY */}

                  <div
                    className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/5"
                    aria-hidden="true"
                  />

                  {/* CATEGORY */}

                  <div className="absolute left-3 top-3 rounded-lg border border-white/70 bg-white/92 px-2.5 py-1.5 shadow-sm backdrop-blur-md">
                    <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#B4232F]">
                      {getCategoryLabel(vehicle.category)}
                    </span>
                  </div>

                  {/* SELECTED */}

                  {selected && (
                    <div className="absolute right-3 top-3 flex items-center gap-1.5 rounded-lg bg-red-600 px-2.5 py-1.5 text-white shadow-lg">
                      <AdminIcon name="check" size={12} strokeWidth={3} />

                      <span className="text-[8px] font-black uppercase tracking-[0.08em]">
                        Sélectionné
                      </span>
                    </div>
                  )}

                  {/* IMAGE ACCENT */}

                  <div
                    className={[
                      "absolute bottom-0 left-0 h-[3px] bg-red-600",
                      "transition-all duration-300",
                      selected
                        ? "w-full"
                        : "w-0 group-hover:w-1/3",
                    ].join(" ")}
                    aria-hidden="true"
                  />
                </div>

                {/* ==================================================
                    CONTENT
                ================================================== */}

                <div className="p-4">

                  {/* ==================================================
                      TITLE
                  ================================================== */}

                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#64748B]">
                        {vehicle.year}
                      </p>

                      <h3 className="mt-1 truncate text-lg font-bold tracking-tight text-[#202327]">
                        {vehicle.brand} {vehicle.model}
                      </h3>
                    </div>

                    <div className="flex shrink-0 items-center gap-1.5 rounded-lg border border-emerald-100 bg-emerald-50 px-2 py-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />

                      <span className="text-[8px] font-bold uppercase tracking-[0.08em] text-emerald-700">
                        Disponible
                      </span>
                    </div>
                  </div>

                  {/* ==================================================
                      FEATURES
                  ================================================== */}

                  <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-neutral-100 pt-4">

                    <Feature
                      icon={
                        <AdminIcon name="gauge" size={15} />
                      }
                      label="Transmission"
                      value={getTransmissionLabel(
                        vehicle.transmission,
                      )}
                    />

                    <Feature
                      icon={
                        <AdminIcon name="fuel" size={15} />
                      }
                      label="Carburant"
                      value={getFuelLabel(vehicle.fuel_type)}
                    />

                    <Feature
                      icon={
                        <AdminIcon name="users" size={15} />
                      }
                      label="Places"
                      value={`${vehicle.seats ?? "—"} places`}
                    />

                    <Feature
                      icon={
                        <AdminIcon name="door-open" size={15} />
                      }
                      label="Portes"
                      value={`${vehicle.doors ?? "—"} portes`}
                    />

                    <Feature
                      icon={
                        <AdminIcon name="snowflake" size={15} />
                      }
                      label="Climatisation"
                      value={
                        vehicle.air_conditioning
                          ? "Disponible"
                          : "Non disponible"
                      }
                    />

                    <Feature
                      icon={
                        <AdminIcon name="gauge" size={15} />
                      }
                      label="Kilométrage"
                      value={formatMileage(vehicle.mileage)}
                    />
                  </div>

                  {/* ==================================================
                      PRICE
                  ================================================== */}

                  <div className="mt-4 flex items-end justify-between border-t border-neutral-100 pt-4">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#64748B]">
                        Tarif journalier
                      </p>

                      <div className="mt-1 flex items-baseline gap-1">
                        <span className="text-lg font-bold tracking-tight text-[#202327]">
                          {formatAmount(vehicle.daily_rate)}
                        </span>

                        <span className="text-xs font-medium text-[#64748B]">
                          HTG / jour
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#64748B]">
                        Caution
                      </p>

                      <p className="mt-1 text-sm font-semibold text-[#202327]">
                        {vehicle.deposit === null
                          ? "—"
                          : `${formatAmount(vehicle.deposit)} HTG`}
                      </p>
                    </div>
                  </div>

                  {/* ==================================================
                      COMPACT RED BUTTON
                  ================================================== */}

                  <div className="mt-4 flex justify-end">
                    <button
                      type="button"
                      disabled={disabled}
                      aria-pressed={selected}
                      aria-label={
                        selected
                          ? `Désélectionner ${vehicle.brand} ${vehicle.model}`
                          : `Sélectionner ${vehicle.brand} ${vehicle.model}`
                      }
                      onClick={() => onVehicleSelect(vehicle)}
                      className={[
                        "inline-flex h-9 items-center gap-2",
                        "rounded-lg px-3.5",
                        "text-[9px] font-black uppercase tracking-[0.09em]",
                        "text-white",
                        "transition-all duration-200",
                        "focus:outline-none focus:ring-2 focus:ring-red-600/25 focus:ring-offset-2",
                        "disabled:cursor-not-allowed disabled:opacity-50",
                        selected
                          ? [
                              "bg-red-600",
                              "shadow-[0_5px_15px_rgba(220,38,38,0.20)]",
                              "hover:bg-red-700",
                            ].join(" ")
                          : [
                              "bg-red-600",
                              "shadow-[0_4px_12px_rgba(220,38,38,0.15)]",
                              "hover:bg-red-700",
                              "hover:shadow-[0_6px_17px_rgba(220,38,38,0.22)]",
                            ].join(" "),
                      ].join(" ")}
                    >
                      {selected ? (
                        <>
                          <AdminIcon name="check" size={13} strokeWidth={3} />

                          <span>Retirer</span>
                        </>
                      ) : (
                        <>
                          <AdminIcon name="car-front" size={13} strokeWidth={2} />

                          <span>Choisir</span>

                          <AdminIcon name="chevron-right" size={13} strokeWidth={2.5} />
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* ==================================================
                    SELECTED FRAME
                ================================================== */}

                {selected && (
                  <div
                    className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-red-600"
                    aria-hidden="true"
                  />
                )}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}



