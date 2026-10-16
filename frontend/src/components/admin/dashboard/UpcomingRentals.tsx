import {
  CalendarDays,
  Clock3,
  MapPin,
  ChevronRight,
} from "lucide-react";

const rentals = [
  {
    client: "Jean Pierre",
    vehicle: "Toyota RAV4",
    date: "Aujourd'hui",
    time: "14:00",
    location: "Port-au-Prince",
  },
  {
    client: "Marie Louis",
    vehicle: "Hyundai Tucson",
    date: "Demain",
    time: "09:30",
    location: "Pétion-Ville",
  },
  {
    client: "David Charles",
    vehicle: "Kia Sportage",
    date: "15 août",
    time: "11:00",
    location: "Delmas",
  },
];

export default function UpcomingRentals() {
  return (
    <section
      className="
        bg-white
        border border-gray-200
        rounded-xl
        shadow-sm
        p-4
        sm:p-5
      "
    >
      {/* En-tête */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm sm:text-base font-semibold text-gray-900">
            Prochaines locations
          </h2>

          <p className="mt-1 text-xs text-gray-500">
            Les prochaines prises en charge
          </p>
        </div>

        <button
          type="button"
          className="
            text-xs
            font-semibold
            text-red-700
            hover:text-red-800
            transition-colors
          "
        >
          Voir tout
        </button>
      </div>

      {/* Liste des locations */}
      <div className="divide-y divide-gray-100">
        {rentals.map((rental) => (
          <button
            key={`${rental.client}-${rental.time}`}
            type="button"
            className="
              group
              w-full
              flex
              items-center
              gap-3
              px-2
              py-3
              rounded-lg
              text-left
              transition-colors
              hover:bg-gray-50
            "
          >
            {/* Icône */}
            <div
              className="
                shrink-0
                w-9
                h-9
                rounded-lg
                bg-gray-100
                text-gray-600
                flex
                items-center
                justify-center
                transition-colors
                group-hover:bg-red-50
                group-hover:text-red-700
              "
            >
              <CalendarDays size={16} />
            </div>

            {/* Informations client */}
            <div className="flex-1 min-w-0">
              <p
                className="
                  text-sm
                  font-semibold
                  text-gray-900
                  truncate
                "
              >
                {rental.client}
              </p>

              <p
                className="
                  mt-0.5
                  text-xs
                  text-gray-500
                  truncate
                "
              >
                {rental.vehicle}
              </p>
            </div>

            {/* Date et localisation */}
            <div className="hidden sm:block text-right shrink-0">
              <div
                className="
                  flex
                  items-center
                  justify-end
                  gap-1.5
                  text-xs
                  font-medium
                  text-gray-600
                "
              >
                <Clock3
                  size={13}
                  className="text-gray-400"
                />

                <span>
                  {rental.date} · {rental.time}
                </span>
              </div>

              <div
                className="
                  flex
                  items-center
                  justify-end
                  gap-1.5
                  mt-1
                  text-[11px]
                  text-gray-400
                "
              >
                <MapPin size={12} />

                <span>
                  {rental.location}
                </span>
              </div>
            </div>

            {/* Indicateur */}
            <div
              className="
                shrink-0
                w-7
                h-7
                rounded-full
                flex
                items-center
                justify-center
                text-gray-300
                transition-all
                group-hover:bg-red-50
                group-hover:text-red-700
              "
            >
              <ChevronRight size={16} />
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}