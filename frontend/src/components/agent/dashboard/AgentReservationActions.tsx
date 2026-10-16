import {
  CheckCircle2,
  Eye,
  MoreHorizontal,
  Pencil,
  XCircle,
} from "lucide-react";
import { useState } from "react";

import type { ReservationStatus } from "../../../types/reservation";

interface AgentReservationActionsProps {
  status: ReservationStatus;
  onView: () => void;
  onValidate?: () => void;
  onEdit?: () => void;
  onCancel?: () => void;
}

export default function AgentReservationActions({
  status,
  onView,
  onValidate,
  onEdit,
  onCancel,
}: AgentReservationActionsProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative flex justify-end">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="
          flex
          h-8
          w-8
          items-center
          justify-center
          rounded-lg
          text-black/40
          transition
          hover:bg-black/[0.05]
          hover:text-black
        "
        aria-label="Actions de la réservation"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>

      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-20 cursor-default"
            onClick={() => setOpen(false)}
            aria-label="Fermer"
          />

          <div
            className="
              absolute
              right-0
              top-9
              z-30
              w-48
              overflow-hidden
              rounded-xl
              border
              border-black/[0.08]
              bg-white
              p-1
              shadow-[0_12px_35px_rgba(0,0,0,0.12)]
            "
          >
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onView();
              }}
              className="
                flex
                w-full
                items-center
                gap-2.5
                rounded-lg
                px-3
                py-2.5
                text-left
                text-xs
                font-medium
                text-black/70
                hover:bg-black/[0.04]
                hover:text-black
              "
            >
              <Eye className="h-4 w-4 text-black/40" />
              Voir la réservation
            </button>

            {status === "PENDING_VERIFICATION" &&
              onValidate && (
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    onValidate();
                  }}
                  className="
                    flex
                    w-full
                    items-center
                    gap-2.5
                    rounded-lg
                    px-3
                    py-2.5
                    text-left
                    text-xs
                    font-semibold
                    text-red-700
                    hover:bg-red-50
                  "
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Valider
                </button>
              )}

            {onEdit && status !== "TERMINEE" && (
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  onEdit();
                }}
                className="
                  flex
                  w-full
                  items-center
                  gap-2.5
                  rounded-lg
                  px-3
                  py-2.5
                  text-left
                  text-xs
                  font-medium
                  text-black/70
                  hover:bg-black/[0.04]
                "
              >
                <Pencil className="h-4 w-4 text-black/40" />
                Modifier
              </button>
            )}

            {onCancel &&
              status !== "CANCELLED" &&
              status !== "TERMINEE" && (
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    onCancel();
                  }}
                  className="
                    flex
                    w-full
                    items-center
                    gap-2.5
                    rounded-lg
                    px-3
                    py-2.5
                    text-left
                    text-xs
                    font-medium
                    text-red-700
                    hover:bg-red-50
                  "
                >
                  <XCircle className="h-4 w-4" />
                  Annuler
                </button>
              )}
          </div>
        </>
      )}
    </div>
  );
}