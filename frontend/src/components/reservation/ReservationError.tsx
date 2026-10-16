import {
  AlertCircle,
  RefreshCw,
  X,
} from "lucide-react";

interface ReservationErrorProps {
  message: string;
  onRetry?: () => void;
}

export default function ReservationError({
  message,
  onRetry,
}: ReservationErrorProps) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className="
        overflow-hidden rounded-2xl
        border border-red-200
        bg-white
        shadow-[0_8px_30px_rgba(0,0,0,0.04)]
      "
    >
      <div className="flex items-start gap-4 p-5 sm:p-6">
        {/* Icon */}

        <div
          className="
            flex h-11 w-11 shrink-0
            items-center justify-center
            rounded-xl bg-red-50
          "
        >
          <AlertCircle
            size={21}
            strokeWidth={2}
            className="text-red-600"
            aria-hidden="true"
          />
        </div>

        {/* Content */}

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-black text-neutral-950">
              Impossible de charger les données
            </h2>

            <span className="hidden h-1 w-1 rounded-full bg-red-400 sm:block" />
          </div>

          <p className="mt-1.5 text-sm leading-6 text-neutral-600">
            {message}
          </p>

          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="
                mt-4 inline-flex items-center gap-2
                rounded-xl border border-neutral-200
                bg-white px-4 py-2.5
                text-xs font-black text-neutral-800
                shadow-sm
                transition-all duration-200
                hover:border-neutral-400
                hover:bg-neutral-50
                focus:outline-none
                focus:ring-2 focus:ring-red-600
                focus:ring-offset-2
              "
            >
              <RefreshCw size={14} />
              Réessayer
            </button>
          )}
        </div>

        {/* Decorative close icon */}

        <div
          className="
            flex h-7 w-7 shrink-0
            items-center justify-center
            rounded-full bg-red-50
          "
          aria-hidden="true"
        >
          <X
            size={14}
            className="text-red-500"
          />
        </div>
      </div>

      {/* Accent */}

      <div className="h-1 w-full bg-red-600" />
    </div>
  );
}