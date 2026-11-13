import { Link } from "react-router-dom";
import { UserCircle } from "lucide-react";

interface ProfileWidgetProps {
  completion?: number;
}

export default function ProfileWidget({
  completion = 0,
}: ProfileWidgetProps) {
  const safeCompletion = Math.min(
    100,
    Math.max(0, completion)
  );

  const isComplete = safeCompletion === 100;

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-6">
      {/* Header */}
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100">
          <UserCircle
            size={22}
            className="text-gray-500"
          />
        </div>

        <div>
          <p className="text-sm font-semibold text-gray-900">
            Votre profil
          </p>

          <p className="text-xs text-gray-400">
            {isComplete
              ? "Profil complété"
              : "Profil incomplet"}
          </p>
        </div>
      </div>

      {/* Progression */}
      <div className="mb-1.5 flex items-center justify-between text-xs text-gray-500">
        <span>Complété</span>

        <span className="font-semibold text-gray-800">
          {safeCompletion}%
        </span>
      </div>

      <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          className={`h-full rounded-full transition-all ${
            isComplete
              ? "bg-emerald-500"
              : "bg-red-500"
          }`}
          style={{
            width: `${safeCompletion}%`,
          }}
        />
      </div>

      {/* Profil incomplet */}
      {!isComplete && (
        <Link
          to="/profile/complete"
          className="block rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-center text-xs font-semibold text-red-600 transition-colors hover:bg-red-100"
        >
          Compléter mon profil
        </Link>
      )}
    </div>
  );
}