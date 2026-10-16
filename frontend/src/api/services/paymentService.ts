import api from "../axios";

// ============================================================
// KJOURENTACAR — SERVICE PAIEMENT
//
// Source de vérité métier : BACKEND DJANGO
//
// Le frontend ne décide jamais :
// - du montant déjà payé
// - du montant restant
// - du montant total
// - du taux de change
// - du montant HTG calculé
// - du statut du paiement
// - de la date de paiement
// - du montant remboursé
// - de l'utilisateur qui enregistre le paiement
//
// Les règles financières sont appliquées côté Django.
// ============================================================


// ============================================================
// TYPES
// ============================================================

export type PaymentMethod =
  | "CASH"
  | "MONCASH"
  | "NATCASH";

export type PaymentStatus =
  | "PENDING"
  | "SUCCEEDED"
  | "FAILED"
  | "CANCELLED"
  | "REFUNDED";

export type PaymentCurrency =
  | "HTG"
  | "USD";


// ============================================================
// PAIEMENT — RÉPONSE API
// ============================================================

export interface Payment {
  uuid: string;

  reference: string | null;

  reservation: string;
  reservation_numero: string;

  montant: string;
  devise: PaymentCurrency;

  taux_change: string | null;
  montant_htg: string;

  montant_rembourse: string;
  montant_non_rembourse: string;

  methode: PaymentMethod;
  methode_display: string;

  statut: PaymentStatus;
  statut_display: string;

  date_paiement: string | null;

  created_at: string;
  updated_at: string;

  notes: string;

  enregistre_par: number | null;

  est_finalise: boolean;
  est_remboursable: boolean;
}


// ============================================================
// RÉSUMÉ FINANCIER
//
// Tous les montants retournés par cet endpoint sont en HTG,
// conformément à PaymentSummarySerializer.
// ============================================================

export interface PaymentSummary {
  montant_total: string;
  montant_paye: string;
  montant_restant: string;
  est_entierement_paye: boolean;
}


// ============================================================
// CRÉATION D'UN PAIEMENT
// ============================================================
//
// Correspond exactement à PaymentCreateSerializer.
//
// Le frontend fournit :
// - reservation
// - montant
// - methode
// - devise
// - reference
// - notes
//
// Le backend calcule le reste.
// ============================================================

export interface PaymentCreatePayload {
  reservation: string;
  montant: string;
  methode: PaymentMethod;
  devise: PaymentCurrency;
  reference?: string;
  notes?: string;
}


// ============================================================
// CONFIRMATION
// ============================================================

export interface PaymentConfirmPayload {
  reference?: string;
}


// ============================================================
// REMBOURSEMENT
// ============================================================

export interface PaymentRefundPayload {
  montant?: string;
  notes?: string;
}


// ============================================================
// SERVICE
// ============================================================

export const paymentService = {

  // ==========================================================
  // LISTE DES PAIEMENTS
  //
  // GET /api/payments/
  // ==========================================================

  async getPayments(): Promise<Payment[]> {

    const response = await api.get<Payment[]>(
      "/payments/"
    );

    return response.data;
  },


  // ==========================================================
  // DÉTAIL D'UN PAIEMENT
  //
  // GET /api/payments/<uuid>/
  // ==========================================================

  async getPayment(
    paymentUuid: string
  ): Promise<Payment> {

    const response = await api.get<Payment>(
      `/payments/${paymentUuid}/`
    );

    return response.data;
  },


  // ==========================================================
  // PAIEMENTS D'UNE RÉSERVATION
  //
  // GET /api/payments/reservations/<reservation_id>/
  // ==========================================================

  async getReservationPayments(
    reservationId: string
  ): Promise<Payment[]> {

    const response = await api.get<Payment[]>(
      `/payments/reservations/${reservationId}/`
    );

    return response.data;
  },


  // ==========================================================
  // RÉSUMÉ FINANCIER
  //
  // GET /api/payments/reservations/<reservation_id>/summary/
  // ==========================================================

  async getPaymentSummary(
    reservationId: string
  ): Promise<PaymentSummary> {

    const response = await api.get<PaymentSummary>(
      `/payments/reservations/${reservationId}/summary/`
    );

    return response.data;
  },


  // ==========================================================
  // CRÉER UN PAIEMENT
  //
  // POST /api/payments/
  // ==========================================================

  async createPayment(
    data: PaymentCreatePayload
  ): Promise<Payment> {

    const response = await api.post<Payment>(
      "/payments/",
      data
    );

    return response.data;
  },


  // ==========================================================
  // CONFIRMER UN PAIEMENT
  //
  // POST /api/payments/<uuid>/confirm/
  // ==========================================================

  async confirmPayment(
    paymentUuid: string,
    data: PaymentConfirmPayload = {}
  ): Promise<Payment> {

    const response = await api.post<Payment>(
      `/payments/${paymentUuid}/confirm/`,
      data
    );

    return response.data;
  },


  // ==========================================================
  // ANNULER UN PAIEMENT
  //
  // POST /api/payments/<uuid>/cancel/
  // ==========================================================

  async cancelPayment(
    paymentUuid: string
  ): Promise<Payment> {

    const response = await api.post<Payment>(
      `/payments/${paymentUuid}/cancel/`
    );

    return response.data;
  },


  // ==========================================================
  // REMBOURSER UN PAIEMENT
  //
  // POST /api/payments/<uuid>/refund/
  // ==========================================================

  async refundPayment(
    paymentUuid: string,
    data: PaymentRefundPayload = {}
  ): Promise<Payment> {

    const response = await api.post<Payment>(
      `/payments/${paymentUuid}/refund/`,
      data
    );

    return response.data;
  },
};


// ============================================================
// EXPORT DEFAULT
// ============================================================

export default paymentService;