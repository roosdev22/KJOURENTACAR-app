import AdminIcon from "../admin/AdminIcon";

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
  id,
  value,
  onChange,
  min,
  disabled,
  error,
}: {
  label: string;
  id: string;
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
        <label htmlFor={id} className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#64748B]">
          {label}
        </label>

        <AdminIcon name="calendar-check" size={15} className={error ? "text-[#B4232F]" : "text-[#64748B]"} />
      </div>

      {/* INPUT */}
      <div
        className={[
          "relative flex h-10 items-center overflow-hidden rounded-md border",
          "transition-all duration-200",
          error
            ? "border-[#B4232F] bg-[#FFF5F6]"
            : hasValue
              ? "border-[#B7C0C7] bg-white"
              : "border-[#E3E6E8] bg-[#F8F9FA]",
          disabled ? "cursor-not-allowed opacity-60" : "",
        ].join(" ")}
      >
        {/* ICON */}
        <div className="flex h-full w-10 shrink-0 items-center justify-center border-r border-[#E3E6E8]">
          <AdminIcon name="calendar-check" size={15} className={error ? "text-[#B4232F]" : "text-[#64748B]"} />
        </div>

        {/* INPUT DATE */}
        <input
          id={id}
          type="date"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          value={value}
          min={min}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          className={[
            "h-full min-w-0 flex-1 appearance-none bg-transparent px-2.5",
            "text-sm font-semibold text-[#202327]",
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
        <p id={`${id}-error`} className="mt-1 text-xs font-medium leading-4 text-[#B4232F]">
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
    <section className="w-full border-b border-[#E3E6E8] bg-[#F4F5F6] px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-7xl overflow-hidden rounded-2xl border border-[#E3E6E8] bg-white shadow-sm">
      {/* ==================================================
          HEADER
      ================================================== */}

      <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2.5">
          {/* STEP */}
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-neutral-950">
            <span             className="text-[10px] font-bold tracking-[0.08em] text-white">
              01
            </span>
          </div>

          {/* TITLE */}
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-[#202327]">
              Dates de location
            </h2>

            <p className="mt-0.5 text-xs text-[#64748B]">
              Choisissez vos dates de départ et de retour
            </p>
          </div>
        </div>

        {/* STATUS */}
        <div className="flex shrink-0 items-center gap-1.5">
          <span
            className={[
              "h-1.5 w-1.5 rounded-full",
                datesComplete ? "bg-[#16845B]" : "bg-[#B7791F]",
            ].join(" ")}
          />

          <span className="hidden text-[10px] font-bold uppercase tracking-[0.1em] text-[#64748B] sm:block">
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
              id="reservation-date-start"
              value={dateDebut}
              onChange={onDateDebutChange}
              min={minDate}
              disabled={disabled}
              error={errorDateDebut}
            />

            {/* ARROW */}
            <div className="hidden h-10 items-center justify-center md:flex">
              <div className="flex h-6 w-6 items-center justify-center rounded-full border border-neutral-200 bg-white">
                <AdminIcon name="arrow-right" size={14} className="text-[#64748B]" />
              </div>
            </div>

            {/* END */}
            <DateField
              label="Fin de location"
              id="reservation-date-end"
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

          <div className="mt-4 flex items-center gap-2 border-t border-[#E3E6E8] pt-3">
            <AdminIcon name="info" size={15} className="shrink-0 text-[#B4232F]" />

            <p className="text-xs leading-5 text-[#64748B]">
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
      </div>
    </section>
  );
}







