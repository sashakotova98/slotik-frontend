import { api } from "./api";

export type HomeCategory = {
  id: number;
  name: string;
  icon: string;
};

export function getHomeCategories(): Promise<HomeCategory[]> {
  return api<HomeCategory[]>("/Category");
}