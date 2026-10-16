import {
  TrendingUp,
  Wallet,
  CalendarCheck,
  ArrowUpRight,
} from "lucide-react";

export default function PerformanceOverview() {
  return (
    <section className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 sm:p-5">

      {/* En-tête */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-sm sm:text-base font-semibold text-gray-900">
            Performance
          </h2>

          <p className="mt-1 text-xs text-gray-500">
            Activité de location
          </p>
        </div>

        <div
          className="
            w-9
            h-9
            rounded-lg
            bg-gray-100
            text-gray-600
            flex
            items-center
            justify-center
          "
        >
          <TrendingUp size={17} />
        </div>
      </div>

      {/* Indicateurs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

        {/* Revenus */}
        <div
          className="
            rounded-lg
            border border-gray-200
            bg-white
            p-4
            transition-all
            duration-200
            hover:border-gray-300
            hover:shadow-sm
          "
        >
          <div className="flex items-center justify-between">

            <div className="flex items-center gap-2">
              <div
                className="
                  w-8
                  h-8
                  rounded-lg
                  bg-gray-100
                  text-gray-600
                  flex
                  items-center
                  justify-center
                "
              >
                <Wallet size={15} />
              </div>

              <span className="text-xs sm:text-sm font-medium text-gray-600">
                Revenus
              </span>
            </div>

            <ArrowUpRight
              size={15}
              className="text-green-600"
            />
          </div>

          <p className="mt-3 text-xl sm:text-2xl font-bold text-gray-900">
            125 400{" "}
            <span className="text-xs sm:text-sm font-medium text-gray-500">
              HTG
            </span>
          </p>

          <div className="mt-2 flex items-center gap-2">
            <span
              className="
                inline-flex
                items-center
                px-1.5
                py-0.5
                rounded-md
                bg-green-50
                text-green-700
                text-[11px]
                font-semibold
              "
            >
              +12,5%
            </span>

            <span className="text-[11px] text-gray-400">
              vs mois dernier
            </span>
          </div>
        </div>

        {/* Locations */}
        <div
          className="
            rounded-lg
            border border-gray-200
            bg-white
            p-4
            transition-all
            duration-200
            hover:border-gray-300
            hover:shadow-sm
          "
        >
          <div className="flex items-center justify-between">

            <div className="flex items-center gap-2">
              <div
                className="
                  w-8
                  h-8
                  rounded-lg
                  bg-gray-100
                  text-gray-600
                  flex
                  items-center
                  justify-center
                "
              >
                <CalendarCheck size={15} />
              </div>

              <span className="text-xs sm:text-sm font-medium text-gray-600">
                Locations
              </span>
            </div>

            <ArrowUpRight
              size={15}
              className="text-green-600"
            />
          </div>

          <p className="mt-3 text-xl sm:text-2xl font-bold text-gray-900">
            42
          </p>

          <div className="mt-2 flex items-center gap-2">
            <span
              className="
                inline-flex
                items-center
                px-1.5
                py-0.5
                rounded-md
                bg-green-50
                text-green-700
                text-[11px]
                font-semibold
              "
            >
              +8,2%
            </span>

            <span className="text-[11px] text-gray-400">
              vs mois dernier
            </span>
          </div>
        </div>

      </div>

      {/* Graphique */}
      <div className="mt-5">

        <div className="flex items-center justify-between mb-3">

          <div>
            <h3 className="text-xs sm:text-sm font-semibold text-gray-800">
              Aperçu des performances
            </h3>

            <p className="mt-0.5 text-[11px] text-gray-400">
              Évolution de votre activité
            </p>
          </div>

          <div className="flex items-center gap-1">

            <button
              type="button"
              className="
                px-2.5
                py-1
                rounded-md
                text-[11px]
                font-medium
                text-gray-500
                hover:bg-gray-100
                transition
              "
            >
              7 jours
            </button>

            <button
              type="button"
              className="
                px-2.5
                py-1
                rounded-md
                text-[11px]
                font-medium
                bg-red-700
                text-white
                hover:bg-red-800
                transition
              "
            >
              30 jours
            </button>

          </div>
        </div>

        {/* Zone graphique */}
        <div
          className="
            h-36
            rounded-lg
            border border-gray-200
            bg-gray-50
            flex
            items-center
            justify-center
          "
        >
          <div className="text-center">
            <TrendingUp
              size={22}
              className="mx-auto mb-2 text-gray-300"
            />

            <p className="text-xs font-medium text-gray-500">
              Graphique des performances
            </p>

            <p className="mt-1 text-[10px] text-gray-400">
              Les données seront affichées ici
            </p>
          </div>
        </div>

      </div>
    </section>
  );
}