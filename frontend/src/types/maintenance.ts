// frontend/src/types/maintenance.ts

export type MaintenanceType =
  | "PREVENTIVE"
  | "REPAIR"
  | "INSPECTION"
  | "OIL_CHANGE"
  | "TIRE_CHANGE"
  | "OTHER";

export type MaintenanceStatus =
  | "PLANNED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

export interface Maintenance {
  id: string;
  vehicle: string;
  vehicle_display: string;
  maintenance_type: MaintenanceType;
  title: string;
  description: string;
  status: MaintenanceStatus;
  scheduled_date: string;
  started_at: string | null;
  completed_at: string | null;
  mileage: number;
  cost: string;
  provider: string;
  notes: string;
  created_by: string | null;
  created_by_display: string;
  created_at: string;
  updated_at: string;
}

export interface MaintenanceFormData {
  vehicle: string;
  maintenance_type: MaintenanceType;
  title: string;
  description: string;
  scheduled_date: string;
  mileage: number;
  cost: string;
  provider: string;
  notes: string;
}

export interface MaintenanceListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Maintenance[];
}

export const MAINTENANCE_TYPE_LABELS: Record<MaintenanceType, string> = {
  PREVENTIVE: "Préventive",
  REPAIR: "Réparation",
  INSPECTION: "Inspection",
  OIL_CHANGE: "Vidange",
  TIRE_CHANGE: "Changement de pneus",
  OTHER: "Autre",
};

export const MAINTENANCE_STATUS_LABELS: Record<MaintenanceStatus, string> = {
  PLANNED: "Planifiée",
  IN_PROGRESS: "En cours",
  COMPLETED: "Terminée",
  CANCELLED: "Annulée",
};