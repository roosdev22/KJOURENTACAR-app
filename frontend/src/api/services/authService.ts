import api from "../axios";

/**
 * ============================================================
 * RÔLES UTILISATEURS
 * ============================================================
 */

export type UserRole =
  | "CLIENT"
  | "AGENT"
  | "GESTIONNAIRE"
  | "ADMIN"
  | "SUPER_ADMIN";

/**
 * ============================================================
 * TYPE DOCUMENT D'IDENTITÉ
 * ============================================================
 */

export type IdDocumentType =
  | "PASSPORT"
  | "ID_CARD"
  | "DRIVER_LICENSE";

/**
 * ============================================================
 * GOOGLE LOGIN
 * ============================================================
 */

interface GoogleLoginResponse {
  user: User;
  provider: string;
  is_new: boolean;
}

export interface CreateClientByAgentPayload {
  first_name: string;
  last_name: string;
  email: string;

  phone?: string;
  address?: string;

  driving_license_number?: string;
  driving_license_expiry?: string;

  id_document_type?: IdDocumentType;
  id_document_number?: string;
}

/**
 * ============================================================
 * UTILISATEUR
 * ============================================================
 */

export interface User {
  id: string;

  email: string;

  first_name: string;
  last_name: string;

  phone?: string;
  address?: string;

  driving_license_number?: string;
  driving_license_expiry?: string;

  id_document_type?: IdDocumentType;
  id_document_number?: string;

  role: UserRole;

  is_active: boolean;
  is_staff: boolean;

  force_password_change: boolean;

  oauth_only: boolean;

  is_email_verified: boolean;
  eligibility?: RentalEligibility;

  created_at: string;
  updated_at: string;
}

/**
 * ============================================================
 * ÉLIGIBILITÉ LOCATION
 * ============================================================
 */

export interface RentalEligibility {
  eligible: boolean;
  missing_docs: string[];
  reasons: string[];
}

/**
 * ============================================================
 * LOGIN
 * ============================================================
 */

export interface LoginPayload {
  email: string;
  password: string;
}

/**
 * ============================================================
 * INSCRIPTION
 * ============================================================
 */

export interface RegisterPayload {
  first_name: string;
  last_name: string;
  email: string;

  password: string;
  password_confirm: string;

  phone?: string;
  address?: string;

  driving_license_number?: string;
  driving_license_expiry?: string;

  id_document_type?: IdDocumentType;
  id_document_number?: string;
}

/**
 * ============================================================
 * MODIFICATION PROFIL
 * ============================================================
 */

export interface UpdateProfilePayload {
  first_name?: string;
  last_name?: string;

  phone?: string;
  address?: string;

  driving_license_number?: string;
  driving_license_expiry?: string;

  id_document_type?: IdDocumentType;
  id_document_number?: string;
}

/**
 * ============================================================
 * RESET PASSWORD
 * ============================================================
 */

export interface PasswordResetConfirmPayload {
  token: string;
  new_password: string;
  confirm_password: string;
}

/**
 * ============================================================
 * CHANGEMENT PASSWORD
 *
 * Le backend actuel utilise :
 * current_password
 * new_password
 * confirm_password
 * ============================================================
 */

export interface ChangePasswordPayload {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

/**
 * ============================================================
 * SERVICE AUTHENTIFICATION
 * ============================================================
 */

export const authService = {
  /**
   * ----------------------------------------------------------
   * LOGIN
   * POST /users/login/
   * ----------------------------------------------------------
   */

  async login(payload: LoginPayload): Promise<User> {
    const { data } = await api.post<{ user: User }>(
      "/users/login/",
      payload
    );

    return data.user;
  },

  /**
   * ----------------------------------------------------------
   * INSCRIPTION
   * POST /users/
   * ----------------------------------------------------------
   */

  async register(payload: RegisterPayload): Promise<User> {
    const { data } = await api.post<{
      message: string;
      user: User;
    }>("/users/", payload);

    return data.user;
  },

  /**
   * ----------------------------------------------------------
   * LOGOUT
   * POST /users/logout/
   * ----------------------------------------------------------
   */

  async logout(): Promise<void> {
    try {
      await api.post("/users/logout/");
    } finally {
      window.location.href = "/login";
    }
  },


async createClientByAgent(
  payload: CreateClientByAgentPayload
): Promise<User> {
  const { data } = await api.post<{
    message: string;
    user: User;
    temporary_password?: string | null;
  }>(
    "/users/create_by_agent/",
    payload
  );

  return data.user;
},

async getClients(): Promise<User[]> {
  const { data } = await api.get<
    User[] | {
      count: number;
      next: string | null;
      previous: string | null;
      results: User[];
    }
  >("/users/clients/");

  if (Array.isArray(data)) {
    return data;
  }

  return data.results;
},

  /**
   * ----------------------------------------------------------
   * GOOGLE LOGIN
   * POST /users/google_login/
   * ----------------------------------------------------------
   */

  async loginWithGoogle(idToken: string): Promise<User> {
    const { data } = await api.post<GoogleLoginResponse>(
      "/users/google_login/",
      {
        id_token: idToken,
      }
    );

    return data.user;
  },

  /**
   * ----------------------------------------------------------
   * PROFIL CONNECTÉ
   * GET /users/me/
   * ----------------------------------------------------------
   */

  async getProfile(): Promise<User> {
    const { data } = await api.get<User>(
      "/users/me/"
    );

    return data;
  },

  /**
   * ----------------------------------------------------------
   * MODIFIER PROFIL
   * PATCH /users/me/
   * ----------------------------------------------------------
   */

  async updateProfile(
    payload: UpdateProfilePayload
  ): Promise<User> {
    const { data } = await api.patch<User>(
      "/users/me/",
      payload
    );

    return data;
  },

  /**
   * ----------------------------------------------------------
   * ÉLIGIBILITÉ LOCATION
   * GET /users/{id}/eligibility/
   * ----------------------------------------------------------
   */

  async checkRentalEligibility(
    userId: string
  ): Promise<RentalEligibility> {
    const { data } =
      await api.get<RentalEligibility>(
        `/users/${userId}/eligibility/`
      );

    return data;
  },

  /**
   * ----------------------------------------------------------
   * CHANGER PASSWORD
   * POST /users/change_password/
   * ----------------------------------------------------------
   */

  async changePassword(
    payload: ChangePasswordPayload
  ): Promise<void> {
    await api.post(
      "/users/change_password/",
      payload
    );
  },

  /**
   * ----------------------------------------------------------
   * MOT DE PASSE OUBLIÉ
   * POST /users/forgot_password/
   * ----------------------------------------------------------
   */

  async requestPasswordReset(
    email: string
  ): Promise<void> {
    await api.post(
      "/users/forgot_password/",
      {
        email,
      }
    );
  },

  /**
   * ----------------------------------------------------------
   * VALIDATION TOKEN RESET
   * POST /users/validate_reset_token/
   * ----------------------------------------------------------
   */

  async validateResetToken(
    token: string
  ): Promise<void> {
    await api.post(
      "/users/validate_reset_token/",
      {
        token,
      }
    );
  },

  /**
   * ----------------------------------------------------------
   * RESET PASSWORD
   * POST /users/reset_password/
   * ----------------------------------------------------------
   */

  async confirmPasswordReset(
    payload: PasswordResetConfirmPayload
  ): Promise<void> {
    await api.post(
      "/users/reset_password/",
      payload
    );
  },

  /**
   * ----------------------------------------------------------
   * VÉRIFICATION EMAIL
   * POST /users/verify_email/
   * ----------------------------------------------------------
   */

  async verifyEmail(
    token: string
  ): Promise<void> {
    await api.post(
      "/users/verify_email/",
      {
        token,
      }
    );
  },

  /**
   * ----------------------------------------------------------
   * RENVOYER EMAIL VÉRIFICATION
   * POST /users/verify_email/resend/
   * ⚠ À confirmer — action non visible dans le ViewSet actuel
   * ----------------------------------------------------------
   */

  async resendVerificationEmail(
    email: string
  ): Promise<void> {
    await api.post(
      "/users/verify_email/resend/",
      {
        email,
      }
    );
  },
};