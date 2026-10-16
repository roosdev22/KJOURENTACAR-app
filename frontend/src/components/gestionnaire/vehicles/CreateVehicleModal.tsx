import {
  Car,
  X,
  Check,
  Loader2,
  AlertCircle,
} from "lucide-react";

import { useState, type FormEvent } from "react";

import {
  vehicleService,
  type Vehicle,
  type VehicleFormData,
  type VehicleStatus,
  type VehicleCondition,
  type VehicleCategory,
} from "../../../api/services/vehicleService";

import VehicleImageManager, {
  type VehicleImageItem,
} from "./VehicleImageManager";

// ============================================================
// CONSTANTES — alignées sur models.py
// ============================================================

const MIN_YEAR = 1900; // Vehicle.year MinValueValidator(1900)
const MAX_YEAR = new Date().getFullYear() + 1; // clean(): année courante + 1

const VALID_CATEGORIES: VehicleCategory[] = [
  "ECONOMIQUE",
  "COMPACTE",
  "BERLINE",
  "SUV",
  "PICKUP",
  "MINIVAN",
  "VAN",
  "LUXE",
  "SPORT",
  "AUTRE",
];

const VALID_FUEL_TYPES = [
  "GASOLINE",
  "DIESEL",
  "HYBRID",
  "ELECTRIC",
  "LPG",
  "OTHER",
] as const;

// ============================================================
// TYPES
// ============================================================

interface VehicleForm {
  brand: string;
  model: string;
  year: string;
  registration_number: string;
  vin: string;
  category: string;
  transmission: string;
  fuel_type: string;
  seats: string;
  doors: string;
  color: string;

  daily_rate: string;
  weekly_rate: string;
  monthly_rate: string;
  deposit: string;

  mileage: string;

  condition: VehicleCondition;
  status: VehicleStatus;

  next_maintenance_date: string;
  last_maintenance_date: string;

  description: string;

  air_conditioning: boolean;
  unlimited_mileage: boolean;
}

interface CreateVehicleModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (vehicle: Vehicle) => void;
}

const initialForm: VehicleForm = {
  brand: "",
  model: "",
  year: "",
  registration_number: "",
  vin: "",

  category: "",
  transmission: "AUTOMATIC",
  fuel_type: "GASOLINE",

  seats: "5",
  doors: "4",
  color: "",

  daily_rate: "",
  weekly_rate: "",
  monthly_rate: "",
  deposit: "",

  mileage: "0",

  condition: "GOOD",
  status: "AVAILABLE",

  next_maintenance_date: "",
  last_maintenance_date: "",

  description: "",

  air_conditioning: true,
  unlimited_mileage: false,
};

// ============================================================
// UTILITAIRES
// ============================================================

function getTodayDate(): string {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function extractApiError(error: unknown): string {
  const err = error as {
    response?: { data?: unknown };
    message?: string;
  };

  const data = err?.response?.data;

  if (typeof data === "string") {
    return data;
  }

  if (data && typeof data === "object") {
    const values = Object.entries(data as Record<string, unknown>);

    const messages: string[] = [];

    for (const [field, value] of values) {
      if (Array.isArray(value)) {
        messages.push(`${field}: ${value.join(", ")}`);
      } else if (typeof value === "string") {
        messages.push(`${field}: ${value}`);
      } else if (value !== null && value !== undefined) {
        messages.push(`${field}: ${JSON.stringify(value)}`);
      }
    }

    if (messages.length > 0) {
      return messages.join(" | ");
    }
  }

  return (
    err?.message ||
    "Une erreur est survenue lors de la création du véhicule."
  );
}

// ============================================================
// COMPOSANT
// ============================================================

export default function CreateVehicleModal({
  open,
  onClose,
  onCreated,
}: CreateVehicleModalProps) {
  const [form, setForm] = useState<VehicleForm>(initialForm);
  const [images, setImages] = useState<VehicleImageItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateField = (
    field: keyof VehicleForm,
    value: string | boolean
  ) => {
    if (
      field === "last_maintenance_date" &&
      typeof value === "string" &&
      value
    ) {
      const today = new Date().toISOString().split("T")[0];

      if (value > today) {
        return;
      }
    }

    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // ==========================================================
  // VALIDATION
  // ==========================================================

  const validateForm = (): string | null => {
    // --- MARQUE ---
    const brand = form.brand.trim();

    if (!brand) return "La marque est obligatoire.";
    if (brand.length < 2)
      return "La marque doit contenir au moins 2 caractères.";
    if (brand.length > 50)
      return "La marque ne peut pas dépasser 50 caractères.";

    // --- MODÈLE ---
    const model = form.model.trim();

    if (!model) return "Le modèle est obligatoire.";
    if (model.length > 100)
      return "Le modèle ne peut pas dépasser 100 caractères.";

    // --- ANNÉE ---
    if (!form.year.trim()) return "L'année est obligatoire.";

    const year = Number(form.year);

    if (!Number.isInteger(year)) {
      return "L'année doit être un nombre entier.";
    }

    if (year < MIN_YEAR) {
      return `L'année du véhicule ne peut pas être antérieure à ${MIN_YEAR}.`;
    }

    if (year > MAX_YEAR) {
      return `L'année du véhicule ne peut pas dépasser ${MAX_YEAR}.`;
    }

    // --- IMMATRICULATION ---
    const registration = form.registration_number.trim();

    if (!registration)
      return "Le numéro d'immatriculation est obligatoire.";
    if (registration.length < 3)
      return "Le numéro d'immatriculation est trop court.";
    if (registration.length > 20)
      return "Le numéro d'immatriculation ne peut pas dépasser 20 caractères.";
    if (!/^[A-Za-z0-9 -]+$/.test(registration)) {
      return "Le numéro d'immatriculation contient des caractères invalides.";
    }

    // --- VIN ---
    const vin = form.vin.trim();

    if (vin) {
      if (vin.length !== 17) {
        return "Le VIN doit contenir exactement 17 caractères.";
      }

      // Aligné sur validate_vin() côté DRF : pas de I, O, Q
      if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(vin)) {
        return "Le VIN contient des caractères invalides (I, O et Q sont interdits).";
      }
    }

    // --- COULEUR ---
    if (!form.color.trim()) return "La couleur est obligatoire.";
    if (form.color.trim().length > 50)
      return "La couleur ne peut pas dépasser 50 caractères.";

    // --- CATÉGORIE ---
    if (!form.category) return "La catégorie est obligatoire.";

    if (
      !VALID_CATEGORIES.includes(form.category as VehicleCategory)
    ) {
      return "La catégorie sélectionnée est invalide.";
    }

    // --- TRANSMISSION ---
    if (
      form.transmission !== "MANUAL" &&
      form.transmission !== "AUTOMATIC"
    ) {
      return "La transmission sélectionnée est invalide.";
    }

    // --- CARBURANT ---
    if (
      !VALID_FUEL_TYPES.includes(
        form.fuel_type as (typeof VALID_FUEL_TYPES)[number],
      )
    ) {
      return "Le type de carburant sélectionné est invalide.";
    }

    // --- PLACES ---
    const seats = Number(form.seats);

    if (!Number.isInteger(seats)) {
      return "Le nombre de places doit être un nombre entier.";
    }
    if (seats < 1 || seats > 50) {
      return "Le nombre de places doit être compris entre 1 et 50.";
    }

    // --- PORTES ---
    const doors = Number(form.doors);

    if (!Number.isInteger(doors)) {
      return "Le nombre de portes doit être un nombre entier.";
    }
    if (doors < 1 || doors > 10) {
      return "Le nombre de portes doit être compris entre 1 et 10.";
    }

    // --- KILOMÉTRAGE ---
    const mileage = Number(form.mileage);

    if (!Number.isFinite(mileage)) return "Le kilométrage est invalide.";
    if (mileage < 0) return "Le kilométrage ne peut pas être négatif.";

    // --- PRIX JOURNALIER ---
    const dailyRate = Number(form.daily_rate);

    if (!form.daily_rate.trim()) {
      return "Le prix journalier est obligatoire.";
    }
    if (!Number.isFinite(dailyRate)) {
      return "Le prix journalier est invalide.";
    }
    if (dailyRate <= 0) {
      return "Le prix journalier doit être supérieur à 0.";
    }

    // --- PRIX HEBDOMADAIRE ---
    if (form.weekly_rate.trim()) {
      const weeklyRate = Number(form.weekly_rate);

      if (!Number.isFinite(weeklyRate)) {
        return "Le prix hebdomadaire est invalide.";
      }
      if (weeklyRate <= 0) {
        return "Le prix hebdomadaire doit être supérieur à 0.";
      }
      if (weeklyRate < dailyRate) {
        return "Le prix hebdomadaire ne peut pas être inférieur au prix journalier.";
      }
      if (weeklyRate > dailyRate * 7) {
        return "Le prix hebdomadaire ne peut normalement pas dépasser 7 fois le prix journalier.";
      }
    }

    // --- PRIX MENSUEL ---
    if (form.monthly_rate.trim()) {
      const monthlyRate = Number(form.monthly_rate);

      if (!Number.isFinite(monthlyRate)) {
        return "Le prix mensuel est invalide.";
      }
      if (monthlyRate <= 0) {
        return "Le prix mensuel doit être supérieur à 0.";
      }
      if (monthlyRate < dailyRate) {
        return "Le prix mensuel ne peut pas être inférieur au prix journalier.";
      }
      if (monthlyRate > dailyRate * 30) {
        return "Le prix mensuel ne peut normalement pas dépasser 30 fois le prix journalier.";
      }
    }

    // --- CAUTION ---
    if (form.deposit.trim()) {
      const deposit = Number(form.deposit);

      if (!Number.isFinite(deposit)) return "La caution est invalide.";
      if (deposit < 0) return "La caution ne peut pas être négative.";
    }

    // --- DATES DE MAINTENANCE ---
    if (form.last_maintenance_date) {
      const date = new Date(`${form.last_maintenance_date}T00:00:00`);

      if (Number.isNaN(date.getTime())) {
        return "La date de dernière maintenance est invalide.";
      }
    }

    if (form.next_maintenance_date) {
      const date = new Date(`${form.next_maintenance_date}T00:00:00`);

      if (Number.isNaN(date.getTime())) {
        return "La date de prochaine maintenance est invalide.";
      }

      if (form.next_maintenance_date < getTodayDate()) {
        return "La prochaine maintenance ne peut pas être dans le passé.";
      }

      if (
        form.last_maintenance_date &&
        form.next_maintenance_date < form.last_maintenance_date
      ) {
        return "La prochaine maintenance ne peut pas être antérieure à la dernière maintenance.";
      }
    }

    // --- DESCRIPTION ---
    if (form.description.length > 2000) {
      return "La description ne peut pas dépasser 2000 caractères.";
    }

    return null;
  };

  // ==========================================================
  // SUBMIT
  // ==========================================================

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);

      const data: VehicleFormData = {
        brand: form.brand.trim(),
        model: form.model.trim(),
        year: Number(form.year),
        registration_number: form.registration_number.trim(),
        vin: form.vin.trim() || null,
        color: form.color.trim(),
        category: form.category as VehicleCategory,
        transmission: form.transmission as VehicleFormData["transmission"],
        fuel_type: form.fuel_type as VehicleFormData["fuel_type"],
        seats: Number(form.seats),
        doors: Number(form.doors),
        air_conditioning: form.air_conditioning,
        daily_rate: form.daily_rate,
        weekly_rate: form.weekly_rate.trim() ? form.weekly_rate : null,
        monthly_rate: form.monthly_rate.trim() ? form.monthly_rate : null,
        deposit: form.deposit.trim() ? form.deposit : null,
        unlimited_mileage: form.unlimited_mileage,
        status: form.status,
        condition: form.condition,
        mileage: Number(form.mileage),
        last_maintenance_date: form.last_maintenance_date || null,
        next_maintenance_date: form.next_maintenance_date || null,
        description: form.description.trim() || null,
        equipment_ids: [],
      };

      const createdVehicle = await vehicleService.createVehicle(data);

      if (images.length > 0) {
        for (let index = 0; index < images.length; index++) {
          const imageItem = images[index];

          if (!imageItem.file) continue;

          await vehicleService.addImage(createdVehicle.id, {
            image: imageItem.file,
            caption: imageItem.caption ?? undefined,
            is_primary: imageItem.is_primary ?? false,
            display_order: index,
          });
        }

        try {
          const updatedVehicle = await vehicleService.getVehicle(
            createdVehicle.id,
          );

          onCreated(updatedVehicle);
        } catch {
          onCreated(createdVehicle);
        }
      } else {
        onCreated(createdVehicle);
      }

      setForm(initialForm);
      setImages([]);
      setError(null);
      onClose();
    } catch (err) {
      console.error("Erreur lors de la création du véhicule :", err);
      setError(extractApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;

    setForm(initialForm);
    setImages([]);
    setError(null);
    onClose();
  };

  if (!open) return null;

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[95vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* HEADER */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <Car size={22} />
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Ajouter un véhicule
              </h2>
              <p className="text-sm text-gray-500">
                Enregistrer un nouveau véhicule dans la flotte
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 overflow-y-auto p-6">
            {error && (
              <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                <AlertCircle size={20} className="mt-0.5 shrink-0" />
                <p className="whitespace-pre-wrap">{error}</p>
              </div>
            )}

            {/* IDENTIFICATION */}
            <section className="mb-8">
              <SectionTitle>Identification du véhicule</SectionTitle>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field
                  label="Marque"
                  value={form.brand}
                  required
                  maxLength={50}
                  placeholder="Ex. Toyota"
                  onChange={(value) => updateField("brand", value)}
                />

                <Field
                  label="Modèle"
                  value={form.model}
                  required
                  maxLength={100}
                  placeholder="Ex. Corolla"
                  onChange={(value) => updateField("model", value)}
                />

                <Field
                  label="Année"
                  type="number"
                  value={form.year}
                  required
                  min={MIN_YEAR}
                  max={MAX_YEAR}
                  step={1}
                  placeholder={`Ex. ${new Date().getFullYear()}`}
                  onChange={(value) => updateField("year", value)}
                />

                <Field
                  label="Immatriculation"
                  value={form.registration_number}
                  required
                  maxLength={20}
                  placeholder="Ex. AA-12345"
                  onChange={(value) =>
                    updateField("registration_number", value.toUpperCase())
                  }
                />

                <Field
                  label="VIN"
                  value={form.vin}
                  maxLength={17}
                  placeholder="17 caractères (sans I, O, Q)"
                  onChange={(value) =>
                    updateField("vin", value.toUpperCase())
                  }
                />

                <Field
                  label="Couleur"
                  value={form.color}
                  required
                  maxLength={50}
                  placeholder="Ex. Blanc"
                  onChange={(value) => updateField("color", value)}
                />
              </div>
            </section>

            {/* CARACTÉRISTIQUES */}
            <section className="mb-8">
              <SectionTitle>Caractéristiques</SectionTitle>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                <SelectField
                  label="Catégorie"
                  value={form.category}
                  required
                  onChange={(value) => updateField("category", value)}
                  options={[
                    { value: "", label: "Sélectionner" },
                    { value: "ECONOMIQUE", label: "Économique" },
                    { value: "COMPACTE", label: "Compacte" },
                    { value: "BERLINE", label: "Berline" },
                    { value: "SUV", label: "SUV" },
                    { value: "PICKUP", label: "Pick-up" },
                    { value: "MINIVAN", label: "Minivan" },
                    { value: "VAN", label: "Van" },
                    { value: "LUXE", label: "Luxe" },
                    { value: "SPORT", label: "Sport" },
                    { value: "AUTRE", label: "Autre" },
                  ]}
                />

                <SelectField
                  label="Transmission"
                  value={form.transmission}
                  required
                  onChange={(value) => updateField("transmission", value)}
                  options={[
                    { value: "AUTOMATIC", label: "Automatique" },
                    { value: "MANUAL", label: "Manuelle" },
                  ]}
                />

                <SelectField
                  label="Carburant"
                  value={form.fuel_type}
                  required
                  onChange={(value) => updateField("fuel_type", value)}
                  options={[
                    { value: "GASOLINE", label: "Essence" },
                    { value: "DIESEL", label: "Diesel" },
                    { value: "HYBRID", label: "Hybride" },
                    { value: "ELECTRIC", label: "Électrique" },
                    { value: "LPG", label: "GPL" },
                    { value: "OTHER", label: "Autre" },
                  ]}
                />

                <Field
                  label="Nombre de places"
                  type="number"
                  value={form.seats}
                  required
                  min={1}
                  max={50}
                  step={1}
                  onChange={(value) => updateField("seats", value)}
                />

                <Field
                  label="Nombre de portes"
                  type="number"
                  value={form.doors}
                  required
                  min={1}
                  max={10}
                  step={1}
                  onChange={(value) => updateField("doors", value)}
                />

                <div className="flex items-center rounded-xl border border-gray-200 px-4">
                  <label className="flex cursor-pointer items-center gap-3 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={form.air_conditioning}
                      onChange={(event) =>
                        updateField("air_conditioning", event.target.checked)
                      }
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    Climatisation
                  </label>
                </div>
              </div>
            </section>

            {/* TARIFICATION */}
            <section className="mb-8">
              <SectionTitle>Tarification</SectionTitle>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Field
                  label="Prix journalier"
                  type="number"
                  value={form.daily_rate}
                  required
                  min={0}
                  step="0.01"
                  placeholder="Ex. 65.00"
                  onChange={(value) => updateField("daily_rate", value)}
                />

                <Field
                  label="Prix hebdomadaire"
                  type="number"
                  value={form.weekly_rate}
                  min={0}
                  step="0.01"
                  placeholder="Optionnel"
                  onChange={(value) => updateField("weekly_rate", value)}
                />

                <Field
                  label="Prix mensuel"
                  type="number"
                  value={form.monthly_rate}
                  min={0}
                  step="0.01"
                  placeholder="Optionnel"
                  onChange={(value) => updateField("monthly_rate", value)}
                />

                <Field
                  label="Caution"
                  type="number"
                  value={form.deposit}
                  min={0}
                  step="0.01"
                  placeholder="Optionnel"
                  onChange={(value) => updateField("deposit", value)}
                />
              </div>

              <label className="mt-4 flex cursor-pointer items-center gap-3 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={form.unlimited_mileage}
                  onChange={(event) =>
                    updateField("unlimited_mileage", event.target.checked)
                  }
                  className="h-4 w-4 rounded border-gray-300"
                />
                Kilométrage illimité
              </label>
            </section>

            {/* ÉTAT */}
            <section className="mb-8">
              <SectionTitle>État du véhicule</SectionTitle>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <Field
                  label="Kilométrage"
                  type="number"
                  value={form.mileage}
                  required
                  min={0}
                  step={1}
                  onChange={(value) => updateField("mileage", value)}
                />

                <SelectField
                  label="État"
                  value={form.condition}
                  required
                  onChange={(value) =>
                    updateField("condition", value as VehicleCondition)
                  }
                  options={[
                    { value: "EXCELLENT", label: "Excellent" },
                    { value: "GOOD", label: "Bon" },
                    { value: "FAIR", label: "Moyen" },
                    { value: "POOR", label: "Mauvais" },
                  ]}
                />

                <SelectField
                  label="Statut"
                  value={form.status}
                  required
                  onChange={(value) =>
                    updateField("status", value as VehicleStatus)
                  }
                  options={[
                    { value: "AVAILABLE", label: "Disponible" },
                    { value: "MAINTENANCE", label: "Maintenance" },
                    { value: "OUT_OF_SERVICE", label: "Hors service" },
                  ]}
                />
              </div>
            </section>

            {/* MAINTENANCE */}
            <section className="mb-8">
              <SectionTitle>Maintenance</SectionTitle>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field
                  label="Dernière maintenance"
                  type="date"
                  value={form.last_maintenance_date}
                  max={new Date().toISOString().split("T")[0]}
                  onChange={(value) =>
                    updateField("last_maintenance_date", value)
                  }
                />
              
                <Field
                  label="Prochaine maintenance"
                  type="date"
                  value={form.next_maintenance_date}
                  min={getTodayDate()}
                  onChange={(value) =>
                    updateField("next_maintenance_date", value)
                  }
                />
              </div>
            </section>

            {/* DESCRIPTION */}
            <section className="mb-8">
              <SectionTitle>Description</SectionTitle>

              <textarea
                value={form.description}
                maxLength={2000}
                rows={4}
                placeholder="Description du véhicule..."
                onChange={(event) =>
                  updateField("description", event.target.value)
                }
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />

              <p className="mt-1 text-right text-xs text-gray-400">
                {form.description.length}/2000
              </p>
            </section>

            {/* IMAGES */}
            <section>
              <SectionTitle>Photos du véhicule</SectionTitle>

              <VehicleImageManager images={images} onChange={setImages} />
            </section>
          </div>

          {/* FOOTER */}
          <div className="flex items-center justify-end gap-3 border-t bg-gray-50 px-6 py-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Annuler
            </button>

            <button
              type="submit"
              disabled={loading}
              className="cursor-pointer flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-red-700 active:bg-red-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Création...
                </>
              ) : (
                <>
                  <Check size={18} />
                  Créer le véhicule
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================
// SECTION TITLE
// ============================================================

interface SectionTitleProps {
  children: React.ReactNode;
}

function SectionTitle({ children }: SectionTitleProps) {
  return (
    <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-700">
      {children}
    </h3>
  );
}

// ============================================================
// FIELD
// ============================================================

interface FieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "number" | "date";
  required?: boolean;
  min?: number | string;
  max?: number | string;
  step?: number | string;
  maxLength?: number;
  placeholder?: string;
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required = false,
  min,
  max,
  step,
  maxLength,
  placeholder,
}: FieldProps) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>

      <input
        type={type}
        value={value}
        required={required}
        min={min}
        max={max}
        step={step}
        maxLength={maxLength}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100"
      />
    </div>
  );
}

// ============================================================
// SELECT FIELD
// ============================================================

interface SelectOption {
  value: string;
  label: string;
}

interface SelectFieldProps {
  label: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  required?: boolean;
}

function SelectField({
  label,
  value,
  options,
  onChange,
  required = false,
}: SelectFieldProps) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>

      <select
        value={value}
        required={required}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}