import {
  CalendarPlus,
  CarFront,
  CreditCard,
  UserPlus,
  ArrowUpRight,
} from "lucide-react";

const actions = [
  {
    label: "Nouvelle réservation",
    description: "Créer une réservation",
    icon: CalendarPlus,
    color: "blue",
  },
  {
    label: "Ajouter un véhicule",
    description: "Ajouter à la flotte",
    icon: CarFront,
    color: "orange",
  },
  {
    label: "Enregistrer un paiement",
    description: "Ajouter un paiement",
    icon: CreditCard,
    color: "green",
  },
  {
    label: "Nouvel utilisateur",
    description: "Créer un utilisateur",
    icon: UserPlus,
    color: "red",
  },
] as const;

const colorStyles = {
  blue: {
    icon: "bg-blue-50 text-blue-600",
    hover: "group-hover:border-blue-200",
    arrow: "group-hover:bg-blue-50 group-hover:text-blue-600",
  },

  orange: {
    icon: "bg-orange-50 text-orange-600",
    hover: "group-hover:border-orange-200",
    arrow: "group-hover:bg-orange-50 group-hover:text-orange-600",
  },

  green: {
    icon: "bg-emerald-50 text-emerald-600",
    hover: "group-hover:border-emerald-200",
    arrow: "group-hover:bg-emerald-50 group-hover:text-emerald-600",
  },

  red: {
    icon: "bg-red-50 text-red-600",
    hover: "group-hover:border-red-200",
    arrow: "group-hover:bg-red-50 group-hover:text-red-600",
  },
};

export default function DashboardActions() {
  return (
    <section className="space-y-4">

      {/* En-tête */}
      <div>
        <h2 className="text-sm sm:text-base font-bold text-gray-900">
          Actions rapides
        </h2>

        <p className="mt-1 text-xs sm:text-sm text-gray-400">
          Accédez rapidement aux opérations principales
        </p>
      </div>

      {/* Actions */}
      <div
        className="
          grid
          grid-cols-1
          sm:grid-cols-2
          lg:grid-cols-4
          gap-3
        "
      >
        {actions.map((action) => {
          const Icon = action.icon;
          const styles = colorStyles[action.color];

          return (
            <button
              key={action.label}
              type="button"
              className={`
                group
                relative
                flex
                items-center
                gap-3

                min-h-[78px]
                p-3.5

                rounded-xl

                bg-white
                border
                border-gray-200

                text-left

                shadow-sm

                transition-all
                duration-200

                hover:-translate-y-0.5
                hover:shadow-md

                ${styles.hover}

                focus:outline-none
                focus:ring-2
                focus:ring-red-500/30
              `}
            >

              {/* Icône */}
              <div
                className={`
                  shrink-0
                  flex
                  items-center
                  justify-center

                  w-10
                  h-10

                  rounded-lg

                  ${styles.icon}

                  transition-transform
                  duration-200

                  group-hover:scale-105
                `}
              >
                <Icon
                  size={18}
                  strokeWidth={2}
                />
              </div>

              {/* Texte */}
              <div className="min-w-0 flex-1">

                <p
                  className="
                    text-sm
                    font-semibold
                    text-gray-800
                    truncate
                  "
                >
                  {action.label}
                </p>

                <p
                  className="
                    mt-0.5
                    text-xs
                    text-gray-400
                    truncate
                  "
                >
                  {action.description}
                </p>

              </div>

              {/* Flèche */}
              <div
                className={`
                  shrink-0

                  flex
                  items-center
                  justify-center

                  w-7
                  h-7

                  rounded-full

                  bg-gray-50
                  text-gray-400

                  transition-all
                  duration-200

                  group-hover:translate-x-0.5

                  ${styles.arrow}
                `}
              >
                <ArrowUpRight size={14} />
              </div>

            </button>
          );
        })}
      </div>
    </section>
  );
}