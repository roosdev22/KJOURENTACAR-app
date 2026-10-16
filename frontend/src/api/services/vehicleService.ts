// src/api/services/vehicleService.ts

import api from "../axios";

// ============================================================
// TYPES — alignés exactement sur les choix Django (models.py)
// ============================================================

export type VehicleStatus =
  | "AVAILABLE"
  | "MAINTENANCE"
  | "OUT_OF_SERVICE";

export type VehicleCondition =
  | "EXCELLENT"
  | "GOOD"
  | "FAIR"
  | "POOR";

// Aligné sur VehicleCategory dans models.py
export type VehicleCategory =
  | "ECONOMIQUE"
  | "COMPACTE"
  | "BERLINE"
  | "SUV"
  | "PICKUP"
  | "MINIVAN"
  | "VAN"
  | "LUXE"
  | "SPORT"
  | "AUTRE";

export type TransmissionType =
  | "MANUAL"
  | "AUTOMATIC";

export type FuelType =
  | "GASOLINE"
  | "DIESEL"
  | "HYBRID"
  | "ELECTRIC"
  | "LPG"
  | "OTHER";


// ============================================================
// IMAGE
// ============================================================

export interface VehicleImage {
  id: string;
  image: string;
  image_url: string | null;
  caption: string | null;
  is_primary: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}


// ============================================================
// EQUIPMENT
// ============================================================

export interface Equipment {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PublicEquipment {
  id: string;
  name: string;
}


// ============================================================
// VEHICLE EQUIPMENT
// ============================================================

export interface VehicleEquipment {
  id: string;
  vehicle: string;
  equipment: string;
  equipment_name: string;
  created_at: string;
}


// ============================================================
// VEHICLE
// ============================================================

export interface Vehicle {
  id: string;

  // Identification
  brand: string;
  model: string;
  year: number;
  registration_number: string;
  vin: string | null;
  color: string;

  // Caractéristiques
  category: VehicleCategory | string;
  category_display?: string;

  transmission: TransmissionType | string;
  transmission_display?: string;

  fuel_type: FuelType | string;
  fuel_type_display?: string;

  seats: number;
  doors: number;
  air_conditioning: boolean;

  // Tarification
  daily_rate: string;
  weekly_rate: string | null;
  monthly_rate: string | null;
  deposit: string | null;
  unlimited_mileage: boolean;

  // État
  status: VehicleStatus | string;
  status_display?: string;

  condition: VehicleCondition | string;
  condition_display?: string;

  mileage: number;

  last_maintenance_date: string | null;
  next_maintenance_date: string | null;

  // Contenu
  description: string | null;

  // Relations
  images: VehicleImage[];
  vehicle_equipments: VehicleEquipment[];

  // Audit
  created_by: string | null;
  created_by_email?: string | null;
  created_at: string;
  updated_at: string;

  // Helpers
  display_name: string;
  full_name: string;
}


// ============================================================
// DONNÉES DE CRÉATION / MODIFICATION
// ============================================================

export interface VehicleFormData {
  brand: string;
  model: string;
  year: number;

  registration_number: string;
  vin?: string | null;
  color: string;

  category: VehicleCategory;
  transmission: TransmissionType;
  fuel_type: FuelType;

  seats: number;
  doors: number;
  air_conditioning: boolean;

  daily_rate: string;
  weekly_rate?: string | null;
  monthly_rate?: string | null;
  deposit?: string | null;

  unlimited_mileage: boolean;

  status: VehicleStatus;
  condition: VehicleCondition;

  mileage: number;

  last_maintenance_date?: string | null;
  next_maintenance_date?: string | null;

  description?: string | null;

  equipment_ids?: string[];
}


// ============================================================
// CHANGEMENT DE STATUT
// ============================================================

export interface ChangeVehicleStatusData {
  status: VehicleStatus;
}


// ============================================================
// CHANGEMENT DE CONDITION
// ============================================================

export interface ChangeVehicleConditionData {
  condition: VehicleCondition;
}


// ============================================================
// AJOUT IMAGE
// ============================================================

export interface AddVehicleImageData {
  image: File;
  caption?: string;
  is_primary?: boolean;
  display_order?: number;
}


// ============================================================
// PAGINATION
// ============================================================

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}


// ============================================================
// VEHICLE SERVICE
// ============================================================

export const vehicleService = {

  // ==========================================================
  // LISTE DES VÉHICULES
  // ==========================================================

  async getVehicles(): Promise<Vehicle[]> {
    const response = await api.get<
      Vehicle[] | PaginatedResponse<Vehicle>
    >("/vehicles/");

    if (Array.isArray(response.data)) {
      return response.data;
    }

    return response.data.results;
  },


  // ==========================================================
  // DÉTAIL D'UN VÉHICULE
  // ==========================================================

  async getVehicle(id: string): Promise<Vehicle> {
    const response = await api.get<Vehicle>(
      `/vehicles/${id}/`
    );

    return response.data;
  },


  // ==========================================================
  // CRÉER UN VÉHICULE
  // ==========================================================

  async createVehicle(
    data: VehicleFormData
  ): Promise<Vehicle> {
    const response = await api.post<Vehicle>(
      "/vehicles/",
      data
    );

    return response.data;
  },


  // ==========================================================
  // MODIFIER UN VÉHICULE
  // ==========================================================

  async updateVehicle(
    id: string,
    data: Partial<VehicleFormData>
  ): Promise<Vehicle> {
    const response = await api.patch<Vehicle>(
      `/vehicles/${id}/`,
      data
    );

    return response.data;
  },


  // ==========================================================
  // SUPPRIMER UN VÉHICULE
  // ==========================================================

  async deleteVehicle(
    id: string
  ): Promise<void> {
    await api.delete(
      `/vehicles/${id}/`
    );
  },


  // ==========================================================
  // CHANGER LE STATUT
  // ==========================================================

  async changeStatus(
    id: string,
    data: ChangeVehicleStatusData
  ): Promise<Vehicle> {
    const response = await api.post<Vehicle>(
      `/vehicles/${id}/change-status/`,
      data
    );

    return response.data;
  },


  // ==========================================================
  // CHANGER LA CONDITION
  // ==========================================================

  async changeCondition(
    id: string,
    data: ChangeVehicleConditionData
  ): Promise<Vehicle> {
    const response = await api.post<Vehicle>(
      `/vehicles/${id}/change-condition/`,
      data
    );

    return response.data;
  },


  // ==========================================================
  // AJOUTER UNE IMAGE
  // ==========================================================

  async addImage(
    id: string,
    data: AddVehicleImageData
  ): Promise<VehicleImage> {

    const formData = new FormData();

    formData.append("image", data.image);

    if (data.caption) {
      formData.append("caption", data.caption);
    }

    if (data.is_primary !== undefined) {
      formData.append("is_primary", String(data.is_primary));
    }

    if (data.display_order !== undefined) {
      formData.append("display_order", String(data.display_order));
    }

    const response = await api.post<VehicleImage>(
      `/vehicles/${id}/add-image/`,
      formData
    );

    return response.data;
  },


  // ==========================================================
  // SUPPRIMER UNE IMAGE
  // ==========================================================

  async deleteImage(
    vehicleId: string,
    imageId: string
  ): Promise<void> {
    await api.delete(
      `/vehicles/${vehicleId}/images/${imageId}/`
    );
  },


  // ==========================================================
  // DÉFINIR IMAGE PRINCIPALE
  // ==========================================================

  async setPrimaryImage(
    vehicleId: string,
    imageId: string
  ): Promise<VehicleImage> {
    const response = await api.post<VehicleImage>(
      `/vehicles/${vehicleId}/images/${imageId}/set-primary/`
    );

    return response.data;
  },


  // ==========================================================
  // ÉQUIPEMENTS
  // ==========================================================

  async getEquipments(): Promise<Equipment[]> {
    const response = await api.get<
      Equipment[] | PaginatedResponse<Equipment>
    >("/vehicles/equipment/");

    if (Array.isArray(response.data)) {
      return response.data;
    }

    return response.data.results;
  },


  // ==========================================================
  // CRÉER UN ÉQUIPEMENT
  // ==========================================================

  async createEquipment(
    data: {
      name: string;
      description?: string;
      is_active?: boolean;
    }
  ): Promise<Equipment> {
    const response = await api.post<Equipment>(
      "/vehicles/equipment/",
      data
    );

    return response.data;
  },


  // ==========================================================
  // MODIFIER UN ÉQUIPEMENT
  // ==========================================================

  async updateEquipment(
    id: string,
    data: Partial<{
      name: string;
      description: string;
      is_active: boolean;
    }>
  ): Promise<Equipment> {
    const response = await api.patch<Equipment>(
      `/vehicles/equipment/${id}/`,
      data
    );

    return response.data;
  },


  // ==========================================================
  // SUPPRIMER UN ÉQUIPEMENT
  // ==========================================================

  async deleteEquipment(
    id: string
  ): Promise<void> {
    await api.delete(
      `/vehicles/equipment/${id}/`
    );
  },
};


// ============================================================
// EXPORT PAR DÉFAUT
// ============================================================

export default vehicleService;