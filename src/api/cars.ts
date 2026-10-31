import { api } from "./client";

export type CareDevice = {
  id: number;
  care_id: number;
  parent_id: number | null;
  name: string;
  type: string;
  icon: string;
  connected: boolean;
  power_source: string; // "external" | "car"
  battery: number;
  signal: number;
  last_update: string;
  firmware: string;
  children: CareDevice[];
};

export type Care = {
  id: number;
  user_id: number;
  name: string;
  model: string;
  plate: string;
  latitude: number;
  longitude: number;
  devices: CareDevice[];
};

export async function getCars(): Promise<Care[]> {
  const res = await api.get<Care[]>("/cars");
  return res.data;
}

export async function getCare(id: number): Promise<Care> {
  const res = await api.get<Care>(`/cars/${id}`);
  return res.data;
}
