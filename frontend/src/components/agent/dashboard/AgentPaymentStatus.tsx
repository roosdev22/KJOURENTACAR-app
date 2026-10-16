interface AgentPaymentStatusProps {
  status:
    | "SUCCEEDED"
    | "PENDING"
    | "FAILED"
    | "NONE";
}

const PAYMENT_CONFIG = {
  SUCCEEDED: {
    label: "Payé",
    className:
      "bg-emerald-50 text-emerald-700 border-emerald-100",
  },

  PENDING: {
    label: "En attente",
    className:
      "bg-amber-50 text-amber-700 border-amber-100",
  },

  FAILED: {
    label: "Échec",
    className:
      "bg-red-50 text-red-700 border-red-100",
  },

  NONE: {
    label: "Non payé",
    className:
      "bg-black/[0.04] text-black/50 border-black/[0.06]",
  },
} as const;

export default function AgentPaymentStatus({
  status,
}: AgentPaymentStatusProps) {
  const config = PAYMENT_CONFIG[status];

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