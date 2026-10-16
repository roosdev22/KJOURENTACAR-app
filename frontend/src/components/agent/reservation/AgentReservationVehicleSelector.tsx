import {
  CarFront,
  Check,
  Search,
} from "lucide-react";

import type { Vehicle } from "../../../api/services/vehicleService";

interface AgentReservationVehicleSelectorProps {
  vehicles: Vehicle[];
  selectedVehicleIds: string[];
  search: string;
  isLoading: boolean;
  error: string | null;

  onSearchChange: (value: string) => void;
  onToggleVehicle: (vehicleId: string) => void;
}

export default function AgentReservationVehicleSelector({
  vehicles,
  selectedVehicleIds,
  search,
  isLoading,
  error,
  onSearchChange,
  onToggleVehicle,
}: AgentReservationVehicleSelectorProps) {
  const filteredVehicles = vehicles.filter((vehicle) => {
    if (vehicle.status !== "AVAILABLE") {
      return false;
    }

    const query = search.trim().toLowerCase();

    if (!query) {
      return true;
    }

    const text = [
      vehicle.brand,
      vehicle.model,
      vehicle.registration_number,
      vehicle.category,
      vehicle.category_display,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return text.includes(query);
  });

  return (
    <section>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <CarFront size={20} className="text-red-600" />

            <h2 className="text-lg font-bold text-slate-950">
              Véhicules
            </h2>
          </div>

          <p className="text-sm text-slate-500">
            Sélectionnez un ou plusieurs véhicules disponibles.
          </p>
        </div>

        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm font-bold text-red-700">
          {selectedVehicleIds.length} sélectionné
          {selectedVehicleIds.length > 1 ? "s" : ""}
        </div>
      </div>

      {/* Recherche */}
      <div className="relative mb-5">
        <Search
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
        />

        <input
          type="text"
          value={search}
          onChange={(event) =>
            onSearchChange(event.target.value)
          }
          placeholder="Marque, modèle, plaque..."
          className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-100"
        />
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex min-h-40 items-center justify-center rounded-xl border border-slate-200 bg-slate-50">
          <p className="text-sm text-slate-500">
            Chargement des véhicules...
          </p>
        </div>
      ) : filteredVehicles.length === 0 ? (
        <div className="flex min-h-40 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-500">
          Aucun véhicule disponible.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filteredVehicles.map((vehicle) => {
            const selected = selectedVehicleIds.includes(
              vehicle.id
            );

            const image =
              vehicle.images[0]?.image_url ??
              vehicle.images[0]?.image ??
              null;

            return (
              <button
                key={vehicle.id}
                type="button"
                onClick={() => onToggleVehicle(vehicle.id)}
                className={[
                  "relative overflow-hidden rounded-xl border text-left transition",
                  selected
                    ? "border-red-500 bg-red-50 ring-1 ring-red-500"
                    : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm",
                ].join(" ")}
              >
                <div className="flex gap-3 p-3">
                  <div className="h-20 w-24 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                    {image ? (
                      <img
                        src={image}
                        alt={`${vehicle.brand} ${vehicle.model}`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-slate-400">
                        <CarFront size={28} />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="truncate text-sm font-bold text-slate-900">
                          {vehicle.brand} {vehicle.model}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {vehicle.registration_number}
                        </p>
                      </div>

                      <div
                        className={[
                          "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border",
                          selected
                            ? "border-red-600 bg-red-600 text-white"
                            : "border-slate-200 bg-white text-transparent",
                        ].join(" ")}
                      >
                        <Check size={14} />
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-600">
                        {vehicle.category_display ||
                          vehicle.category}
                      </span>

                      <span className="rounded-md bg-emerald-50 px-2 py-1 text-[11px] font-medium text-emerald-700">
                        Disponible
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}