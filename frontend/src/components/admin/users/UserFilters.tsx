import { Search } from "lucide-react";

import type { UserRole } from "../../../api/services/authService";

import {
  USER_ROLES,
  ROLE_LABELS,
} from "./userConstants";

/**
 * ============================================================
 * PROPS
 * ============================================================
 */
interface UserFiltersProps {
  search: string;

  role: UserRole | "";

  activeFilter: "" | "true" | "false";

  onSearchChange: (value: string) => void;

  onRoleChange: (
    value: UserRole | ""
  ) => void;

  onActiveChange: (
    value: "" | "true" | "false"
  ) => void;
}

/**
 * ============================================================
 * FILTRES UTILISATEURS
 * ============================================================
 */
export default function UserFilters({
  search,
  role,
  activeFilter,
  onSearchChange,
  onRoleChange,
  onActiveChange,
}: UserFiltersProps) {
  return (
    <div
      className="
        mb-5
        rounded-xl
        border
        border-black/10
        bg-white
        p-4
      "
    >
      <div
        className="
          grid
          grid-cols-1
          gap-3
          md:grid-cols-2
          lg:grid-cols-4
        "
      >
        {/* ====================================================
            RECHERCHE
        ===================================================== */}
        <div
          className="
            relative
            lg:col-span-2
          "
        >
          <Search
            size={18}
            className="
              absolute
              left-3
              top-1/2
              -translate-y-1/2
              text-black/40
            "
          />

          <input
            type="text"
            value={search}
            placeholder="Rechercher un utilisateur..."
            onChange={(event) =>
              onSearchChange(
                event.target.value
              )
            }
            className="
              w-full
              rounded-lg
              border
              border-black/10
              py-2.5
              pl-10
              pr-4
              text-sm
              outline-none
              transition
              focus:border-red-600
            "
          />
        </div>

        {/* ====================================================
            RÔLE
        ===================================================== */}
        <select
          value={role}
          onChange={(event) => {
            const value =
              event.target.value;

            if (value === "") {
              onRoleChange("");
              return;
            }

            onRoleChange(
              value as UserRole
            );
          }}
          className="
            rounded-lg
            border
            border-black/10
            bg-white
            px-3
            py-2.5
            text-sm
            outline-none
            transition
            focus:border-red-600
          "
        >
          <option value="">
            Tous les rôles
          </option>

          {USER_ROLES.map((item) => (
            <option
              key={item}
              value={item}
            >
              {ROLE_LABELS[item]}
            </option>
          ))}
        </select>

        {/* ====================================================
            STATUT
        ===================================================== */}
        <select
          value={activeFilter}
          onChange={(event) => {
            const value =
              event.target.value as
                | ""
                | "true"
                | "false";

            onActiveChange(value);
          }}
          className="
            rounded-lg
            border
            border-black/10
            bg-white
            px-3
            py-2.5
            text-sm
            outline-none
            transition
            focus:border-red-600
          "
        >
          <option value="">
            Tous les statuts
          </option>

          <option value="true">
            Actifs
          </option>

          <option value="false">
            Inactifs
          </option>
        </select>
      </div>
    </div>
  );
}

