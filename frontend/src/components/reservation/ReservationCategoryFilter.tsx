import type {
  Vehicle,
  VehicleCategory,
} from "../../api/services/vehicleService";

interface ReservationCategoryFilterProps {
  vehicles: Vehicle[];
  selectedCategory: VehicleCategory | "ALL";
  onCategoryChange: (
    category: VehicleCategory | "ALL"
  ) => void;
  disabled?: boolean;
}

const categoryLabels: Record<VehicleCategory, string> = {
  ECONOMIQUE: "Économique",
  COMPACTE: "Compacte",
  BERLINE: "Berline",
  SUV: "SUV",
  PICKUP: "Pick-up",
  MINIVAN: "Minivan",
  VAN: "Van",
  LUXE: "Luxe",
  SPORT: "Sport",
  AUTRE: "Autre",
};

const categoryOrder: VehicleCategory[] = [
  "ECONOMIQUE",
  "COMPACTE",
  "BERLINE",
  "SUV",
  "PICKUP",
  "MINIVAN",
  "VAN",
  "LUXE",
  "SPORT",
  "AUTRE",
];

export default function ReservationCategoryFilter({
  vehicles,
  selectedCategory,
  onCategoryChange,
  disabled = false,
}: ReservationCategoryFilterProps) {
  const availableCategories = new Set(
    vehicles.map((vehicle) => vehicle.category),
  );
  const categories: Array<{
    value: VehicleCategory | "ALL";
    label: string;
  }> = [
    { value: "ALL", label: "Toutes les catégories" },
    ...categoryOrder
      .filter((category) => availableCategories.has(category))
      .map((category) => ({
        value: category,
        label: categoryLabels[category],
      })),
  ];

  return (
    <section className="border-y border-[#E3E6E8] bg-white">
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3">
          {/* Header */}

          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#B4232F]">
              Parc disponible
            </p>

            <p className="mt-1 text-sm font-semibold text-[#202327]">
              Affiner par catégorie
            </p>
          </div>

          {/* Categories */}

          <div
            className="
              flex gap-2 overflow-x-auto
              pb-1 scrollbar-none
              [-ms-overflow-style:none]
              [scrollbar-width:none]
            "
          >
            {categories.map((category) => {
              const active =
                selectedCategory === category.value;

              return (
                <button
                  key={category.value}
                  type="button"
                  disabled={disabled}
                  onClick={() =>
                    onCategoryChange(category.value)
                  }
                  aria-pressed={active}
                  className={[
                    "group relative shrink-0",
                    "rounded-lg border px-3.5 py-2",
                    "text-xs font-semibold",
                    "transition-all duration-200",
                    "focus:outline-none focus:ring-2",
                    "focus:ring-red-600 focus:ring-offset-2",
                    "disabled:cursor-not-allowed disabled:opacity-40",

                    active
                      ? "border-[#17191C] bg-[#17191C] text-white shadow-sm"
                      : [
                          "border-[#E3E6E8] bg-white text-[#64748B]",
                          "hover:border-[#BAC1C7]",
                          "hover:bg-[#F4F5F6]",
                          "hover:text-[#202327]",
                        ].join(" "),
                  ].join(" ")}
                >
                  {category.label}

                  {active && (
                    <span
                      className="ml-2 inline-block h-1.5 w-1.5 rounded-full bg-[#B4232F] align-middle"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}