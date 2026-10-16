import type { VehicleCategory } from "../../api/services/vehicleService";

interface ReservationCategoryFilterProps {
  selectedCategory: VehicleCategory | "ALL";
  onCategoryChange: (
    category: VehicleCategory | "ALL"
  ) => void;
  disabled?: boolean;
}

const categories: Array<{
  value: VehicleCategory | "ALL";
  label: string;
}> = [
  { value: "ALL", label: "Tous" },
  { value: "ECONOMIQUE", label: "Économique" },
  { value: "COMPACTE", label: "Compacte" },
  { value: "BERLINE", label: "Berline" },
  { value: "SUV", label: "SUV" },
  { value: "PICKUP", label: "Pickup" },
  { value: "MINIVAN", label: "Minivan" },
  { value: "VAN", label: "Van" },
  { value: "LUXE", label: "Luxe" },
  { value: "SPORT", label: "Sport" },
  { value: "AUTRE", label: "Autre" },
];

export default function ReservationCategoryFilter({
  selectedCategory,
  onCategoryChange,
  disabled = false,
}: ReservationCategoryFilterProps) {
  return (
    <section className="border-y border-neutral-200 bg-white">
      <div className="mx-auto max-w-7xl px-5 py-5 sm:px-8 lg:px-10">
        <div className="flex flex-col gap-4">
          {/* Header */}

          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-red-600">
              Catégories
            </p>

            <p className="mt-1 text-sm font-bold text-neutral-950">
              Quel type de véhicule recherchez-vous ?
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
                    "rounded-full border px-4 py-2.5",
                    "text-xs font-bold",
                    "transition-all duration-200",
                    "focus:outline-none focus:ring-2",
                    "focus:ring-red-600 focus:ring-offset-2",
                    "disabled:cursor-not-allowed disabled:opacity-40",

                    active
                      ? "border-neutral-950 bg-neutral-950 text-white shadow-sm"
                      : [
                          "border-neutral-200 bg-white text-neutral-500",
                          "hover:border-neutral-400",
                          "hover:bg-neutral-50",
                          "hover:text-neutral-950",
                        ].join(" "),
                  ].join(" ")}
                >
                  {category.label}

                  {active && (
                    <span
                      className="
                        absolute -bottom-[5px]
                        left-1/2 h-1 w-1
                        -translate-x-1/2
                        rounded-full bg-red-600
                      "
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