import type { LucideIcon } from "lucide-react";

interface Stat {
  label: string;
  value: string;
  icon: LucideIcon;
  color: string;
}

interface StatsRowProps {
  stats: Stat[];
}

export default function StatsRow({
  stats,
}: StatsRowProps) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {stats.map(
        ({
          label,
          value,
          icon: Icon,
          color,
        }) => (
          <div
            key={label}
            className="rounded-xl border border-gray-100 bg-white px-5 py-4"
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm text-gray-500">
                {label}
              </p>

              <span
                className={`rounded-lg p-2 ${color}`}
              >
                <Icon
                  size={16}
                  aria-hidden
                />
              </span>
            </div>

            <p className="text-3xl font-bold text-gray-900 tabular-nums">
              {value}
            </p>
          </div>
        )
      )}
    </div>
  );
}