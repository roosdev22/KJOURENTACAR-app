/**
 * CRUD complet pour la ressource "voiture".
 * Utilisé par les pages : liste des voitures, détail, formulaire admin.
 */

import api from "../axios";

export interface Car {
  id: string;
  brand: string;
  model: string;
  year: number;
  color: string;
  price_per_day: number;
  is_available: boolean;
  image_url?: string;
  description?: string;
}

export type CreateCarPayload = Omit<Car, "id">;
export type UpdateCarPayload = Partial<CreateCarPayload>;

export const carService = {
  /** Liste toutes les voitures disponibles */
  async getAll(): Promise<Car[]> {
    const { data } = await api.get<Car[]>("/cars/");
    return data;
  },

  async getById(id: string): Promise<Car> {
    const { data } = await api.get<Car>(`/cars/${id}/`);
    return data;
  },

  async create(payload: CreateCarPayload): Promise<Car> {
    const { data } = await api.post<Car>("/cars/", payload);
    return data;
  },

  async update(id: string, payload: UpdateCarPayload): Promise<Car> {
    const { data } = await api.patch<Car>(`/cars/${id}/`, payload);
    return data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/cars/${id}/`);
  },
};