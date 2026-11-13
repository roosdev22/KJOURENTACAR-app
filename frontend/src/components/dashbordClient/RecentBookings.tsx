import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

type BookingStatus =
  | "CONFIRMÉE"
  | "EN COURS"
  | "ANNULÉE"
  | "TERMINÉE"
  | "EN ATTENTE";

interface Booking {
  id: number | string;
  vehicle: string;
  ref: string;
  dateStart: string;
  dateEnd: string;
  days: number;
  amount: number;
  status: BookingStatus;
}

interface RecentBookingsProps {
  bookings?: Booking[];
}

const STATUS_STYLES: Record<BookingStatus, string> = {
  CONFIRMÉE:
    "bg-emerald-50 text-emerald-700",

  "EN COURS":
    "bg-blue-50 text-blue-700",

  ANNULÉE:
    "bg-red-50 text-red-700",

  TERMINÉE:
    "bg-gray-100 text-gray-600",

  "EN ATTENTE":
    "bg-amber-50 text-amber-700",
};

export default function RecentBookings({
  bookings = [],
}: RecentBookingsProps) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
        <h2 className="text-base font-semibold text-gray-900">
          Réservations récentes
        </h2>

        <Link
          to="/reservations"
          className="flex items-center gap-1 text-sm font-medium text-red-600 transition-colors hover:text-red-700"
        >
          Voir tout

          <ArrowRight size={14} />
        </Link>
      </div>

      {/* Liste vide */}
      {bookings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 text-center">
          <p className="text-sm font-medium text-gray-700">
            Aucune réservation
          </p>

          <p className="mt-1 text-sm text-gray-400">
            Votre historique apparaîtra ici.
          </p>

          <Link
            to=""
            className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700"
          >
            Réserver maintenant
          </Link>
        </div>
      ) : (
        <ul className="divide-y divide-gray-50">
          {bookings.map((booking) => (
            <li
              key={booking.id}
              className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-gray-50"
            >
              {/* Icône véhicule */}
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-lg">
                🚗
              </div>

              {/* Informations */}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-gray-900">
                  {booking.vehicle}
                </p>

                <p className="text-xs text-gray-400">
                  {booking.ref} · {booking.dateStart} →{" "}
                  {booking.dateEnd} · {booking.days} jour
                  {booking.days > 1 ? "s" : ""}
                </p>
              </div>

              {/* Montant + statut */}
              <div className="flex shrink-0 flex-col items-end gap-1.5">
                <p className="text-sm font-semibold text-gray-900">
                  {booking.amount.toLocaleString(
                    "fr-FR"
                  )}{" "}
                  HTG
                </p>

                <span
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                    STATUS_STYLES[booking.status]
                  }`}
                >
                  {booking.status}
                </span>
              </div>

              {/* Détails */}
              <Link
                to={`/reservations/${booking.id}`}
                className="ml-2 shrink-0 text-xs font-medium text-red-600 transition-colors hover:text-red-700"
              >
                Détails
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}