import {
  Car,
  X,
  Gauge,
  CalendarDays,
  Fuel,
  Settings2,
  Users,
  Snowflake,
  Palette,
  CreditCard,
} from "lucide-react";

import type { Vehicle } from "../../../api/services/vehicleService";

interface VehicleDetailsModalProps {
  open: boolean;
  vehicle: Vehicle | null;
  onClose: () => void;
  onEdit?: (vehicle: Vehicle) => void;
}

function formatPrice(
  value: number | string | null | undefined,
) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "—";
  }

  return `${Number(value).toLocaleString("fr-FR")} $`;
}

function statusLabel(status: string) {
  if (status === "AVAILABLE") return "Disponible";
  if (status === "MAINTENANCE") return "Maintenance";
  if (status === "OUT_OF_SERVICE")
    return "Hors service";

  return status;
}

export default function VehicleDetailsModal({
  open,
  vehicle,
  onClose,
  onEdit,
}: VehicleDetailsModalProps) {
  if (!open || !vehicle) return null;

  const images =
    vehicle.images ?? [];

  const mainImage =
    images.find(
      (image) => image.is_primary,
    ) ?? images[0];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
        {/* HEADER */}

        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-gray-100 bg-white/95 px-6 py-5 backdrop-blur">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-gray-400">
              Fiche véhicule
            </p>

            <h2 className="mt-1 text-xl font-bold text-gray-900">
              {vehicle.display_name ||
                `${vehicle.brand} ${vehicle.model}`}
            </h2>

            <p className="mt-1 font-mono text-xs text-gray-500">
              {vehicle.registration_number}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          {/* HERO IMAGE */}

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_0.6fr]">
            <div className="relative overflow-hidden rounded-3xl bg-gray-100">
              {mainImage?.image_url ? (
                <img
                  src={mainImage.image_url}
                  alt={
                    vehicle.display_name ||
                    "Véhicule"
                  }
                  className="aspect-[16/9] h-full w-full object-cover"
                />
              ) : (
                <div className="flex aspect-[16/9] items-center justify-center">
                  <Car className="h-16 w-16 text-gray-300" />
                </div>
              )}

              <div className="absolute bottom-4 left-4">
                <span className="rounded-full bg-white/95 px-3 py-1.5 text-xs font-bold text-gray-800 shadow-lg">
                  {statusLabel(vehicle.status)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {images
                .slice(1, 5)
                .map((image) => (
                  <div
                    key={image.id}
                    className="overflow-hidden rounded-2xl bg-gray-100"
                  >
                    {image.image_url && (
                      <img
                        src={image.image_url}
                        alt="Véhicule"
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                ))}

              {images.length <= 1 && (
                <div className="col-span-2 flex items-center justify-center rounded-2xl bg-gray-50">
                  <p className="text-xs text-gray-400">
                    Photos supplémentaires
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* INFORMATION GRID */}

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <InfoCard
              icon={Car}
              label="Marque"
              value={vehicle.brand}
            />

            <InfoCard
              icon={Car}
              label="Modèle"
              value={vehicle.model}
            />

            <InfoCard
              icon={CalendarDays}
              label="Année"
              value={String(vehicle.year)}
            />

            <InfoCard
              icon={Palette}
              label="Couleur"
              value={vehicle.color || "—"}
            />

            <InfoCard
              icon={Fuel}
              label="Carburant"
              value={
                vehicle.fuel_type_display ||
                vehicle.fuel_type
              }
            />

            <InfoCard
              icon={Settings2}
              label="Transmission"
              value={
                vehicle.transmission_display ||
                vehicle.transmission
              }
            />

            <InfoCard
              icon={Users}
              label="Places"
              value={`${vehicle.seats}`}
            />

            <InfoCard
              icon={Gauge}
              label="Kilométrage"
              value={`${Number(
                vehicle.mileage ?? 0,
              ).toLocaleString("fr-FR")} km`}
            />
          </div>

          {/* LOWER */}

          <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
            <section className="rounded-2xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900">
                État du véhicule
              </h3>

              <div className="mt-5 space-y-4">
                <Row
                  label="Statut"
                  value={statusLabel(
                    vehicle.status,
                  )}
                />

                <Row
                  label="Condition"
                  value={
                    vehicle.condition_display ||
                    vehicle.condition ||
                    "—"
                  }
                />

                <Row
                  label="Climatisation"
                  value={
                    vehicle.air_conditioning
                      ? "Oui"
                      : "Non"
                  }
                  icon={Snowflake}
                />

                <Row
                  label="Prochaine maintenance"
                  value={
                    vehicle.next_maintenance_date ||
                    "Non définie"
                  }
                  icon={CalendarDays}
                />
              </div>
            </section>

            <section className="rounded-2xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900">
                Tarification
              </h3>

              <div className="mt-5 space-y-3">
                <PriceRow
                  label="Journalier"
                  value={formatPrice(
                    vehicle.daily_rate,
                  )}
                />

                <PriceRow
                  label="Hebdomadaire"
                  value={formatPrice(
                    vehicle.weekly_rate,
                  )}
                />

                <PriceRow
                  label="Mensuel"
                  value={formatPrice(
                    vehicle.monthly_rate,
                  )}
                />
              </div>
            </section>
          </div>
        </div>

        {/* FOOTER */}

        <div className="flex justify-end gap-3 border-t border-gray-100 bg-gray-50 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-100"
          >
            Fermer
          </button>

          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(vehicle)}
              className="rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-800"
            >
              Modifier le véhicule
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Car;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4">
      <div className="flex items-center gap-2 text-xs text-gray-400">
        <Icon className="h-4 w-4" />
        {label}
      </div>

      <p className="mt-2 truncate text-sm font-bold text-gray-900">
        {value || "—"}
      </p>
    </div>
  );
}

function Row({
  label,
  value,
}: {
  label: string;
  value: string;
  icon?: typeof Car;
}) {
  return (
    <div className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-0 last:pb-0">
      <span className="text-sm text-gray-500">
        {label}
      </span>

      <span className="text-sm font-semibold text-gray-900">
        {value}
      </span>
    </div>
  );
}

function PriceRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
      <div className="flex items-center gap-2">
        <CreditCard className="h-4 w-4 text-gray-400" />

        <span className="text-sm text-gray-600">
          {label}
        </span>
      </div>

      <span className="font-bold text-gray-900">
        {value}
      </span>
    </div>
  );
}