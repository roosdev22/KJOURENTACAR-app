import api from "../axios";
import axios from "axios";


// import type {
//   Reservation,
//   ReservationCreatePayload,
//   PaginatedReservations,
// } from "../../types/reservation";


import type {
  Reservation,
  ReservationCreatePayload,
  PaginatedReservations,
  ConfirmReservationResponse,
} from "../../types/reservation";

// ============================================================
// KJOURENTACAR — SERVICE RÉSERVATION
//
// Source de vérité métier : BACKEND DJANGO
//
// Le frontend ne transmet jamais :
// - montant_total
// - caution_totale
// - nombre_jours
// - prix_journalier_unitaire
// - caution_unitaire
// - sous_total
// - statut
// - source
// - client (sauf client_id explicite pour une création agent)
// - created_by
// ============================================================


// ============================================================
// PAYLOADS — ACTIONS AGENT
// ------------------------------------------------------------
// Définis ici (et non dans types/reservation.ts) car ce sont
// des payloads d'écriture propres aux actions du ViewSet,
// pas des formes renvoyées par l'API.
// ============================================================

export interface ReservationAgentCreatePayload {
  client_id: string;
  date_debut: string; // "YYYY-MM-DD"
  date_fin: string; // "YYYY-MM-DD"
  vehicules: string[]; // IDs véhicules
  notes_client?: string;
  notes_agent?: string;
}

export interface ReservationCancellationPayload {
  motif_annulation: string;
}


// ============================================================
// RETOUR DE VÉHICULE — PAYLOADS
// ============================================================

export type VehicleReturnCondition =
  | "BON"
  | "DOMMAGES_MINEURS"
  | "DOMMAGES_MAJEURS";

export interface VehicleReturnLinePayload {
  ligne_reservation_id: string;
  kilometrage_retour: number;
  etat_general: VehicleReturnCondition;
  observations?: string;
}

export interface VehicleReturnPayload {
  date_retour_effective?: string;
  penalite_retard?: string;
  penalite_dommages?: string;
  caution_restituee?: boolean;
  lignes: VehicleReturnLinePayload[];
}

export interface ReservationActionError {
  code?: string;
  detail?: string;
  message?: string;
  client?: string;
  paiement?: string;
  statut?: string;
  confirmation?: string[] | string;
  vehicules?: string;
  reasons?: string[];
  missing_docs?: string[];
  vehicules_indisponibles?: Array<{
    id: string;
    nom: string;
    statut: string;
  }>;
}

// ============================================================
// RETOUR DE VÉHICULE — RÉPONSE API
// ============================================================

export interface VehicleReturnVehicle {
  id: string;
  brand: string;
  model: string;
  registration_number: string;
}

export interface VehicleReturnLine {
  id: string;
  ligne_reservation_id?: string;
  vehicule: VehicleReturnVehicle;
  kilometrage_depart: number;
  kilometrage_retour: number;
  etat_general: VehicleReturnCondition;
  observations: string;
  created_at: string;
  updated_at: string;
}

export interface VehicleReturn {
  id: string;
  reservation_id: string;

  date_retour_prevue: string;
  date_retour_effective: string | null;

  penalite_retard: string;
  penalite_dommages: string;
  total_penalites: string;

  caution_restituee: boolean;

  enregistre_par: {
    id: string;
    nom: string;
  } | null;

  nombre_vehicules: number;
  nombre_vehicules_retournes: number;
  tous_les_vehicules_sont_retournes: boolean;

  lignes: VehicleReturnLine[];

  created_at: string;
  updated_at: string;
}


// ============================================================
// SERVICE
// ============================================================

export const reservationService = {

  // ==========================================================
  // CRÉER UNE RÉSERVATION CLIENT
  // ==========================================================

  async createReservation(
    data: ReservationCreatePayload
  ): Promise<Reservation> {

    const response = await api.post<Reservation>(
      "/reservations/",
      data
    );

    return response.data;
  },


  // ==========================================================
  // CRÉER UNE RÉSERVATION EN AGENCE (AGENT / ADMIN / SUPER_ADMIN)
  // ------------------------------------------------------------
  // Même endpoint que la création client : le backend choisit
  // ReservationAgentCreateSerializer selon le rôle de l'utilisateur
  // connecté (cf. ReservationViewSet.get_serializer_class).
  // ==========================================================

  async createReservationAsAgent(
    data: ReservationAgentCreatePayload
  ): Promise<Reservation> {

    const response = await api.post<Reservation>(
      "/reservations/",
      data
    );

    return response.data;
  },


  // ==========================================================
  // MES RÉSERVATIONS (CLIENT)
  // ==========================================================

  async getMyReservations(): Promise<Reservation[]> {

    const response = await api.get<
      Reservation[] | PaginatedReservations
    >(
      "/reservations/mes-reservations/"
    );

    if (Array.isArray(response.data)) {
      return response.data;
    }

    return response.data.results;
  },


  // ==========================================================
  // TOUTES LES RÉSERVATIONS ACCESSIBLES (STAFF)
  // ------------------------------------------------------------
  // Pour un AGENT/GESTIONNAIRE/ADMIN, le queryset du backend
  // renvoie déjà toutes les réservations (pas seulement les
  // siennes). Sert de source unique pour dériver les stats du
  // dashboard (payé/non payé, départs/retours du jour) tant
  // qu'aucun endpoint d'agrégation dédié n'existe côté backend.
  // ==========================================================

  async getAllReservations(): Promise<Reservation[]> {

    const response = await api.get<
      Reservation[] | PaginatedReservations
    >(
      "/reservations/"
    );

    if (Array.isArray(response.data)) {
      return response.data;
    }

    return response.data.results;
  },


  // ==========================================================
  // RÉSERVATIONS EN ATTENTE (STAFF)
  // ==========================================================

  async getPendingReservations(): Promise<Reservation[]> {

    const response = await api.get<
      Reservation[] | PaginatedReservations
    >(
      "/reservations/en-attente/"
    );

    if (Array.isArray(response.data)) {
      return response.data;
    }

    return response.data.results;
  },


  // ==========================================================
  // RÉSERVATIONS CONFIRMÉES (STAFF)
  // ==========================================================

  async getConfirmedReservations(): Promise<Reservation[]> {

    const response = await api.get<
      Reservation[] | PaginatedReservations
    >(
      "/reservations/confirmees/"
    );

    if (Array.isArray(response.data)) {
      return response.data;
    }

    return response.data.results;
  },


  // ==========================================================
  // DÉTAIL D'UNE RÉSERVATION
  // ==========================================================

  async getReservation(
    id: string
  ): Promise<Reservation> {

    const response = await api.get<Reservation>(
      `/reservations/${id}/`
    );

    return response.data;
  },


  // ==========================================================
  // CONFIRMER (AGENT / ADMIN / SUPER_ADMIN)
  // ==========================================================
// ==========================================================
// CONFIRMER (AGENT / ADMIN / SUPER_ADMIN)
// ==========================================================

async confirmReservation(
  id: string
): Promise<ConfirmReservationResponse> {
  const fallback = "Impossible de confirmer la réservation.";

  try {
    const response = await api.post<ConfirmReservationResponse>(
      `/reservations/${id}/confirmer/`,
      { confirmation: true }
    );

    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError<ReservationActionError>(error)) {
      const data = error.response?.data;

      if (data) {
        if (
          Array.isArray(data.reasons) &&
          data.reasons.length > 0
        ) {
          throw new Error(
            `${data.detail ?? fallback} ${data.reasons.join(" ")}`,
            { cause: error }
          );
        }

        if (
          Array.isArray(data.vehicules_indisponibles) &&
          data.vehicules_indisponibles.length > 0
        ) {
          const vehicles = data.vehicules_indisponibles
            .map((vehicle) => vehicle.nom)
            .join(", ");

          throw new Error(
            `${data.detail ?? fallback} Véhicules concernés : ${vehicles}.`,
            { cause: error }
          );
        }

        if (data.confirmation) {
          const confirmationMessage = Array.isArray(
            data.confirmation
          )
            ? data.confirmation.join(" ")
            : data.confirmation;

          throw new Error(
            confirmationMessage,
            { cause: error }
          );
        }

        throw new Error(
          data.message ??
            data.detail ??
            data.client ??
            data.paiement ??
            data.statut ??
            data.vehicules ??
            fallback,
          { cause: error }
        );
      }
    }

    throw new Error(fallback, { cause: error });
  }
},

  // ==========================================================
  // ANNULER (AGENT / ADMIN / SUPER_ADMIN)
  // ==========================================================

  async cancelReservation(
    id: string,
    data: ReservationCancellationPayload
  ): Promise<Reservation> {

    const response = await api.post<Reservation>(
      `/reservations/${id}/annuler/`,
      data
    );

    return response.data;
  },


  // ==========================================================
  // DÉMARRER — CONFIRMED → EN_COURS (AGENT / ADMIN / SUPER_ADMIN)
  // ==========================================================

  async startReservation(
    id: string
  ): Promise<Reservation> {

    const response = await api.post<Reservation>(
      `/reservations/${id}/demarrer/`,
      { confirmation: true }
    );

    return response.data;
  },


  // ==========================================================
  // TERMINER — EN_COURS → TERMINEE (AGENT / ADMIN / SUPER_ADMIN)
  // ==========================================================

  async completeReservation(
    id: string
  ): Promise<Reservation> {

    const response = await api.post<Reservation>(
      `/reservations/${id}/terminer/`,
      { confirmation: true }
    );

    return response.data;
  },


  async registerVehicleReturn(
    reservationId: string,
    data: VehicleReturnPayload
  ): Promise<VehicleReturn> {

    const response = await api.post<VehicleReturn>(
      `/reservations/${reservationId}/retour/`,
      data
    );

    return response.data;
  },
};


// ==========================================================
// ENREGISTRER LE RETOUR COMPLET
// EN_COURS → TERMINEE
// ==========================================================


// ============================================================
// EXPORT DEFAULT
// ============================================================

export default reservationService;