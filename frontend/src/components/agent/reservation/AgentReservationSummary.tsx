import type { ReactNode } from "react";

import {
  CalendarDays,
  CarFront,
  Mail,
  Save,
  UserRound,
} from "lucide-react";

import type { User } from "../../../api/services/authService";
import type { Vehicle } from "../../../api/services/vehicleService";

// interface AgentReservationSummaryProps {
//   client: User | null;
//   dateDebut: string;
//   dateFin: string;
//   vehicles: Vehicle[];
//   notesClient: string;
//   notesAgent: string;
//   onNotesClientChange: (value: string) => void;
//   onNotesAgentChange: (value: string) => void;
// }

interface AgentReservationSummaryProps {
  client: User | null;
  dateDebut: string;
  dateFin: string;
  vehicles: Vehicle[];
  notesClient: string;
  notesAgent: string;
  onNotesClientChange: (value: string) => void;
  onNotesAgentChange: (value: string) => void;
  canSubmit: boolean;
  isSubmitting: boolean;
  submitError: string | null;
  onSubmit: () => void;
}

function getClientName(client: User): string {
  const name = `${client.first_name || ""} ${
    client.last_name || ""
  }`.trim();

  return name || client.email;
}

function formatDate(date: string): string {
  if (!date) {
    return "—";
  }

  const parsed = new Date(`${date}T00:00:00`);

  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(parsed);
}

export default function AgentReservationSummary({
  client,
  dateDebut,
  dateFin,
  vehicles,
  notesClient,
  notesAgent,
  onNotesClientChange,
  onNotesAgentChange,
  canSubmit,
  isSubmitting,
  submitError,
  onSubmit
}: AgentReservationSummaryProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-6">
        <h2 className="text-lg font-bold text-slate-950">
          Confirmation
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Vérifiez les informations avant de créer la réservation.
        </p>
      </div>

      {/* Client */}
      <SummarySection
        icon={<UserRound size={17} />}
        title="Client"
      >
        {client ? (
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-sm font-bold text-red-700">
              {getClientName(client)
                .slice(0, 1)
                .toUpperCase()}
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-slate-900">
                {getClientName(client)}
              </p>

              <p className="mt-1 flex items-center gap-1 truncate text-xs text-slate-500">
                <Mail size={13} />
                {client.email}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-red-600">
            Aucun client sélectionné.
          </p>
        )}
      </SummarySection>

      {/* Dates */}
      <SummarySection
        icon={<CalendarDays size={17} />}
        title="Période"
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <SummaryItem
            label="Début"
            value={formatDate(dateDebut)}
          />

          <SummaryItem
            label="Fin"
            value={formatDate(dateFin)}
          />
        </div>
      </SummarySection>

      {/* Véhicules */}
      <SummarySection
        icon={<CarFront size={17} />}
        title="Véhicules"
      >
        {vehicles.length === 0 ? (
          <p className="text-sm text-red-600">
            Aucun véhicule sélectionné.
          </p>
        ) : (
          <div className="space-y-2">
            {vehicles.map((vehicle) => (
              <div
                key={vehicle.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <CarFront
                    size={16}
                    className="shrink-0 text-red-600"
                  />

                  <span className="truncate text-sm font-semibold text-slate-800">
                    {vehicle.brand} {vehicle.model}
                  </span>
                </div>

                <span className="shrink-0 text-xs text-slate-500">
                  {vehicle.registration_number}
                </span>
              </div>
            ))}
          </div>
        )}
      </SummarySection>

      {/* Notes */}
      <SummarySection title="Notes">
        <div className="space-y-4">
          <div>
            <label
              htmlFor="agent-reservation-notes-client"
              className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400"
            >
              Notes client
            </label>

            <textarea
              id="agent-reservation-notes-client"
              value={notesClient}
              onChange={(event) =>
                onNotesClientChange(event.target.value)
              }
              rows={3}
              placeholder="Informations communiquées par le client..."
              className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-red-500 focus:ring-2 focus:ring-red-100"
            />
          </div>

          <div>
            <label
              htmlFor="agent-reservation-notes-agent"
              className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400"
            >
              Notes agent
            </label>

            <textarea
              id="agent-reservation-notes-agent"
              value={notesAgent}
              onChange={(event) =>
                onNotesAgentChange(event.target.value)
              }
              rows={3}
              placeholder="Notes internes de l'agent..."
              className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-red-500 focus:ring-2 focus:ring-red-100"
            />
          </div>
        </div>
      </SummarySection>

      {/* Information métier */}
      <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
          Calculs de réservation
        </p>

        <p className="mt-2 text-sm leading-6 text-slate-600">
          Le nombre de jours, le montant total et la caution sont
          calculés par le backend à partir des tarifs enregistrés.
        </p>
      </div>
        
              {/* ========================================================
          ENREGISTREMENT
      ======================================================== */}

      {submitError && (
        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm font-medium text-red-700">
            {submitError}
          </p>
        </div>
      )}

      <button
        type="button"
        onClick={onSubmit}
        disabled={!canSubmit || isSubmitting}
        className={[
          "mt-5 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3.5",
          "text-sm font-bold transition",
          "focus:outline-none focus:ring-2 focus:ring-red-500/20",
          "disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400",
          canSubmit && !isSubmitting
            ? "bg-red-600 text-white hover:bg-red-700"
            : "",
        ].join(" ")}
      >
        <Save size={17} />

        {isSubmitting
          ? "Enregistrement..."
          : "Enregistrer la réservation"}
      </button>

    </section>
  );
}

// ============================================================
// SOUS-COMPOSANTS
// ============================================================

function SummarySection({
  icon,
  title,
  children,
}: {
  icon?: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="border-b border-slate-100 py-5 first:pt-0 last:border-0">
      <div className="mb-3 flex items-center gap-2">
        {icon && (
          <span className="text-red-600">
            {icon}
          </span>
        )}

        <h3 className="text-xs font-bold uppercase tracking-wide text-slate-400">
          {title}
        </h3>
      </div>

      {children}
    </section>
  );
}

function SummaryItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-sm font-bold text-slate-800">
        {value}
      </p>
    </div>
  );
}