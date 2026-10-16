import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  ListChecks,
} from "lucide-react";

interface AgentReservationStatsProps {
  total: number;
  pending: number;
  confirmed: number;
  ongoing: number;
}

interface StatCardProps {
  label: string;
  value: number;
  description: string;
  icon: React.ReactNode;
  highlight?: boolean;
}

function StatCard({
  label,
  value,
  description,
  icon,
  highlight = false,
}: StatCardProps) {
  return (
    <div
      className={`
        group
        relative
        overflow-hidden
        rounded-xl
        border
        bg-white
        p-4
        transition-all
        duration-200
        hover:-translate-y-[1px]
        hover:shadow-[0_8px_25px_rgba(0,0,0,0.05)]
        ${
          highlight
            ? "border-red-100"
            : "border-black/[0.07]"
        }
      `}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-black/40">
            {label}
          </p>

          <p className="mt-2 text-2xl font-bold tracking-tight text-black">
            {value}
          </p>

          <p className="mt-0.5 text-xs text-black/40">
            {description}
          </p>
        </div>

        <div
          className={`
            flex h-9 w-9 items-center justify-center rounded-lg
            ${
              highlight
                ? "bg-red-50 text-red-700"
                : "bg-black/[0.04] text-black/50"
            }
          `}
        >
          {icon}
        </div>
      </div>

      {highlight && (
        <div className="absolute bottom-0 left-0 h-[2px] w-full bg-red-700" />
      )}
    </div>
  );
}

export default function AgentReservationStats({
  total,
  pending,
  confirmed,
  ongoing,
}: AgentReservationStatsProps) {
  return (
    <section className="mb-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
      <StatCard
        label="Total"
        value={total}
        description="réservations"
        icon={<CalendarDays className="h-4 w-4" />}
      />

      <StatCard
        label="À valider"
        value={pending}
        description="action requise"
        icon={<ListChecks className="h-4 w-4" />}
        highlight={pending > 0}
      />

      <StatCard
        label="Confirmées"
        value={confirmed}
        description="réservations"
        icon={<CheckCircle2 className="h-4 w-4" />}
      />

      <StatCard
        label="En cours"
        value={ongoing}
        description="locations actives"
        icon={<Clock3 className="h-4 w-4" />}
      />
    </section>
  );
}