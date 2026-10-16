import { Link } from "react-router-dom";
import { ArrowRight, CalendarDays } from "lucide-react";

interface Booking {
  id: number | string;
  vehicle: string;
  dateStart: string;
  days: number;
  amount: number;
}

interface NextBookingWidgetProps {
  booking?: Booking | null;
}

export default function NextBookingWidget({
  booking = null,
}: NextBookingWidgetProps) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-6">
      {/* Header */}
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
          <CalendarDays
            size={20}
            className="text-blue-600"
          />
        </div>

        <p className="text-sm font-semibold text-gray-900">
          Prochaine réservation
        </p>
      </div>

      {/* Réservation disponible */}
      {booking ? (
        <>
          <p className="text-base font-bold text-gray-900">
            {booking.vehicle}
          </p>

          <p className="mt-1 text-sm text-gray-500">
            {booking.dateStart}
          </p>

          <p className="mt-0.5 text-xs text-gray-400">
            {booking.days} jour
            {booking.days > 1 ? "s" : ""} ·{" "}
            {booking.amount.toLocaleString("fr-FR")} HTG
          </p>

          <Link
            to={`/reservations/${booking.id}`}
            className="mt-4 flex items-center gap-1 text-sm font-semibold text-red-600 transition-colors hover:text-red-700"
          >
            Voir les détails

            <ArrowRight size={14} />
          </Link>
        </>
      ) : (
        /* Aucune réservation */
        <div className="py-4 text-center">
          <p className="text-sm text-gray-500">
            Aucune réservation à venir
          </p>

          <Link
            to="/reserver"
            className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-red-600 transition-colors hover:text-red-700"
          >
            Réserver maintenant

            <ArrowRight size={14} />
          </Link>
        </div>
      )}
    </div>
  );
}