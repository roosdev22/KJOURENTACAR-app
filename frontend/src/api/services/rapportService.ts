
import api from "../axios";

// ============================================================
// TYPES
// ============================================================

export type TypeRapport =
  | "FINANCIER"
  | "RESERVATIONS"
  | "VEHICULES"
  | "CONTRATS"
  | "MAINTENANCE";

export type FormatRapport = "PDF" | "EXCEL";

export type StatutRapport =
  | "EN_ATTENTE"
  | "EN_COURS"
  | "TERMINE"
  | "ECHEC";

export type FrequenceRapport =
  | "QUOTIDIENNE"
  | "HEBDOMADAIRE"
  | "MENSUELLE";

export interface PeriodeRapport {
  date_debut?: string;
  date_fin?: string;
}

export interface DemandeGenerationRapport {
  type_rapport: TypeRapport;
  format_rapport: FormatRapport;
  date_debut: string;
  date_fin: string;
}

export interface RapportGenere {
  id: string;
  type_rapport: TypeRapport;
  format_rapport: FormatRapport;
  date_debut: string;
  date_fin: string;
  statut: StatutRapport;
  fichier: string | null;
  auteur: number | string | null;
  planification: string | null;
  erreur: string;
  cree_le: string;
  termine_le: string | null;
}

export interface PlanificationRapport {
  id: string;
  type_rapport: TypeRapport;
  frequence: FrequenceRapport;
  jour: number | null;
  heure: string;
  format_pdf: boolean;
  format_excel: boolean;
  destinataires: string[];
  actif: boolean;
  prochaine_execution: string | null;
  derniere_execution: string | null;
  cree_par: number | string | null;
  cree_le: string;
  modifie_le: string;
}

export type DonneesPlanification = Pick<
  PlanificationRapport,
  | "type_rapport"
  | "frequence"
  | "jour"
  | "heure"
  | "format_pdf"
  | "format_excel"
  | "destinataires"
  | "actif"
>;

export interface DonneesRapport {
  [cle: string]: unknown;
}

export interface ErreurApi {
  detail?: string;
  [cle: string]: unknown;
}

// ============================================================
// CONFIGURATION
// ============================================================

const BASE_URL = "/rapports/";

const MESSAGES_ERREUR = {
  generation: "Impossible de générer le rapport.",
  historique: "Impossible de charger l'historique des rapports.",
  formatHistorique:
    "La réponse de l'API ne contient pas une liste de rapports valide.",
  telechargement: "Impossible de télécharger le rapport.",
  planifications: "Impossible de charger les planifications.",
  formatPlanifications:
    "La réponse de l'API ne contient pas une liste de planifications valide.",
  creationPlanification: "Impossible de créer la planification.",
  modificationPlanification: "Impossible de modifier la planification.",
  suppressionPlanification: "Impossible de supprimer la planification.",
};

// ============================================================
// GESTION DES ERREURS
// ============================================================

function extraireMessageErreur(
  erreur: unknown,
  messageParDefaut: string,
): string {
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
        return data.detail;
      }

      if (
        typeof data === "object" &&
        data !== null &&
        "message" in data &&
        typeof data.message === "string"
      ) {
        return data.message;
      }
    }
  }

  if (erreur instanceof Error && erreur.message) {
    return erreur.message;
  }

  return messageParDefaut;
}

function creerErreurService(
  erreur: unknown,
  messageParDefaut: string,
): Error {
  return new Error(
    extraireMessageErreur(erreur, messageParDefaut),
    { cause: erreur },
  );
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

/**
 * Accepte une liste directe ou le format paginé DRF { results: [] }.
 * Les données restent unknown jusqu'à leur validation.
 */
function extraireListe(
  donnees: unknown,
): unknown[] | null {
  if (Array.isArray(donnees)) {
    return donnees;
  }

  if (
    estObjet(donnees) &&
    Array.isArray(donnees.results)
  ) {
    return donnees.results;
  }

  return null;
}

function estTypeRapport(
  valeur: unknown,
): valeur is TypeRapport {
  return (
    valeur === "FINANCIER" ||
    valeur === "RESERVATIONS" ||
    valeur === "VEHICULES" ||
    valeur === "CONTRATS" ||
    valeur === "MAINTENANCE"
  );
}

function estFormatRapport(
  valeur: unknown,
): valeur is FormatRapport {
  return valeur === "PDF" || valeur === "EXCEL";
}

function estStatutRapport(
  valeur: unknown,
): valeur is StatutRapport {
  return (
    valeur === "EN_ATTENTE" ||
    valeur === "EN_COURS" ||
    valeur === "TERMINE" ||
    valeur === "ECHEC"
  );
}

function estRapportGenere(
  valeur: unknown,
): valeur is RapportGenere {
  if (!estObjet(valeur)) {
    return false;
  }

  return (
    typeof valeur.id === "string" &&
    estTypeRapport(valeur.type_rapport) &&
    estFormatRapport(valeur.format_rapport) &&
    typeof valeur.date_debut === "string" &&
    typeof valeur.date_fin === "string" &&
    estStatutRapport(valeur.statut) &&
    (typeof valeur.fichier === "string" ||
      valeur.fichier === null) &&
    (typeof valeur.auteur === "number" ||
      typeof valeur.auteur === "string" ||
      valeur.auteur === null) &&
    (typeof valeur.planification === "string" ||
      valeur.planification === null) &&
    typeof valeur.erreur === "string" &&
    typeof valeur.cree_le === "string" &&
    (typeof valeur.termine_le === "string" ||
      valeur.termine_le === null)
  );
}

function estFrequenceRapport(
  valeur: unknown,
): valeur is FrequenceRapport {
  return (
    valeur === "QUOTIDIENNE" ||
    valeur === "HEBDOMADAIRE" ||
    valeur === "MENSUELLE"
  );
}

function estPlanificationRapport(
  valeur: unknown,
): valeur is PlanificationRapport {
  if (!estObjet(valeur)) {
    return false;
  }

  return (
    typeof valeur.id === "string" &&
    estTypeRapport(valeur.type_rapport) &&
    estFrequenceRapport(valeur.frequence) &&
    (typeof valeur.jour === "number" ||
      valeur.jour === null) &&
    typeof valeur.heure === "string" &&
    typeof valeur.format_pdf === "boolean" &&
    typeof valeur.format_excel === "boolean" &&
    Array.isArray(valeur.destinataires) &&
    valeur.destinataires.every(
      (element: unknown) => typeof element === "string",
    ) &&
    typeof valeur.actif === "boolean" &&
    (typeof valeur.prochaine_execution === "string" ||
      valeur.prochaine_execution === null) &&
    (typeof valeur.derniere_execution === "string" ||
      valeur.derniere_execution === null) &&
    (typeof valeur.cree_par === "number" ||
      typeof valeur.cree_par === "string" ||
      valeur.cree_par === null) &&
    typeof valeur.cree_le === "string" &&
    typeof valeur.modifie_le === "string"
  );
}

// ============================================================
// SERVICE RAPPORTS
// ============================================================

const rapportService = {
  // ----------------------------------------------------------
  // RAPPORTS DE CONSULTATION
  // ----------------------------------------------------------

  async financier(
    periode: PeriodeRapport = {},
  ): Promise<DonneesRapport> {
    const response = await api.get<DonneesRapport>(
      `${BASE_URL}financier/`,
      { params: periode },
    );

    return response.data;
  },

  async reservations(
    periode: PeriodeRapport = {},
  ): Promise<DonneesRapport> {
    const response = await api.get<DonneesRapport>(
      `${BASE_URL}reservations/`,
      { params: periode },
    );

    return response.data;
  },

  async vehicules(
    periode: PeriodeRapport = {},
  ): Promise<DonneesRapport> {
    const response = await api.get<DonneesRapport>(
      `${BASE_URL}vehicules/`,
      { params: periode },
    );

    return response.data;
  },

  async contrats(
    periode: PeriodeRapport = {},
  ): Promise<DonneesRapport> {
    const response = await api.get<DonneesRapport>(
      `${BASE_URL}contrats/`,
      { params: periode },
    );

    return response.data;
  },

  async maintenance(
    periode: PeriodeRapport = {},
  ): Promise<DonneesRapport> {
    const response = await api.get<DonneesRapport>(
      `${BASE_URL}maintenance/`,
      { params: periode },
    );

    return response.data;
  },

  // ----------------------------------------------------------
  // GÉNÉRATION
  // ----------------------------------------------------------

  async generer(
    demande: DemandeGenerationRapport,
  ): Promise<RapportGenere> {
    try {
      const response = await api.post<unknown>(
        `${BASE_URL}generer/`,
        demande,
      );

      if (!estRapportGenere(response.data)) {
        throw new Error(
          "L'API a renvoyé un rapport généré invalide.",
        );
      }

      return response.data;
    } catch (erreur: unknown) {
      throw creerErreurService(
        erreur,
        MESSAGES_ERREUR.generation,
      );
    }
  },

  // ----------------------------------------------------------
  // HISTORIQUE DES RAPPORTS GÉNÉRÉS
  // ----------------------------------------------------------

  async listerGeneres(): Promise<RapportGenere[]> {
    let donnees: unknown;

    try {
      const response = await api.get<unknown>(
        `${BASE_URL}generes/`,
      );

      donnees = response.data;
    } catch (erreur: unknown) {
      throw creerErreurService(
        erreur,
        MESSAGES_ERREUR.historique,
      );
    }

    const liste = extraireListe(donnees);

    if (liste === null || !liste.every(estRapportGenere)) {
      throw new Error(MESSAGES_ERREUR.formatHistorique);
    }

    return liste;
  },

  // ----------------------------------------------------------
  // TÉLÉCHARGEMENT PRIVÉ PDF / EXCEL
  // ----------------------------------------------------------

  async telecharger(
    rapport: Pick<RapportGenere, "id" | "format_rapport">,
  ): Promise<void> {
    try {
      const response = await api.get<Blob>(
        `${BASE_URL}${rapport.id}/telecharger/`,
        { responseType: "blob" },
      );

      const typeMime =
        rapport.format_rapport === "PDF"
          ? "application/pdf"
          : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

      const blob = new Blob([response.data], {
        type: typeMime,
      });

      const url = window.URL.createObjectURL(blob);
      const lien = document.createElement("a");

      lien.href = url;
      lien.download =
        `rapport-${rapport.id}.${rapport.format_rapport === "PDF" ? "pdf" : "xlsx"}`;

      document.body.appendChild(lien);
      lien.click();
      lien.remove();

      window.setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 1000);
    } catch (erreur: unknown) {
      throw creerErreurService(
        erreur,
        MESSAGES_ERREUR.telechargement,
      );
    }
  },

  // ----------------------------------------------------------
  // PLANIFICATIONS AUTOMATIQUES
  // ----------------------------------------------------------

  async listerPlanifications(): Promise<PlanificationRapport[]> {
    let donnees: unknown;

    try {
      const response = await api.get<unknown>(
        `${BASE_URL}planifications/`,
      );

      donnees = response.data;
    } catch (erreur: unknown) {
      throw creerErreurService(
        erreur,
        MESSAGES_ERREUR.planifications,
      );
    }

    const liste = extraireListe(donnees);

    if (liste === null || !liste.every(estPlanificationRapport)) {
      throw new Error(
        MESSAGES_ERREUR.formatPlanifications,
      );
    }

    return liste;
  },

  async creerPlanification(
    donnees: DonneesPlanification,
  ): Promise<PlanificationRapport> {
    try {
      const response = await api.post<unknown>(
        `${BASE_URL}planifications/`,
        donnees,
      );

      if (!estPlanificationRapport(response.data)) {
        throw new Error(
          "L'API a renvoyé une planification invalide.",
        );
      }

      return response.data;
    } catch (erreur: unknown) {
      throw creerErreurService(
        erreur,
        MESSAGES_ERREUR.creationPlanification,
      );
    }
  },

  async modifierPlanification(
    id: string,
    donnees: Partial<DonneesPlanification>,
  ): Promise<PlanificationRapport> {
    try {
      const response = await api.patch<unknown>(
        `${BASE_URL}planifications/${id}/`,
        donnees,
      );

      if (!estPlanificationRapport(response.data)) {
        throw new Error(
          "L'API a renvoyé une planification invalide.",
        );
      }

      return response.data;
    } catch (erreur: unknown) {
      throw creerErreurService(
        erreur,
        MESSAGES_ERREUR.modificationPlanification,
      );
    }
  },

  async supprimerPlanification(id: string): Promise<void> {
    try {
      await api.delete(`${BASE_URL}planifications/${id}/`);
    } catch (erreur: unknown) {
      throw creerErreurService(
        erreur,
        MESSAGES_ERREUR.suppressionPlanification,
      );
    }
  },
};

export default rapportService;
