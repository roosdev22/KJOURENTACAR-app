import { FileText, MessageSquareText } from "lucide-react";

interface ReservationNotesProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  maxLength?: number;
}

const DEFAULT_MAX_LENGTH = 1000;

export default function ReservationNotes({
  value,
  onChange,
  disabled = false,
  maxLength = DEFAULT_MAX_LENGTH,
}: ReservationNotesProps) {
  const remainingCharacters = maxLength - value.length;
  const hasContent = value.length > 0;
  const isNearLimit = remainingCharacters < 100;

  return (
    <section className="relative overflow-hidden rounded-[28px] border border-neutral-200/80 bg-white shadow-[0_20px_60px_-30px_rgba(0,0,0,0.25)]">
      {/* Premium accent */}
      <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-neutral-950 via-red-600 to-neutral-950" />

      {/* ============================================================
          HEADER
      ============================================================ */}
      <div className="border-b border-neutral-100 px-5 pb-5 pt-7 sm:px-7 sm:pb-6 sm:pt-8">
        <div className="flex items-start justify-between gap-5">
          <div className="flex min-w-0 items-start gap-4">
            {/* Icon */}
            <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-[17px] bg-neutral-950 text-white shadow-[0_8px_20px_-8px_rgba(0,0,0,0.5)]">
              <FileText
                size={19}
                strokeWidth={1.8}
                className="relative z-10"
              />

              <div className="absolute inset-0 rounded-[17px] bg-gradient-to-br from-white/10 to-transparent" />
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-[15px] font-extrabold tracking-[-0.02em] text-neutral-950 sm:text-[17px]">
                  Notes pour votre réservation
                </h2>

                <span className="inline-flex items-center rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.14em] text-neutral-500">
                  Facultatif
                </span>
              </div>

              <p className="mt-2 max-w-xl text-[13px] leading-5 text-neutral-500 sm:text-sm sm:leading-6">
                Ajoutez une demande ou une information utile à notre équipe.
              </p>
            </div>
          </div>

          {/* Decorative indicator */}
          <div className="hidden shrink-0 items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5 sm:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-red-600" />
            <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-neutral-500">
              Message
            </span>
          </div>
        </div>
      </div>

      {/* ============================================================
          CONTENT
      ============================================================ */}
      <div className="px-5 py-5 sm:px-7 sm:py-7">
        {/* Label / Counter */}
        <div className="flex items-center justify-between gap-4">
          <label
            htmlFor="reservation-notes"
            className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.18em] text-neutral-700"
          >
            <MessageSquareText
              size={13}
              strokeWidth={2}
              className="text-neutral-400"
            />

            Votre message
          </label>

          <div
            className={[
              "rounded-full border px-2.5 py-1 text-[10px] font-bold tabular-nums transition-all duration-200",
              isNearLimit
                ? "border-red-200 bg-red-50 text-red-600"
                : hasContent
                  ? "border-neutral-200 bg-neutral-50 text-neutral-600"
                  : "border-neutral-100 bg-neutral-50 text-neutral-400",
            ].join(" ")}
          >
            {value.length}
            <span className="mx-0.5 text-neutral-300">/</span>
            {maxLength}
          </div>
        </div>

        {/* ============================================================
            TEXTAREA
        ============================================================ */}
        <div className="group relative mt-3.5">
          {/* Focus border */}
          <div className="pointer-events-none absolute -inset-px rounded-[20px] bg-gradient-to-br from-neutral-950/10 via-transparent to-red-600/10 opacity-0 transition-opacity duration-300 group-focus-within:opacity-100" />

          <div className="relative overflow-hidden rounded-[20px] border border-neutral-200 bg-neutral-50 transition-all duration-300 group-focus-within:border-neutral-300 group-focus-within:bg-white group-focus-within:shadow-[0_12px_35px_-20px_rgba(0,0,0,0.35)]">
            {/* Top inner line */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-neutral-300 to-transparent opacity-0 transition-opacity duration-300 group-focus-within:opacity-100" />

            <textarea
              id="reservation-notes"
              value={value}
              onChange={(event) => {
                onChange(event.target.value.slice(0, maxLength));
              }}
              disabled={disabled}
              maxLength={maxLength}
              rows={6}
              placeholder="Ex. : Je souhaite récupérer le véhicule à l'aéroport..."
              className={[
                "min-h-[155px] w-full resize-y bg-transparent px-5 py-4.5",
                "text-[13px] leading-6 text-neutral-950 outline-none",
                "placeholder:text-neutral-400",
                "transition-colors duration-200",
                "disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-400",
                "sm:min-h-[165px] sm:px-5 sm:py-5 sm:text-sm",
              ].join(" ")}
            />

            {/* Bottom status */}
            <div className="pointer-events-none absolute bottom-3.5 right-4 flex items-center gap-2">
              <span
                className={[
                  "h-1.5 w-1.5 rounded-full transition-all duration-300",
                  hasContent
                    ? isNearLimit
                      ? "bg-red-500"
                      : "bg-neutral-950"
                    : "bg-neutral-300",
                ].join(" ")}
              />

              <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
                {hasContent ? "En cours" : "Prêt à recevoir"}
              </span>
            </div>
          </div>
        </div>

        {/* ============================================================
            FOOTER
        ============================================================ */}
        <div className="mt-3.5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[11px] leading-5 text-neutral-400 sm:text-xs">
            Ces informations seront transmises à notre équipe.
          </p>

          {isNearLimit ? (
            <span className="flex items-center gap-1.5 text-[9px] font-extrabold uppercase tracking-[0.12em] text-red-600">
              <span className="h-1.5 w-1.5 rounded-full bg-red-600" />
              Limite bientôt atteinte
            </span>
          ) : (
            <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-neutral-300">
              Jusqu'à {maxLength} caractères
            </span>
          )}
        </div>
      </div>
    </section>
  );
}