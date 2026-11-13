import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { getApiErrorMessage } from "../../utils/apiError";
import AdminIcon from "../../components/admin/AdminIcon";

import { adminService } from "../../api/services/adminService";

import type {
  CreateUserPayload,
  UpdateUserPayload,
} from "../../api/services/adminService";

import type {
  User,
  UserRole,
} from "../../api/services/authService";

import UserFilters from "../../components/admin/users/UserFilters";
import UserTable from "../../components/admin/users/UserTable";
import CreateUserModal from "../../components/admin/users/CreateUserModal";
import EditUserModal from "../../components/admin/users/EditUserModal";
import DeleteUserModal from "../../components/admin/users/DeleteUserModal";

import type {
  EditUserForm,
} from "../../components/admin/users/EditUserModal";


/**
 * ============================================================
 * PAGE ADMIN — GESTION DES UTILISATEURS
 * ============================================================
 */
export default function AdminUsers() {

  /**
   * ==========================================================
   * UTILISATEURS
   * ==========================================================
   */

  const [users, setUsers] = useState<User[]>([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");


  /**
   * ==========================================================
   * FILTRES
   * ==========================================================
   */

  const [search, setSearch] = useState("");

  const [role, setRole] =
    useState<UserRole | "">("");

  const [activeFilter, setActiveFilter] =
    useState<"" | "true" | "false">("");


  /**
   * ==========================================================
   * PAGINATION
   * ==========================================================
   */

  const [page, setPage] = useState(1);

  const [count, setCount] = useState(0);

  const pageSize = 10;

  const totalPages =
    Math.ceil(count / pageSize);


  /**
   * ==========================================================
   * CRÉATION
   * ==========================================================
   */

  const [showCreateModal, setShowCreateModal] =
    useState(false);

  const [creating, setCreating] =
    useState(false);

  const [form, setForm] =
    useState<CreateUserPayload>({
      email: "",
      password: "",
      first_name: "",
      last_name: "",
      role: "CLIENT",
      phone: "",
    });


  /**
   * ==========================================================
   * MODIFICATION
   * ==========================================================
   */

  const [showEditModal, setShowEditModal] =
    useState(false);

  const [editing, setEditing] =
    useState(false);

  const [selectedUser, setSelectedUser] =
    useState<User | null>(null);

  const [editForm, setEditForm] =
    useState<EditUserForm>({
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      role: "CLIENT",
    });


  /**
   * ==========================================================
   * SUPPRESSION
   * ==========================================================
   */

  const [showDeleteModal, setShowDeleteModal] =
    useState(false);

  const [deleting, setDeleting] =
    useState(false);

  const [userToDelete, setUserToDelete] =
    useState<User | null>(null);


  /**
   * ==========================================================
   * CHARGEMENT DES UTILISATEURS
   * ==========================================================
   */

  const loadUsers = useCallback(async () => {

    try {

      setLoading(true);
      setError("");

      const response =
        await adminService.listUsers({

          search:
            search.trim() || undefined,

          role:
            role || undefined,

          is_active:
            activeFilter === ""
              ? undefined
              : activeFilter === "true",

          ordering:
            "-date_joined",

          page,
        });

      setUsers(response.results);

      setCount(response.count);

    } catch (err) {

      console.error(
        "Erreur chargement utilisateurs :",
        err
      );

      setError(
        "Impossible de charger les utilisateurs."
      );

    } finally {

      setLoading(false);

    }

  }, [
    search,
    role,
    activeFilter,
    page,
  ]);


  /**
   * ==========================================================
   * CHARGEMENT INITIAL / FILTRES / PAGINATION
   * ==========================================================
   */

  useEffect(() => {

    let cancelled = false;

    const fetchUsers = async () => {

      try {

        setLoading(true);
        setError("");

        const response =
          await adminService.listUsers({

            search:
              search.trim() || undefined,

            role:
              role || undefined,

            is_active:
              activeFilter === ""
                ? undefined
                : activeFilter === "true",

            ordering:
              "-date_joined",

            page,
          });

        if (cancelled) {
          return;
        }

        setUsers(response.results);

        setCount(response.count);

      } catch (err) {

        if (cancelled) {
          return;
        }

        console.error(
          "Erreur chargement utilisateurs :",
          err
        );

        setError(
          "Impossible de charger les utilisateurs."
        );

      } finally {

        if (!cancelled) {
          setLoading(false);
        }

      }

    };

    fetchUsers();

    return () => {
      cancelled = true;
    };

  }, [
    search,
    role,
    activeFilter,
    page,
  ]);


  /**
   * ==========================================================
   * CHANGEMENT DE RÔLE
   * ==========================================================
   *
   * Le rôle possède son propre endpoint backend :
   *
   * PATCH /users/{id}/change_role/
   *
   * On ne l'envoie donc PAS dans updateUser().
   */
  const handleChangeRole = async (
    user: User,
    newRole: UserRole
  ): Promise<void> => {

    if (user.role === newRole) {
      return;
    }

    try {

      setError("");

      await adminService.changeRole(
        String(user.id),
        {
          role: newRole,
        }
      );

      await loadUsers();

    } catch (err) {

      console.error(
        "Erreur changement rôle :",
        err
      );

      setError(
        "Impossible de modifier le rôle de l'utilisateur."
      );

    }
  };


  /**
   * ==========================================================
   * ACTIVER / DÉSACTIVER
   * ==========================================================
   *
   * IMPORTANT :
   *
   * adminService.toggleActive() attend un objet User.
   *
   * Donc :
   *
   *  toggleActive(String(user.id))
   *
   * ✅ toggleActive(user)
   */
  const handleToggleActive = async (
    user: User
  ): Promise<void> => {

    try {

      setError("");

      await adminService.toggleActive(user.id);

      await loadUsers();

    } catch (err) {

      console.error(
        "Erreur changement statut :",
        err
      );

      setError(
        "Impossible de modifier le statut de l'utilisateur."
      );

    }
  };


  /**
   * ==========================================================
   * FORMULAIRE CRÉATION
   * ==========================================================
   */

  const handleFormChange = (
    field: keyof CreateUserPayload,
    value: string
  ): void => {

    setForm((current) => ({
      ...current,
      [field]: value,
    }));

  };


  /**
   * ==========================================================
   * CRÉER UTILISATEUR
   * ==========================================================
   */
// AdminUsers.tsx  ← ce fichier
const handleCreateUser = async (
  event: React.FormEvent<HTMLFormElement>
): Promise<void> => {

  event.preventDefault();

  try {
    setCreating(true);
    setError("");

    await adminService.createUser(form);

    setShowCreateModal(false);
    setForm({
      email: "",
      password: "",
      first_name: "",
      last_name: "",
      role: "CLIENT",
      phone: "",
    });

    setPage(1);
    if (page === 1) {
      await loadUsers();
    }

  } catch (err: unknown) {

    console.error("Erreur création utilisateur.");

    setError(
      getApiErrorMessage(
        err,
        "Impossible de créer l'utilisateur. Vérifiez les informations saisies."
      )
    );

  } finally {
    setCreating(false);
  }
};

  /**
   * ==========================================================
   * OUVRIR MODIFICATION
   * ==========================================================
   */

  const handleEditUser = (
    user: User
  ): void => {

    setSelectedUser(user);

    setEditForm({

      first_name:
        user.first_name ?? "",

      last_name:
        user.last_name ?? "",

      email:
        user.email ?? "",

      phone:
        user.phone ?? "",

      role:
        user.role,

    });

    setShowEditModal(true);

  };


  /**
   * ==========================================================
   * CHANGEMENT FORMULAIRE MODIFICATION
   * ==========================================================
   */

  const handleEditFormChange = (
    field: keyof EditUserForm,
    value: string
  ): void => {

    setEditForm((current) => ({
      ...current,
      [field]: value,
    }));

  };


  /**
   * ==========================================================
   * ENREGISTRER MODIFICATION
   * ==========================================================
   *
   * IMPORTANT :
   *
   * updateUser() ne reçoit PAS role.
   *
   * Si le rôle a changé, on appelle ensuite changeRole().
   */
  const handleUpdateUser = async (
    event: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {

    event.preventDefault();

    if (!selectedUser) {
      return;
    }

    try {

      setEditing(true);
      setError("");

      /**
       * ------------------------------------------------------
       * 1. Informations personnelles
       * ------------------------------------------------------
       */

      const payload: UpdateUserPayload = {

        first_name:
          editForm.first_name.trim(),

        last_name:
          editForm.last_name.trim(),

        email:
          editForm.email.trim(),

        phone:
          editForm.phone.trim() || undefined,

      };


      /**
       * ------------------------------------------------------
       * 2. Mise à jour des informations
       * ------------------------------------------------------
       */

      await adminService.updateUser(
        String(selectedUser.id),
        payload
      );


      /**
       * ------------------------------------------------------
       * 3. Changement de rôle uniquement si nécessaire
       * ------------------------------------------------------
       */

      if (
        selectedUser.role !==
        editForm.role
      ) {

        await adminService.changeRole(
          String(selectedUser.id),
          {
            role: editForm.role,
          }
        );

      }


      /**
       * ------------------------------------------------------
       * 4. Fermer modal
       * ------------------------------------------------------
       */

      setShowEditModal(false);

      setSelectedUser(null);


      /**
       * ------------------------------------------------------
       * 5. Recharger la liste
       * ------------------------------------------------------
       */

      await loadUsers();

    } catch (err) {

      console.error(
        "Erreur modification utilisateur :",
        err
      );

      setError(
        "Impossible de modifier l'utilisateur."
      );

    } finally {

      setEditing(false);

    }

  };


  /**
   * ==========================================================
   * OUVRIR SUPPRESSION
   * ==========================================================
   */

  const handleDeleteUser = (
    user: User
  ): void => {

    setUserToDelete(user);

    setShowDeleteModal(true);

  };


  /**
   * ==========================================================
   * CONFIRMER SUPPRESSION
   * ==========================================================
   */

  const handleConfirmDelete = async (): Promise<void> => {

    if (!userToDelete) {
      return;
    }

    try {

      setDeleting(true);
      setError("");

      await adminService.deleteUser(
        String(userToDelete.id)
      );

      setShowDeleteModal(false);

      setUserToDelete(null);

      if (
        users.length === 1 &&
        page > 1
      ) {

        setPage(
          (current) =>
            Math.max(current - 1, 1)
        );

      } else {

        await loadUsers();

      }

    } catch (err) {

      console.error(
        "Erreur suppression utilisateur :",
        err
      );

      setError(
        "Impossible de supprimer l'utilisateur."
      );

    } finally {

      setDeleting(false);

    }

  };


  /**
   * ==========================================================
   * RENDER
   * ==========================================================
   */

  return (

    <div className="space-y-5">

      {/* ======================================================
          HEADER
      ======================================================= */}

      <div
        className="
          flex
          flex-col
          gap-4
          md:flex-row
          md:items-center
          md:justify-between
        "
      >

        <div>

          <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-kjou-red">
          Administration / Comptes
          </div>
          <h1 className="font-kjou-display text-2xl font-bold tracking-tight text-kjou-text md:text-[30px]">
            Gestion des utilisateurs
          </h1>

          <p className="mt-1 text-sm text-kjou-muted">
            Gérez les comptes, rôles et
            accès des utilisateurs.
          </p>

        </div>


        <button
          type="button"
          onClick={() =>
            setShowCreateModal(true)
          }
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-kjou-control bg-kjou-red px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-kjou-red-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kjou-red focus-visible:ring-offset-2"
        >

          <AdminIcon name="plus" size={18} />

          Ajouter un utilisateur

        </button>

      </div>


      {/* ======================================================
          ERREUR
      ======================================================= */}

      {error && (

        <div
          className="
            rounded-kjou-control
            border
            border-red-200
            bg-red-50
            px-4
            py-3
            text-sm
            text-red-700
            flex items-center justify-between
          "
        >

          <span>
            {error}
          </span>

          <button
            type="button"
            onClick={() =>
              setError("")
            }
            className="
              p-1
              hover:bg-red-100
              rounded
            "
            aria-label="Fermer"
          >

            <AdminIcon name="x" size={16} />

          </button>

        </div>

      )}


      {/* ======================================================
          FILTRES
      ======================================================= */}

      <UserFilters

        search={search}

        role={role}

        activeFilter={activeFilter}

        onSearchChange={(value) => {

          setSearch(value);

          setPage(1);

        }}

        onRoleChange={(value) => {

          setRole(value);

          setPage(1);

        }}

        onActiveChange={(value) => {

          setActiveFilter(value);

          setPage(1);

        }}

      />


      {/* ======================================================
          TABLE
      ======================================================= */}

      <UserTable

        users={users}

        loading={loading}

        onChangeRole={handleChangeRole}

        onToggleActive={handleToggleActive}

        onEdit={handleEditUser}

        onDelete={handleDeleteUser}

      />


      {/* ======================================================
          PAGINATION
      ======================================================= */}

      {!loading &&
        users.length > 0 && (

        <div
          className="
            mt-4
            flex
            flex-col
            gap-3
            sm:flex-row
            sm:items-center
            sm:justify-between
            px-1
          "
        >

          <p
            className="
              text-xs
              text-kjou-muted
            "
          >

            {count} utilisateur
            {count > 1 ? "s" : ""}

          </p>


          <div
            className="
              flex
              items-center
              gap-2
            "
          >

            <button
              type="button"
              disabled={page <= 1}
              onClick={() =>
                setPage(
                  (current) =>
                    Math.max(current - 1, 1)
                )
              }
              className="
                p-2
                rounded-kjou-control
                border
                border-kjou-border
                bg-white
                disabled:opacity-30
                disabled:cursor-not-allowed
                hover:bg-kjou-mist
                transition
                focus-visible:outline-none
                focus-visible:ring-2
                focus-visible:ring-kjou-red
              "
              aria-label="Page précédente"
            >

              <AdminIcon name="chevron-left" size={16} />

            </button>


            <span
              className="
                min-w-[70px]
                text-center
                text-xs
                font-semibold
              "
            >

              {page} /{" "}
              {Math.max(totalPages, 1)}

            </span>


            <button
              type="button"
              disabled={
                page >= totalPages ||
                totalPages === 0
              }
              onClick={() =>
                setPage(
                  (current) =>
                    Math.min(
                      current + 1,
                      totalPages
                    )
                )
              }
              className="
                p-2
                rounded-lg
                border
                border-black/10
                bg-white
                disabled:opacity-30
                disabled:cursor-not-allowed
                hover:bg-black/5
                transition
              "
              aria-label="Page suivante"
            >

              <AdminIcon name="chevron-right" size={16} />

            </button>

          </div>

        </div>

      )}


      {/* ======================================================
          MODAL CRÉATION
      ======================================================= */}

      <CreateUserModal

        open={showCreateModal}

        creating={creating}

        form={form}

        onClose={() =>
          setShowCreateModal(false)
        }

        onSubmit={handleCreateUser}

        onChange={handleFormChange}

      />


      {/* ======================================================
          MODAL MODIFICATION
      ======================================================= */}

      <EditUserModal

        open={showEditModal}

        editing={editing}

        user={selectedUser}

        form={editForm}

        onClose={() => {

          if (editing) {
            return;
          }

          setShowEditModal(false);

          setSelectedUser(null);

        }}

        onSubmit={handleUpdateUser}

        onChange={handleEditFormChange}

      />


      {/* ======================================================
          MODAL SUPPRESSION
      ======================================================= */}

      <DeleteUserModal

        open={showDeleteModal}

        deleting={deleting}

        user={userToDelete}

        onClose={() => {

          if (deleting) {
            return;
          }

          setShowDeleteModal(false);

          setUserToDelete(null);

        }}

        onConfirm={handleConfirmDelete}

      />

    </div>

  );
}

