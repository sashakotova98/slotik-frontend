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

export function getCatalogMasters(categoryId?: number, cityId?: number, search: string = "",  districtId?: number): Promise<CatalogMaster[]> {
  const params = new URLSearchParams();

  params.set("status", "active");

  if (categoryId !== undefined) {
    params.set("categoryId", String(categoryId));
  }

   if (cityId !== undefined) {
    params.set("cityId", String(cityId));
  }


  if (districtId !== undefined) {
    params.set("districtId", String(districtId));
  }

   const query = search.trim();

    if (query) {
    params.set("search", query);
  }

   return api<CatalogMaster[]>(`/Master?${params.toString()}`);
}