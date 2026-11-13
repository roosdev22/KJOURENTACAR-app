
import { CalendarDays } from "lucide-react";

interface AgentReservationDatesProps {
  dateDebut: string;
  dateFin: string;
  onDateDebutChange: (value: string) => void;
  onDateFinChange: (value: string) => void;
}

function getLocalDate(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getNextDate(value: string): string {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + 1));

  return date.toISOString().slice(0, 10);
}

export default function AgentReservationDates({
  dateDebut,
  dateFin,
  onDateDebutChange,
  onDateFinChange,
}: AgentReservationDatesProps) {
  const today = getLocalDate();
  const minDateFin = dateDebut
    ? getNextDate(dateDebut)
    : getNextDate(today);

  const datesInvalides =
    Boolean(dateDebut && dateFin) && dateFin <= dateDebut;

  return (
    <section>
      <div className="mb-6">
        <div className="mb-2 flex items-center gap-2">
          <CalendarDays size={20} className="text-red-600" />

          <h2 className="text-lg font-bold text-slate-950">
            Période de location
          </h2>
        </div>

        <p className="text-sm text-slate-500">
          Définissez la date de départ et la date de retour.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <DateField
          label="Date de début"
          value={dateDebut}
          min={today}
          onChange={onDateDebutChange}
        />

        <DateField
          label="Date de fin"
          value={dateFin}
          min={minDateFin}
          onChange={onDateFinChange}
        />
      </div>

      {datesInvalides && (
        <div
          role="alert"
          className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          La date de fin doit être strictement postérieure à la date de début.
        </div>
      )}

      <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Règle métier
        </p>

        <p className="mt-1 text-sm leading-6 text-slate-600">
          Le nombre de jours et le montant de la réservation sont calculés par
          le serveur.
        </p>
      </div>
    </section>
  );
}

function DateField({
  label,
  value,
  min,
  onChange,
}: {
  label: string;
  value: string;
  min: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
        <span className="ml-1 text-red-600">*</span>
      </label>

      <div className="relative">
        <CalendarDays
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
        />

        <input
          type="date"
          value={value}
          min={min}
          onChange={(event) => onChange(event.target.value)}
          className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-800 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100"
        />
      </div>
    </div>
  );
}
