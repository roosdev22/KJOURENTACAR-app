import type { FormEvent } from "react";
import AdminIcon from "../AdminIcon";

import type {
  User,
  UserRole,
} from "../../../api/services/authService";

import {
  USER_ROLES,
  ROLE_LABELS,
} from "./userConstants";

/**
 * ============================================================
 * FORMULAIRE DE MODIFICATION
 * ============================================================
 */
export interface EditUserForm {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  role: UserRole;
}

/**
 * ============================================================
 * PROPS
 * ============================================================
 */
interface EditUserModalProps {
  open: boolean;
  editing: boolean;
  user: User | null;

  form: EditUserForm;

  onClose: () => void;

  onSubmit: (
    event: FormEvent<HTMLFormElement>
  ) => void | Promise<void>;

  onChange: (
    field: keyof EditUserForm,
    value: string
  ) => void;
}

/**
 * ============================================================
 * MODAL MODIFICATION UTILISATEUR
 * ============================================================
 */
export default function EditUserModal({
  open,
  editing,
  user,
  form,
  onClose,
  onSubmit,
  onChange,
}: EditUserModalProps) {
  /**
   * Ne rien afficher si modal fermée
   * ou aucun utilisateur sélectionné.
   */
  if (!open || !user) {
    return null;
  }

  /**
   * ==========================================================
   * RENDER
   * ==========================================================
   */
  return (
    <div
      className="
        fixed
        inset-0
        z-[100]
        flex
        items-center
        justify-center
        p-4
      "
    >
      {/* ======================================================
          OVERLAY
      ======================================================= */}
      <div
        className="
          absolute
          inset-0
          bg-black/50
          backdrop-blur-sm
        "
        onClick={() => {
          if (!editing) {
            onClose();
          }
        }}
      />

      {/* ======================================================
          MODAL
      ======================================================= */}
      <div
        className="
          relative
          z-10
          w-full
          max-w-lg
          max-h-[90vh]
          overflow-y-auto
          rounded-2xl
          bg-white
          shadow-2xl
        "
      >
        {/* ====================================================
            HEADER
        ===================================================== */}
        <div
          className="
            sticky
            top-0
            z-10
            flex
            items-center
            justify-between
            border-b
            border-black/10
            bg-white
            px-5
            py-4
          "
        >
          <div>
            <h2
              className="
                text-lg
                font-bold
                text-black
              "
            >
              Modifier l'utilisateur
            </h2>

            <p
              className="
                mt-0.5
                text-xs
                text-black/45
              "
            >
              Modifiez les informations du compte.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={editing}
            className="
              rounded-lg
              p-2
              text-black/50
              hover:bg-black/5
              hover:text-black
              disabled:cursor-not-allowed
              disabled:opacity-40
              transition
            "
            aria-label="Fermer"
          >
            <AdminIcon name="x" size={19} />
          </button>
        </div>

        {/* ====================================================
            FORMULAIRE
        ===================================================== */}
        <form
          onSubmit={onSubmit}
          className="p-5"
        >
          {/* ==================================================
              UTILISATEUR
          =================================================== */}
          <div
            className="
              mb-5
              flex
              items-center
              gap-3
              rounded-xl
              bg-black/[0.025]
              p-3
            "
          >
            <div
              className="
                flex
                h-11
                w-11
                shrink-0
                items-center
                justify-center
                rounded-full
                bg-red-50
                text-sm
                font-bold
                text-red-700
              "
            >
              {(
                `${user.first_name?.[0] ?? ""}` +
                `${user.last_name?.[0] ?? ""}`
              ).toUpperCase()}
            </div>

            <div className="min-w-0">
              <p
                className="
                  truncate
                  text-sm
                  font-semibold
                  text-black
                "
              >
                {user.first_name} {user.last_name}
              </p>

              <p
                className="
                  truncate
                  text-xs
                  text-black/45
                "
              >
                {user.email}
              </p>
            </div>
          </div>

          {/* ==================================================
              PRÉNOM
          =================================================== */}
          <div className="mb-4">
            <label
              htmlFor="edit-first-name"
              className="
                mb-1.5
                block
                text-xs
                font-semibold
                text-black/70
              "
            >
              Prénom
            </label>

            <div className="relative">
              <AdminIcon
                name="user-round"
                size={17}
                className="
                  absolute
                  left-3
                  top-1/2
                  -translate-y-1/2
                  text-black/35
                "
              />

              <input
                id="edit-first-name"
                type="text"
                value={form.first_name}
                onChange={(event) =>
                  onChange(
                    "first_name",
                    event.target.value
                  )
                }
                disabled={editing}
                required
                className="
                  w-full
                  rounded-lg
                  border
                  border-black/10
                  bg-white
                  py-2.5
                  pl-10
                  pr-3
                  text-sm
                  outline-none
                  transition
                  focus:border-red-600
                  disabled:bg-black/[0.03]
                  disabled:opacity-60
                "
                placeholder="Prénom"
              />
            </div>
          </div>

          {/* ==================================================
              NOM
          =================================================== */}
          <div className="mb-4">
            <label
              htmlFor="edit-last-name"
              className="
                mb-1.5
                block
                text-xs
                font-semibold
                text-black/70
              "
            >
              Nom
            </label>

            <div className="relative">
              <AdminIcon
                name="user-round"
                size={17}
                className="
                  absolute
                  left-3
                  top-1/2
                  -translate-y-1/2
                  text-black/35
                "
              />

              <input
                id="edit-last-name"
                type="text"
                value={form.last_name}
                onChange={(event) =>
                  onChange(
                    "last_name",
                    event.target.value
                  )
                }
                disabled={editing}
                required
                className="
                  w-full
                  rounded-lg
                  border
                  border-black/10
                  bg-white
                  py-2.5
                  pl-10
                  pr-3
                  text-sm
                  outline-none
                  transition
                  focus:border-red-600
                  disabled:bg-black/[0.03]
                  disabled:opacity-60
                "
                placeholder="Nom"
              />
            </div>
          </div>

          {/* ==================================================
              EMAIL
          =================================================== */}
          <div className="mb-4">
            <label
              htmlFor="edit-email"
              className="
                mb-1.5
                block
                text-xs
                font-semibold
                text-black/70
              "
            >
              Adresse email
            </label>

            <div className="relative">
              <AdminIcon
                name="mail"
                size={17}
                className="
                  absolute
                  left-3
                  top-1/2
                  -translate-y-1/2
                  text-black/35
                "
              />

              <input
                id="edit-email"
                type="email"
                value={form.email}
                onChange={(event) =>
                  onChange(
                    "email",
                    event.target.value
                  )
                }
                disabled={editing}
                required
                className="
                  w-full
                  rounded-lg
                  border
                  border-black/10
                  bg-white
                  py-2.5
                  pl-10
                  pr-3
                  text-sm
                  outline-none
                  transition
                  focus:border-red-600
                  disabled:bg-black/[0.03]
                  disabled:opacity-60
                "
                placeholder="email@example.com"
              />
            </div>
          </div>

          {/* ==================================================
              TÉLÉPHONE
          =================================================== */}
          <div className="mb-4">
            <label
              htmlFor="edit-phone"
              className="
                mb-1.5
                block
                text-xs
                font-semibold
                text-black/70
              "
            >
              Téléphone
            </label>

            <div className="relative">
              <AdminIcon
                name="phone"
                size={17}
                className="
                  absolute
                  left-3
                  top-1/2
                  -translate-y-1/2
                  text-black/35
                "
              />

              <input
                id="edit-phone"
                type="tel"
                value={form.phone}
                onChange={(event) =>
                  onChange(
                    "phone",
                    event.target.value
                  )
                }
                disabled={editing}
                className="
                  w-full
                  rounded-lg
                  border
                  border-black/10
                  bg-white
                  py-2.5
                  pl-10
                  pr-3
                  text-sm
                  outline-none
                  transition
                  focus:border-red-600
                  disabled:bg-black/[0.03]
                  disabled:opacity-60
                "
                placeholder="+509..."
              />
            </div>
          </div>

          {/* ==================================================
              RÔLE
          =================================================== */}
          <div className="mb-6">
            <label
              htmlFor="edit-role"
              className="
                mb-1.5
                block
                text-xs
                font-semibold
                text-black/70
              "
            >
              Rôle
            </label>

            <div className="relative">
              <AdminIcon
                name="shield"
                size={17}
                className="
                  pointer-events-none
                  absolute
                  left-3
                  top-1/2
                  -translate-y-1/2
                  text-black/35
                "
              />

              <select
                id="edit-role"
                value={form.role}
                onChange={(event) => {
                  const newRole =
                    event.target.value as UserRole;

                  onChange(
                    "role",
                    newRole
                  );
                }}
                disabled={editing}
                required
                className="
                  w-full
                  appearance-none
                  rounded-lg
                  border
                  border-black/10
                  bg-white
                  py-2.5
                  pl-10
                  pr-3
                  text-sm
                  font-medium
                  outline-none
                  transition
                  focus:border-red-600
                  disabled:bg-black/[0.03]
                  disabled:opacity-60
                "
              >
                {USER_ROLES.map((item) => (
                  <option
                    key={item}
                    value={item}
                  >
                    {ROLE_LABELS[item]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* ==================================================
              ACTIONS
          =================================================== */}
          <div
            className="
              flex
              flex-col-reverse
              gap-2
              sm:flex-row
              sm:justify-end
            "
          >
            <button
              type="button"
              onClick={onClose}
              disabled={editing}
              className="
                rounded-lg
                border
                border-black/10
                px-4
                py-2.5
                text-sm
                font-semibold
                text-black/65
                hover:bg-black/5
                disabled:cursor-not-allowed
                disabled:opacity-40
                transition
              "
            >
              Annuler
            </button>

            <button
              type="submit"
              disabled={editing}
              className="
                inline-flex
                items-center
                justify-center
                gap-2
                rounded-lg
                bg-red-700
                px-4
                py-2.5
                text-sm
                font-semibold
                text-white
                hover:bg-red-800
                disabled:cursor-not-allowed
                disabled:opacity-60
                transition
              "
            >
              {editing ? (
                <>
                  <AdminIcon
                    name="loader"
                    size={17}
                    className="animate-spin"
                  />

                  Enregistrement...
                </>
              ) : (
                <>
                  <AdminIcon name="save" size={17} />

                  Enregistrer
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

