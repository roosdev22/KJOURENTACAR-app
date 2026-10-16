import {
  TrendingUp,
  TrendingDown,
} from "lucide-react";

import type { LucideIcon } from "lucide-react";

interface DashboardKpiCardProps {
  label: string;
  value: string;
  description: string;
  icon: LucideIcon;
  trend?: string;
  color?:
    | "red"
    | "blue"
    | "green"
    | "purple"
    | "orange"
    | "teal"
    | "indigo";
  onClick?: () => void;
}

export default function DashboardKpiCard({
  label,
  value,
  description,
  icon: Icon,
  trend,
  color = "blue",
  onClick,
}: DashboardKpiCardProps) {

  const colors = {
    red: {
      icon: "bg-red-50 text-red-600",
      border: "border-red-100",
    },

    blue: {
      icon: "bg-blue-50 text-blue-600",
      border: "border-blue-100",
    },

    green: {
      icon: "bg-emerald-50 text-emerald-600",
      border: "border-emerald-100",
    },

    purple: {
      icon: "bg-violet-50 text-violet-600",
      border: "border-violet-100",
    },

    orange: {
      icon: "bg-orange-50 text-orange-600",
      border: "border-orange-100",
    },

    teal: {
      icon: "bg-teal-50 text-teal-600",
      border: "border-teal-100",
    },

    indigo: {
      icon: "bg-indigo-50 text-indigo-600",
      border: "border-indigo-100",
    },
  };

  const styles = colors[color];

  const isPositive = trend?.startsWith("+");

  return (
    <div
      onClick={onClick}
      className={`
        group
        relative
        min-w-0
        rounded-xl
        border
        border-gray-200
        bg-white
        p-3.5

        transition-all
        duration-200

        hover:-translate-y-0.5
        hover:shadow-md
        hover:${styles.border}

        ${onClick ? "cursor-pointer" : ""}
      `}
    >

      {/* Contenu principal */}
      <div className="flex items-start justify-between gap-2">

        {/* Informations */}
        <div className="min-w-0">

          <p className="text-xs font-medium text-gray-500 truncate">
            {label}
          </p>

          <p
            className="
              mt-1
              text-lg
              sm:text-xl
              font-bold
              text-gray-900
              truncate
            "
          >
            {value}
          </p>

          <p className="mt-1 text-[10px] text-gray-400 truncate">
            {description}
          </p>

        </div>

        {/* Icône */}
        <div
          className={`
            flex
            h-8
            w-8
            shrink-0
            items-center
            justify-center
            rounded-lg
            ${styles.icon}

            transition-transform
            duration-200

            group-hover:scale-105
          `}
        >
          <Icon
            size={16}
            strokeWidth={2}
          />
        </div>

      </div>

      {/* Tendance */}
      {trend && (
        <div className="mt-3 flex items-center gap-1.5">

          <span
            className={`
              inline-flex
              items-center
              gap-1
              rounded-md
              px-1.5
              py-0.5
              text-[10px]
              font-semibold

              ${
                isPositive
                  ? "bg-emerald-50 text-emerald-600"
                  : "bg-red-50 text-red-600"
              }
            `}
          >

            {isPositive ? (
              <TrendingUp size={11} />
            ) : (
              <TrendingDown size={11} />
            )}

            {trend}

          </span>

          <span className="text-[9px] text-gray-400">
            vs période précédente
          </span>

        </div>
      )}

      {/* Ligne rouge discrète au hover */}
      <div
        className="
          absolute
          bottom-0
          left-3
          right-3
          h-0.5
          rounded-full
          bg-red-600
          scale-x-0
          transition-transform
          duration-200
          group-hover:scale-x-100
        "
      />

    </div>
  );
}