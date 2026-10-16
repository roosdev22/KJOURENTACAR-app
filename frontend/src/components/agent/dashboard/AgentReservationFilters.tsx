import {
  Search,
  RotateCcw,
  SlidersHorizontal,
  X,
} from "lucide-react";

import type {
  ReservationStatus,
  ReservationSource,
} from "../../../types/reservation";

interface AgentReservationFiltersProps {
  search: string;

  status: ReservationStatus | "ALL";

  payment:
    | "SUCCEEDED"
    | "PENDING"
    | "FAILED"
    | "NONE"
    | "ALL";

  source: ReservationSource | "ALL";

  onSearchChange: (value: string) => void;

  onStatusChange: (
    value: ReservationStatus | "ALL"
  ) => void;

  onPaymentChange: (
    value:
      | "SUCCEEDED"
      | "PENDING"
      | "FAILED"
      | "NONE"
      | "ALL"
  ) => void;

  onSourceChange: (
    value: ReservationSource | "ALL"
  ) => void;

  onReset: () => void;
}

export default function AgentReservationFilters({
  search,
  status,
  payment,
  source,
  onSearchChange,
  onStatusChange,
  onPaymentChange,
  onSourceChange,
  onReset,
}: AgentReservationFiltersProps) {
  const hasFilters =
    Boolean(search) ||
    status !== "ALL" ||
    payment !== "ALL" ||
    source !== "ALL";

  return (
    <section className="mb-5 rounded-xl border border-black/[0.07] bg-white p-3 shadow-[0_1px_2px_rgba(0,0,0,0.02)] sm:p-4">
      <div className="flex items-center gap-2 mb-3">
        <SlidersHorizontal className="h-4 w-4 text-black/40" />

        <span className="text-xs font-semibold text-black">
          Recherche et filtres
        </span>
      </div>

      <div className="flex flex-col gap-3 xl:flex-row">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black/30" />

          <input
            type="text"
            value={search}
            onChange={(event) =>
              onSearchChange(event.target.value)
            }
            placeholder="Rechercher une réservation, un client, un véhicule..."
            className="
              h-10
              w-full
              rounded-lg
              border
              border-black/[0.08]
              bg-[#fafafa]
              pl-9
              pr-9
              text-sm
              text-black
              outline-none
              transition
              placeholder:text-black/30
              focus:border-red-600
              focus:bg-white
              focus:ring-2
              focus:ring-red-600/10
            "
          />

          {search && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-black/30 hover:text-black"
              aria-label="Effacer la recherche"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 xl:w-[570px]">
          <select
            value={status}
            onChange={(event) =>
              onStatusChange(
                event.target.value as ReservationStatus | "ALL"
              )
            }
            className="
              h-10
              rounded-lg
              border
              border-black/[0.08]
              bg-[#fafafa]
              px-3
              text-sm
              text-black/70
              outline-none
              focus:border-red-600
              focus:ring-2
              focus:ring-red-600/10
            "
          >
            <option value="ALL">Tous les statuts</option>
            <option value="PENDING_VERIFICATION">
              À valider
            </option>
            <option value="CONFIRMED">Confirmées</option>
            <option value="EN_COURS">En cours</option>
            <option value="TERMINEE">Terminées</option>
            <option value="CANCELLED">Annulées</option>
          </select>

          <select
            value={payment}
            onChange={(event) =>
              onPaymentChange(
                event.target.value as
                  | "SUCCEEDED"
                  | "PENDING"
                  | "FAILED"
                  | "NONE"
                  | "ALL"
              )
            }
            className="
              h-10
              rounded-lg
              border
              border-black/[0.08]
              bg-[#fafafa]
              px-3
              text-sm
              text-black/70
              outline-none
              focus:border-red-600
              focus:ring-2
              focus:ring-red-600/10
            "
          >
            <option value="ALL">Tous les paiements</option>
            <option value="SUCCEEDED">Payé</option>
            <option value="PENDING">En attente</option>
            <option value="FAILED">Échec</option>
            <option value="NONE">Non payé</option>
          </select>

          <select
            value={source}
            onChange={(event) =>
              onSourceChange(
                event.target.value as ReservationSource | "ALL"
              )
            }
            className="
              h-10
              rounded-lg
              border
              border-black/[0.08]
              bg-[#fafafa]
              px-3
              text-sm
              text-black/70
              outline-none
              focus:border-red-600
              focus:ring-2
              focus:ring-red-600/10
            "
          >
            <option value="ALL">Toutes les sources</option>
            <option value="CLIENT">Client</option>
            <option value="AGENT">Agent</option>
          </select>
        </div>

        {hasFilters && (
          <button
            type="button"
            onClick={onReset}
            className="
              inline-flex
              h-10
              items-center
              justify-center
              gap-2
              rounded-lg
              border
              border-black/[0.08]
              px-3
              text-xs
              font-semibold
              text-black/55
              transition
              hover:border-black/15
              hover:bg-black/[0.03]
              hover:text-black
            "
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Réinitialiser
          </button>
        )}
      </div>
    </section>
  );
}