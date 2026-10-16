import { CalendarDays, ChevronDown } from "lucide-react";

export type DashboardPeriod =
  | "today"
  | "week"
  | "month"
  | "year";

interface DashboardPeriodSelectorProps {
  period: DashboardPeriod;
  onChange: (period: DashboardPeriod) => void;
}

const periods = [
  { value: "today", label: "Aujourd'hui" },
  { value: "week", label: "Cette semaine" },
  { value: "month", label: "Ce mois" },
  { value: "year", label: "Cette année" },
] as const;

export default function DashboardPeriodSelector({
  period,
  onChange,
}: DashboardPeriodSelectorProps) {
  return (
    <div className="relative flex items-center">
      <CalendarDays
        size={17}
        className="absolute left-3 pointer-events-none text-black/40"
      />

      <select
        value={period}
        onChange={(event) =>
          onChange(event.target.value as DashboardPeriod)
        }
        className="
          appearance-none
          bg-white
          border border-black/10
          rounded-lg
          pl-9 pr-9
          py-2
          text-sm
          font-medium
          text-black
          outline-none
          cursor-pointer
          transition
          focus:border-red-700
          focus:ring-2
          focus:ring-red-700/10
        "
        aria-label="Sélectionner une période"
      >
        {periods.map((item) => (
          <option
            key={item.value}
            value={item.value}
          >
            {item.label}
          </option>
        ))}
      </select>

      <ChevronDown
        size={15}
        className="absolute right-3 pointer-events-none text-black/40"
      />
    </div>
  );
}