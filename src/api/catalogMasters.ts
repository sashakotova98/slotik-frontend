import { api } from "./api";

export type CatalogMaster = {
  id: number;
  firstName: string;
  lastName: string;
  category: string;
  city: string;
  districtName: string | null;
  avatarUrl: string | null;
  isBlocked: boolean;
  slug: string;
  rating: number | null;
  clientsCount: number;
};

export function getCatalogMasters(categoryId?: number, signal?: AbortSignal): Promise<CatalogMaster[]> {
  const params = new URLSearchParams();
  params.set("status", "active");

  if (categoryId !== undefined) {
    params.set("categoryId", String(categoryId));
  }

  const query = params.toString();

  return api<CatalogMaster[]>(query ? `/Master?${query}` : "/Master", { signal });
}
