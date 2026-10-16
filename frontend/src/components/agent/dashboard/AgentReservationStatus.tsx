
import type { ReservationStatus } from "../../../types/reservation";

interface AgentReservationStatusProps {
  status: ReservationStatus;
}

const STATUS_CONFIG: Record<
  ReservationStatus,
  {
    label: string;
    className: string;
  }
> = {
  PENDING_VERIFICATION: {
    label: "À valider",
    className: "bg-red-50 text-red-700 border-red-100",
  },

  CONFIRMED: {
    label: "Confirmée",
    className: "bg-emerald-50 text-emerald-700 border-emerald-100",
  },

  CANCELLED: {
    label: "Annulée",
    className: "bg-black/[0.04] text-black/50 border-black/[0.06]",
  },

  EN_COURS: {
    label: "En cours",
    className: "bg-blue-50 text-blue-700 border-blue-100",
  },

  TERMINEE: {
    label: "Terminée",
    className: "bg-slate-100 text-slate-600 border-slate-200",
  },

  EXPIRED: {
    label: "Expirée",
    className: "bg-gray-100 text-gray-600 border-gray-200",
  },
};

export default function AgentReservationStatus({
  status,
}: AgentReservationStatusProps) {
  const config = STATUS_CONFIG[status];

  return (
    <span
      className={`
        inline-flex
        items-center
        gap-1.5
        whitespace-nowrap
        rounded-full
        border
        px-2.5
        py-1
        text-[11px]
        font-semibold
        ${config.className}
      `}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />

      {config.label}
    </span>
  );
}

