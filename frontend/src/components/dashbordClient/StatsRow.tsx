
import AdminIcon, { type AdminIconName } from "../admin/AdminIcon";

interface Stat {
  label: string;
  value: string;
  icon: AdminIconName;
  color: string;
}

interface StatsRowProps {
  stats?: Stat[] | null;
}

export default function StatsRow({ stats }: StatsRowProps) {
  if (!Array.isArray(stats) || stats.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {stats.map(({ label, value, icon, color }) => (
        <div
          key={label}
          className="rounded-2xl border border-[#E3E6E8] bg-white px-5 py-4 shadow-[0_10px_24px_rgba(23,25,28,0.04)]"
        >
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-medium text-[#64748B]">
              {label}
            </p>

            <span className={`rounded-xl p-2 ${color}`}>
              <AdminIcon name={icon} size={16} />
            </span>
          </div>

          <p className="text-3xl font-black tracking-tight text-[#202327] tabular-nums">
            {value}
          </p>
        </div>
      ))}
    </div>
  );
}
