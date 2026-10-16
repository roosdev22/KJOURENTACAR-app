
import React, { useEffect, useMemo, useState } from "react";
import {
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  ChevronDown,
  X,
  Fuel,
  Zap,
  Users,
  Gauge,
  Settings2,
  Snowflake,
  CarFront,
  Heart,
  Eye,
  CalendarDays,
  RotateCcw,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import vehicleService, {
  type Vehicle,
} from "../../api/services/vehicleService";

/* ============================================================
   TYPES
============================================================ */

type SortOption =
  | "recommended"
  | "price_asc"
  | "price_desc"
  | "year_desc";

type FilterState = {
  categories: string[];
  brands: string[];
  fuelTypes: string[];
  transmissions: string[];
  maxPrice: number;
};

/* ============================================================
   CONSTANTES DESIGN
============================================================ */

const DEFAULT_MAX_PRICE = 500;

/*
 * Si tes routes utilisent d'autres chemins, modifie uniquement
 * ces deux fonctions.
 */
const getVehicleDetailsPath = (id: string) => `/vehicles/${id}`;

const getReservationPath = (id: string) =>
  `/reservations/new/${id}`;

/* ============================================================
   HELPERS
============================================================ */

function getImageUrl(vehicle: Vehicle): string | null {
  if (!vehicle.images || vehicle.images.length === 0) {
    return null;
  }

  const primaryImage = vehicle.images.find(
    (image) => image.is_primary
  );

  return (
    primaryImage?.image_url ||
    primaryImage?.image ||
    vehicle.images[0]?.image_url ||
    vehicle.images[0]?.image ||
    null
  );
}

function formatPrice(value: string): string {
  const number = Number(value);

  if (Number.isNaN(number)) {
    return value;
  }

  return new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 0,
  }).format(number);
}

function getCategoryLabel(vehicle: Vehicle): string {
  return vehicle.category_display || vehicle.category;
}

function getTransmissionLabel(vehicle: Vehicle): string {
  return vehicle.transmission_display || vehicle.transmission;
}

function getFuelLabel(vehicle: Vehicle): string {
  return vehicle.fuel_type_display || vehicle.fuel_type;
}

function getStatusLabel(vehicle: Vehicle): string {
  if (vehicle.status_display) {
    return vehicle.status_display;
  }

  switch (vehicle.status) {
    case "AVAILABLE":
      return "Disponible";

    case "MAINTENANCE":
      return "En entretien";

    case "OUT_OF_SERVICE":
      return "Hors service";

    default:
      return vehicle.status;
  }
}

function isVehicleAvailable(vehicle: Vehicle): boolean {
  return vehicle.status === "AVAILABLE";
}

function getFuelIcon(fuelType: string) {
  if (fuelType === "ELECTRIC") {
    return <Zap size={15} />;
  }

  return <Fuel size={15} />;
}

/* ============================================================
   BADGE DISPONIBILITÉ
============================================================ */

function AvailabilityBadge({
  vehicle,
}: {
  vehicle: Vehicle;
}) {
  const available = isVehicleAvailable(vehicle);

  return (
   // APRÈS — logique correcte
<span
  className={[
    "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5",
    "text-xs font-semibold",
    available
      ? "bg-green-50 text-green-700"
      : "bg-red-50 text-red-700",
  ].join(" ")}
>
  <span
    className={[
      "h-1.5 w-1.5 rounded-full",
      available ? "bg-green-500" : "bg-red-600",
    ].join(" ")}
  />
  {getStatusLabel(vehicle)}
</span>
  );
}

/* ============================================================
   CARTE VÉHICULE
============================================================ */

function VehicleCard({
  vehicle,
  onDetails,
  onReserve,
}: {
  vehicle: Vehicle;
  onDetails: (vehicle: Vehicle) => void;
  onReserve: (vehicle: Vehicle) => void;
}) {
  const [favorite, setFavorite] = useState(false);

  const imageUrl = getImageUrl(vehicle);
  const available = isVehicleAvailable(vehicle);
  const fuelLabel = getFuelLabel(vehicle);
  const transmissionLabel = getTransmissionLabel(vehicle);

  return (
    <article className="group overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all duration-300 hover:-translate-y-1 hover:border-red-100 hover:shadow-xl hover:shadow-slate-200/60">
      {/* IMAGE */}
      <div className="relative h-56 overflow-hidden bg-slate-100">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={vehicle.display_name || vehicle.full_name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-slate-100">
            <CarFront
              size={54}
              strokeWidth={1.2}
              className="text-slate-300"
            />
          </div>
        )}

        {/* Overlay léger */}
        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-4">
          <AvailabilityBadge vehicle={vehicle} />

          <button
            type="button"
            aria-label={
              favorite
                ? "Retirer des favoris"
                : "Ajouter aux favoris"
            }
            onClick={() => setFavorite((value) => !value)}
            className={[
              "flex h-9 w-9 items-center justify-center rounded-full",
              "bg-white/95 shadow-sm backdrop-blur",
              "transition-colors",
              favorite
                ? "text-red-600"
                : "text-slate-500 hover:text-red-600",
            ].join(" ")}
          >
            <Heart
              size={17}
              fill={favorite ? "currentColor" : "none"}
            />
          </button>
        </div>

        {/* Catégorie */}
        <div className="absolute bottom-3 left-3">
          <span className="rounded-md bg-black/65 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur">
            {getCategoryLabel(vehicle)}
          </span>
        </div>
      </div>

      {/* CONTENU */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-lg font-bold text-slate-900">
              {vehicle.brand} {vehicle.model}
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              {vehicle.year}
              {vehicle.color ? ` • ${vehicle.color}` : ""}
            </p>
          </div>

          <div className="shrink-0 text-right">
            <p className="text-xl font-bold text-red-600">
              {formatPrice(vehicle.daily_rate)}
            </p>

            <p className="text-xs text-slate-400">
              / jour
            </p>
          </div>
        </div>

        {/* CARACTÉRISTIQUES */}
        <div className="mt-5 grid grid-cols-2 gap-2 border-y border-slate-100 py-4">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            {getFuelIcon(vehicle.fuel_type)}
            <span className="truncate">
              {fuelLabel}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-600">
            <Settings2
              size={15}
              className="shrink-0 text-slate-400"
            />
            <span className="truncate">
              {transmissionLabel}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-600">
            <Users
              size={15}
              className="shrink-0 text-slate-400"
            />
            <span>{vehicle.seats} places</span>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-600">
            <Gauge
              size={15}
              className="shrink-0 text-slate-400"
            />
            <span>
              {vehicle.unlimited_mileage
                ? "Km illimités"
                : `${vehicle.mileage.toLocaleString("fr-FR")} km`}
            </span>
          </div>
        </div>

        {/* OPTIONS */}
        <div className="mt-4 flex flex-wrap gap-2">
          {vehicle.air_conditioning && (
            <span className="inline-flex items-center gap-1 rounded-md bg-slate-50 px-2 py-1 text-[11px] text-slate-500">
              <Snowflake size={12} />
              Climatisation
            </span>
          )}

          {vehicle.doors > 0 && (
            <span className="inline-flex items-center gap-1 rounded-md bg-slate-50 px-2 py-1 text-[11px] text-slate-500">
              <CarFront size={12} />
              {vehicle.doors} portes
            </span>
          )}
        </div>

        {/* ACTIONS */}
        <div className="mt-5 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onDetails(vehicle)}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:border-red-200 hover:text-red-600"
          >
            <Eye size={16} />
            Détails
          </button>

          <button
            type="button"
            disabled={!available}
            onClick={() => onReserve(vehicle)}
            className={[
              "inline-flex items-center justify-center gap-2 rounded-xl",
              "px-3 py-2.5 text-sm font-semibold transition-colors",
              available
                ? "bg-red-600 text-white hover:bg-red-700"
                : "cursor-not-allowed bg-slate-100 text-slate-400",
            ].join(" ")}
          >
            <CalendarDays size={16} />

            {available ? "Réserver" : "Indisponible"}
          </button>
        </div>
      </div>
    </article>
  );
}

/* ============================================================
   CHECKBOX
============================================================ */

function FilterCheckbox({
  label,
  checked,
  onChange,
  count,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
  count?: number;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg px-2 py-2 text-sm text-slate-600 transition-colors hover:bg-red-50 hover:text-slate-900">
      <span className="flex min-w-0 items-center gap-2">
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          className="h-4 w-4 rounded border-slate-300 text-red-600 focus:ring-red-500"
        />

        <span className="truncate">{label}</span>
      </span>

      {count !== undefined && (
        <span className="text-xs text-slate-400">
          {count}
        </span>
      )}
    </label>
  );
}

/* ============================================================
   SIDEBAR FILTRES
============================================================ */

function FiltersSidebar({
  vehicles,
  filters,
  setFilters,
  maxAvailablePrice,
  onReset,
}: {
  vehicles: Vehicle[];
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  maxAvailablePrice: number;
  onReset: () => void;
}) {
  const categories = useMemo(() => {
    const values = new Map<string, number>();

    vehicles.forEach((vehicle) => {
      const value = getCategoryLabel(vehicle);

      values.set(value, (values.get(value) || 0) + 1);
    });

    return Array.from(values.entries()).sort((a, b) =>
      a[0].localeCompare(b[0])
    );
  }, [vehicles]);

  const brands = useMemo(() => {
    const values = new Map<string, number>();

    vehicles.forEach((vehicle) => {
      values.set(
        vehicle.brand,
        (values.get(vehicle.brand) || 0) + 1
      );
    });

    return Array.from(values.entries()).sort((a, b) =>
      a[0].localeCompare(b[0])
    );
  }, [vehicles]);

  const fuelTypes = useMemo(() => {
    const values = new Map<string, number>();

    vehicles.forEach((vehicle) => {
      const value = getFuelLabel(vehicle);

      values.set(value, (values.get(value) || 0) + 1);
    });

    return Array.from(values.entries()).sort((a, b) =>
      a[0].localeCompare(b[0])
    );
  }, [vehicles]);

  const transmissions = useMemo(() => {
    const values = new Map<string, number>();

    vehicles.forEach((vehicle) => {
      const value = getTransmissionLabel(vehicle);

      values.set(value, (values.get(value) || 0) + 1);
    });

    return Array.from(values.entries()).sort((a, b) =>
      a[0].localeCompare(b[0])
    );
  }, [vehicles]);

  const toggleValue = (
    key:
      | "categories"
      | "brands"
      | "fuelTypes"
      | "transmissions",
    value: string
  ) => {
    setFilters((current) => {
      const list = current[key];

      return {
        ...current,
        [key]: list.includes(value)
          ? list.filter((item) => item !== value)
          : [...list, value],
      };
    });
  };

  return (
    <aside className="rounded-2xl border border-slate-200 bg-white p-5">
      {/* HEADER */}
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SlidersHorizontal
            size={17}
            className="text-red-600"
          />

          <h2 className="font-bold text-slate-900">
            Filtres
          </h2>
        </div>

        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-700"
        >
          <RotateCcw size={12} />
          Réinitialiser
        </button>
      </div>

      {/* CATÉGORIES */}
      {categories.length > 0 && (
        <div className="border-b border-slate-100 pb-5">
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
            Catégorie
          </h3>

          <div>
            {categories.map(([label, count]) => (
              <FilterCheckbox
                key={label}
                label={label}
                count={count}
                checked={filters.categories.includes(label)}
                onChange={() =>
                  toggleValue("categories", label)
                }
              />
            ))}
          </div>
        </div>
      )}

      {/* MARQUES */}
      {brands.length > 0 && (
        <div className="border-b border-slate-100 py-5">
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
            Marque
          </h3>

          <div>
            {brands.map(([label, count]) => (
              <FilterCheckbox
                key={label}
                label={label}
                count={count}
                checked={filters.brands.includes(label)}
                onChange={() =>
                  toggleValue("brands", label)
                }
              />
            ))}
          </div>
        </div>
      )}

      {/* CARBURANT */}
      {fuelTypes.length > 0 && (
        <div className="border-b border-slate-100 py-5">
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
            Carburant
          </h3>

          {fuelTypes.map(([label, count]) => (
            <FilterCheckbox
              key={label}
              label={label}
              count={count}
              checked={filters.fuelTypes.includes(label)}
              onChange={() =>
                toggleValue("fuelTypes", label)
              }
            />
          ))}
        </div>
      )}

      {/* TRANSMISSION */}
      {transmissions.length > 0 && (
        <div className="border-b border-slate-100 py-5">
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
            Transmission
          </h3>

          {transmissions.map(([label, count]) => (
            <FilterCheckbox
              key={label}
              label={label}
              count={count}
              checked={filters.transmissions.includes(label)}
              onChange={() =>
                toggleValue("transmissions", label)
              }
            />
          ))}
        </div>
      )}

      {/* PRIX */}
      <div className="pt-5">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Prix maximum / jour
          </h3>

          <span className="font-bold text-red-600">
            {formatPrice(String(filters.maxPrice))}
          </span>
        </div>

        <input
          type="range"
          min={0}
          max={maxAvailablePrice}
          step={5}
          value={Math.min(
            filters.maxPrice,
            maxAvailablePrice
          )}
          onChange={(event) =>
            setFilters((current) => ({
              ...current,
              maxPrice: Number(event.target.value),
            }))
          }
          className="w-full accent-red-600"
        />

        <div className="mt-1 flex justify-between text-xs text-slate-400">
          <span>0</span>
          <span>{formatPrice(String(maxAvailablePrice))}</span>
        </div>
      </div>
    </aside>
  );
}

/* ============================================================
   FILTRES MOBILE
============================================================ */

function MobileFilters({
  open,
  onClose,
  vehicles,
  filters,
  setFilters,
  maxAvailablePrice,
  onReset,
}: {
  open: boolean;
  onClose: () => void;
  vehicles: Vehicle[];
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  maxAvailablePrice: number;
  onReset: () => void;
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <button
        type="button"
        aria-label="Fermer les filtres"
        onClick={onClose}
        className="absolute inset-0 bg-black/40"
      />

      <div className="absolute right-0 top-0 h-full w-[88%] max-w-sm overflow-y-auto bg-slate-50 p-4 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">
            Filtres
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm"
          >
            <X size={18} />
          </button>
        </div>

        <FiltersSidebar
          vehicles={vehicles}
          filters={filters}
          setFilters={setFilters}
          maxAvailablePrice={maxAvailablePrice}
          onReset={onReset}
        />

        <button
          type="button"
          onClick={onClose}
          className="mt-4 w-full rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white hover:bg-red-700"
        >
          Afficher les résultats
        </button>
      </div>
    </div>
  );
}

/* ============================================================
   PAGE PRINCIPALE
============================================================ */

export default function VehiculesPage() {
  const navigate = useNavigate();

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState("");

  const [onlyAvailable, setOnlyAvailable] =
    useState(true);

  const [sortBy, setSortBy] =
    useState<SortOption>("recommended");

  const [sortOpen, setSortOpen] = useState(false);

  const [mobileFiltersOpen, setMobileFiltersOpen] =
    useState(false);

  const [filters, setFilters] = useState<FilterState>({
    categories: [],
    brands: [],
    fuelTypes: [],
    transmissions: [],
    maxPrice: DEFAULT_MAX_PRICE,
  });

  /* ==========================================================
     CHARGEMENT API
  ========================================================== */

  useEffect(() => {
    let mounted = true;

    const loadVehicles = async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await vehicleService.getVehicles();

        if (!mounted) {
          return;
        }

        setVehicles(data);

        /*
         * Le prix maximum est calculé à partir des données
         * réelles reçues de Django.
         */
        const prices = data
          .map((vehicle) => Number(vehicle.daily_rate))
          .filter((price) => !Number.isNaN(price));

        if (prices.length > 0) {
          const maximum = Math.ceil(
            Math.max(...prices) / 10
          ) * 10;

          setFilters((current) => ({
            ...current,
            maxPrice: maximum,
          }));
        }
      } catch (err) {
        console.error(
          "[VehiculesPage] Erreur chargement véhicules:",
          err
        );

        if (mounted) {
          setError(
            "Impossible de charger les véhicules pour le moment."
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadVehicles();

    return () => {
      mounted = false;
    };
  }, []);

  /* ==========================================================
     PRIX MAXIMUM
  ========================================================== */

  const maxAvailablePrice = useMemo(() => {
    const prices = vehicles
      .map((vehicle) => Number(vehicle.daily_rate))
      .filter((price) => !Number.isNaN(price));

    if (prices.length === 0) {
      return DEFAULT_MAX_PRICE;
    }

    return Math.max(
      10,
      Math.ceil(Math.max(...prices) / 10) * 10
    );
  }, [vehicles]);

  /* ==========================================================
     FILTRAGE
  ========================================================== */

  const filteredVehicles = useMemo(() => {
    const normalizedQuery = query
      .trim()
      .toLowerCase();

    const result = vehicles.filter((vehicle) => {
      const searchableText = [
        vehicle.brand,
        vehicle.model,
        vehicle.display_name,
        vehicle.full_name,
        getCategoryLabel(vehicle),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesQuery =
        normalizedQuery === "" ||
        searchableText.includes(normalizedQuery);

      const matchesAvailability =
        !onlyAvailable ||
        isVehicleAvailable(vehicle);

      const matchesCategory =
        filters.categories.length === 0 ||
        filters.categories.includes(
          getCategoryLabel(vehicle)
        );

      const matchesBrand =
        filters.brands.length === 0 ||
        filters.brands.includes(vehicle.brand);

      const matchesFuel =
        filters.fuelTypes.length === 0 ||
        filters.fuelTypes.includes(
          getFuelLabel(vehicle)
        );

      const matchesTransmission =
        filters.transmissions.length === 0 ||
        filters.transmissions.includes(
          getTransmissionLabel(vehicle)
        );

      const price = Number(vehicle.daily_rate);

      const matchesPrice =
        Number.isNaN(price) ||
        price <= filters.maxPrice;

      return (
        matchesQuery &&
        matchesAvailability &&
        matchesCategory &&
        matchesBrand &&
        matchesFuel &&
        matchesTransmission &&
        matchesPrice
      );
    });

    /* ========================================================
       TRI
    ======================================================== */

    return [...result].sort((a, b) => {
      const priceA = Number(a.daily_rate);
      const priceB = Number(b.daily_rate);

      switch (sortBy) {
        case "price_asc":
          return priceA - priceB;

        case "price_desc":
          return priceB - priceA;

        case "year_desc":
          return b.year - a.year;

        case "recommended":
        default:
          /*
           * Les véhicules disponibles passent avant les autres.
           * Pour le reste, on garde l'ordre API.
           */
          return (
            Number(isVehicleAvailable(b)) -
            Number(isVehicleAvailable(a))
          );
      }
    });
  }, [
    vehicles,
    query,
    onlyAvailable,
    filters,
    sortBy,
  ]);

  /* ==========================================================
     RESET
  ========================================================== */

  const resetFilters = () => {
    setFilters({
      categories: [],
      brands: [],
      fuelTypes: [],
      transmissions: [],
      maxPrice: maxAvailablePrice,
    });

    setOnlyAvailable(true);
  };

  /* ==========================================================
     NAVIGATION
  ========================================================== */

  const handleDetails = (vehicle: Vehicle) => {
    navigate(getVehicleDetailsPath(vehicle.id));
  };

  const handleReserve = (vehicle: Vehicle) => {
    /*
     * IMPORTANT :
     * Cette navigation ouvre le futur parcours réservation.
     *
     * La vérification du profil devra être faite dans le
     * parcours de réservation ET côté Django.
     */
    navigate(getReservationPath(vehicle.id));
  };

  /* ==========================================================
     LOADING
  ========================================================== */

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="mx-auto flex min-h-[70vh] max-w-7xl items-center justify-center px-6">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50">
              <Loader2
                size={28}
                className="animate-spin text-red-600"
              />
            </div>

            <h1 className="mt-4 text-lg font-bold text-slate-900">
              Chargement des véhicules
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Nous préparons notre flotte pour vous.
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* ==========================================================
     ERROR
  ========================================================== */

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="mx-auto flex min-h-[70vh] max-w-xl items-center justify-center px-6">
          <div className="w-full rounded-2xl border border-red-100 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
              <AlertCircle
                size={28}
                className="text-red-600"
              />
            </div>

            <h1 className="mt-4 text-xl font-bold text-slate-900">
              Une erreur est survenue
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              {error}
            </p>

            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-6 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
            >
              Réessayer
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ==========================================================
     PAGE
  ========================================================== */

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ======================================================
          HEADER
      ====================================================== */}

      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6">
          {/* LOGO */}
          <button
            type="button"
            onClick={() => navigate("/")}
            className="flex items-center gap-2.5"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-600 text-white shadow-sm">
              <CarFront size={21} />
            </div>

            <div className="text-left">
              <p className="text-base font-extrabold tracking-tight text-slate-900">
                Kjou
                <span className="text-red-600">
                  RentACar
                </span>
              </p>

              <p className="hidden text-[10px] font-medium uppercase tracking-widest text-slate-400 sm:block">
                Location automobile
              </p>
            </div>
          </button>

          {/* NAVIGATION */}
          <nav className="hidden items-center gap-7 md:flex">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="text-sm font-medium text-slate-500 transition-colors hover:text-red-600"
            >
              Accueil
            </button>

            <button
              type="button"
              className="text-sm font-semibold text-red-600"
            >
              Véhicules
            </button>

            <button
              type="button"
              onClick={() => navigate("/")}
              className="text-sm font-medium text-slate-500 transition-colors hover:text-red-600"
            >
              Services
            </button>

            <button
              type="button"
              onClick={() => navigate("/")}
              className="text-sm font-medium text-slate-500 transition-colors hover:text-red-600"
            >
              À propos
            </button>

            <button
              type="button"
              onClick={() => navigate("/")}
              className="text-sm font-medium text-slate-500 transition-colors hover:text-red-600"
            >
              Contact
            </button>
          </nav>

          {/* ACTION */}
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-red-200 hover:text-red-600"
          >
            Connexion
          </button>
        </div>
      </header>

      {/* ======================================================
          HERO
      ====================================================== */}

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 pb-8 pt-10 sm:px-6 lg:pb-10 lg:pt-14">
          <div className="max-w-3xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700">
              <CheckCircle2 size={14} />
              Une flotte sélectionnée pour vous
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">
              Trouvez le véhicule
              <span className="text-red-600">
                {" "}
                idéal
              </span>
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
              Découvrez notre sélection de véhicules
              disponibles et choisissez celui qui
              correspond à votre prochain déplacement.
            </p>
          </div>

          {/* RECHERCHE */}
          <div className="mt-8 flex flex-col gap-3 lg:flex-row">
            <div className="relative flex-1">
              <Search
                size={19}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="search"
                value={query}
                onChange={(event) =>
                  setQuery(event.target.value)
                }
                placeholder="Rechercher une marque, un modèle..."
                className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-red-400 focus:ring-4 focus:ring-red-50"
              />

              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() =>
                setMobileFiltersOpen(true)
              }
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 hover:border-red-200 hover:text-red-600 lg:hidden"
            >
              <SlidersHorizontal size={17} />
              Filtres
            </button>

            {/* TRI */}
            <div className="relative">
              <button
                type="button"
                onClick={() =>
                  setSortOpen((value) => !value)
                }
                className="inline-flex h-12 w-full items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-600 hover:border-red-200 hover:text-red-600 lg:w-auto"
              >
                <span className="flex items-center gap-2">
                  <ArrowUpDown size={16} />
                  Trier
                </span>

                <ChevronDown
                  size={16}
                  className={[
                    "transition-transform",
                    sortOpen
                      ? "rotate-180"
                      : "",
                  ].join(" ")}
                />
              </button>

              {sortOpen && (
                <div className="absolute right-0 top-14 z-20 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
                  {[
                    {
                      value: "recommended",
                      label: "Recommandé",
                    },
                    {
                      value: "price_asc",
                      label: "Prix croissant",
                    },
                    {
                      value: "price_desc",
                      label: "Prix décroissant",
                    },
                    {
                      value: "year_desc",
                      label: "Plus récent",
                    },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        setSortBy(
                          option.value as SortOption
                        );
                        setSortOpen(false);
                      }}
                      className={[
                        "flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm",
                        sortBy === option.value
                          ? "bg-red-50 font-semibold text-red-600"
                          : "text-slate-600 hover:bg-slate-50",
                      ].join(" ")}
                    >
                      {option.label}

                      {sortBy === option.value && (
                        <CheckCircle2 size={15} />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================
          CONTENU
      ====================================================== */}

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-10">
        <div className="grid grid-cols-1 gap-7 lg:grid-cols-[240px_minmax(0,1fr)]">
          {/* FILTRES DESKTOP */}
          <div className="hidden lg:block">
            <div className="sticky top-6">
              <FiltersSidebar
                vehicles={vehicles}
                filters={filters}
                setFilters={setFilters}
                maxAvailablePrice={maxAvailablePrice}
                onReset={resetFilters}
              />
            </div>
          </div>

          {/* RÉSULTATS */}
          <section>
            {/* BARRE RESULTATS */}
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-slate-500">
                  Notre flotte
                </p>

                <h2 className="mt-0.5 text-xl font-bold text-slate-900">
                  {filteredVehicles.length} véhicule
                  {filteredVehicles.length !== 1
                    ? "s"
                    : ""}{" "}
                  trouvé
                  {filteredVehicles.length !== 1
                    ? "s"
                    : ""}
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setOnlyAvailable(
                      (value) => !value
                    )
                  }
                  className={[
                    "inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold transition-colors",
                    onlyAvailable
                      ? "border-red-200 bg-red-50 text-red-700"
                      : "border-slate-200 bg-white text-slate-500",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "h-2 w-2 rounded-full",
                      onlyAvailable
                        ? "bg-red-600"
                        : "bg-slate-300",
                    ].join(" ")}
                  />

                  Disponible uniquement
                </button>
              </div>
            </div>

            {/* RESULTATS */}
            {filteredVehicles.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50">
                  <CarFront
                    size={30}
                    className="text-slate-300"
                  />
                </div>

                <h3 className="mt-5 text-lg font-bold text-slate-900">
                  Aucun véhicule trouvé
                </h3>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                  Aucun véhicule ne correspond aux
                  critères sélectionnés. Essayez de
                  modifier votre recherche ou vos filtres.
                </p>

                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    resetFilters();
                  }}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
                >
                  <RotateCcw size={15} />
                  Réinitialiser les filtres
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                {filteredVehicles.map((vehicle) => (
                  <VehicleCard
                    key={vehicle.id}
                    vehicle={vehicle}
                    onDetails={handleDetails}
                    onReserve={handleReserve}
                  />
                ))}
              </div>
            )}

            {/* INFO BAS DE PAGE */}
            {filteredVehicles.length > 0 && (
              <div className="mt-8 flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 p-4">
                <div className="mt-0.5 shrink-0 text-red-600">
                  <CheckCircle2 size={18} />
                </div>

                <div>
                  <p className="text-sm font-semibold text-red-900">
                    Réservation simple et rapide
                  </p>

                  <p className="mt-1 text-xs leading-5 text-red-800/70">
                    Choisissez votre véhicule, indiquez
                    vos dates et poursuivez votre
                    réservation. Si votre profil client
                    n'est pas encore complet, nous vous
                    demanderons de le compléter au moment
                    de la réservation.
                  </p>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>

      {/* ======================================================
          MOBILE FILTERS
      ====================================================== */}

      <MobileFilters
        open={mobileFiltersOpen}
        onClose={() =>
          setMobileFiltersOpen(false)
        }
        vehicles={vehicles}
        filters={filters}
        setFilters={setFilters}
        maxAvailablePrice={maxAvailablePrice}
        onReset={resetFilters}
      />
    </div>
  );
}

