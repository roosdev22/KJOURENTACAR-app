import api from "../axios";
import type {
  Maintenance,
  MaintenanceFormData,
  MaintenanceListResponse,
} from "../../types/maintenance";

type MaintenanceCollection =
  | Maintenance[]
  | MaintenanceListResponse;

function extractResults(data: MaintenanceCollection): Maintenance[] {
  return Array.isArray(data) ? data : data.results;
}

export const maintenanceService = {
  async getAll(): Promise<Maintenance[]> {
    const response = await api.get<MaintenanceCollection>(
      "/maintenance/"
    );

    return extractResults(response.data);
  },

  async getById(id: string): Promise<Maintenance> {
    const response = await api.get<Maintenance>(
      `/maintenance/${id}/`
    );

    return response.data;
  },

  async create(data: MaintenanceFormData): Promise<Maintenance> {
    const response = await api.post<Maintenance>(
      "/maintenance/",
      data
    );

    return response.data;
  },

  async update(
    id: string,
    data: Partial<MaintenanceFormData>
  ): Promise<Maintenance> {
    const response = await api.patch<Maintenance>(
      `/maintenance/${id}/`,
      data
    );

    return response.data;
  },

  async demarrer(id: string): Promise<Maintenance> {
    const response = await api.post<Maintenance>(
      `/maintenance/${id}/demarrer/`
    );

    return response.data;
  },

  async terminer(id: string): Promise<Maintenance> {
    const response = await api.post<Maintenance>(
      `/maintenance/${id}/terminer/`
    );

    return response.data;
  },
};

export default maintenanceService;