// ============================================================
// KJOURENTACAR — Types réservation
// Alignés sur ReservationSerializer Django
// ============================================================

export type ReservationStatus =
  | "PENDING_VERIFICATION"
  | "CONFIRMED"
  | "CANCELLED"
  | "EN_COURS"
  | "TERMINEE"
  | "EXPIRED";


export type ReservationSource =
  | "CLIENT"
  | "AGENT";

// ============================================================
// VÉHICULE D'UNE RÉSERVATION
// ============================================================

export interface ReservationVehicle {
  id: string;
  brand: string;
  model: string;
  status: string;
  daily_rate: string;
  deposit: string | null;
}

// ============================================================
// LIGNE DE RÉSERVATION
// ============================================================

export interface ReservationLine {
  id: string;
  vehicule_id: string;
  vehicule: ReservationVehicle;
  prix_journalier_unitaire: string;
  caution_unitaire: string;
  sous_total: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================
// UTILISATEUR LIÉ (créateur, validateur)
// ============================================================

export interface ReservationUser {
  id: string;
  nom: string;
}

// ============================================================
// RÉSERVATION
// ============================================================

export interface Reservation {
  id: string;
  numero: string;

  // Client
  client_id: string;
  client_nom: string;

  // Créateur
  created_by_id: string;
  created_by_nom: string;

  // Validateur — objet imbriqué, pas deux champs plats
  validated_by: ReservationUser | null;   // ← corrigé

  // Dates
  date_debut: string;
  date_fin: string;
  date_confirmation: string | null;
  date_annulation: string | null;

  // Calculs
  nombre_jours: number;
  montant_total: string;
  caution_totale: string;

  // Statut
  statut: ReservationStatus;
  statut_display: string;

  // Source
  source: ReservationSource;
  source_display: string;

  // Notes
  notes_client: string;
  notes_agent: string;
  motif_annulation: string | null;

  // Véhicules
  lignes: ReservationLine[];

  // Propriétés métier
  est_modifiable: boolean;
  est_annulable: boolean;
  paiement_reussi: boolean;

  // Dates système
  created_at: string;
  updated_at: string;
}

// ============================================================
// CRÉATION — CLIENT
// ============================================================

export interface ReservationCreatePayload {
  date_debut: string;   // "YYYY-MM-DD"
  date_fin: string;     // "YYYY-MM-DD"
  vehicules: string[];  // tableau d'UUID
  notes_client?: string;
}

// ============================================================
// PAGINATION
// ============================================================

export interface PaginatedReservations {
  count: number;
  next: string | null;
  previous: string | null;
  results: Reservation[];
}

export interface ReservationContractResult {
  generated: boolean;
  id?: string;
  reference?: string;
  status?: string;
  detail?: string;
}

export interface ConfirmReservationResponse extends Reservation {
  contract: ReservationContractResult;
}
