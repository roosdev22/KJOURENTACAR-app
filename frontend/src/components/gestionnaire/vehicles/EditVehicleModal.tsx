import {
  Car,
  X,
  Check,
  Loader2,
} from "lucide-react";

import {
  useState,
  type FormEvent,
} from "react";

import {
  vehicleService,
  type Vehicle,
  type VehicleFormData,
  type VehicleCategory,
  type TransmissionType,
  type FuelType,
  type VehicleStatus,
  type VehicleCondition,
} from "../../../api/services/vehicleService";

interface EditVehicleModalProps {
  open: boolean;
  vehicle: Vehicle | null;
  onClose: () => void;
  onUpdated: (vehicle: Vehicle) => void;
}

interface FormState {
  brand: string;
  model: string;
  year: string;
  registration_number: string;
  vin: string;
  color: string;

  category: VehicleCategory | "";
  transmission: TransmissionType | "";
  fuel_type: FuelType | "";

  seats: string;
  doors: string;
  air_conditioning: boolean;

  daily_rate: string;
  weekly_rate: string;
  monthly_rate: string;
  deposit: string;
  unlimited_mileage: boolean;

  status: VehicleStatus;
  condition: VehicleCondition;

  mileage: string;

  last_maintenance_date: string;
  next_maintenance_date: string;

  description: string;
}

function createInitialForm(
  vehicle: Vehicle | null,
): FormState {
  if (!vehicle) {
    return {
      brand: "",
      model: "",
      year: "",
      registration_number: "",
      vin: "",
      color: "",

      category: "",
      transmission: "",
      fuel_type: "",

      seats: "",
      doors: "",
      air_conditioning: false,

      daily_rate: "",
      weekly_rate: "",
      monthly_rate: "",
      deposit: "",
      unlimited_mileage: false,

      status: "AVAILABLE",
      condition: "GOOD",

      mileage: "",

      last_maintenance_date: "",
      next_maintenance_date: "",

      description: "",
    };
  }

  return {
    brand: vehicle.brand ?? "",
    model: vehicle.model ?? "",
    year: String(vehicle.year ?? ""),

    registration_number:
      vehicle.registration_number ?? "",

    vin: vehicle.vin ?? "",
    color: vehicle.color ?? "",

    category:
      (vehicle.category as VehicleCategory) ?? "",

    transmission:
      (vehicle.transmission as TransmissionType) ?? "",

    fuel_type:
      (vehicle.fuel_type as FuelType) ?? "",

    seats: String(vehicle.seats ?? ""),
    doors: String(vehicle.doors ?? ""),

    air_conditioning:
      Boolean(vehicle.air_conditioning),

    daily_rate:
      vehicle.daily_rate ?? "",

    weekly_rate:
      vehicle.weekly_rate ?? "",

    monthly_rate:
      vehicle.monthly_rate ?? "",

    deposit:
      vehicle.deposit ?? "",

    unlimited_mileage:
      Boolean(vehicle.unlimited_mileage),

    status:
      (vehicle.status as VehicleStatus) ??
      "AVAILABLE",

    condition:
      (vehicle.condition as VehicleCondition) ??
      "GOOD",

    mileage:
      String(vehicle.mileage ?? ""),

    last_maintenance_date:
      vehicle.last_maintenance_date ?? "",

    next_maintenance_date:
      vehicle.next_maintenance_date ?? "",

    description:
      vehicle.description ?? "",
  };
}

export default function EditVehicleModal({
  open,
  vehicle,
  onClose,
  onUpdated,
}: EditVehicleModalProps) {
  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  /*
   * IMPORTANT :
   * Le formulaire est initialisé directement à partir
   * du véhicule.
   *
   * Aucun useEffect + setState nécessaire.
   */
  const [form, setForm] = useState<FormState>(() =>
    createInitialForm(vehicle),
  );

  if (!open || !vehicle) {
    return null;
  }

  const update = <K extends keyof FormState>(
    field: K,
    value: FormState[K],
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    try {
      setLoading(true);
      setError(null);

      /*
       * Validation minimale
       */
      if (
        !form.brand.trim() ||
        !form.model.trim() ||
        !form.registration_number.trim()
      ) {
        setError(
          "Veuillez renseigner la marque, le modèle et l'immatriculation.",
        );

        return;
      }

      if (!form.category) {
        setError(
          "Veuillez sélectionner une catégorie.",
        );

        return;
      }

      if (!form.transmission) {
        setError(
          "Veuillez sélectionner la transmission.",
        );

        return;
      }

      if (!form.fuel_type) {
        setError(
          "Veuillez sélectionner le carburant.",
        );

        return;
      }

      /*
       * Payload correspondant à VehicleFormData.
       *
       * IMPORTANT :
       * Les tarifs restent des string.
       * C'est exactement ce qu'attend Vehicle.
       */
      const payload: Partial<VehicleFormData> = {
        brand: form.brand.trim(),

        model: form.model.trim(),

        year: Number(form.year),

        registration_number:
          form.registration_number
            .trim()
            .toUpperCase(),

        vin:
          form.vin.trim() || null,

        color:
          form.color.trim(),

        category:
          form.category,

        transmission:
          form.transmission,

        fuel_type:
          form.fuel_type,

        seats:
          Number(form.seats),

        doors:
          Number(form.doors),

        air_conditioning:
          form.air_conditioning,

        daily_rate:
          form.daily_rate,

        weekly_rate:
          form.weekly_rate.trim()
            ? form.weekly_rate
            : null,

        monthly_rate:
          form.monthly_rate.trim()
            ? form.monthly_rate
            : null,

        deposit:
          form.deposit.trim()
            ? form.deposit
            : null,

        unlimited_mileage:
          form.unlimited_mileage,

        status:
          form.status,

        condition:
          form.condition,

        mileage:
          Number(form.mileage),

        last_maintenance_date:
          form.last_maintenance_date || null,

        next_maintenance_date:
          form.next_maintenance_date || null,

        description:
          form.description.trim() || null,
      };

      /*
       * Vraie modification côté backend.
       */
      const updated =
        await vehicleService.updateVehicle(
          vehicle.id,
          payload,
        );

      /*
       * On renvoie le véhicule mis à jour
       * au parent.
       */
      onUpdated(updated);

      onClose();
    } catch (err) {
      console.error(
        "Erreur modification véhicule:",
        err,
      );

      setError(
        "Impossible de modifier le véhicule. Vérifiez les données puis réessayez.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl">

        {/* =====================================================
            HEADER
        ====================================================== */}

        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">

          <div className="flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-900 text-white">
              <Car className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Modifier le véhicule
              </h2>

              <p className="text-xs text-gray-500">
                {vehicle.brand}{" "}
                {vehicle.model}
              </p>
            </div>

          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            aria-label="Fermer"
            className="rounded-xl p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>

        </div>

        {/* =====================================================
            FORM
        ====================================================== */}

        <form
          onSubmit={handleSubmit}
          className="max-h-[78vh] overflow-y-auto"
        >

          <div className="grid grid-cols-1 gap-5 p-6 sm:grid-cols-2 lg:grid-cols-3">

            {/* IDENTIFICATION */}

            <Input
              label="Marque"
              value={form.brand}
              onChange={(value) =>
                update("brand", value)
              }
              required
            />

            <Input
              label="Modèle"
              value={form.model}
              onChange={(value) =>
                update("model", value)
              }
              required
            />

            <Input
              label="Année"
              type="number"
              min="1900"
              max="2100"
              value={form.year}
              onChange={(value) =>
                update("year", value)
              }
              required
            />

            <Input
              label="Immatriculation"
              value={
                form.registration_number
              }
              onChange={(value) =>
                update(
                  "registration_number",
                  value.toUpperCase(),
                )
              }
              required
            />

            <Input
              label="VIN"
              value={form.vin}
              onChange={(value) =>
                update("vin", value)
              }
            />

            <Input
              label="Couleur"
              value={form.color}
              onChange={(value) =>
                update("color", value)
              }
            />

            {/* CARACTÉRISTIQUES */}

            <Select
              label="Catégorie"
              value={form.category}
              options={[
                [
                  "ECONOMY",
                  "Économique",
                ],
                [
                  "COMPACT",
                  "Compacte",
                ],
                [
                  "SEDAN",
                  "Berline",
                ],
                [
                  "SUV",
                  "SUV",
                ],
                [
                  "LUXURY",
                  "Luxe",
                ],
                [
                  "VAN",
                  "Van",
                ],
                [
                  "PICKUP",
                  "Pick-up",
                ],
              ]}
              onChange={(value) =>
                update(
                  "category",
                  value as VehicleCategory,
                )
              }
              required
            />

            <Select
              label="Transmission"
              value={form.transmission}
              options={[
                [
                  "AUTOMATIC",
                  "Automatique",
                ],
                [
                  "MANUAL",
                  "Manuelle",
                ],
              ]}
              onChange={(value) =>
                update(
                  "transmission",
                  value as TransmissionType,
                )
              }
              required
            />

            <Select
              label="Carburant"
              value={form.fuel_type}
              options={[
                [
                  "GASOLINE",
                  "Essence",
                ],
                [
                  "DIESEL",
                  "Diesel",
                ],
                [
                  "HYBRID",
                  "Hybride",
                ],
                [
                  "ELECTRIC",
                  "Électrique",
                ],
              ]}
              onChange={(value) =>
                update(
                  "fuel_type",
                  value as FuelType,
                )
              }
              required
            />

            <Input
              label="Places"
              type="number"
              min="1"
              value={form.seats}
              onChange={(value) =>
                update("seats", value)
              }
              required
            />

            <Input
              label="Portes"
              type="number"
              min="1"
              value={form.doors}
              onChange={(value) =>
                update("doors", value)
              }
              required
            />

            <Input
              label="Kilométrage"
              type="number"
              min="0"
              value={form.mileage}
              onChange={(value) =>
                update("mileage", value)
              }
              required
            />

            {/* TARIFICATION */}

            <Input
              label="Tarif journalier ($)"
              type="number"
              min="0"
              step="0.01"
              value={form.daily_rate}
              onChange={(value) =>
                update(
                  "daily_rate",
                  value,
                )
              }
              required
            />

            <Input
              label="Tarif hebdomadaire ($)"
              type="number"
              min="0"
              step="0.01"
              value={form.weekly_rate}
              onChange={(value) =>
                update(
                  "weekly_rate",
                  value,
                )
              }
            />

            <Input
              label="Tarif mensuel ($)"
              type="number"
              min="0"
              step="0.01"
              value={form.monthly_rate}
              onChange={(value) =>
                update(
                  "monthly_rate",
                  value,
                )
              }
            />

            <Input
              label="Dépôt / caution ($)"
              type="number"
              min="0"
              step="0.01"
              value={form.deposit}
              onChange={(value) =>
                update(
                  "deposit",
                  value,
                )
              }
            />

            {/* ÉTAT */}

            <Select
              label="Statut"
              value={form.status}
              options={[
                [
                  "AVAILABLE",
                  "Disponible",
                ],
                [
                  "MAINTENANCE",
                  "Maintenance",
                ],
                [
                  "OUT_OF_SERVICE",
                  "Hors service",
                ],
              ]}
              onChange={(value) =>
                update(
                  "status",
                  value as VehicleStatus,
                )
              }
            />

            <Select
              label="Condition"
              value={form.condition}
              options={[
                [
                  "EXCELLENT",
                  "Excellent",
                ],
                [
                  "GOOD",
                  "Bon",
                ],
                [
                  "FAIR",
                  "Moyen",
                ],
                [
                  "POOR",
                  "Mauvais",
                ],
              ]}
              onChange={(value) =>
                update(
                  "condition",
                  value as VehicleCondition,
                )
              }
            />

            <Input
              label="Dernière maintenance"
              type="date"
              value={
                form.last_maintenance_date
              }
              onChange={(value) =>
                update(
                  "last_maintenance_date",
                  value,
                )
              }
            />

            <Input
              label="Prochaine maintenance"
              type="date"
              value={
                form.next_maintenance_date
              }
              onChange={(value) =>
                update(
                  "next_maintenance_date",
                  value,
                )
              }
            />

            {/* OPTIONS */}

            <Checkbox
              label="Climatisation"
              checked={
                form.air_conditioning
              }
              onChange={(value) =>
                update(
                  "air_conditioning",
                  value,
                )
              }
            />

            <Checkbox
              label="Kilométrage illimité"
              checked={
                form.unlimited_mileage
              }
              onChange={(value) =>
                update(
                  "unlimited_mileage",
                  value,
                )
              }
            />

            {/* DESCRIPTION */}

            <div className="sm:col-span-2 lg:col-span-3">
              <label>
                <span className="mb-1.5 block text-xs font-semibold text-gray-600">
                  Description
                </span>

                <textarea
                  value={form.description}
                  onChange={(event) =>
                    update(
                      "description",
                      event.target.value,
                    )
                  }
                  rows={4}
                  placeholder="Description du véhicule..."
                  className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-3 text-sm outline-none transition focus:border-gray-400 focus:bg-white"
                />
              </label>
            </div>

          </div>

          {/* ===================================================
              ERROR
          ==================================================== */}

          {error && (
            <div className="mx-6 mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* ===================================================
              FOOTER
          ==================================================== */}

          <div className="flex flex-col-reverse gap-3 border-t border-gray-100 bg-gray-50 px-6 py-4 sm:flex-row sm:justify-end">

            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Annuler
            </button>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-gray-900/10 transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Enregistrer les modifications
                </>
              )}
            </button>

          </div>

        </form>
      </div>
    </div>
  );
}

/* ============================================================
   INPUT
============================================================ */

function Input({
  label,
  value,
  onChange,
  type = "text",
  min,
  max,
  step,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  min?: string;
  max?: string;
  step?: string;
  required?: boolean;
}) {
  return (
    <label>
      <span className="mb-1.5 block text-xs font-semibold text-gray-600">
        {label}
        {required && (
          <span className="ml-1 text-red-500">
            *
          </span>
        )}
      </span>

      <input
        type={type}
        value={value}
        min={min}
        max={max}
        step={step}
        required={required}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 text-sm outline-none transition focus:border-gray-400 focus:bg-white"
      />
    </label>
  );
}

/* ============================================================
   SELECT
============================================================ */

function Select({
  label,
  value,
  options,
  onChange,
  required = false,
}: {
  label: string;
  value: string;
  options: [string, string][];
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <label>
      <span className="mb-1.5 block text-xs font-semibold text-gray-600">
        {label}
        {required && (
          <span className="ml-1 text-red-500">
            *
          </span>
        )}
      </span>

      <select
        value={value}
        required={required}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 text-sm outline-none transition focus:border-gray-400 focus:bg-white"
      >
        <option value="">
          Sélectionner...
        </option>

        {options.map(
          ([optionValue, optionLabel]) => (
            <option
              key={optionValue}
              value={optionValue}
            >
              {optionLabel}
            </option>
          ),
        )}
      </select>
    </label>
  );
}

/* ============================================================
   CHECKBOX
============================================================ */

function Checkbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 transition hover:bg-gray-100">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) =>
          onChange(event.target.checked)
        }
        className="h-4 w-4 rounded border-gray-300"
      />

      <span className="text-sm font-medium text-gray-700">
        {label}
      </span>
    </label>
  );
}
