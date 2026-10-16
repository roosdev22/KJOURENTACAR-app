import type { UserRole } from "../api/services/authService";

// ============================================================
// RÔLES — MIROIR DU BACKEND
// ------------------------------------------------------------
// Ces listes doivent rester synchronisées avec
// apps/reservations/views.py (STAFF_ROLES,
// RESERVATION_OPERATION_ROLES). Elles ne remplacent pas les
// permissions serveur : elles évitent seulement d'afficher au
// frontend des actions que le backend refuserait de toute façon.
// ============================================================

// Personnel pouvant consulter toutes les réservations
// (dashboard agent en lecture : liste, stats).
export const RESERVATION_STAFF_ROLES: UserRole[] = [
  "AGENT",
  "GESTIONNAIRE",
  "ADMIN",
  "SUPER_ADMIN",
];

// Personnel pouvant confirmer / annuler / démarrer / terminer
// une réservation. Le GESTIONNAIRE consulte mais n'opère pas.
export const RESERVATION_OPERATOR_ROLES: UserRole[] = [
  "AGENT",
  "ADMIN",
  "SUPER_ADMIN",
];