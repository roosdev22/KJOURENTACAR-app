
export type DeviseEntreprise = "HTG" | "USD";

export interface ParametresEntreprise {
  id: number;
  raison_sociale: string;
  nom_commercial: string;
  nif: string;
  patente: string;
  adresse: string;
  telephone: string;
  email: string;
  site_web: string;
  devise_defaut: DeviseEntreprise;
  prefixe_reservation: string;
  prefixe_facture: string;
  prefixe_contrat: string;
  modifie_par: number | null;
  cree_le: string;
  modifie_le: string;
}

export type ActionHistoriqueParametre =
  | "CREATION"
  | "MODIFICATION"
  | "ACTIVATION"
  | "DESACTIVATION";

export interface HistoriqueParametre {
  id: number;
  utilisateur: number | null;
  utilisateur_nom: string | null;
  action: ActionHistoriqueParametre;
  modele: string;
  objet_id: string;
  description: string;
  justification: string;
  anciennes_valeurs: Record<string, unknown>;
  nouvelles_valeurs: Record<string, unknown>;
  date_action: string;
}

export interface ModifierParametresEntreprise {
  raison_sociale: string;
  nom_commercial: string;
  nif: string;
  patente: string;
  adresse: string;
  telephone: string;
  email: string;
  site_web: string;
  devise_defaut: DeviseEntreprise;
  prefixe_reservation: string;
  prefixe_facture: string;
  prefixe_contrat: string;
  justification: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
