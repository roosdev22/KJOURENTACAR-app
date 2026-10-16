import {
  CarFront,
  CheckCircle2,
  Clock3,
  Wrench,
} from "lucide-react";

const fleet = [
  {
    label: "Disponibles",
    value: 10,
    icon: CheckCircle2,
  },
  {
    label: "En location",
    value: 8,
    icon: CarFront,
  },
  {
    label: "Réservés",
    value: 4,
    icon: Clock3,
  },
  {
    label: "Maintenance",
    value: 2,
    icon: Wrench,
  },
];

export default function FleetStatus() {
  return (
    <section className="bg-white border border-black/10 rounded-xl p-4 sm:p-5">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-sm sm:text-base font-bold text-black">
          État de la flotte
        </h2>

        <CarFront
          size={18}
          className="text-black/30"
        />
      </div>

      <div className="space-y-4">
        {fleet.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.label}
              className="flex items-center gap-3"
            >
              <div className="w-8 h-8 rounded-lg bg-black/[0.04] flex items-center justify-center">
                <Icon
                  size={16}
                  className="text-black/60"
                />
              </div>

              <div className="flex-1">
                <div className="flex justify-between gap-3 mb-1">
                  <span className="text-xs text-black/55">
                    {item.label}
                  </span>

                  <span className="text-sm font-bold text-black">
                    {item.value}
                  </span>
                </div>

                <div className="h-1.5 bg-black/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-black/30 rounded-full"
                    style={{
                      width: `${(item.value / 24) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}