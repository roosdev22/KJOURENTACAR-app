import type { DashboardPerformance } from "../../../api/services/adminDashboardService";
import AdminIcon from "../AdminIcon";

interface PerformanceOverviewProps {
  performance: DashboardPerformance;
  loading?: boolean;
}

function formatHTG(value: string | number): string {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return "0 HTG";
  }

  return `${new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 2,
  }).format(amount)} HTG`;
}

export default function PerformanceOverview({
  performance,
  loading = false,
}: PerformanceOverviewProps) {
  const chart = performance.chart ?? [];

  const maxRevenue = Math.max(
    ...chart.map((item) => Number(item.revenue_htg) || 0),
    1,
  );

  return (
    <section className="rounded-kjou-card border border-kjou-border bg-white p-4 sm:p-5">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="font-kjou-display text-sm font-bold text-kjou-text sm:text-base">
            Performance
          </h2>

          <p className="mt-1 text-xs text-kjou-muted">
            Activité de location sur la période sélectionnée
          </p>
        </div>

        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-kjou-mist text-kjou-carbon">
          <AdminIcon name="trend-up" size={17} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-kjou-border p-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-kjou-mist text-kjou-carbon">
              <AdminIcon name="wallet" size={15} />
            </div>

            <span className="text-xs font-medium text-kjou-muted sm:text-sm">
              Revenus encaissés nets
            </span>
          </div>

          <p className="mt-3 break-words font-kjou-display text-xl font-bold text-kjou-text sm:text-2xl">
            {loading ? "Chargement…" : formatHTG(performance.revenue_htg)}
          </p>

          <p className="mt-2 text-[11px] text-kjou-muted">
            Après prise en compte des remboursements
          </p>
        </div>

        <div className="rounded-lg border border-kjou-border p-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-kjou-mist text-kjou-carbon">
              <AdminIcon name="calendar-check" size={15} />
            </div>

            <span className="text-xs font-medium text-kjou-muted sm:text-sm">
              Réservations créées
            </span>
          </div>

          <p className="mt-3 font-kjou-display text-xl font-bold text-kjou-text sm:text-2xl">
            {loading ? "…" : performance.reservations_count}
          </p>

          <p className="mt-2 text-[11px] text-kjou-muted">
            Sur la période sélectionnée
          </p>
        </div>
      </div>

      <div className="mt-5">
        <div className="mb-3">
          <h3 className="text-xs font-semibold text-kjou-text sm:text-sm">
            Évolution des revenus
          </h3>

          <p className="mt-1 text-[11px] text-kjou-muted">
            Revenus nets en HTG par jour ou par mois
          </p>
        </div>

        {loading ? (
          <div className="flex h-40 items-center justify-center rounded-lg border border-kjou-border bg-kjou-mist">
            <p className="text-xs text-kjou-muted">
              Chargement des performances…
            </p>
          </div>
        ) : chart.length === 0 ? (
          <div className="flex h-40 items-center justify-center rounded-lg border border-kjou-border bg-kjou-mist">
            <p className="text-xs text-kjou-muted">
              Aucune donnée disponible pour cette période.
            </p>
          </div>
        ) : (
          <div className="rounded-lg border border-kjou-border bg-kjou-mist p-3">
            <div className="flex h-36 items-end gap-1.5 sm:gap-2">
              {chart.map((item) => {
                const revenue = Number(item.revenue_htg) || 0;
                const height =
                  revenue > 0
                    ? Math.max((revenue / maxRevenue) * 100, 3)
                    : 0;

                return (
                  <div
                    key={item.date}
                    className="group flex h-full min-w-0 flex-1 flex-col items-center justify-end"
                    title={`${item.label} — ${formatHTG(revenue)} — ${item.reservations} réservation(s)`}
                  >
                    <div className="mb-1 hidden text-[9px] text-kjou-muted group-hover:block">
                      {revenue > 0 ? formatHTG(revenue) : ""}
                    </div>

                    <div className="flex h-full w-full items-end justify-center">
                      <div
                        className="w-full max-w-8 rounded-t-sm bg-kjou-red transition-colors group-hover:bg-kjou-red-hover"
                        style={{ height: `${height}%` }}
                      />
                    </div>

                    <span className="mt-2 w-full truncate text-center text-[9px] text-kjou-muted">
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-kjou-border pt-3 text-[10px] text-kjou-muted">
              <span>{chart.length} période(s)</span>
              <span>
                {chart.reduce(
                  (total, item) => total + item.reservations,
                  0,
                )}{" "}
                réservation(s) créées
              </span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}