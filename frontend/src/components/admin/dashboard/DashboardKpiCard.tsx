interface DashboardKpiCardProps {
  label: string;
  value: string;
  description: string;
}

export default function DashboardKpiCard({
  label,
  value,
  description,
}: DashboardKpiCardProps) {
  return (
    <div className="min-w-0 bg-white px-3 py-3.5 sm:px-4 sm:py-4">
      <p className="truncate text-xs font-medium text-kjou-muted">{label}</p>
      <p className="mt-1.5 truncate font-kjou-display text-xl font-bold tracking-tight text-kjou-text sm:text-2xl">
        {value}
      </p>
      <p className="mt-1 truncate text-[11px] leading-4 text-kjou-muted">
        {description}
      </p>
    </div>
  );
}