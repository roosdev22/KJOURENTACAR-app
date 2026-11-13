import api from "../axios";

export interface AgentClient {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  role_display: string;
  phone: string | null;
  address: string | null;
  is_active: boolean;
  created_at: string;
}

const clientService = {
  async getAll(): Promise<AgentClient[]> {
    const response = await api.get<AgentClient[]>("/users/clients/");
    return response.data;
  },
};

export default clientService;