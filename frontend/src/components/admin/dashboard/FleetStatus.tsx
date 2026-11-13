import type { DashboardFleet } from "../../../api/services/adminDashboardService";
import AdminIcon from "../AdminIcon";

interface FleetStatusProps {
  fleet: DashboardFleet;
  loading?: boolean;
}

export default function FleetStatus({
  fleet,
  loading = false,
}: FleetStatusProps) {
  const items = [
    {
      label: "Disponibles",
      value: fleet.available,
      icon: "check-circle",
    },
    {
      label: "En location",
      value: fleet.in_rental,
      icon: "car-front",
    },
    {
      label: "Réservés",
      value: fleet.reserved,
      icon: "clock",
    },
    {
      label: "Maintenance",
      value: fleet.maintenance,
      icon: "wrench",
    },
    {
      label: "Hors service",
      value: fleet.out_of_service,
      icon: "ban",
    },
  ] as const;

  return (
    <section className="rounded-kjou-card border border-kjou-border bg-white p-4 sm:p-5">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="font-kjou-display text-sm font-bold text-kjou-text sm:text-base">
            État de la flotte
          </h2>
          <p className="mt-1 text-xs text-kjou-muted">
            {loading ? "Actualisation..." : `${fleet.total} véhicule(s) au total`}
          </p>
        </div>
        <AdminIcon name="vehicle" size={18} className="text-kjou-muted" />
      </div>

      <div className="space-y-4">
        {items.map((item) => {
          const percentage =
            fleet.total > 0
              ? Math.min((item.value / fleet.total) * 100, 100)
              : 0;

          return (
            <div key={item.label} className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-kjou-mist text-kjou-carbon">
                <AdminIcon name={item.icon} size={16} />
              </div>

              <div className="min-w-0 flex-1">
                <div className="mb-1 flex justify-between gap-3">
                  <span className="text-xs text-kjou-muted">
                    {item.label}
                  </span>

                  <span className="font-kjou-display text-sm font-bold text-kjou-text">
                    {loading ? "…" : item.value}
                  </span>
                </div>

                {!loading && (
                  <div className="h-1.5 overflow-hidden rounded-full bg-kjou-mist">
                    <div
                      className="h-full rounded-full bg-kjou-red"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}