import { ArrowRight, CalendarDays } from "lucide-react";

// ============================================================
// TYPES
// ============================================================

interface ReservationDateSelectorProps {
  dateDebut: string;
  dateFin: string;
  onDateDebutChange: (value: string) => void;
  onDateFinChange: (value: string) => void;
  minDate?: string;
  disabled?: boolean;
  errorDateDebut?: string;
  errorDateFin?: string;
}

// ============================================================
// DATE FIELD
// ============================================================

function DateField({
  label,
  value,
  onChange,
  min,
  disabled,
  error,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  min?: string;
  disabled: boolean;
  error?: string;
}) {
  const hasValue = Boolean(value);

  return (
    <div className="min-w-0">
      {/* LABEL */}
      <div className="mb-1.5 flex items-center justify-between">
        <label className="text-[9px] font-bold uppercase tracking-[0.14em] text-neutral-500">
          {label}
        </label>

        <CalendarDays
          size={12}
          strokeWidth={1.8}
          className={
            error
              ? "text-red-600"
              : hasValue
                ? "text-red-600"
                : "text-neutral-300"
          }
        />
      </div>

      {/* INPUT */}
      <div
        className={[
          "relative flex h-10 items-center overflow-hidden rounded-md border",
          "transition-all duration-200",
          error
            ? "border-red-200 bg-red-50/30"
            : hasValue
              ? "border-neutral-300 bg-white"
              : "border-neutral-200 bg-neutral-50",
          disabled ? "cursor-not-allowed opacity-60" : "",
        ].join(" ")}
      >
        {/* ICON */}
        <div className="flex h-full w-9 shrink-0 items-center justify-center border-r border-neutral-200">
          <CalendarDays
            size={13}
            strokeWidth={1.8}
            className={
              error
                ? "text-red-600"
                : hasValue
                  ? "text-red-600"
                  : "text-neutral-400"
            }
          />
        </div>

        {/* INPUT DATE */}
        <input
          type="date"
          value={value}
          min={min}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          className={[
            "h-full min-w-0 flex-1 appearance-none bg-transparent px-2.5",
            "text-[11px] font-semibold text-neutral-900",
            "outline-none",
            "disabled:cursor-not-allowed",
            "[color-scheme:light]",
          ].join(" ")}
        />

        {/* ACTIVE LINE */}
        <span
          aria-hidden="true"
          className={[
            "absolute bottom-0 left-0 h-[2px] bg-red-600",
            "transition-all duration-300",
            hasValue ? "w-full" : "w-0",
          ].join(" ")}
        />
      </div>

      {/* ERROR */}
      {error && (
        <p className="mt-1 text-[9px] font-medium leading-3 text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

// ============================================================
// COMPONENT
// ============================================================

export default function ReservationDateSelector({
  dateDebut,
  dateFin,
  onDateDebutChange,
  onDateFinChange,
  minDate,
  disabled = false,
  errorDateDebut,
  errorDateFin,
}: ReservationDateSelectorProps) {
  const datesComplete = Boolean(dateDebut && dateFin);

  return (
    <section className="w-full max-w-3xl overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
      {/* ==================================================
          HEADER
      ================================================== */}

      <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2.5">
          {/* STEP */}
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-neutral-950">
            <span className="text-[8px] font-black tracking-[0.08em] text-white">
              01
            </span>
          </div>

          {/* TITLE */}
          <div className="min-w-0">
            <h2 className="text-[10px] font-black uppercase tracking-[0.14em] text-neutral-950">
              Dates de location
            </h2>

            <p className="mt-0.5 text-[9px] text-neutral-400">
              Définissez votre période
            </p>
          </div>
        </div>

        {/* STATUS */}
        <div className="flex shrink-0 items-center gap-1.5">
          <span
            className={[
              "h-1.5 w-1.5 rounded-full",
              datesComplete ? "bg-red-600" : "bg-neutral-300",
            ].join(" ")}
          />

          <span className="hidden text-[8px] font-bold uppercase tracking-[0.14em] text-neutral-400 sm:block">
            {datesComplete ? "Dates définies" : "Étape 1"}
          </span>
        </div>
      </div>

      {/* ==================================================
          DATE SELECTION
      ================================================== */}

      <div className="px-4 py-4">
        {/* CENTERED DATE BLOCK */}
        <div className="mx-auto w-full max-w-[680px]">
          <div className="grid items-end gap-3 md:grid-cols-[1fr_auto_1fr]">
            {/* START */}
            <DateField
              label="Début de location"
              value={dateDebut}
              onChange={onDateDebutChange}
              min={minDate}
              disabled={disabled}
              error={errorDateDebut}
            />

            {/* ARROW */}
            <div className="hidden h-10 items-center justify-center md:flex">
              <div className="flex h-6 w-6 items-center justify-center rounded-full border border-neutral-200 bg-white">
                <ArrowRight
                  size={11}
                  strokeWidth={1.8}
                  className="text-neutral-400"
                />
              </div>
            </div>

            {/* END */}
            <DateField
              label="Fin de location"
              value={dateFin}
              onChange={onDateFinChange}
              min={dateDebut || minDate}
              disabled={disabled}
              error={errorDateFin}
            />
          </div>

          {/* ==================================================
              INFORMATION
          ================================================== */}

          <div className="mt-3 flex items-center gap-2 border-t border-neutral-100 pt-2.5">
            <CalendarDays
              size={11}
              strokeWidth={1.7}
              className="shrink-0 text-red-600"
            />

            <p className="text-[8px] leading-3.5 text-neutral-400">
              La disponibilité des véhicules sera vérifiée selon cette
              période.
            </p>
          </div>
        </div>
      </div>

      {/* ==================================================
          BOTTOM STATUS
      ================================================== */}

      <div
        aria-hidden="true"
        className={[
          "h-[2px] bg-red-600 transition-all duration-300",
          datesComplete ? "w-full" : "w-10",
        ].join(" ")}
      />
    </section>
  );
}







