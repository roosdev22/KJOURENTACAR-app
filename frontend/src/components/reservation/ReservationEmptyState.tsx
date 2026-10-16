import {
  ArrowRight,
  CarFront,
  RefreshCw,
  SearchX,
} from "lucide-react";

interface ReservationEmptyStateProps {
  title: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
}

export default function ReservationEmptyState({
  title,
  message,
  onRetry,
  retryLabel = "Réessayer",
}: ReservationEmptyStateProps) {
  return (
    <section className="relative py-8 sm:py-12">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        {/* ============================================================
            PREMIUM EMPTY STATE
        ============================================================ */}
        <div
          className="
            group relative overflow-hidden
            rounded-[28px]
            border border-neutral-200/80
            bg-white
            shadow-[0_24px_70px_-32px_rgba(0,0,0,0.28)]
            transition-shadow duration-500
            hover:shadow-[0_30px_85px_-34px_rgba(0,0,0,0.32)]
          "
        >
          {/* ==========================================================
              TOP ACCENT
          ========================================================== */}
          <div
            className="
              absolute inset-x-0 top-0 h-[3px]
              bg-gradient-to-r
              from-neutral-950
              via-red-600
              to-neutral-950
            "
          />

          {/* ==========================================================
              AMBIENT DECORATION
          ========================================================== */}
          <div
            className="
              pointer-events-none absolute
              -right-32 -top-32
              h-72 w-72
              rounded-full
              bg-red-600/[0.045]
              blur-3xl
              transition-transform duration-700
              group-hover:scale-110
            "
          />

          <div
            className="
              pointer-events-none absolute
              -bottom-32 -left-32
              h-72 w-72
              rounded-full
              bg-neutral-950/[0.035]
              blur-3xl
            "
          />

          {/* Fine grid texture */}
          <div
            className="
              pointer-events-none absolute inset-0
              opacity-[0.025]
              [background-image:linear-gradient(to_right,#000_1px,transparent_1px),linear-gradient(to_bottom,#000_1px,transparent_1px)]
              [background-size:32px_32px]
            "
          />

          <div className="relative px-6 py-10 text-center sm:px-12 sm:py-14">
            {/* ========================================================
                ICON SYSTEM
            ======================================================== */}
            <div className="relative mx-auto h-[96px] w-[96px]">
              {/* Outer halo */}
              <div
                className="
                  absolute -inset-3
                  rounded-[34px]
                  border border-red-600/[0.06]
                  bg-red-600/[0.02]
                "
              />

              {/* Outer frame */}
              <div
                className="
                  absolute inset-0
                  rounded-[28px]
                  border border-neutral-200
                  bg-neutral-50
                  shadow-[inset_0_1px_0_rgba(255,255,255,0.95)]
                  transition-transform duration-500
                  group-hover:scale-[1.02]
                "
              />

              {/* Inner dark frame */}
              <div
                className="
                  absolute left-1/2 top-1/2
                  flex h-[66px] w-[66px]
                  -translate-x-1/2 -translate-y-1/2
                  items-center justify-center
                  overflow-hidden
                  rounded-[22px]
                  bg-neutral-950
                  text-white
                  shadow-[0_18px_35px_-15px_rgba(0,0,0,0.65)]
                  transition-transform duration-500
                  group-hover:-translate-y-[53%]
                "
              >
                <div
                  className="
                    absolute inset-0
                    bg-gradient-to-br
                    from-white/[0.14]
                    via-transparent
                    to-transparent
                  "
                />

                <CarFront
                  size={28}
                  strokeWidth={1.65}
                  className="relative transition-transform duration-500 group-hover:scale-105"
                  aria-hidden="true"
                />
              </div>

              {/* Search status */}
              <div
                className="
                  absolute -right-1 -top-1
                  flex h-8 w-8
                  items-center justify-center
                  rounded-full
                  border-[3px] border-white
                  bg-red-50
                  shadow-[0_7px_18px_-7px_rgba(220,38,38,0.5)]
                "
              >
                <SearchX
                  size={14}
                  strokeWidth={2.2}
                  className="text-red-600"
                  aria-hidden="true"
                />
              </div>

              {/* Small bottom detail */}
              <div
                className="
                  absolute -bottom-1 left-1/2
                  h-1 w-8
                  -translate-x-1/2
                  rounded-full
                  bg-neutral-200
                "
              />
            </div>

            {/* ========================================================
                EYEBROW
            ======================================================== */}
            <div className="mt-7">
              <div
                className="
                  inline-flex items-center gap-2.5
                  rounded-full
                  border border-red-100
                  bg-red-50/70
                  px-3 py-1.5
                "
              >
                <span className="h-1.5 w-1.5 rounded-full bg-red-600" />

                <p
                  className="
                    text-[9px]
                    font-black
                    uppercase
                    tracking-[0.24em]
                    text-red-600
                  "
                >
                  Aucun résultat
                </p>

                <span className="h-1.5 w-1.5 rounded-full bg-red-600" />
              </div>
            </div>

            {/* ========================================================
                TITLE
            ======================================================== */}
            <h2
              className="
                mx-auto mt-4
                max-w-2xl
                text-[22px]
                font-black
                leading-[1.12]
                tracking-[-0.04em]
                text-neutral-950
                sm:text-[29px]
              "
            >
              {title}
            </h2>

            {/* ========================================================
                MESSAGE
            ======================================================== */}
            <p
              className="
                mx-auto mt-4
                max-w-xl
                text-[13px]
                leading-6
                text-neutral-500
                sm:text-sm
                sm:leading-7
              "
            >
              {message}
            </p>

            {/* ========================================================
                ACTION
            ======================================================== */}
            {onRetry && (
              <div className="mt-7 flex justify-center">
                <button
                  type="button"
                  onClick={onRetry}
                  className="
                    group/button
                    inline-flex
                    items-center
                    justify-center
                    gap-3
                    rounded-[15px]
                    bg-neutral-950
                    px-5
                    py-3.5
                    text-[10px]
                    font-black
                    uppercase
                    tracking-[0.12em]
                    text-white
                    shadow-[0_14px_28px_-14px_rgba(0,0,0,0.7)]
                    transition-all
                    duration-300
                    hover:-translate-y-0.5
                    hover:bg-red-600
                    hover:shadow-[0_18px_34px_-13px_rgba(220,38,38,0.5)]
                    focus:outline-none
                    focus:ring-2
                    focus:ring-red-600
                    focus:ring-offset-2
                    active:translate-y-0
                  "
                >
                  <RefreshCw
                    size={15}
                    strokeWidth={2}
                    className="
                      transition-transform
                      duration-500
                      group-hover/button:rotate-180
                    "
                    aria-hidden="true"
                  />

                  <span>{retryLabel}</span>

                  <ArrowRight
                    size={14}
                    strokeWidth={2}
                    className="
                      -ml-1
                      opacity-50
                      transition-all
                      duration-300
                      group-hover/button:translate-x-0.5
                      group-hover/button:opacity-100
                    "
                    aria-hidden="true"
                  />
                </button>
              </div>
            )}

            {/* ========================================================
                BRAND FOOTER
            ======================================================== */}
            <div
              className="
                mx-auto mt-8
                flex max-w-md
                items-center justify-center
                gap-3
                border-t border-neutral-100
                pt-5
              "
            >
              <span className="h-px w-8 bg-neutral-200" />

              <span
                className="
                  text-[8px]
                  font-black
                  uppercase
                  tracking-[0.22em]
                  text-neutral-400
                "
              >
                K-JOU RENT A CAR
              </span>

              <span className="h-px w-8 bg-neutral-200" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}