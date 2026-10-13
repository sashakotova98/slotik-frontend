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
  groupId: number | null;
  isPopular: boolean;
  sortOrder: number;
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

export type UpdateServiceData = CreateServiceData &
  Pick<Service, "groupId" | "isPopular" | "sortOrder">;

export function updateService(id: number, data: UpdateServiceData, files: File[]): Promise<Service> {
  const formData = new FormData();
  formData.append("MasterId", String(data.masterId));
  formData.append("Name", data.name);
  formData.append("Price", String(data.price));
  formData.append("DurationMin", String(data.durationMin));

  // Зберігаємо налаштування, яких немає у формі.
  if (data.groupId !== null) formData.append("GroupId", String(data.groupId));
  formData.append("IsPopular", String(data.isPopular));
  formData.append("SortOrder", String(data.sortOrder));

  // Нові фото додаються до збережених.
  for (const file of files) formData.append("files", file);

  return api<Service>(`/Service/${id}`, { method: "PUT", body: formData });
}
