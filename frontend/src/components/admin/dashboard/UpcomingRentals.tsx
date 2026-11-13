import type { UpcomingRental } from "../../../api/services/adminDashboardService";
import AdminIcon from "../AdminIcon";

interface UpcomingRentalsProps {
  rentals: UpcomingRental[];
  loading?: boolean;
  onViewAll?: () => void;
}

function formatDate(value: string): string {
  const date = new Date(`${value}T12:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export default function UpcomingRentals({
  rentals,
  loading = false,
  onViewAll,
}: UpcomingRentalsProps) {
  return (
    <section className="rounded-kjou-card border border-kjou-border bg-white p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="font-kjou-display text-sm font-bold text-kjou-text sm:text-base">
            Prochaines locations
          </h2>

          <p className="mt-1 text-xs text-kjou-muted">
            Réservations confirmées à venir
          </p>
        </div>

        {onViewAll && (
          <button
            type="button"
            onClick={onViewAll}
            className="shrink-0 text-xs font-semibold text-kjou-red transition-colors hover:text-kjou-red-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kjou-red focus-visible:ring-offset-2"
          >
            Voir tout
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-4 py-2" aria-live="polite">
          {[1, 2, 3].map((item) => (
            <div key={item} className="flex animate-pulse items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-gray-100" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-2/3 rounded bg-gray-100" />
                <div className="h-3 w-1/2 rounded bg-gray-100" />
              </div>
            </div>
          ))}
        </div>
      ) : rentals.length === 0 ? (
        <div className="py-8 text-center">
          <AdminIcon
            name="reservation"
            className="mx-auto mb-2 text-kjou-muted"
            size={28}
          />

          <p className="text-sm font-semibold text-kjou-text">
            Aucune location à venir
          </p>

          <p className="mt-1 text-xs text-kjou-muted">
            Les prochaines réservations confirmées apparaîtront ici.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {rentals.map((rental) => (
            <div
              key={rental.id}
              className="flex items-center gap-3 border-t border-kjou-border px-2 py-3 first:border-t-0"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-kjou-mist text-kjou-carbon">
                <AdminIcon name="car-front" size={17} />
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-kjou-text">
                  {rental.client}
                </p>

                <p className="mt-0.5 truncate text-xs text-kjou-muted">
                  {rental.vehicles.length > 0
                    ? rental.vehicles.join(", ")
                    : "Véhicule non renseigné"}
                </p>

                <p className="mt-1 text-[11px] text-kjou-muted">
                  Réservation {rental.numero}
                </p>
              </div>

              <div className="shrink-0 text-right">
                <div className="flex items-center justify-end gap-1.5 text-xs font-medium text-kjou-text">
                  <AdminIcon name="clock" size={13} className="text-kjou-muted" />
                  <span>{formatDate(rental.date_debut)}</span>
                </div>

                <p className="mt-1 text-[11px] text-kjou-muted">
                  Jusqu’au {formatDate(rental.date_fin)}
                </p>
              </div>

              <AdminIcon
                name="chevron-right"
                size={16}
                className="shrink-0 text-kjou-muted"
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}