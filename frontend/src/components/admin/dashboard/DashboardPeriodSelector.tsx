import AdminIcon from "../AdminIcon";

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
      <AdminIcon
        name="reservation"
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
          border border-kjou-border
          rounded-kjou-control
          pl-9 pr-9
          py-2
          text-sm
          font-medium
          text-kjou-text
          outline-none
          cursor-pointer
          transition
          focus:border-kjou-red
          focus:ring-2
          focus:ring-kjou-red/10
          focus-visible:outline-none
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

      <AdminIcon
        name="chevron-down"
        size={15}
        className="pointer-events-none absolute right-3 text-kjou-muted"
      />
    </div>
  );
}