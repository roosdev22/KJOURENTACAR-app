
import AdminIcon from "../admin/AdminIcon";
import carImage from "../../assets/images/rrr.jpeg";

// ============================================================
// TYPES
// ============================================================

interface ReservationHeroProps {
  disabled?: boolean;
  onStartReservation: () => void;
}

// ============================================================
// COMPONENT
// ============================================================

export default function ReservationHero({
  disabled = false,
  onStartReservation,
}: ReservationHeroProps) {
  return (
    <section className="relative bg-white px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid items-center gap-5 lg:grid-cols-[0.95fr_1.05fr]">

          {/* ==================================================
              COLONNE GAUCHE — CONTENU
          ================================================== */}

          <div className="relative overflow-hidden rounded-2xl border border-neutral-100 bg-neutral-50 px-6 py-8 sm:px-8 sm:py-9 lg:px-10 lg:py-10">

            {/* Décoration rouge */}
            <div
              aria-hidden="true"
              className="absolute left-0 top-0 h-16 w-[3px] bg-red-600"
            />

            <div className="max-w-lg">

              {/* ==================================================
                  BRAND
              ================================================== */}

              <div className="mb-6 flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-950">
                  <span className="text-[10px] font-black tracking-tight text-white">
                    KJ
                  </span>
                </div>

                <div className="h-4 w-px bg-neutral-200" />

                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-neutral-500">
                    K-JOU RENT A CAR
                  </p>

                  <p className="mt-0.5 text-[8px] uppercase tracking-[0.16em] text-neutral-400">
                    Location automobile
                  </p>
                </div>
              </div>

              {/* ==================================================
                  LABEL
              ================================================== */}

              <div className="mb-4 flex items-center gap-2.5">
                <span className="h-px w-6 bg-red-600" />

                <span className="text-[9px] font-bold uppercase tracking-[0.22em] text-red-600">
                  Réservation
                </span>
              </div>

              {/* ==================================================
                  HEADLINE
              ================================================== */}

              <h1 className="text-[2.6rem] font-black uppercase leading-[0.94] tracking-[-0.04em] text-neutral-950 sm:text-[3.2rem] lg:text-[3.45rem]">
                Réservez.
                <br />

                <span className="text-red-600">
                  Maintenant.
                </span>

                <br />

                <span className="text-neutral-900">
                  Conduisez.
                </span>
              </h1>

              {/* ==================================================
                  DESCRIPTION
              ================================================== */}

              <p className="mt-5 max-w-md text-[13px] leading-6 text-neutral-500 sm:text-sm">
                Choisissez votre véhicule, définissez vos dates
                et préparez votre prochaine destination.
              </p>

              {/* ==================================================
                  CTA + SÉCURITÉ
              ================================================== */}

              <div className="mt-7 flex flex-col gap-4 sm:flex-row sm:items-center">

                <button
                  type="button"
                  onClick={onStartReservation}
                  disabled={disabled}
                  className={[
                    "group inline-flex items-center justify-center gap-3",
                    "rounded-lg bg-red-600 px-5 py-3",
                    "text-[10px] font-bold uppercase tracking-[0.16em] text-white",
                    "shadow-[0_8px_20px_rgba(220,38,38,0.16)]",
                    "transition-all duration-300",
                    "hover:bg-neutral-950",
                    "hover:shadow-[0_8px_20px_rgba(0,0,0,0.12)]",
                    "focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2",
                    "disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none",
                  ].join(" ")}
                >
                  <span>
                    Réserver
                  </span>

                  <span
                    className={[
                      "flex h-6 w-6 items-center justify-center rounded-md",
                      "bg-white/15",
                      "transition-transform duration-300",
                      disabled ? "" : "group-hover:translate-x-0.5",
                    ].join(" ")}
                  >
                    <AdminIcon name="arrow-right" size={15} strokeWidth={2.5} />
                  </span>
                </button>

                {/* Sécurité */}
                <div className="flex items-center gap-2">
                  <AdminIcon name="shield" size={17} className="text-neutral-500" />

                  <div>
                    <p className="text-[9px] font-semibold uppercase tracking-wider text-neutral-700">
                      Réservation sécurisée
                    </p>

                    <p className="mt-0.5 text-[8px] text-neutral-400">
                      Processus vérifié
                    </p>
                  </div>
                </div>
              </div>

              {/* ==================================================
                  MINI FEATURES
              ================================================== */}

              <div className="mt-7 flex items-center gap-5 border-t border-neutral-200 pt-4">

                <div className="flex items-center gap-1.5">
                  <AdminIcon name="calendar-check" size={15} className="text-[#B4232F]" />

                  <span className="text-[9px] font-semibold uppercase tracking-wider text-neutral-500">
                    Dates flexibles
                  </span>
                </div>

                <div className="h-3 w-px bg-neutral-200" />

                <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-600" />

                  <span className="text-[9px] font-semibold uppercase tracking-wider text-neutral-500">
                    Véhicules disponibles
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ==================================================
              COLONNE DROITE — IMAGE
          ================================================== */}

          <div className="relative overflow-hidden rounded-2xl bg-neutral-950">

            <div className="aspect-[16/10] w-full sm:aspect-[16/9] lg:aspect-[5/4]">

              <img
                src={carImage}
                alt="Véhicule disponible à la location"
                className="h-full w-full object-cover object-center transition-transform duration-700 hover:scale-[1.025]"
              />

              {/* Overlay */}
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-r from-black/10 via-transparent to-black/30"
              />

              {/* Dégradé inférieur */}
              <div
                aria-hidden="true"
                className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/65 to-transparent"
              />

              {/* ==================================================
                  BADGE
              ================================================== */}

              <div className="absolute right-4 top-4 sm:right-5 sm:top-5">
                <div className="rounded-lg border border-white/15 bg-black/35 px-3 py-2 backdrop-blur-md">
                  <p className="text-[8px] font-bold uppercase tracking-[0.18em] text-white/60">
                    K-JOU
                  </p>

                  <p className="mt-0.5 text-[10px] font-semibold text-white">
                    Conduisez en toute confiance
                  </p>
                </div>
              </div>

              {/* ==================================================
                  TEXTE IMAGE
              ================================================== */}

              <div className="absolute bottom-4 left-5 right-5 sm:bottom-5 sm:left-6 sm:right-6">
                <div className="flex items-end justify-between gap-4">

                  <div>
                    <p className="text-[8px] font-bold uppercase tracking-[0.22em] text-white/55">
                      Votre prochaine destination
                    </p>

                    <p className="mt-1 text-base font-bold tracking-tight text-white sm:text-lg">
                      Commence ici.
                    </p>
                  </div>

                  <div className="hidden border-l border-white/20 pl-4 sm:block">
                    <p className="text-[8px] uppercase tracking-wider text-white/50">
                      Location
                    </p>

                    <p className="mt-0.5 text-[10px] font-semibold text-white">
                      KJOURENTACAR
                    </p>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================
          BARRE ROUGE
      ====================================================== */}

      <div
        aria-hidden="true"
        className={[
          "absolute bottom-0 left-0 h-[2px]",
          "bg-red-600",
          "transition-all duration-700",
          disabled ? "w-0" : "w-20",
        ].join(" ")}
      />
    </section>
  );
}

