import { api } from "./api";

export type Favorite = {
  id: number; // ID запису обраного, а не майстра.
  userId: number;
  masterId: number;
};


export function getFavorites(): Promise<Favorite[]> {
  return api<Favorite[]>("/Favorite");
}


export function getFavoriteById(id: number): Promise<Favorite> {
  return api<Favorite>(`/Favorite/${id}`);
}

export type CreateFavoriteData = {
  masterId: number;
};


export function createFavorite(data: CreateFavoriteData): Promise<Favorite> {
  return api<Favorite>("/Favorite", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function deleteFavorite(id: number): Promise<void> {
  await api<string>(`/Favorite/${id}`, { method: "DELETE" }, "text");
}