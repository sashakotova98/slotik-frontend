import { api } from "./api";

export type ServicePhoto = {
  id: number; // ID записи фотографии
  serviceId: number; // ID услуги, к которой относится фото
  photoUrl: string;
  sortOrder: number;
};

export function getServicePhotosByMasterId(masterId: number): Promise<ServicePhoto[]> {
  return api<ServicePhoto[]>(`/ServicePhoto?masterId=${masterId}`);
}
export async function deleteServicePhoto(id: number): Promise<void> {
  await api<string>(`/ServicePhoto/${id}`, { method: "DELETE" }, "text");
}
