import type { FormEvent } from "react";
import { X } from "lucide-react";

import type {
  CreateUserPayload,
} from "../../../api/services/adminService";

import type {
  UserRole,
} from "../../../api/services/authService";

import {
  USER_ROLES,
  ROLE_LABELS,
} from "./userConstants";

interface CreateUserModalProps {
  open: boolean;
  creating: boolean;
  form: CreateUserPayload;

  onClose: () => void;

  onSubmit: (
    event: FormEvent<HTMLFormElement>
  ) => void | Promise<void>;

  onChange: (
    field: keyof CreateUserPayload,
    value: string
  ) => void;
}

export default function CreateUserModal({
  open,
  creating,
  form,
  onClose,
  onSubmit,
  onChange,
}: CreateUserModalProps) {
  /**
   * ============================================================
   * MODAL FERMÉ
   * ============================================================
   */
  if (!open) {
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
        z-[100]
        bg-black/40
        backdrop-blur-sm
        flex
        items-center
        justify-center
        p-4
      "
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-user-title"
    >
      <div
        className="
          w-full
          max-w-lg
          max-h-[90vh]
          overflow-y-auto
          bg-white
          rounded-2xl
          shadow-2xl
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
          <div>
            <h2
              id="create-user-title"
              className="font-bold text-lg text-black"
            >
              Nouvel utilisateur
            </h2>

            <p
              className="
                text-xs
                text-black/40
                mt-1
              "
            >
              Créer un compte depuis
              l'administration.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={creating}
            className="
              p-2
              rounded-lg
              hover:bg-black/5
              disabled:opacity-50
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
            FORMULAIRE
        ======================================================= */}
        <form
          onSubmit={onSubmit}
          className="p-6 space-y-4"
        >
          {/* ====================================================
              PRÉNOM + NOM
          ===================================================== */}
          <div
            className="
              grid
              grid-cols-1
              sm:grid-cols-2
              gap-4
            "
          >
            {/* Prénom */}
            <div>
              <label
                htmlFor="create-first-name"
                className="
                  block
                  text-xs
                  font-semibold
                  mb-1.5
                  text-black
                "
              >
                Prénom
              </label>

              <input
                id="create-first-name"
                required
                disabled={creating}
                type="text"
                autoComplete="given-name"
                value={form.first_name}
                onChange={(event) =>
                  onChange(
                    "first_name",
                    event.target.value
                  )
                }
                className="
                  w-full
                  px-3
                  py-2.5
                  rounded-lg
                  border
                  border-black/10
                  text-sm
                  outline-none
                  focus:border-red-600
                  disabled:bg-black/5
                  disabled:cursor-not-allowed
                "
                placeholder="Jean"
              />
            </div>

            {/* Nom */}
            <div>
              <label
                htmlFor="create-last-name"
                className="
                  block
                  text-xs
                  font-semibold
                  mb-1.5
                  text-black
                "
              >
                Nom
              </label>

              <input
                id="create-last-name"
                required
                disabled={creating}
                type="text"
                autoComplete="family-name"
                value={form.last_name}
                onChange={(event) =>
                  onChange(
                    "last_name",
                    event.target.value
                  )
                }
                className="
                  w-full
                  px-3
                  py-2.5
                  rounded-lg
                  border
                  border-black/10
                  text-sm
                  outline-none
                  focus:border-red-600
                  disabled:bg-black/5
                  disabled:cursor-not-allowed
                "
                placeholder="Baptiste"
              />
            </div>
          </div>

          {/* ====================================================
              EMAIL
          ===================================================== */}
          <div>
            <label
              htmlFor="create-email"
              className="
                block
                text-xs
                font-semibold
                mb-1.5
                text-black
              "
            >
              Email
            </label>

            <input
              id="create-email"
              required
              disabled={creating}
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={(event) =>
                onChange(
                  "email",
                  event.target.value
                )
              }
              className="
                w-full
                px-3
                py-2.5
                rounded-lg
                border
                border-black/10
                text-sm
                outline-none
                focus:border-red-600
                disabled:bg-black/5
                disabled:cursor-not-allowed
              "
              placeholder="utilisateur@example.com"
            />
          </div>

          {/* ====================================================
              TÉLÉPHONE
          ===================================================== */}
          <div>
            <label
              htmlFor="create-phone"
              className="
                block
                text-xs
                font-semibold
                mb-1.5
                text-black
              "
            >
              Téléphone
            </label>

            <input
              id="create-phone"
              disabled={creating}
              type="tel"
              autoComplete="tel"
              value={form.phone ?? ""}
              onChange={(event) =>
                onChange(
                  "phone",
                  event.target.value
                )
              }
              className="
                w-full
                px-3
                py-2.5
                rounded-lg
                border
                border-black/10
                text-sm
                outline-none
                focus:border-red-600
                disabled:bg-black/5
                disabled:cursor-not-allowed
              "
              placeholder="+509 XXXX XXXX"
            />
          </div>

          {/* ====================================================
              ADRESSE
          ===================================================== */}
          <div>
            <label
              htmlFor="create-address"
              className="
                block
                text-xs
                font-semibold
                mb-1.5
                text-black
              "
            >
              Adresse
            </label>

            <input
              id="create-address"
              disabled={creating}
              type="text"
              autoComplete="street-address"
              value={form.address ?? ""}
              onChange={(event) =>
                onChange(
                  "address",
                  event.target.value
                )
              }
              className="
                w-full
                px-3
                py-2.5
                rounded-lg
                border
                border-black/10
                text-sm
                outline-none
                focus:border-red-600
                disabled:bg-black/5
                disabled:cursor-not-allowed
              "
              placeholder="Adresse de l'utilisateur"
            />
          </div>

          {/* ====================================================
              MOT DE PASSE
          ===================================================== */}
          <div>
            <label
              htmlFor="create-password"
              className="
                block
                text-xs
                font-semibold
                mb-1.5
                text-black
              "
            >
              Mot de passe
              <span className="text-black/40 font-normal">
                {" "}
                (facultatif)
              </span>
            </label>

            <input
              id="create-password"
              disabled={creating}
              type="password"
              minLength={8}
              autoComplete="new-password"
              value={form.password ?? ""}
              onChange={(event) =>
                onChange(
                  "password",
                  event.target.value
                )
              }
              className="
                w-full
                px-3
                py-2.5
                rounded-lg
                border
                border-black/10
                text-sm
                outline-none
                focus:border-red-600
                disabled:bg-black/5
                disabled:cursor-not-allowed
              "
              placeholder="Laisser vide pour un mot de passe temporaire"
            />

            <p
              className="
                text-[11px]
                text-black/40
                mt-1
              "
            >
              Minimum 8 caractères si vous définissez
              vous-même le mot de passe. Sinon, le backend
              peut générer un mot de passe temporaire.
            </p>
          </div>

          {/* ====================================================
              RÔLE
          ===================================================== */}
          <div>
            <label
              htmlFor="create-role"
              className="
                block
                text-xs
                font-semibold
                mb-1.5
                text-black
              "
            >
              Rôle
            </label>

            <select
              id="create-role"
              required
              disabled={creating}
              value={form.role}
              onChange={(event) => {
                const newRole =
                  event.target.value as UserRole;

                onChange(
                  "role",
                  newRole
                );
              }}
              className="
                w-full
                px-3
                py-2.5
                rounded-lg
                border
                border-black/10
                text-sm
                bg-white
                outline-none
                focus:border-red-600
                disabled:bg-black/5
                disabled:cursor-not-allowed
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
              pt-3
            "
          >
            <button
              type="button"
              onClick={onClose}
              disabled={creating}
              className="
                px-4
                py-2.5
                rounded-lg
                text-sm
                font-semibold
                hover:bg-black/5
                disabled:opacity-50
                disabled:cursor-not-allowed
                transition
              "
            >
              Annuler
            </button>

            <button
              type="submit"
              disabled={creating}
              className="
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
              {creating
                ? "Création..."
                : "Créer l'utilisateur"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
