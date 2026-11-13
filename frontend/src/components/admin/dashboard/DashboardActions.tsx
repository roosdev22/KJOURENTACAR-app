
import { useNavigate } from "react-router-dom";
import AdminIcon from "../AdminIcon";

const actions = [
  {
    label: "Réservations",
    description: "Consulter les dossiers",
    icon: "reservation",
    path: "/admin/reservations",
  },
  {
    label: "Ajouter un véhicule",
    description: "Ajouter à la flotte",
    icon: "vehicle",
    path: "/admin/vehicles",
  },
  {
    label: "Enregistrer un paiement",
    description: "Ajouter un paiement",
    icon: "payment",
    path: "/admin/payments",
  },
  {
    label: "Nouvel utilisateur",
    description: "Créer un utilisateur",
    icon: "users",
    path: "/admin/users",
  },
] as const;

export default function DashboardActions() {
  const navigate = useNavigate();

  return (
    <section className="space-y-3">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <h2 className="font-kjou-display text-base font-bold text-kjou-text">
          Actions rapides
        </h2>
        <p className="text-xs text-kjou-muted">
          Accès direct aux opérations d’administration
        </p>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {actions.map((action) => {
          return (
            <button
              key={action.label}
              type="button"
              onClick={() => navigate(action.path)}
              aria-label={action.label}
              className="group flex min-h-16 items-center gap-3 rounded-lg border border-kjou-border bg-white px-3.5 py-3 text-left transition-colors hover:border-kjou-red/40 hover:bg-kjou-mist/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kjou-red focus-visible:ring-offset-2"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-kjou-mist text-kjou-carbon transition-colors group-hover:bg-kjou-red/10 group-hover:text-kjou-red">
                <AdminIcon name={action.icon} size={18} />
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-kjou-text">
                  {action.label}
                </p>
                <p className="mt-0.5 truncate text-xs text-kjou-muted">
                  {action.description}
                </p>
              </div>
              <AdminIcon
                name="arrow-up-right"
                size={15}
                className="shrink-0 text-kjou-muted transition-colors group-hover:text-kjou-red"
              />
            </button>
          );
        })}
      </div>
    </section>
  );
}
