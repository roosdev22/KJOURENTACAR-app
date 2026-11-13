import AdminIcon from "../admin/AdminIcon";

const securityItems = [
  {
    icon: "lock" as const,
    title: "Données protégées",
    description:
      "Vos informations sont transmises de manière sécurisée à notre serveur.",
  },
  {
    icon: "server" as const,
    title: "Serveur comme référence",
    description:
      "Les règles de réservation et les calculs définitifs sont vérifiés côté serveur.",
  },
  {
    icon: "database" as const,
    title: "Disponibilité vérifiée",
    description:
      "La disponibilité réelle des véhicules est contrôlée lors de la création de la réservation.",
  },
];

export default function ReservationSecurityInfo() {
  return (
    <section className="rounded-2xl border border-[#E5E5E5] bg-white p-6">
      <div className="mb-6 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F7F7F7]">
          <AdminIcon name="shield" size={21} className="text-[#B4232F]" />
        </div>

        <div>
          <h2 className="text-lg font-black text-[#111111]">
            Une réservation sécurisée
          </h2>

          <p className="mt-1 text-sm leading-5 text-[#666666]">
            Nous vérifions les informations importantes avant de
            valider votre demande.
          </p>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        {securityItems.map((item) => {
          return (
            <div
              key={item.title}
              className="rounded-xl bg-[#F8F8F8] p-4"
            >
              <AdminIcon name={item.icon} size={20} className="text-[#B4232F]" />

              <h3 className="mt-3 text-sm font-black text-[#111111]">
                {item.title}
              </h3>

              <p className="mt-1.5 text-xs leading-5 text-[#777777]">
                {item.description}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}