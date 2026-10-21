import { api } from "./api";

export type ServiceGroup = { id: number; name: string; categoryId: number };

export function getServiceGroups(categoryId: number): Promise<ServiceGroup[]> {
  return api<ServiceGroup[]>(`/ServiceGroup?categoryId=${categoryId}`);
}
