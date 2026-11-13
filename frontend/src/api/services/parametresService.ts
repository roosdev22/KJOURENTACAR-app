
import api from "../axios";
import type {
  HistoriqueParametre,
  PaginatedResponse,
  ParametresEntreprise,
  ModifierParametresEntreprise,
} from "../../types/parametres";

const parametresService = {
  async getParametres(): Promise<ParametresEntreprise> {
    const response = await api.get<ParametresEntreprise>(
      "/parametres/"
    );
    return response.data;
  },

  async modifierParametres(
    donnees: Partial<ModifierParametresEntreprise>
  ): Promise<ParametresEntreprise> {
    const response = await api.patch<ParametresEntreprise>(
      "/parametres/",
      donnees
    );
    return response.data;
  },

  async getHistorique(): Promise<
    HistoriqueParametre[] | PaginatedResponse<HistoriqueParametre>
  > {
    const response = await api.get<
      HistoriqueParametre[] | PaginatedResponse<HistoriqueParametre>
    >("/parametres/historique/");

    return response.data;
  },
};

export default parametresService;
