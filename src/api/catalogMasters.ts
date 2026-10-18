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
  createdAt: string | null;
  rating: number | null;
  clientsCount: number | null;
  portfolioPhotos: { id: number; photoUrl: string; sortOrder: number }[];
};

export async function getCatalogMasters(categoryId?: number, cityId?: number, search: string = "",  districtId?: number): Promise<CatalogMaster[]> {
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

   const masters = await api<(Partial<CatalogMaster> & {
     id: number;
     categoryName?: string;
     cityName?: string;
   })[]>(`/Master?${params.toString()}`);

   // Публічний DTO використовує categoryName/cityName; старі назви залишаємо для компонентів.
   return masters.map((master) => ({
     id: master.id,
     firstName: master.firstName ?? "",
     lastName: master.lastName ?? "",
     category: master.categoryName ?? master.category ?? "",
     city: master.cityName ?? master.city ?? "",
     districtName: master.districtName ?? null,
     avatarUrl: master.avatarUrl ?? null,
     isBlocked: master.isBlocked ?? false,
     slug: master.slug ?? "",
     createdAt: master.createdAt ?? null,
     rating: master.rating ?? null,
     clientsCount: master.clientsCount ?? null,
     portfolioPhotos: master.portfolioPhotos ?? [],
   }));
}