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

export type CreateServiceData = {
  masterId: number;
  name: string;
  price: number;
  durationMin: number;
};

export async function createService(data: CreateServiceData, files: File[]): Promise<Service> {
  const formData = new FormData();

  formData.append("MasterId", String(data.masterId));
  formData.append("Name", data.name);
  formData.append("Price", String(data.price));
  formData.append("DurationMin", String(data.durationMin));

  for (const file of files) {
    formData.append("files", file);
  }

  return api<Service>("/Service", {
    method: "POST",
    body: formData,
  });
}
