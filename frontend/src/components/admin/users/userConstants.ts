import type { UserRole } from "../../../api/services/authService";

/**
 * Rôles disponibles dans l'application.
 *
 * SUPER_ADMIN existe dans le backend et doit donc
 * être représenté dans le frontend.
 */
export const USER_ROLES: UserRole[] = [
  "SUPER_ADMIN",
  "ADMIN",
  "GESTIONNAIRE",
  "AGENT",
  "CLIENT",
];

/**
 * Libellés affichés dans l'interface.
 */
export const ROLE_LABELS: Record<UserRole, string> = {
  SUPER_ADMIN: "Super administrateur",
  ADMIN: "Administrateur",
  GESTIONNAIRE: "Gestionnaire",
  AGENT: "Agent",
  CLIENT: "Client",
};

/**
 * Retourne le nom lisible d'un rôle.
 */
export const getRoleLabel = (role: UserRole): string => {
  return ROLE_LABELS[role];
};
