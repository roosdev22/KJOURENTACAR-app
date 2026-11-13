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
    hour < 12 ? "Bonjour" : hour < 18 ? "Bon après-midi" : "Bonsoir";

  return (
    <div className="relative overflow-hidden rounded-3xl border border-[#E3E6E8] bg-[#17191C] px-6 py-7 text-white shadow-[0_18px_34px_rgba(23,25,28,0.12)] sm:px-8">
      <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-[#B4232F]/20" />
      <div className="pointer-events-none absolute bottom-0 right-10 h-28 w-28 rounded-full bg-[#B4232F]/15" />

      <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm text-white/70">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em]">
              {greeting}
            </span>
            <Hand size={18} strokeWidth={2} className="text-[#B4232F]" />
          </div>

          <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
            {userName}
          </h1>
          <p className="mt-2 max-w-xl text-sm text-white/70">
            Voici un aperçu de vos locations, réservations et prochaines actions.
          </p>
        </div>

        <Link
          to="/reservation"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#B4232F] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#941C27]"
        >
          Réserver un véhicule
          <ArrowRight size={15} />
        </Link>
      </div>
    </div>
  );
}