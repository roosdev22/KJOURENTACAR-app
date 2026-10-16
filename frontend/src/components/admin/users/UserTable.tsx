import {
  UserCheck,
  UserX,
  Pencil,
  Trash2,
  Users,
  ChevronUp,
  ChevronDown,
  ShieldCheck,
  Crown,
  BriefcaseBusiness,
  UserRound,
  CheckCircle2,
  XCircle,
  Mail,
  Search,
} from "lucide-react";

import { useState, useMemo } from "react";

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
 * KJOURENTACAR — USER TABLE PREMIUM
 * ============================================================
 *
 * Tableau d'administration des utilisateurs.
 *
 * - Design compact / premium
 * - Textes agrandis pour une meilleure lisibilité
 * - Couleurs par rôle plus marquées
 * - Barre de recherche : les correspondances remontent en premier
 * - Header sticky uniquement dans la zone scrollable
 * - Scroll vertical contrôlé
 * - Scroll horizontal responsive
 * - Statuts avec icônes
 * - Actions discrètes
 * - Protection contre les rôles inconnus
 *
 * ============================================================
 */


/**
 * ============================================================
 * COULEURS PAR RÔLE
 * ============================================================
 *
 * Couleurs plus imposantes / saturées pour bien
 * différencier chaque rôle visuellement.
 */

const ROLE_COLORS: Record<
  UserRole,
  { bg: string; text: string; border: string; icon: string }
> = {
  SUPER_ADMIN: {
    bg: "bg-violet-100",
    text: "text-violet-800",
    border: "border-violet-300",
    icon: "text-violet-600",
  },
  ADMIN: {
    bg: "bg-blue-100",
    text: "text-blue-800",
    border: "border-blue-300",
    icon: "text-blue-600",
  },
  GESTIONNAIRE: {
    bg: "bg-amber-100",
    text: "text-amber-800",
    border: "border-amber-300",
    icon: "text-amber-600",
  },
  AGENT: {
    bg: "bg-emerald-100",
    text: "text-emerald-800",
    border: "border-emerald-300",
    icon: "text-emerald-600",
  },
  CLIENT: {
    bg: "bg-slate-200",
    text: "text-slate-700",
    border: "border-slate-300",
    icon: "text-slate-600",
  },
};

const DEFAULT_ROLE_COLOR = {
  bg: "bg-slate-100",
  text: "text-slate-600",
  border: "border-slate-300",
  icon: "text-slate-500",
};


/**
 * ============================================================
 * ICÔNES DES RÔLES
 * ============================================================
 */

const ROLE_ICONS: Partial<
  Record<UserRole, typeof Crown>
> = {
  SUPER_ADMIN: Crown,
  ADMIN: ShieldCheck,
  GESTIONNAIRE: BriefcaseBusiness,
  AGENT: UserCheck,
  CLIENT: UserRound,
};


/**
 * ============================================================
 * TYPES DE TRI
 * ============================================================
 */

type SortField =
  | "name"
  | "email"
  | "role"
  | "status";

type SortDir =
  | "asc"
  | "desc";


/**
 * ============================================================
 * SORT ICON
 * ============================================================
 *
 * IMPORTANT :
 * Ce composant doit rester en dehors de UserTable.
 *
 * Cela évite :
 *
 * "Cannot create components during render"
 *
 * ============================================================
 */

const SortIcon = ({
  field,
  sortField,
  sortDir,
}: {
  field: SortField;
  sortField: SortField;
  sortDir: SortDir;
}) => {

  const active =
    sortField === field;

  return (
    <span
      aria-hidden="true"
      className={`
        inline-flex
        flex-col
        ml-1
        shrink-0
        transition-opacity
        duration-150
        ${
          active
            ? "opacity-100"
            : "opacity-30"
        }
      `}
    >

      <ChevronUp
        size={10}
        strokeWidth={2.5}
        className={
          active &&
          sortDir === "asc"
            ? "text-red-600"
            : "text-slate-400"
        }
      />

      <ChevronDown
        size={10}
        strokeWidth={2.5}
        className={
          active &&
          sortDir === "desc"
            ? "text-red-600"
            : "text-slate-400"
        }
        style={{
          marginTop: "-3px",
        }}
      />

    </span>
  );
};


/**
 * ============================================================
 * PROPS
 * ============================================================
 */

interface UserTableProps {
  users: User[];

  loading: boolean;

  onChangeRole:
    (user: User, role: UserRole) =>
      void | Promise<void>;

  onToggleActive:
    (user: User) =>
      void | Promise<void>;

  onEdit:
    (user: User) =>
      void | Promise<void>;

  onDelete:
    (user: User) =>
      void | Promise<void>;
}


/**
 * ============================================================
 * COMPOSANT PRINCIPAL
 * ============================================================
 */

export default function UserTable({
  users,
  loading,
  onChangeRole,
  onToggleActive,
  onEdit,
  onDelete,
}: UserTableProps) {

  const [sortField, setSortField] =
    useState<SortField>("name");

  const [sortDir, setSortDir] =
    useState<SortDir>("asc");

  const [searchQuery, setSearchQuery] =
    useState("");


  /**
   * ==========================================================
   * INITIALLES
   * ==========================================================
   */

  const getInitials = (
    user: User
  ): string => {

    const first =
      user.first_name
        ?.trim()
        ?.charAt(0) ?? "";

    const last =
      user.last_name
        ?.trim()
        ?.charAt(0) ?? "";

    const initials =
      `${first}${last}`.toUpperCase();

    return initials || "U";
  };


  /**
   * ==========================================================
   * NOM COMPLET
   * ==========================================================
   */

  const getFullName = (
    user: User
  ): string => {

    const name =
      `${user.first_name ?? ""} ${
        user.last_name ?? ""
      }`.trim();

    return name || "Utilisateur";
  };


  /**
   * ==========================================================
   * TRI
   * ==========================================================
   */

  const handleSort = (
    field: SortField
  ) => {

    if (sortField === field) {

      setSortDir((current) =>
        current === "asc"
          ? "desc"
          : "asc"
      );

      return;
    }

    setSortField(field);
    setSortDir("asc");
  };


  /**
   * ==========================================================
   * UTILISATEURS TRIÉS + RECHERCHE
   * ==========================================================
   *
   * 1. Tri normal selon la colonne choisie.
   * 2. Si une recherche est en cours, les utilisateurs dont
   *    le nom ou l'email contiennent le texte tapé remontent
   *    en premier (tri stable : l'ordre interne est conservé).
   * ==========================================================
   */

  const sorted = useMemo(() => {

    const byField = [...users].sort(
      (a, b) => {

        let valueA = "";
        let valueB = "";

        switch (sortField) {

          case "name":

            valueA =
              `${a.first_name ?? ""} ${
                a.last_name ?? ""
              }`.toLowerCase();

            valueB =
              `${b.first_name ?? ""} ${
                b.last_name ?? ""
              }`.toLowerCase();

            break;


          case "email":

            valueA =
              a.email?.toLowerCase() ?? "";

            valueB =
              b.email?.toLowerCase() ?? "";

            break;


          case "role":

            valueA =
              String(a.role ?? "");

            valueB =
              String(b.role ?? "");

            break;


          case "status":

            valueA =
              a.is_active
                ? "1"
                : "0";

            valueB =
              b.is_active
                ? "1"
                : "0";

            break;
        }

        return sortDir === "asc"
          ? valueA.localeCompare(valueB)
          : valueB.localeCompare(valueA);
      }
    );

    const query =
      searchQuery
        .trim()
        .toLowerCase();

    if (!query) {
      return byField;
    }

    const matches = (user: User) =>
      getFullName(user)
        .toLowerCase()
        .includes(query) ||
      (user.email ?? "")
        .toLowerCase()
        .includes(query);

    // Tri stable : les correspondances remontent en premier,
    // l'ordre relatif au sein de chaque groupe est conservé.
    return [...byField].sort(
      (a, b) => {

        const aMatch = matches(a);
        const bMatch = matches(b);

        if (aMatch && !bMatch) return -1;
        if (!aMatch && bMatch) return 1;

        return 0;
      }
    );

  }, [users, sortField, sortDir, searchQuery]);


  /**
   * ==========================================================
   * LOADING
   * ==========================================================
   */

  if (loading) {

    return (

      <div
        className="
          w-full
          overflow-hidden
          rounded-xl
          border
          border-slate-200
          bg-white
          shadow-sm
        "
      >

        {/* HEADER */}

        <div
          className="
            h-11
            px-5
            flex
            items-center
            border-b
            border-slate-200
            bg-slate-50/70
          "
        >

          <div
            className="
              h-3
              w-28
              rounded-full
              bg-slate-200
              animate-pulse
            "
          />

        </div>


        {/* ROWS */}

        {[1, 2, 3, 4].map(
          (item) => (

            <div
              key={item}
              className="
                h-[68px]
                px-5
                flex
                items-center
                gap-3
                border-b
                border-slate-100
                last:border-0
              "
            >

              <div
                className="
                  w-9
                  h-9
                  shrink-0
                  rounded-lg
                  bg-slate-200
                  animate-pulse
                "
              />

              <div
                className="
                  flex-1
                  space-y-2
                "
              >

                <div
                  className="
                    h-3
                    w-32
                    rounded-full
                    bg-slate-200
                    animate-pulse
                  "
                />

                <div
                  className="
                    h-2.5
                    w-20
                    rounded-full
                    bg-slate-100
                    animate-pulse
                  "
                />

              </div>

            </div>

          )
        )}

      </div>
    );
  }


  /**
   * ==========================================================
   * TABLE PRINCIPALE
   * ==========================================================
   */

  return (

    <div
      className="
        w-full
        overflow-hidden
        rounded-xl
        border
        border-slate-200
        bg-white
        shadow-sm
      "
    >

      {/* ======================================================
          BARRE DE RECHERCHE
      ======================================================= */}

      <div
        className="
          group
          flex
          items-center
          gap-2
          border-b
          border-slate-200
          bg-white
          px-5
          py-3
          transition-all
          duration-200
          ease-out
          focus-within:bg-slate-50/70
        "
      >

        <Search
          size={16}
          strokeWidth={2}
          className="
            shrink-0
            text-slate-400
            transition-transform
            duration-200
            ease-out
            group-focus-within:scale-110
          "
        />

        <input
          type="text"
          value={searchQuery}
          onChange={(event) =>
            setSearchQuery(event.target.value)
          }
          placeholder="Rechercher un utilisateur (nom, email)..."
          className="
            w-full
            bg-transparent
            text-sm
            text-slate-700
            placeholder:text-slate-400
            outline-none
          "
        />

        {searchQuery && (

          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="
              shrink-0
              text-xs
              font-semibold
              text-slate-400
              transition-all
              duration-200
              ease-out
              hover:scale-110
              hover:text-slate-600
              active:scale-95
            "
          >
            Effacer
          </button>

        )}

      </div>


      {/* ======================================================
          EMPTY STATE (après recherche/filtre inclus)
      ======================================================= */}

      {users.length === 0 ? (

        <div
          className="
            px-6
            py-12
            text-center
          "
        >

          <div
            className="
              mx-auto
              flex
              h-12
              w-12
              items-center
              justify-center
              rounded-xl
              border
              border-slate-200
              bg-slate-50
            "
          >

            <Users
              size={22}
              className="text-slate-400"
            />

          </div>


          <p
            className="
              mt-4
              text-sm
              font-semibold
              text-slate-700
            "
          >
            Aucun utilisateur
          </p>


          <p
            className="
              mt-1
              text-xs
              text-slate-400
            "
          >
            Aucun utilisateur ne correspond
            aux critères actuels.
          </p>

        </div>

      ) : (

        <>

          {/* ==================================================
              ZONE SCROLLABLE
          ================================================== */}

          <div
            className="
              max-h-[320px]
              overflow-x-auto
              overflow-y-auto
              overscroll-contain
            "
          >

            <div
              className="
                min-w-[850px]
              "
            >

              {/* ==============================================
                  HEADER
              ============================================== */}

              <div
                className="
                  sticky
                  top-0
                  z-20
                  grid
                  h-11
                  grid-cols-[2fr_2fr_1.4fr_1fr_120px]
                  items-center
                  gap-4
                  border-b
                  border-slate-200
                  bg-white/95
                  px-5
                  backdrop-blur-md
                "
              >

                {/* USER */}

                <button
                  type="button"
                  onClick={() =>
                    handleSort("name")
                  }
                  className="
                    group
                    flex
                    items-center
                    text-left
                    text-[11px]
                    font-bold
                    uppercase
                    tracking-[0.08em]
                    text-slate-500
                    transition-all
                    duration-200
                    ease-out
                    hover:scale-105
                    hover:text-red-600
                  "
                >

                  Utilisateur

                  <SortIcon
                    field="name"
                    sortField={sortField}
                    sortDir={sortDir}
                  />

                </button>


                {/* EMAIL */}

                <button
                  type="button"
                  onClick={() =>
                    handleSort("email")
                  }
                  className="
                    group
                    flex
                    items-center
                    text-left
                    text-[11px]
                    font-bold
                    uppercase
                    tracking-[0.08em]
                    text-slate-500
                    transition-all
                    duration-200
                    ease-out
                    hover:scale-105
                    hover:text-red-600
                  "
                >

                  Email

                  <SortIcon
                    field="email"
                    sortField={sortField}
                    sortDir={sortDir}
                  />

                </button>


                {/* ROLE */}

                <button
                  type="button"
                  onClick={() =>
                    handleSort("role")
                  }
                  className="
                    group
                    flex
                    items-center
                    text-left
                    text-[11px]
                    font-bold
                    uppercase
                    tracking-[0.08em]
                    text-slate-500
                    transition-all
                    duration-200
                    ease-out
                    hover:scale-105
                    hover:text-red-600
                  "
                >

                  Rôle

                  <SortIcon
                    field="role"
                    sortField={sortField}
                    sortDir={sortDir}
                  />

                </button>


                {/* STATUS */}

                <button
                  type="button"
                  onClick={() =>
                    handleSort("status")
                  }
                  className="
                    group
                    flex
                    items-center
                    text-left
                    text-[11px]
                    font-bold
                    uppercase
                    tracking-[0.08em]
                    text-slate-500
                    transition-all
                    duration-200
                    ease-out
                    hover:scale-105
                    hover:text-red-600
                  "
                >

                  Statut

                  <SortIcon
                    field="status"
                    sortField={sortField}
                    sortDir={sortDir}
                  />

                </button>


                {/* ACTIONS */}

                <span
                  className="
                    text-right
                    text-[11px]
                    font-bold
                    uppercase
                    tracking-[0.08em]
                    text-slate-500
                  "
                >
                  Actions
                </span>

              </div>


              {/* ==============================================
                  LIGNES
              ============================================== */}

              {sorted.length === 0 ? (

                <div
                  className="
                    px-5
                    py-10
                    text-center
                    text-sm
                    text-slate-400
                  "
                >
                  Aucun résultat pour « {searchQuery} »
                </div>

              ) : (

                sorted.map((user) => {

                  const fullName =
                    getFullName(user);

                  const initials =
                    getInitials(user);

                  const RoleIcon =
                    ROLE_ICONS[user.role] ??
                    UserRound;

                  const roleLabel =
                    ROLE_LABELS[user.role] ??
                    String(
                      user.role ??
                      "Inconnu"
                    );

                  const roleColor =
                    ROLE_COLORS[user.role] ??
                    DEFAULT_ROLE_COLOR;


                  return (

                    <div
                      key={user.id}
                      className={`
                        group
                        grid
                        h-[68px]
                        grid-cols-[2fr_2fr_1.4fr_1fr_120px]
                        items-center
                        gap-4
                        border-b
                        border-slate-100
                        px-5
                        transition-all
                        duration-200
                        ease-out
                        last:border-0
                        hover:bg-slate-50/80
                        hover:shadow-[inset_0_0_0_1px_rgba(226,232,240,0.8)]
                        ${
                          !user.is_active
                            ? "opacity-60"
                            : ""
                        }
                      `}
                    >

                      {/* ==========================================
                          UTILISATEUR
                      ========================================== */}

                      <div
                        className="
                          flex
                          min-w-0
                          items-center
                          gap-3
                        "
                      >

                        {/* AVATAR */}

                        <div
                          className={`
                            relative
                            flex
                            h-9
                            w-9
                            shrink-0
                            items-center
                            justify-center
                            rounded-lg
                            border
                            text-[11px]
                            font-bold
                            shadow-sm
                            transition-transform
                            duration-200
                            ease-out
                            group-hover:scale-110
                            group-hover:shadow-md
                            ${roleColor.bg}
                            ${roleColor.text}
                            ${roleColor.border}
                          `}
                        >

                          {initials}


                          {/* INDICATEUR */}

                          <span
                            className="
                              absolute
                              -bottom-1
                              -right-1
                              flex
                              h-3.5
                              w-3.5
                              items-center
                              justify-center
                              rounded-full
                              border
                              border-white
                              bg-white
                            "
                          >

                            {user.is_active ? (

                              <CheckCircle2
                                size={11}
                                className="text-emerald-500"
                                strokeWidth={2.5}
                              />

                            ) : (

                              <XCircle
                                size={11}
                                className="text-slate-400"
                                strokeWidth={2.5}
                              />

                            )}

                          </span>

                        </div>


                        {/* NOM + TÉLÉPHONE */}

                        <div
                          className="
                            min-w-0
                          "
                        >

                          <p
                            className="
                              truncate
                              text-sm
                              font-semibold
                              leading-tight
                              text-slate-800
                            "
                            title={fullName}
                          >
                            {fullName}
                          </p>


                          <p
                            className="
                              mt-0.5
                              truncate
                              text-xs
                              leading-tight
                              text-slate-400
                            "
                            title={
                              user.phone ||
                              "Aucun téléphone"
                            }
                          >
                            {user.phone ||
                              "Aucun téléphone"}
                          </p>

                        </div>

                      </div>


                      {/* ==========================================
                          EMAIL
                      ========================================== */}

                      <div
                        className="
                          flex
                          min-w-0
                          items-center
                          gap-2
                        "
                      >

                        <Mail
                          size={13}
                          strokeWidth={1.8}
                          className="
                            shrink-0
                            text-slate-300
                          "
                        />

                        <span
                          className="
                            truncate
                            text-sm
                            text-slate-500
                          "
                          title={user.email}
                        >
                          {user.email}
                        </span>

                      </div>


                      {/* ==========================================
                          ROLE
                      ========================================== */}

                      <div
                        className="
                          flex
                          min-w-0
                          items-center
                          gap-1.5
                        "
                      >

                        {/* BADGE */}

                        <div
                          className={`
                            inline-flex
                            max-w-[140px]
                            min-w-0
                            items-center
                            gap-1.5
                            rounded-md
                            border
                            px-2.5
                            py-1.5
                            transition-all
                            duration-200
                            ease-out
                            hover:scale-105
                            hover:shadow-sm
                            ${roleColor.bg}
                            ${roleColor.border}
                          `}
                          title={roleLabel}
                        >

                          <RoleIcon
                            size={13}
                            strokeWidth={2.2}
                            className={`
                              shrink-0
                              ${roleColor.icon}
                            `}
                          />

                          <span
                            className={`
                              truncate
                              text-xs
                              font-bold
                              ${roleColor.text}
                            `}
                          >
                            {roleLabel}
                          </span>

                        </div>


                        {/* SELECT */}

                        <select
                          value={user.role}
                          onChange={(event) => {

                            const newRole =
                              event.target.value as UserRole;

                            if (
                              newRole !== user.role
                            ) {

                              void onChangeRole(
                                user,
                                newRole
                              );
                            }
                          }}
                          aria-label={
                            `Changer le rôle de ${fullName}`
                          }
                          className="
                            h-6
                            w-5
                            cursor-pointer
                            border-0
                            bg-transparent
                            p-0
                            text-xs
                            text-slate-400
                            outline-none
                          "
                        >

                          {USER_ROLES.map(
                            (role) => (

                              <option
                                key={role}
                                value={role}
                              >
                                {ROLE_LABELS[role]}
                              </option>

                            )
                          )}

                        </select>

                      </div>


                      {/* ==========================================
                          STATUT
                      ========================================== */}

                      <div
                        className="
                          flex
                          items-center
                        "
                      >

                        {user.is_active ? (

                          <span
                            className="
                              inline-flex
                              items-center
                              gap-1.5
                              text-sm
                              font-semibold
                              text-slate-600
                              transition-transform
                              duration-200
                              ease-out
                              hover:scale-105
                            "
                          >

                            <CheckCircle2
                              size={14}
                              className="text-emerald-500"
                              strokeWidth={2.4}
                            />

                            Actif

                          </span>

                        ) : (

                          <span
                            className="
                              inline-flex
                              items-center
                              gap-1.5
                              text-sm
                              font-semibold
                              text-slate-400
                              transition-transform
                              duration-200
                              ease-out
                              hover:scale-105
                            "
                          >

                            <XCircle
                              size={14}
                              className="text-slate-400"
                              strokeWidth={2.4}
                            />

                            Inactif

                          </span>

                        )}

                      </div>


                      {/* ==========================================
                          ACTIONS
                      ========================================== */}

                      <div
                        className="
                          flex
                          items-center
                          justify-end
                          gap-0.5
                        "
                      >

                        {/* MODIFIER */}

                        <button
                          type="button"
                          onClick={() =>
                            void onEdit(user)
                          }
                          title="Modifier"
                          aria-label={
                            `Modifier ${fullName}`
                          }
                          className="
                            flex
                            h-7
                            w-7
                            items-center
                            justify-center
                            rounded-md
                            text-slate-400
                            transition-all
                            duration-200
                            ease-out
                            hover:scale-110
                            hover:bg-slate-100
                            hover:text-slate-700
                            active:scale-90
                          "
                        >

                          <Pencil
                            size={14}
                            strokeWidth={2}
                          />

                        </button>


                        {/* ACTIVER / DÉSACTIVER */}

                        <button
                          type="button"
                          onClick={() =>
                            void onToggleActive(user)
                          }
                          title={
                            user.is_active
                              ? "Désactiver"
                              : "Activer"
                          }
                          aria-label={
                            user.is_active
                              ? `Désactiver ${fullName}`
                              : `Activer ${fullName}`
                          }
                          className="
                            flex
                            h-7
                            w-7
                            items-center
                            justify-center
                            rounded-md
                            text-slate-400
                            transition-all
                            duration-200
                            ease-out
                            hover:scale-110
                            hover:bg-slate-100
                            hover:text-slate-700
                            active:scale-90
                          "
                        >

                          {user.is_active ? (

                            <UserX
                              size={14}
                              strokeWidth={2}
                            />

                          ) : (

                            <UserCheck
                              size={14}
                              strokeWidth={2}
                            />

                          )}

                        </button>


                        {/* SUPPRIMER */}

                        <button
                          type="button"
                          onClick={() =>
                            void onDelete(user)
                          }
                          title="Supprimer"
                          aria-label={
                            `Supprimer ${fullName}`
                          }
                          className="
                            flex
                            h-7
                            w-7
                            items-center
                            justify-center
                            rounded-md
                            text-slate-400
                            transition-all
                            duration-200
                            ease-out
                            hover:scale-110
                            hover:bg-red-50
                            hover:text-red-600
                            active:scale-90
                          "
                        >

                          <Trash2
                            size={14}
                            strokeWidth={2}
                          />

                        </button>

                      </div>

                    </div>
                  );
                })

              )}

            </div>

          </div>


          {/* ==================================================
              FOOTER
          ================================================== */}

          <div
            className="
              flex
              h-10
              items-center
              justify-between
              border-t
              border-slate-100
              bg-slate-50/50
              px-5
            "
          >

            <div
              className="
                flex
                items-center
                gap-1.5
              "
            >

              <Users
                size={13}
                className="text-slate-400"
              />

              <span
                className="
                  text-xs
                  font-medium
                  text-slate-500
                "
              >
                {sorted.length} utilisateur
                {sorted.length > 1
                  ? "s"
                  : ""}
              </span>

            </div>


            <span
              className="
                hidden
                sm:block
                text-xs
                text-slate-400
              "
            >
              {sorted.length > 4
                ? "Défilement disponible"
                : "Liste des utilisateurs"}
            </span>

          </div>

        </>

      )}

    </div>
  );
}