import {
  CarFront,
  CircleCheck,
  CircleOff,
  Gauge,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Wrench,
  X,
} from "lucide-react";

import { useMemo, useState } from "react";

import type {
  Vehicle,
  VehicleStatus,
} from "../../api/services/vehicleService";

import { useVehicles } from "../../hooks/useVehicles";

// ============================================================
// HELPERS
// ============================================================

function formatCategory(category: string): string {
  const labels: Record<string, string> = {
    ECONOMIQUE: "Économique",
    COMPACTE: "Compacte",
    BERLINE: "Berline",
    SUV: "SUV",
    PICKUP: "Pick-up",
    MINIVAN: "Minivan",
    VAN: "Van",
    LUXE: "Luxe",
    SPORT: "Sport",
    AUTRE: "Autre",
  };

  return labels[category] ?? category;
}

function formatNumber(value: number | string | null | undefined): string {
  return new Intl.NumberFormat("fr-FR").format(Number(value ?? 0));
}

function formatPrice(value: number | string | null | undefined): string {
  return `${new Intl.NumberFormat("fr-FR").format(Number(value ?? 0))} HTG`;
}

// ============================================================
// PAGE
// ============================================================

export default function AgentVehicles() {
  const {
    vehicles,
    isLoading,
    error,
    refresh,
  } = useVehicles();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    VehicleStatus | "ALL"
  >("ALL");

  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [showFilters, setShowFilters] = useState(false);

  // ==========================================================
  // CATÉGORIES
  // ==========================================================

  const categories = useMemo(() => {
    return Array.from(
      new Set(
        vehicles
          .map((vehicle) => vehicle.category)
          .filter(Boolean)
      )
    ).sort();
  }, [vehicles]);

  // ==========================================================
  // FILTRAGE
  // ==========================================================

  const filteredVehicles = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return vehicles.filter((vehicle) => {
      const matchesSearch =
        !normalizedSearch ||
        vehicle.brand?.toLowerCase().includes(normalizedSearch) ||
        vehicle.model?.toLowerCase().includes(normalizedSearch) ||
        vehicle.registration_number
          ?.toLowerCase()
          .includes(normalizedSearch);

      const matchesStatus =
        statusFilter === "ALL" ||
        vehicle.status === statusFilter;

      const matchesCategory =
        categoryFilter === "ALL" ||
        vehicle.category === categoryFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesCategory
      );
    });
  }, [
    vehicles,
    search,
    statusFilter,
    categoryFilter,
  ]);

  // ==========================================================
  // STATISTIQUES
  // ==========================================================

  const statistics = useMemo(() => {
    return {
      total: vehicles.length,

      available: vehicles.filter(
        (vehicle) => vehicle.status === "AVAILABLE"
      ).length,

      maintenance: vehicles.filter(
        (vehicle) => vehicle.status === "MAINTENANCE"
      ).length,

      outOfService: vehicles.filter(
        (vehicle) => vehicle.status === "OUT_OF_SERVICE"
      ).length,
    };
  }, [vehicles]);

  // ==========================================================
  // RESET FILTRES
  // ==========================================================

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("ALL");
    setCategoryFilter("ALL");
  };

  // ==========================================================
  // STATUS
  // ==========================================================

  const getStatusLabel = (status: Vehicle["status"]) => {
    switch (status) {
      case "AVAILABLE":
        return "Disponible";

      case "MAINTENANCE":
        return "Maintenance";

      case "OUT_OF_SERVICE":
        return "Hors service";

      default:
        return status;
    }
  };

  const getStatusIcon = (status: Vehicle["status"]) => {
    switch (status) {
      case "AVAILABLE":
        return <CircleCheck size={15} />;

      case "MAINTENANCE":
        return <Wrench size={15} />;

      case "OUT_OF_SERVICE":
        return <CircleOff size={15} />;

      default:
        return null;
    }
  };

  const getStatusClass = (status: Vehicle["status"]) => {
    switch (status) {
      case "AVAILABLE":
        return "bg-green-50 text-green-700 border-green-200";

      case "MAINTENANCE":
        return "bg-amber-50 text-amber-700 border-amber-200";

      case "OUT_OF_SERVICE":
        return "bg-red-50 text-red-700 border-red-200";

      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="min-h-full bg-gray-50 p-4 md:p-6">
      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-black text-white">
              <CarFront size={19} />
            </div>

            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-red-600">
              Parc automobile
            </span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-gray-950">
            Véhicules
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Consultez l’état du parc automobile et les véhicules disponibles.
          </p>
        </div>

        <button
          type="button"
          onClick={refresh}
          disabled={isLoading}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw
            size={16}
            className={isLoading ? "animate-spin" : ""}
          />

          Actualiser
        </button>
      </div>

      {/* ======================================================
          STATISTIQUES
      ====================================================== */}

      <div className="mb-6 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
            Total
          </p>

          <p className="mt-2 text-2xl font-bold text-gray-950">
            {statistics.total}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
            Disponibles
          </p>

          <p className="mt-2 text-2xl font-bold text-green-600">
            {statistics.available}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
            Maintenance
          </p>

          <p className="mt-2 text-2xl font-bold text-amber-600">
            {statistics.maintenance}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
            Hors service
          </p>

          <p className="mt-2 text-2xl font-bold text-red-600">
            {statistics.outOfService}
          </p>
        </div>
      </div>

      {/* ======================================================
          TOOLBAR
      ====================================================== */}

      <div className="mb-4 rounded-2xl border border-gray-200 bg-white p-3 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row">
          {/* SEARCH */}

          <div className="relative flex-1">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Rechercher par marque, modèle ou immatriculation..."
              className="h-10 w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-100"
            />
          </div>

          {/* FILTER BUTTON */}

          <button
            type="button"
            onClick={() => setShowFilters((value) => !value)}
            className={`inline-flex h-10 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-semibold transition ${
              showFilters
                ? "border-red-200 bg-red-50 text-red-600"
                : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            <SlidersHorizontal size={16} />

            Filtres
          </button>
        </div>

        {/* FILTERS */}

        {showFilters && (
          <div className="mt-3 grid gap-3 border-t border-gray-100 pt-3 md:grid-cols-2">
            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value as VehicleStatus | "ALL"
                )
              }
              className="h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
            >
              <option value="ALL">Tous les statuts</option>
              <option value="AVAILABLE">Disponible</option>
              <option value="MAINTENANCE">Maintenance</option>
              <option value="OUT_OF_SERVICE">
                Hors service
              </option>
            </select>

            <select
              value={categoryFilter}
              onChange={(event) =>
                setCategoryFilter(event.target.value)
              }
              className="h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
            >
              <option value="ALL">Toutes les catégories</option>

              {categories.map((category) => (
                <option
                  key={category}
                  value={category}
                >
                  {formatCategory(category)}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* ACTIVE FILTERS */}

        {(search ||
          statusFilter !== "ALL" ||
          categoryFilter !== "ALL") && (
          <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3">
            <p className="text-xs text-gray-500">
              {filteredVehicles.length} véhicule
              {filteredVehicles.length > 1 ? "s" : ""} trouvé
              {filteredVehicles.length > 1 ? "s" : ""}
            </p>

            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:text-red-700"
            >
              <X size={14} />
              Réinitialiser
            </button>
          </div>
        )}
      </div>

      {/* ======================================================
          ERROR
      ====================================================== */}

      {error && (
        <div className="mb-4 flex items-center justify-between gap-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm font-medium text-red-700">
            {error}
          </p>

          <button
            type="button"
            onClick={refresh}
            className="shrink-0 rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-700"
          >
            Réessayer
          </button>
        </div>
      )}

      {/* ======================================================
          TABLE
      ====================================================== */}

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/80">
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Véhicule
                </th>

                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Immatriculation
                </th>

                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Catégorie
                </th>

                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Statut
                </th>

                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Kilométrage
                </th>

                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Tarif / jour
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, index) => (
                  <tr key={index}>
                    <td
                      colSpan={6}
                      className="px-5 py-4"
                    >
                      <div className="h-10 animate-pulse rounded-xl bg-gray-100" />
                    </td>
                  </tr>
                ))
              ) : filteredVehicles.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-16 text-center"
                  >
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 text-gray-400">
                      <CarFront size={22} />
                    </div>

                    <p className="mt-3 text-sm font-semibold text-gray-800">
                      Aucun véhicule trouvé
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      Essayez de modifier vos critères de recherche.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredVehicles.map((vehicle: Vehicle) => (
                  <tr
                    key={vehicle.id}
                    className="transition hover:bg-gray-50/70"
                  >
                    {/* VEHICLE */}

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-11 w-14 shrink-0 overflow-hidden rounded-xl bg-gray-100">
                          {vehicle.images?.length ? (
                            <img
                              src={vehicle.images[0].image}
                              alt={`${vehicle.brand} ${vehicle.model}`}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-gray-400">
                              <CarFront size={20} />
                            </div>
                          )}
                        </div>

                        <div>
                          <p className="text-sm font-bold text-gray-900">
                            {vehicle.brand} {vehicle.model}
                          </p>

                          <p className="text-xs text-gray-400">
                            {vehicle.year}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* REGISTRATION */}

                    <td className="px-5 py-4">
                      <span className="rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700">
                        {vehicle.registration_number}
                      </span>
                    </td>

                    {/* CATEGORY */}

                    <td className="px-5 py-4">
                      <span className="text-sm text-gray-600">
                        {formatCategory(vehicle.category)}
                      </span>
                    </td>

                    {/* STATUS */}

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusClass(
                          vehicle.status
                        )}`}
                      >
                        {getStatusIcon(vehicle.status)}

                        {getStatusLabel(vehicle.status)}
                      </span>
                    </td>

                    {/* MILEAGE */}

                    <td className="px-5 py-4">
                      <div className="inline-flex items-center gap-1.5 text-sm text-gray-600">
                        <Gauge
                          size={15}
                          className="text-gray-400"
                        />

                        {formatNumber(vehicle.mileage)} km
                      </div>
                    </td>

                    {/* PRICE */}

                    <td className="px-5 py-4 text-right">
                      <span className="text-sm font-bold text-gray-900">
                        {formatPrice(vehicle.daily_rate)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* FOOTER */}

        {!isLoading && filteredVehicles.length > 0 && (
          <div className="border-t border-gray-100 bg-gray-50/50 px-5 py-3">
            <p className="text-xs text-gray-500">
              Affichage de{" "}
              <span className="font-semibold text-gray-700">
                {filteredVehicles.length}
              </span>{" "}
              véhicule
              {filteredVehicles.length > 1 ? "s" : ""} sur{" "}
              <span className="font-semibold text-gray-700">
                {vehicles.length}
              </span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

