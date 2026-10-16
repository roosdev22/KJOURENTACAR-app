import {
  Car,
  Plus,
  Search,
  SlidersHorizontal,
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
  Wrench,
  CheckCircle2,
  CircleOff,
  RefreshCw,
  Gauge,
  X,
  AlertTriangle,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  vehicleService,
  type Vehicle,
  type VehicleStatus,
} from "../../api/services/vehicleService";

import CreateVehicleModal from "../../components/gestionnaire/vehicles/CreateVehicleModal";
import EditVehicleModal from "../../components/gestionnaire/vehicles/EditVehicleModal";
import VehicleDetailsModal from "../../components/gestionnaire/vehicles/VehicleDetailsModal";

// ============================================================
// PAGE
// ============================================================

export default function GestionnaireVehicles() {
  // ==========================================================
  // STATE
  // ==========================================================

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] =
    useState<"ALL" | VehicleStatus>("ALL");

  const [categoryFilter, setCategoryFilter] =
    useState("ALL");

  const [showFilters, setShowFilters] =
    useState(false);

  const [openMenu, setOpenMenu] =
    useState<string | number | null>(null);

  const [selectedVehicle, setSelectedVehicle] =
    useState<Vehicle | null>(null);

  const [showCreateModal, setShowCreateModal] =
    useState(false);

  const [showEditModal, setShowEditModal] =
    useState(false);

  const [showDetailsModal, setShowDetailsModal] =
    useState(false);

  // ==========================================================
  // LOAD VEHICLES
  // ==========================================================

  const loadVehicles = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await vehicleService.getVehicles();

      setVehicles(data);
    } catch (err) {
      console.error(
        "Erreur chargement véhicules:",
        err,
      );

      setError(
        "Impossible de charger les véhicules.",
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadVehicles();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  // ==========================================================
  // CATEGORIES
  // ==========================================================

  const categories = useMemo(() => {
    return Array.from(
      new Set(
        vehicles
          .map((vehicle) => vehicle.category)
          .filter(Boolean),
      ),
    );
  }, [vehicles]);

  // ==========================================================
  // FILTERED VEHICLES
  // ==========================================================

  const filteredVehicles = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    return vehicles.filter((vehicle) => {
      const text =
        `${vehicle.brand} ${vehicle.model} ${vehicle.registration_number}`
          .toLowerCase();

      const matchesSearch =
        !query || text.includes(query);

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
  // STATISTICS
  // ==========================================================

  const statistics = useMemo(() => {
    return {
      total: vehicles.length,

      available: vehicles.filter(
        (vehicle) =>
          vehicle.status === "AVAILABLE",
      ).length,

      maintenance: vehicles.filter(
        (vehicle) =>
          vehicle.status === "MAINTENANCE",
      ).length,

      outOfService: vehicles.filter(
        (vehicle) =>
          vehicle.status === "OUT_OF_SERVICE",
      ).length,
    };
  }, [vehicles]);

  // ==========================================================
  // DELETE
  // ==========================================================

  const handleDelete = async (
    vehicle: Vehicle,
  ) => {
    const confirmed = window.confirm(
      `Supprimer ${vehicle.brand} ${vehicle.model} ?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setError(null);

      await vehicleService.deleteVehicle(
        vehicle.id,
      );

      setVehicles((current) =>
        current.filter(
          (item) => item.id !== vehicle.id,
        ),
      );

      setOpenMenu(null);

      // Si le véhicule supprimé était sélectionné
      if (
        selectedVehicle?.id === vehicle.id
      ) {
        setSelectedVehicle(null);
      }
    } catch (err) {
      console.error(
        "Erreur suppression véhicule:",
        err,
      );

      setError(
        "Impossible de supprimer le véhicule.",
      );
    }
  };

  // ==========================================================
  // RESET FILTERS
  // ==========================================================

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("ALL");
    setCategoryFilter("ALL");
  };

  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-64 animate-pulse rounded-xl bg-gray-200" />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map(
            (_, index) => (
              <div
                key={index}
                className="h-32 animate-pulse rounded-2xl bg-gray-100"
              />
            ),
          )}
        </div>

        <div className="h-[500px] animate-pulse rounded-2xl bg-gray-100" />
      </div>
    );
  }

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="min-h-full space-y-6 pb-10">
      {/* ======================================================
          HEADER
      ====================================================== */}

      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
            <Car className="h-4 w-4" />

            Parc automobile
          </div>

          <h1 className="mt-2 text-3xl font-black tracking-tight text-gray-900">
            Véhicules
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Gérez votre flotte automobile
            depuis un seul espace.
          </p>
        </div>

        <div className="flex gap-2">
          <button
  type="button"
  onClick={() => { void loadVehicles(); }}
  className="cursor-pointer inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
>
  <RefreshCw className="h-4 w-4 text-gray-500" />
  Actualiser
</button>

<button
  type="button"
  onClick={() => { setShowCreateModal(true); }}
  className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-red-600/20 transition hover:bg-red-700 active:bg-red-800"
>
  <Plus className="h-4 w-4" />
  Ajouter
</button>
        </div>
      </header>

      {/* ======================================================
          ERROR
      ====================================================== */}

      {error && (
        <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />

            {error}
          </div>

          <button
            type="button"
            onClick={() => {
              setError(null);
            }}
            aria-label="Fermer"
            className="rounded-lg p-1 hover:bg-red-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ======================================================
          KPI
      ====================================================== */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          label="Total véhicules"
          value={statistics.total}
          icon={Car}
          description="Dans votre flotte"
        />

        <Kpi
          label="Disponibles"
          value={statistics.available}
          icon={CheckCircle2}
          description="Prêts à louer"
        />

        <Kpi
          label="Maintenance"
          value={statistics.maintenance}
          icon={Wrench}
          description="Actuellement immobilisés"
        />

        <Kpi
          label="Hors service"
          value={statistics.outOfService}
          icon={CircleOff}
          description="Indisponibles"
        />
      </div>

      {/* ======================================================
          TOOLBAR
      ====================================================== */}

      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row">
          {/* SEARCH */}

          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
              }}
              placeholder="Rechercher une marque, un modèle ou une plaque..."
              className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-4 text-sm outline-none focus:border-gray-400 focus:bg-white"
            />
          </div>

          {/* STATUS */}

          <select
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(
                event.target.value as
                  | "ALL"
                  | VehicleStatus,
              );
            }}
            className="h-11 rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium outline-none focus:border-gray-400"
          >
            <option value="ALL">
              Tous les statuts
            </option>

            <option value="AVAILABLE">
              Disponibles
            </option>

            <option value="MAINTENANCE">
              Maintenance
            </option>

            <option value="OUT_OF_SERVICE">
              Hors service
            </option>
          </select>

          {/* FILTER BUTTON */}

          <button
            type="button"
            onClick={() => {
              setShowFilters(
                (value) => !value,
              );
            }}
            className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-semibold ${
              showFilters
                ? "border-gray-900 bg-gray-900 text-white"
                : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            <SlidersHorizontal className="h-4 w-4" />

            Filtres
          </button>
        </div>

        {/* ADVANCED FILTERS */}

        {showFilters && (
          <div className="mt-4 flex flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:items-end">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-500">
                Catégorie
              </label>

              <select
                value={categoryFilter}
                onChange={(event) => {
                  setCategoryFilter(
                    event.target.value,
                  );
                }}
                className="h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm outline-none focus:border-gray-400"
              >
                <option value="ALL">
                  Toutes
                </option>

                {categories.map(
                  (category) => (
                    <option
                      key={category}
                      value={category}
                    >
                      {category}
                    </option>
                  ),
                )}
              </select>
            </div>

            <button
              type="button"
              onClick={resetFilters}
              className="h-10 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-600 hover:bg-gray-50"
            >
              Réinitialiser
            </button>
          </div>
        )}
      </div>

      {/* ======================================================
          TABLE
      ====================================================== */}

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-6 py-5">
          <h2 className="font-bold text-gray-900">
            Parc automobile
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            {filteredVehicles.length} véhicule
            {filteredVehicles.length !== 1
              ? "s"
              : ""}{" "}
            affiché
            {filteredVehicles.length !== 1
              ? "s"
              : ""}
          </p>
        </div>

        {filteredVehicles.length === 0 ? (
          <div className="flex min-h-[350px] flex-col items-center justify-center px-6 text-center">
            <div className="rounded-2xl bg-gray-100 p-5">
              <Car className="h-9 w-9 text-gray-400" />
            </div>

            <h3 className="mt-4 font-bold text-gray-900">
              Aucun véhicule trouvé
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Modifiez vos critères de recherche.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px]">
              <thead className="bg-gray-50">
                <tr className="text-left text-[11px] font-bold uppercase tracking-wider text-gray-400">
                  <th className="px-6 py-4">
                    Véhicule
                  </th>

                  <th className="px-6 py-4">
                    Immatriculation
                  </th>

                  <th className="px-6 py-4">
                    Catégorie
                  </th>

                  <th className="px-6 py-4">
                    État
                  </th>

                  <th className="px-6 py-4">
                    Kilométrage
                  </th>

                  <th className="px-6 py-4">
                    Tarif
                  </th>

                  <th className="px-6 py-4 text-right">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {filteredVehicles.map(
                  (vehicle) => {
                    const image =
                      vehicle.images?.find(
                        (item) =>
                          item.is_primary,
                      ) ??
                      vehicle.images?.[0];

                    return (
                      <tr
                        key={vehicle.id}
                        className="group hover:bg-gray-50/70"
                      >
                        {/* VEHICLE */}

                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-14 w-20 overflow-hidden rounded-xl bg-gray-100">
                              {image?.image_url ? (
                                <img
                                  src={
                                    image.image_url
                                  }
                                  alt={
                                    vehicle.display_name ||
                                    `${vehicle.brand} ${vehicle.model}`
                                  }
                                  className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                                />
                              ) : (
                                <div className="flex h-full items-center justify-center">
                                  <Car className="h-6 w-6 text-gray-300" />
                                </div>
                              )}
                            </div>

                            <div>
                              <p className="font-bold text-gray-900">
                                {vehicle.brand}{" "}
                                {vehicle.model}
                              </p>

                              <p className="mt-1 text-xs text-gray-500">
                                {vehicle.year} ·{" "}
                                {vehicle.color ||
                                  "—"}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* REGISTRATION */}

                        <td className="px-6 py-4">
                          <span className="rounded-lg bg-gray-100 px-2.5 py-1.5 font-mono text-xs font-bold text-gray-700">
                            {
                              vehicle.registration_number
                            }
                          </span>
                        </td>

                        {/* CATEGORY */}

                        <td className="px-6 py-4 text-sm font-medium text-gray-600">
                          {vehicle.category_display ||
                            vehicle.category ||
                            "—"}
                        </td>

                        {/* STATUS */}

                        <td className="px-6 py-4">
                          <StatusBadge
                            status={
                              vehicle.status
                            }
                          />
                        </td>

                        {/* MILEAGE */}

                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Gauge className="h-4 w-4 text-gray-400" />

                            {Number(
                              vehicle.mileage ?? 0,
                            ).toLocaleString(
                              "fr-FR",
                            )}{" "}
                            km
                          </div>
                        </td>

                        {/* RATE */}

                        <td className="px-6 py-4">
                          <span className="font-bold text-gray-900">
                            {Number(
                              vehicle.daily_rate ??
                                0,
                            ).toLocaleString(
                              "fr-FR",
                            )}{" "}
                            $
                          </span>

                          <p className="text-[11px] text-gray-400">
                            / jour
                          </p>
                        </td>

                        {/* ACTIONS */}

                        <td className="px-6 py-4">
                          <div className="relative flex justify-end">
                            <button
                              type="button"
                              onClick={() => {
                                setOpenMenu(
                                  openMenu ===
                                    vehicle.id
                                    ? null
                                    : vehicle.id,
                                );
                              }}
                              aria-label="Actions"
                              className="rounded-xl p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-900"
                            >
                              <MoreHorizontal className="h-5 w-5" />
                            </button>

                            {openMenu ===
                              vehicle.id && (
                              <div className="absolute right-0 top-11 z-30 w-52 rounded-xl border border-gray-200 bg-white p-1.5 shadow-2xl">
                                <ActionButton
                                  icon={Eye}
                                  label="Voir les détails"
                                  onClick={() => {
                                    setSelectedVehicle(
                                      vehicle,
                                    );

                                    setShowDetailsModal(
                                      true,
                                    );

                                    setOpenMenu(
                                      null,
                                    );
                                  }}
                                />

                                <ActionButton
                                  icon={Pencil}
                                  label="Modifier"
                                  onClick={() => {
                                    setSelectedVehicle(
                                      vehicle,
                                    );

                                    setShowEditModal(
                                      true,
                                    );

                                    setOpenMenu(
                                      null,
                                    );
                                  }}
                                />

                                <div className="my-1 border-t border-gray-100" />

                                <ActionButton
                                  icon={Trash2}
                                  label="Supprimer"
                                  danger
                                  onClick={() => {
                                    void handleDelete(
                                      vehicle,
                                    );
                                  }}
                                />
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  },
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ======================================================
          CREATE MODAL
      ====================================================== */}

      <CreateVehicleModal
        open={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
        }}
        onCreated={(vehicle) => {
          setVehicles((current) => [
            vehicle,
            ...current,
          ]);

          setShowCreateModal(false);
        }}
      />

      {/* ======================================================
          EDIT MODAL
      ====================================================== */}

      <EditVehicleModal
        open={showEditModal}
        vehicle={selectedVehicle}
        onClose={() => {
          setShowEditModal(false);
        }}
        onUpdated={(vehicle) => {
          setVehicles((current) =>
            current.map((item) =>
              item.id === vehicle.id
                ? vehicle
                : item,
            ),
          );

          setSelectedVehicle(vehicle);
          setShowEditModal(false);
        }}
      />

      {/* ======================================================
          DETAILS MODAL
      ====================================================== */}

      <VehicleDetailsModal
        open={showDetailsModal}
        vehicle={selectedVehicle}
        onClose={() => {
          setShowDetailsModal(false);
        }}
        onEdit={(vehicle) => {
          setShowDetailsModal(false);
          setSelectedVehicle(vehicle);
          setShowEditModal(true);
        }}
      />
    </div>
  );
}

// ============================================================
// KPI
// ============================================================

function Kpi({
  label,
  value,
  icon: Icon,
  description,
}: {
  label: string;
  value: number;
  icon: typeof Car;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">
            {label}
          </p>

          <p className="mt-2 text-3xl font-black text-gray-900">
            {value}
          </p>
        </div>

        <div className="rounded-xl bg-gray-100 p-3">
          <Icon className="h-5 w-5 text-gray-700" />
        </div>
      </div>

      <p className="mt-3 text-xs text-gray-400">
        {description}
      </p>
    </div>
  );
}

// ============================================================
// STATUS BADGE
// ============================================================

function StatusBadge({
  status,
}: {
  status: string;
}) {
  const config: Record<
    string,
    {
      label: string;
      className: string;
      icon: typeof Car;
    }
  > = {
    AVAILABLE: {
      label: "Disponible",
      className:
        "bg-emerald-50 text-emerald-700",
      icon: CheckCircle2,
    },

    MAINTENANCE: {
      label: "Maintenance",
      className:
        "bg-orange-50 text-orange-700",
      icon: Wrench,
    },

    OUT_OF_SERVICE: {
      label: "Hors service",
      className:
        "bg-red-50 text-red-700",
      icon: CircleOff,
    },
  };

  const item =
    config[status] ?? {
      label: status,
      className:
        "bg-gray-100 text-gray-600",
      icon: AlertTriangle,
    };

  const Icon = item.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-bold ${item.className}`}
    >
      <Icon className="h-3.5 w-3.5" />

      {item.label}
    </span>
  );
}

// ============================================================
// ACTION BUTTON
// ============================================================

function ActionButton({
  icon: Icon,
  label,
  onClick,
  danger = false,
}: {
  icon: typeof Eye;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition ${
        danger
          ? "text-red-600 hover:bg-red-50"
          : "text-gray-700 hover:bg-gray-50"
      }`}
    >
      <Icon className="h-4 w-4" />

      {label}
    </button>
  );
}

