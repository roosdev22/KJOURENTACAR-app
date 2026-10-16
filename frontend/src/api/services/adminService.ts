import api from "../axios";

import type {
  User,
  UserRole,
} from "./authService";


/**
 * ============================================================
 * RÉPONSE PAGINÉE
 * ============================================================
 */

export interface UserListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: User[];
}


/**
 * ============================================================
 * PARAMÈTRES LISTE UTILISATEURS
 * ============================================================
 */

export interface UserListParams {
  search?: string;
  role?: UserRole;
  is_active?: boolean;
  ordering?: string;
  page?: number;
}


/**
 * ============================================================
 * CRÉATION UTILISATEUR PAR ADMIN
 * ============================================================
 */

export interface CreateUserPayload {
  email: string;

  /**
   * Facultatif.
   *
   * Si absent, le backend peut générer
   * un mot de passe temporaire.
   */
  password?: string;

  first_name: string;
  last_name: string;

  role: UserRole;

  phone?: string;
  address?: string;
}


/**
 * ============================================================
 * RÉPONSE CRÉATION UTILISATEUR
 * ============================================================
 */

export interface CreateUserResponse {
  message: string;

  user: User;

  temporary_password: string | null;

  force_password_change: boolean;

  is_email_verified: boolean;
}


/**
 * ============================================================
 * MODIFICATION UTILISATEUR
 * ============================================================
 */

export interface UpdateUserPayload {
  email?: string;

  first_name?: string;
  last_name?: string;

  phone?: string;
  address?: string;

  /**
   * Le rôle peut être modifié depuis
   * l'édition d'un utilisateur.
   */
  role?: UserRole;

  driving_license_number?: string;
  driving_license_expiry?: string;

  id_document_type?: User["id_document_type"];

  id_document_number?: string;
}


/**
 * ============================================================
 * CHANGEMENT DE RÔLE
 * ============================================================
 */

export interface ChangeRolePayload {
  role: UserRole;

  reason?: string;
}


/**
 * ============================================================
 * RÉPONSE CHANGEMENT DE RÔLE
 * ============================================================
 */

export interface ChangeRoleResponse {
  message: string;

  user: User;
}


/**
 * ============================================================
 * ACTIVATION / DÉSACTIVATION
 * ============================================================
 */

export interface UserActionResponse {
  message: string;
}


/**
 * ============================================================
 * RESTAURATION
 * ============================================================
 */

export interface RestoreUserResponse {
  message: string;

  user: User;
}


/**
 * ============================================================
 * AUDIT
 * ============================================================
 */

export interface AuditHistoryItem {
  history_id: number;

  history_date: string;

  history_type: string;

  history_type_display: string;

  history_user_email: string;

  history_change_reason: string | null;

  changed_fields: Array<{
    field: string;
    old: string;
    new: string;
  }>;
}


/**
 * ============================================================
 * SERVICE ADMIN UTILISATEURS
 * ============================================================
 */

export const adminService = {

  /**
   * ----------------------------------------------------------
   * LISTE UTILISATEURS
   *
   * GET /users/
   * ----------------------------------------------------------
   */

  async listUsers(
    params: UserListParams = {}
  ): Promise<UserListResponse> {

    const { data } =
      await api.get<UserListResponse>(
        "/users/",
        {
          params,
        }
      );

    return data;
  },


  /**
   * ----------------------------------------------------------
   * UTILISATEUR PAR ID
   *
   * GET /users/{id}/
   * ----------------------------------------------------------
   */

  async getUser(
    id: string
  ): Promise<User> {

    const { data } =
      await api.get<User>(
        `/users/${id}/`
      );

    return data;
  },


  /**
   * ----------------------------------------------------------
   * CRÉER UTILISATEUR PAR ADMIN
   *
   * POST /users/create_by_admin/
   * ----------------------------------------------------------
   */

  async createUser(
    payload: CreateUserPayload
  ): Promise<CreateUserResponse> {

    const { data } =
      await api.post<CreateUserResponse>(
        "/users/create_by_admin/",
        payload
      );

    return data;
  },


  /**
   * ----------------------------------------------------------
   * MODIFIER UTILISATEUR
   *
   * PATCH /users/{id}/
   * ----------------------------------------------------------
   */

  async updateUser(
    id: string,
    payload: UpdateUserPayload
  ): Promise<User> {

    const { data } =
      await api.patch<User>(
        `/users/${id}/`,
        payload
      );

    return data;
  },


  /**
   * ----------------------------------------------------------
   * SUPPRIMER UTILISATEUR
   *
   * DELETE /users/{id}/
   *
   * Le backend effectue un soft delete.
   * ----------------------------------------------------------
   */

  async deleteUser(
    id: string
  ): Promise<void> {

    await api.delete(
      `/users/${id}/`
    );
  },


  /**
   * ----------------------------------------------------------
   * CHANGER LE RÔLE
   *
   * PATCH /users/{id}/change_role/
   * ----------------------------------------------------------
   */

  async changeRole(
    id: string,
    payload: ChangeRolePayload
  ): Promise<ChangeRoleResponse> {

    const { data } =
      await api.patch<ChangeRoleResponse>(
        `/users/${id}/change_role/`,
        payload
      );

    return data;
  },


  /**
   * ----------------------------------------------------------
   * ACTIVER UTILISATEUR
   *
   * POST /users/{id}/activate/
   * ----------------------------------------------------------
   */

  async activateUser(
    id: string
  ): Promise<UserActionResponse> {

    const { data } =
      await api.post<UserActionResponse>(
        `/users/${id}/activate/`
      );

    return data;
  },


  /**
   * ----------------------------------------------------------
   * DÉSACTIVER UTILISATEUR
   *
   * POST /users/{id}/deactivate/
   * ----------------------------------------------------------
   */

  async deactivateUser(
    id: string
  ): Promise<UserActionResponse> {

    const { data } =
      await api.post<UserActionResponse>(
        `/users/${id}/deactivate/`
      );

    return data;
  },


  /**
   * ----------------------------------------------------------
   * TOGGLE ACTIVE
   *
   * Récupère d'abord l'utilisateur puis décide
   * s'il faut activer ou désactiver.
   * ----------------------------------------------------------
   */

  async toggleActive(
    id: string
  ): Promise<UserActionResponse> {

    const user =
      await this.getUser(id);

    if (user.is_active) {

      return this.deactivateUser(id);

    }

    return this.activateUser(id);
  },


  /**
   * ----------------------------------------------------------
   * CORBEILLE
   *
   * GET /users/trash/
   * ----------------------------------------------------------
   */

  async getTrash(): Promise<User[]> {

    const { data } =
      await api.get<User[]>(
        "/users/trash/"
      );

    return data;
  },


  /**
   * ----------------------------------------------------------
   * RESTAURER UTILISATEUR
   *
   * POST /users/{id}/restore/
   * ----------------------------------------------------------
   */

  async restoreUser(
    id: string
  ): Promise<RestoreUserResponse> {

    const { data } =
      await api.post<RestoreUserResponse>(
        `/users/${id}/restore/`
      );

    return data;
  },


  /**
   * ----------------------------------------------------------
   * ÉLIGIBILITÉ
   *
   * GET /users/{id}/eligibility/
   * ----------------------------------------------------------
   */

  async getUserEligibility(
    id: string
  ): Promise<unknown> {

    const { data } =
      await api.get(
        `/users/${id}/eligibility/`
      );

    return data;
  },


  /**
   * ----------------------------------------------------------
   * HISTORIQUE / AUDIT
   *
   * GET /users/{id}/audit_history/
   * ----------------------------------------------------------
   */

  async getAuditHistory(
    id: string
  ): Promise<AuditHistoryItem[]> {

    const { data } =
      await api.get<AuditHistoryItem[]>(
        `/users/${id}/audit_history/`
      );

    return data;
  },
};

