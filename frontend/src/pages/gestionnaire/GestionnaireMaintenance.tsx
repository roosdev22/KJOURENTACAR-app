
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Plus,
  RefreshCw,
  Search,
  Wrench,
  X,
  Play,
  CircleCheck,
  CarFront,
  Banknote,
  Gauge,
} from "lucide-react";
import { isAxiosError } from "axios";

import maintenanceService from "../../api/services/maintenanceService";
import vehicleService from "../../api/services/vehicleService";

import type {
  Maintenance,
  MaintenanceFormData,
  MaintenanceStatus,
  MaintenanceType,
} from "../../types/maintenance";
import type { Vehicle } from "../../api/services/vehicleService";

import {
  MAINTENANCE_STATUS_LABELS,
  MAINTENANCE_TYPE_LABELS,
} from "../../types/maintenance";

type StatusFilter = "ALL" | MaintenanceStatus;

const inputClass =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100";

const today = () => {
  const date = new Date();
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000)
    .toISOString()
    .slice(0, 10);
};

function getErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    const data = error.response?.data as
      | { detail?: string | string[]; [key: string]: unknown }
      | undefined;

    if (Array.isArray(data?.detail)) {
      return data.detail.join(" ");
    }

    if (typeof data?.detail === "string") {
      return data.detail;
    }

    if (data) {
      const messages = Object.values(data)
        .flatMap((value) => Array.isArray(value) ? value : [value])
        .filter((value): value is string => typeof value === "string");

      if (messages.length > 0) return messages.join(" ");
    }

    if (!error.response) {
      return "Impossible de joindre le serveur. Vérifiez votre connexion.";
    }
  }

  return "Une erreur inattendue est survenue.";
}

function formatDate(value: string | null): string {
  if (!value) return "—";

  const date = new Date(value.length === 10 ? `${value}T12:00:00` : value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatMoney(value: string | number): string {
  return new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value) || 0) + " HTG";
}

function StatusBadge({ status }: { status: MaintenanceStatus }) {
  const styles: Record<MaintenanceStatus, string> = {
    PLANNED: "bg-amber-50 text-amber-700 ring-amber-200",
    IN_PROGRESS: "bg-blue-50 text-blue-700 ring-blue-200",
    COMPLETED: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    CANCELLED: "bg-gray-100 text-gray-600 ring-gray-200",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${styles[status]}`}
    >
      {MAINTENANCE_STATUS_LABELS[status]}
    </span>
  );
}

const initialForm = (): MaintenanceFormData => ({
  vehicle: "",
  maintenance_type: "PREVENTIVE",
  title: "",
  description: "",
  scheduled_date: today(),
  mileage: 0,
  cost: "0.00",
  provider: "",
  notes: "",
});

export default function GestionnaireMaintenance() {
  const [maintenances, setMaintenances] = useState<Maintenance[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [typeFilter, setTypeFilter] = useState<"ALL" | MaintenanceType>("ALL");

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<MaintenanceFormData>(initialForm);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [maintenanceData, vehicleData] = await Promise.all([
        maintenanceService.getAll(),
        vehicleService.getVehicles(),
      ]);

      setMaintenances(maintenanceData);
      setVehicles(vehicleData);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
  let active = true;

  const fetchInitialData = async () => {
    try {
      const [maintenanceData, vehicleData] = await Promise.all([
        maintenanceService.getAll(),
        vehicleService.getVehicles(),
      ]);

      if (!active) return;

      setMaintenances(maintenanceData);
      setVehicles(vehicleData);
    } catch (err: unknown) {
      if (active) {
        setError(getErrorMessage(err));
      }
    } finally {
      if (active) {
        setLoading(false);
      }
    }
  };

  void fetchInitialData();

  return () => {
    active = false;
  };
}, []);

  const filteredMaintenances = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("fr");

    return maintenances.filter((item) => {
      const matchesSearch =
        !query ||
        item.title.toLocaleLowerCase("fr").includes(query) ||
        item.vehicle_display.toLocaleLowerCase("fr").includes(query) ||
        item.provider.toLocaleLowerCase("fr").includes(query) ||
        item.id.toLocaleLowerCase("fr").includes(query);

      const matchesStatus =
        statusFilter === "ALL" || item.status === statusFilter;

      const matchesType =
        typeFilter === "ALL" || item.maintenance_type === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [maintenances, search, statusFilter, typeFilter]);

  const stats = useMemo(() => ({
    planned: maintenances.filter((item) => item.status === "PLANNED").length,
    inProgress: maintenances.filter((item) => item.status === "IN_PROGRESS").length,
    completed: maintenances.filter((item) => item.status === "COMPLETED").length,
    totalCost: maintenances
      .filter((item) => item.status === "COMPLETED")
      .reduce((sum, item) => sum + (Number(item.cost) || 0), 0),
  }), [maintenances]);

  const updateForm = <K extends keyof MaintenanceFormData>(
    key: K,
    value: MaintenanceFormData[K],
  ) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleVehicleChange = (vehicleId: string) => {
    const selectedVehicle = vehicles.find((vehicle) => vehicle.id === vehicleId);

    setForm((current) => ({
      ...current,
      vehicle: vehicleId,
      mileage: selectedVehicle ? selectedVehicle.mileage : current.mileage,
    }));
  };

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!form.vehicle) {
      setError("Veuillez sélectionner un véhicule.");
      return;
    }

    if (!form.title.trim()) {
      setError("Le titre de la maintenance est obligatoire.");
      return;
    }

    if (!Number.isSafeInteger(Number(form.mileage)) || Number(form.mileage) < 0) {
      setError("Le kilométrage doit être un entier positif ou nul.");
      return;
    }

    if (!Number.isFinite(Number(form.cost)) || Number(form.cost) < 0) {
      setError("Le coût doit être un nombre positif ou nul.");
      return;
    }

    setSaving(true);

    try {
      const payload: MaintenanceFormData = {
        ...form,
        title: form.title.trim(),
        description: form.description.trim(),
        provider: form.provider.trim(),
        notes: form.notes.trim(),
        mileage: Number(form.mileage),
        cost: Number(form.cost).toFixed(2),
      };

      await maintenanceService.create(payload);

      setShowCreate(false);
      setForm(initialForm());
      setSuccess("La maintenance a été créée avec succès.");
      await loadData();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleAction = async (
    item: Maintenance,
    action: "demarrer" | "terminer",
  ) => {
    const message = action === "demarrer"
      ? `Démarrer la maintenance « ${item.title} » ?`
      : `Terminer la maintenance « ${item.title} » ?`;

    if (!window.confirm(message)) return;

    setError(null);
    setSuccess(null);
    setProcessingId(item.id);

    try {
      if (action === "demarrer") {
        await maintenanceService.demarrer(item.id);
        setSuccess("La maintenance a démarré.");
      } else {
        await maintenanceService.terminer(item.id);
        setSuccess("La maintenance est terminée.");
      }

      await loadData();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* En-tête */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm text-gray-500">
            <Wrench className="h-4 w-4 text-red-600" />
            Gestion du parc / Maintenance
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Maintenance des véhicules
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Planifiez les interventions et suivez leur avancement.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void loadData()}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Actualiser
          </button>

          <button
            type="button"
            onClick={() => {
              setError(null);
              setSuccess(null);
              setForm(initialForm());
              setShowCreate(true);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-red-700"
          >
            <Plus className="h-4 w-4" />
            Nouvelle maintenance
          </button>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div role="alert" className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <div className="flex-1">{error}</div>
          <button type="button" onClick={() => setError(null)} aria-label="Fermer le message">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {success && (
        <div role="status" className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
          <div className="flex-1">{success}</div>
          <button type="button" onClick={() => setSuccess(null)} aria-label="Fermer le message">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Indicateurs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Planifiées"
          value={stats.planned}
          icon={CalendarDays}
          iconClass="bg-amber-50 text-amber-700"
        />
        <StatCard
          label="En cours"
          value={stats.inProgress}
          icon={Clock3}
          iconClass="bg-blue-50 text-blue-700"
        />
        <StatCard
          label="Terminées"
          value={stats.completed}
          icon={CheckCircle2}
          iconClass="bg-emerald-50 text-emerald-700"
        />
        <StatCard
          label="Coût des interventions terminées"
          value={formatMoney(stats.totalCost)}
          icon={Banknote}
          iconClass="bg-red-50 text-red-700"
        />
      </div>

      {/* Liste */}
      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-gray-200 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="font-semibold text-gray-900">Registre des maintenances</h2>
            <p className="mt-1 text-xs text-gray-500">
              {filteredMaintenances.length} résultat(s)
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="relative sm:col-span-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Rechercher..."
                aria-label="Rechercher une maintenance"
                className={`${inputClass} pl-9`}
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
              aria-label="Filtrer par statut"
              className={inputClass}
            >
              <option value="ALL">Tous les statuts</option>
              <option value="PLANNED">Planifiée</option>
              <option value="IN_PROGRESS">En cours</option>
              <option value="COMPLETED">Terminée</option>
              <option value="CANCELLED">Annulée</option>
            </select>

            <select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value as "ALL" | MaintenanceType)}
              aria-label="Filtrer par type"
              className={inputClass}
            >
              <option value="ALL">Tous les types</option>
              {Object.entries(MAINTENANCE_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-56 items-center justify-center gap-3 text-sm text-gray-500">
            <RefreshCw className="h-5 w-5 animate-spin text-red-600" />
            Chargement des maintenances...
          </div>
        ) : filteredMaintenances.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
              <Wrench className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="mt-4 font-semibold text-gray-900">Aucune maintenance trouvée</h3>
            <p className="mt-1 max-w-md text-sm text-gray-500">
              Modifiez les filtres ou créez une nouvelle intervention pour un véhicule.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setStatusFilter("ALL");
                setTypeFilter("ALL");
              }}
              className="mt-4 text-sm font-semibold text-red-600 hover:text-red-700"
            >
              Réinitialiser les filtres
            </button>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[950px] text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-5 py-3.5 font-semibold">Intervention</th>
                    <th className="px-5 py-3.5 font-semibold">Véhicule</th>
                    <th className="px-5 py-3.5 font-semibold">Date prévue</th>
                    <th className="px-5 py-3.5 font-semibold">Kilométrage</th>
                    <th className="px-5 py-3.5 font-semibold">Coût</th>
                    <th className="px-5 py-3.5 font-semibold">Statut</th>
                    <th className="px-5 py-3.5 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredMaintenances.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/80">
                      <td className="px-5 py-4">
                        <p className="font-semibold text-gray-900">{item.title}</p>
                        <p className="mt-1 text-xs text-gray-500">
                          {MAINTENANCE_TYPE_LABELS[item.maintenance_type]}
                        </p>
                        {item.provider && (
                          <p className="mt-1 text-xs text-gray-500">{item.provider}</p>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <CarFront className="h-4 w-4 shrink-0 text-gray-400" />
                          <span className="font-medium text-gray-800">
                            {item.vehicle_display || "Véhicule"}
                          </span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-gray-600">
                        {formatDate(item.scheduled_date)}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-gray-600">
                        <span className="inline-flex items-center gap-1">
                          <Gauge className="h-3.5 w-3.5 text-gray-400" />
                          {item.mileage.toLocaleString("fr-FR")} km
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 font-medium text-gray-800">
                        {formatMoney(item.cost)}
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={item.status} />
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          {item.status === "PLANNED" && (
                            <button
                              type="button"
                              disabled={processingId === item.id}
                              onClick={() => void handleAction(item, "demarrer")}
                              title="Démarrer la maintenance"
                              className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 px-2.5 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-50 disabled:opacity-50"
                            >
                              <Play className="h-3.5 w-3.5" />
                              Démarrer
                            </button>
                          )}
                          {item.status === "IN_PROGRESS" && (
                            <button
                              type="button"
                              disabled={processingId === item.id}
                              onClick={() => void handleAction(item, "terminer")}
                              title="Terminer la maintenance"
                              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 px-2.5 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
                            >
                              <CircleCheck className="h-3.5 w-3.5" />
                              Terminer
                            </button>
                          )}
                          {processingId === item.id && (
                            <RefreshCw className="h-4 w-4 animate-spin self-center text-gray-400" />
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-gray-100 md:hidden">
              {filteredMaintenances.map((item) => (
                <article key={item.id} className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-gray-900">{item.title}</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        {item.vehicle_display || "Véhicule"}
                      </p>
                    </div>
                    <StatusBadge status={item.status} />
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-gray-500">Date prévue</p>
                      <p className="mt-1 font-medium">{formatDate(item.scheduled_date)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Coût</p>
                      <p className="mt-1 font-medium">{formatMoney(item.cost)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Type</p>
                      <p className="mt-1">{MAINTENANCE_TYPE_LABELS[item.maintenance_type]}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Kilométrage</p>
                      <p className="mt-1">{item.mileage.toLocaleString("fr-FR")} km</p>
                    </div>
                  </div>
                  {item.status === "PLANNED" && (
                    <button
                      type="button"
                      disabled={processingId === item.id}
                      onClick={() => void handleAction(item, "demarrer")}
                      className="inline-flex items-center gap-2 rounded-lg border border-blue-200 px-3 py-2 text-sm font-semibold text-blue-700 disabled:opacity-50"
                    >
                      <Play className="h-4 w-4" />
                      Démarrer
                    </button>
                  )}
                  {item.status === "IN_PROGRESS" && (
                    <button
                      type="button"
                      disabled={processingId === item.id}
                      onClick={() => void handleAction(item, "terminer")}
                      className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 px-3 py-2 text-sm font-semibold text-emerald-700 disabled:opacity-50"
                    >
                      <CircleCheck className="h-4 w-4" />
                      Terminer
                    </button>
                  )}
                </article>
              ))}
            </div>
          </>
        )}
      </section>

      {/* Formulaire de création */}
      {showCreate && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-gray-950/50 p-4 sm:items-center"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saving) {
              setShowCreate(false);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="maintenance-create-title"
            className="my-4 w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 sm:px-6">
              <div>
                <h2 id="maintenance-create-title" className="text-lg font-bold text-gray-900">
                  Nouvelle maintenance
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Enregistrez les informations de l'intervention.
                </p>
              </div>
              <button
                type="button"
                disabled={saving}
                onClick={() => setShowCreate(false)}
                aria-label="Fermer"
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={(event) => void handleCreate(event)}>
              <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 sm:p-6">
                <label className="space-y-1.5 sm:col-span-2">
                  <span className="text-sm font-medium text-gray-700">Véhicule *</span>
                  <select
                    required
                    value={form.vehicle}
                    onChange={(event) => handleVehicleChange(event.target.value)}
                    className={inputClass}
                  >
                    <option value="">Sélectionner un véhicule</option>
                    {vehicles.map((vehicle) => (
                      <option key={vehicle.id} value={vehicle.id}>
                        {vehicle.display_name || vehicle.full_name || `${vehicle.brand} ${vehicle.model}`} — {vehicle.registration_number}
                      </option>
                    ))}
                  </select>
                  {vehicles.length === 0 && !loading && (
                    <span className="block text-xs text-amber-700">
                      Aucun véhicule n'est disponible dans la liste chargée.
                    </span>
                  )}
                </label>

                <label className="space-y-1.5">
                  <span className="text-sm font-medium text-gray-700">Type *</span>
                  <select
                    required
                    value={form.maintenance_type}
                    onChange={(event) => updateForm("maintenance_type", event.target.value as MaintenanceType)}
                    className={inputClass}
                  >
                    {Object.entries(MAINTENANCE_TYPE_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </label>

                <label className="space-y-1.5">
                  <span className="text-sm font-medium text-gray-700">Date prévue *</span>
                  <input
                    required
                    type="date"
                    value={form.scheduled_date}
                    onChange={(event) => updateForm("scheduled_date", event.target.value)}
                    className={inputClass}
                  />
                </label>

                <label className="space-y-1.5 sm:col-span-2">
                  <span className="text-sm font-medium text-gray-700">Titre de l'intervention *</span>
                  <input
                    required
                    maxLength={150}
                    value={form.title}
                    onChange={(event) => updateForm("title", event.target.value)}
                    placeholder="Ex. : Vidange et remplacement du filtre"
                    className={inputClass}
                  />
                </label>

                <label className="space-y-1.5">
                  <span className="text-sm font-medium text-gray-700">Kilométrage (km) *</span>
                  <input
                    required
                    type="number"
                    min={0}
                    step={1}
                    value={form.mileage}
                    onChange={(event) => updateForm("mileage", Number(event.target.value))}
                    className={inputClass}
                  />
                </label>

                <label className="space-y-1.5">
                  <span className="text-sm font-medium text-gray-700">Coût estimé (HTG) *</span>
                  <input
                    required
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.cost}
                    onChange={(event) => updateForm("cost", event.target.value)}
                    className={inputClass}
                  />
                </label>

                <label className="space-y-1.5 sm:col-span-2">
                  <span className="text-sm font-medium text-gray-700">Garage ou prestataire</span>
                  <input
                    maxLength={150}
                    value={form.provider}
                    onChange={(event) => updateForm("provider", event.target.value)}
                    placeholder="Nom du garage ou du mécanicien"
                    className={inputClass}
                  />
                </label>

                <label className="space-y-1.5 sm:col-span-2">
                  <span className="text-sm font-medium text-gray-700">Description</span>
                  <textarea
                    rows={3}
                    value={form.description}
                    onChange={(event) => updateForm("description", event.target.value)}
                    placeholder="Décrivez les travaux à effectuer..."
                    className={inputClass}
                  />
                </label>

                <label className="space-y-1.5 sm:col-span-2">
                  <span className="text-sm font-medium text-gray-700">Notes internes</span>
                  <textarea
                    rows={2}
                    value={form.notes}
                    onChange={(event) => updateForm("notes", event.target.value)}
                    placeholder="Informations réservées à l'équipe..."
                    className={inputClass}
                  />
                </label>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-gray-200 bg-gray-50 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => setShowCreate(false)}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving || vehicles.length === 0}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving && <RefreshCw className="h-4 w-4 animate-spin" />}
                  {saving ? "Enregistrement..." : "Créer la maintenance"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  iconClass,
}: {
  label: string;
  value: string | number;
  icon: typeof Wrench;
  iconClass: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p className="mt-2 break-words text-2xl font-bold tracking-tight text-gray-900">
            {value}
          </p>
        </div>
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconClass}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

