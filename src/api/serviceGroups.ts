import { api } from "./api";

export type ServiceGroup = { id: number; name: string; categoryId: number };

export function getServiceGroups(categoryId: number): Promise<ServiceGroup[]> {
  return api<ServiceGroup[]>(`/ServiceGroup?categoryId=${categoryId}`);
}

export function createServiceGroup(categoryId: number, name: string): Promise<ServiceGroup> {
  return api<ServiceGroup>("/ServiceGroup", {
    method: "POST",
    body: JSON.stringify({
      categoryId,
      name: name.trim(),
    }),
  });
}
