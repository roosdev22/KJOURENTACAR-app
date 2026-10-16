import {
  X,
  Trash2,
  AlertTriangle,
} from "lucide-react";

import type { User } from "../../../api/services/authService";

interface DeleteUserModalProps {
  open: boolean;
  deleting: boolean;
  user: User | null;

  onClose: () => void;

  onConfirm: () => void | Promise<void>;
}

export default function DeleteUserModal({
  open,
  deleting,
  user,
  onClose,
  onConfirm,
}: DeleteUserModalProps) {
  /**
   * ============================================================
   * MODAL FERMÉ
   * ============================================================
   */
  if (!open || !user) {
    return null;
  }

  /**
   * ============================================================
   * RENDER
   * ============================================================
   */
  return (
    <div
      className="
        fixed
        inset-0
        z-[110]
        bg-black/40
        backdrop-blur-sm
        flex
        items-center
        justify-center
        p-4
      "
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-user-title"
    >
      <div
        className="
          w-full
          max-w-md
          bg-white
          rounded-2xl
          shadow-2xl
          overflow-hidden
        "
      >
        {/* ======================================================
            HEADER
        ======================================================= */}
        <div
          className="
            flex
            items-center
            justify-between
            px-6
            py-4
            border-b
            border-black/10
          "
        >
          <h2
            id="delete-user-title"
            className="
              font-bold
              text-lg
              text-black
            "
          >
            Supprimer l'utilisateur
          </h2>

          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="
              p-2
              rounded-lg
              hover:bg-black/5
              disabled:opacity-40
              disabled:cursor-not-allowed
              transition
            "
            aria-label="Fermer"
            title="Fermer"
          >
            <X size={18} />
          </button>
        </div>

        {/* ======================================================
            CONTENU
        ======================================================= */}
        <div className="p-6">
          {/* Avertissement */}
          <div
            className="
              flex
              items-start
              gap-3
              p-4
              rounded-xl
              bg-red-50
              border
              border-red-100
            "
          >
            <AlertTriangle
              size={22}
              className="
                text-red-600
                shrink-0
                mt-0.5
              "
              aria-hidden="true"
            />

            <div>
              <p
                className="
                  text-sm
                  font-semibold
                  text-red-800
                "
              >
                Attention
              </p>

              <p
                className="
                  text-sm
                  text-red-700
                  mt-1
                  leading-5
                "
              >
                Cette action va supprimer le compte
                de cet utilisateur.
              </p>
            </div>
          </div>

          {/* Utilisateur concerné */}
          <p
            className="
              text-sm
              text-black/60
              mt-5
              leading-6
            "
          >
            Voulez-vous vraiment supprimer
            l'utilisateur{" "}
            <strong className="text-black">
              {user.first_name} {user.last_name}
            </strong>
            ?
          </p>

          {/* Email */}
          <p
            className="
              text-xs
              text-black/40
              mt-2
              break-all
            "
          >
            {user.email}
          </p>

          {/* ====================================================
              BOUTONS
          ===================================================== */}
          <div
            className="
              flex
              flex-col-reverse
              sm:flex-row
              sm:justify-end
              gap-3
              mt-6
            "
          >
            <button
              type="button"
              onClick={onClose}
              disabled={deleting}
              className="
                px-4
                py-2.5
                rounded-lg
                text-sm
                font-semibold
                hover:bg-black/5
                disabled:opacity-40
                disabled:cursor-not-allowed
                transition
              "
            >
              Annuler
            </button>

            <button
              type="button"
              onClick={onConfirm}
              disabled={deleting}
              className="
                flex
                items-center
                justify-center
                gap-2
                px-4
                py-2.5
                rounded-lg
                bg-red-700
                text-white
                text-sm
                font-semibold
                hover:bg-red-800
                disabled:opacity-50
                disabled:cursor-not-allowed
                transition
              "
            >
              <Trash2
                size={16}
                aria-hidden="true"
              />

              {deleting
                ? "Suppression..."
                : "Supprimer"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

