import { Link } from "react-router-dom";
import { ArrowRight, Hand } from "lucide-react";

interface WelcomeBannerProps {
  userName?: string;
}

export default function WelcomeBanner({
  userName = "Jean",
}: WelcomeBannerProps) {
  const hour = new Date().getHours();

  const greeting =
    hour < 12
      ? "Bonjour"
      : hour < 18
        ? "Bon après-midi"
        : "Bonsoir";

  return (
    <div className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white px-8 py-7 shadow-sm">
      {/* Cercles décoratifs */}
      <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-red-50" />

      <div className="pointer-events-none absolute bottom-0 right-20 h-28 w-28 rounded-full bg-red-50/70" />

      {/* Contenu */}
      <div className="relative z-10">
        <div className="mb-1 flex items-center gap-2">
          <p className="text-sm font-medium text-gray-500">
            {greeting}
          </p>

          <Hand
            size={18}
            strokeWidth={2}
            className="text-red-600"
          />
        </div>

        <h1 className="mb-1 text-2xl font-bold text-gray-900">
          {userName}
        </h1>

        <p className="mb-6 text-sm text-gray-500">
          Voici un aperçu de vos locations.
        </p>

        <div>
          <p className="mb-2 text-base font-semibold text-gray-900">
            Prêt pour votre prochaine aventure ?
          </p>

          <p className="mb-4 text-sm text-gray-500">
            Trouvez le véhicule idéal pour votre prochain déplacement.
          </p>

          <Link
            to="/reservations"
            className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700"
          >
            Réserver un véhicule
            <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </div>
  );
}