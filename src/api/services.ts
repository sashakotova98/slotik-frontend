//GET /api/Service?masterId=900001 services.ts id, serviceId, photoUrl, sortOrder
import { api } from "./api";

export type Service = {
  id: number;
  masterId: number;
  name: string;
  price: number;
  durationMin: number;
  description: string | null;
  included: string | null;
};

export function getServicesByMasterId(masterId: number): Promise<Service[]> {
  return api<Service[]>(`/Service?masterId=${masterId}`);
}