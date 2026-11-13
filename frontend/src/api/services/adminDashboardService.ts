import api from "../axios";

export type DashboardPeriod = "today" | "week" | "month" | "year";

export interface DashboardKpis {
  total_vehicles: number;
  active_rentals: number;
  reservations: number;
  revenue_htg: string;
  occupancy_rate: number;
  active_clients: number;
}

export interface DashboardFleet {
  total: number;
  available: number;
  in_rental: number;
  reserved: number;
  maintenance: number;
  out_of_service: number;
}

export interface DashboardChartItem {
  label: string;
  date: string;
  revenue_htg: string;
  reservations: number;
}

export interface DashboardPerformance {
  revenue_htg: string;
  reservations_count: number;
  chart: DashboardChartItem[];
}

export interface UpcomingRental {
  id: string;
  numero: string;
  client: string;
  vehicles: string[];
  date_debut: string;
  date_fin: string;
  statut: string;
}

export interface AdminDashboardData {
  period: DashboardPeriod;
  kpis: DashboardKpis;
  fleet: DashboardFleet;
  performance: DashboardPerformance;
  upcoming_rentals: UpcomingRental[];
}

const adminDashboardService = {
  async getDashboard(
    period: DashboardPeriod,
  ): Promise<AdminDashboardData> {
    const response = await api.get<AdminDashboardData>(
      "/admin/dashboard/",
      { params: { period } },
    );

    return response.data;
  },
};

export default adminDashboardService;