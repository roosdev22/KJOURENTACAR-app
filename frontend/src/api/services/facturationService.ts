
import api from "../axios";

// ============================================================
// TYPES
// ============================================================

export type StatutFacture = "EMISE" | "ANNULEE";

export type StatutReglement =
  | "NON_PAYEE"
  | "PARTIELLEMENT_PAYEE"
  | "PAYEE";

export interface Facture {
  id: string;
  reference: string;
  reservation_id: string;
  statut: StatutFacture;
  devise: string;
  montant_location: string | number;
  montant_caution: string | number;
  emise_le: string;
  creee_par_id: number | string | null;
  motif_annulation: string | null;
  annulee_le: string | null;
  annulee_par_id: number | string | null;
}

export interface SituationFinanciere {
  facture_id: string;
  reference: string;
  devise: string;
  montant_location: string | number;
  montant_caution: string | number;
  montant_paye: string | number;
  montant_restant: string | number;
  statut_reglement: StatutReglement;
}

export interface DemandeCreationFacture {
  reservation_id: string;
}

interface ListePaginee<T> {
  results: T[];
  count?: number;
  next?: string | null;
  previous?: string | null;
}

// ============================================================
// ERREURS
// ============================================================

function extraireErreur(
  erreur: unknown,
  messageParDefaut: string,
): Error {
  if (
    typeof erreur === "object" &&
    erreur !== null &&
    "response" in erreur
  ) {
    const response = erreur.response;

    if (
      typeof response === "object" &&
      response !== null &&
      "data" in response
    ) {
      const data = response.data;

      if (
        typeof data === "object" &&
        data !== null &&
        "detail" in data &&
        typeof data.detail === "string"
      ) {
        return new Error(data.detail, { cause: erreur });
      }

      if (
        typeof data === "object" &&
        data !== null &&
        "message" in data &&
        typeof data.message === "string"
      ) {
        return new Error(data.message, { cause: erreur });
      }
    }
  }

  if (erreur instanceof Error) {
    return erreur;
  }

  return new Error(messageParDefaut, { cause: erreur });
}

// ============================================================
// VALIDATION DES RÉPONSES
// ============================================================

function estObjet(
  valeur: unknown,
): valeur is Record<string, unknown> {
  return (
    typeof valeur === "object" &&
    valeur !== null &&
    !Array.isArray(valeur)
  );
}

function estFacture(valeur: unknown): valeur is Facture {
  if (!estObjet(valeur)) {
    return false;
  }

  return (
    typeof valeur.id === "string" &&
    typeof valeur.reference === "string" &&
    typeof valeur.reservation_id === "string" &&
    (valeur.statut === "EMISE" ||
      valeur.statut === "ANNULEE") &&
    typeof valeur.devise === "string" &&
    (typeof valeur.montant_location === "string" ||
      typeof valeur.montant_location === "number") &&
    (typeof valeur.montant_caution === "string" ||
      typeof valeur.montant_caution === "number") &&
    typeof valeur.emise_le === "string" &&
    (typeof valeur.creee_par_id === "number" ||
      typeof valeur.creee_par_id === "string" ||
      valeur.creee_par_id === null) &&
    (typeof valeur.motif_annulation === "string" ||
      valeur.motif_annulation === null) &&
    (typeof valeur.annulee_le === "string" ||
      valeur.annulee_le === null) &&
    (typeof valeur.annulee_par_id === "number" ||
      typeof valeur.annulee_par_id === "string" ||
      valeur.annulee_par_id === null)
  );
}


function extraireListeFactures(
  donnees: unknown,
): Facture[] {
  let liste: unknown[];

  if (Array.isArray(donnees)) {
    liste = donnees;
  } else if (
    estObjet(donnees) &&
    Array.isArray(donnees.results)
  ) {
    const reponse: ListePaginee<unknown> = {
      results: donnees.results,
    };

    liste = reponse.results;
  } else {
    throw new Error(
      "La réponse de l'API ne contient pas une liste de factures valide.",
    );
  }

  if (!liste.every(estFacture)) {
    throw new Error(
      "La réponse de l'API contient une facture invalide.",
    );
  }

  return liste;
}


function estSituationFinanciere(
  valeur: unknown,
): valeur is SituationFinanciere {
  if (!estObjet(valeur)) {
    return false;
  }

  const montantValide = (
    champ: unknown,
  ): boolean =>
    typeof champ === "string" ||
    typeof champ === "number";

  return (
    typeof valeur.facture_id === "string" &&
    typeof valeur.reference === "string" &&
    typeof valeur.devise === "string" &&
    montantValide(valeur.montant_location) &&
    montantValide(valeur.montant_caution) &&
    montantValide(valeur.montant_paye) &&
    montantValide(valeur.montant_restant) &&
    (valeur.statut_reglement === "NON_PAYEE" ||
      valeur.statut_reglement === "PARTIELLEMENT_PAYEE" ||
      valeur.statut_reglement === "PAYEE")
  );
}

// ============================================================
// SERVICE FACTURATION
// ============================================================

const BASE_URL = "/facturation/";

const facturationService = {
  async lister(): Promise<Facture[]> {
    try {
      const response = await api.get<unknown>(BASE_URL);
      return extraireListeFactures(response.data);
    } catch (erreur: unknown) {
      throw extraireErreur(
        erreur,
        "Impossible de charger les factures.",
      );
    }
  },

  async obtenir(id: string): Promise<Facture> {
    try {
      const response = await api.get<unknown>(
        `${BASE_URL}${id}/`,
      );

      if (!estFacture(response.data)) {
        throw new Error(
          "L'API a renvoyé une facture invalide.",
        );
      }

      return response.data;
    } catch (erreur: unknown) {
      throw extraireErreur(
        erreur,
        "Impossible de charger cette facture.",
      );
    }
  },

  async generer(
    demande: DemandeCreationFacture,
  ): Promise<Facture> {
    try {
      const response = await api.post<unknown>(
        BASE_URL,
        demande,
      );

      if (!estFacture(response.data)) {
        throw new Error(
          "L'API a renvoyé une facture invalide.",
        );
      }

      return response.data;
    } catch (erreur: unknown) {
      throw extraireErreur(
        erreur,
        "Impossible de générer la facture.",
      );
    }
  },

  async situationFinanciere(
    id: string,
  ): Promise<SituationFinanciere> {
    try {
      const response = await api.get<unknown>(
        `${BASE_URL}${id}/situation-financiere/`,
      );

      if (!estSituationFinanciere(response.data)) {
        throw new Error(
          "L'API a renvoyé une situation financière invalide.",
        );
      }

      return response.data;
    } catch (erreur: unknown) {
      throw extraireErreur(
        erreur,
        "Impossible de charger la situation financière.",
      );
    }
  },
};

export default facturationService;
