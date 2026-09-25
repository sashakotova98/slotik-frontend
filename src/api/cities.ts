import { api } from "./api";

export type District = {
  id: number;
  name: string;
};

export type City = {
  id: number;
  name: string;
  districts: District[];
};

export function getCities(): Promise<City[]> {
  return api<City[]>("/City");
}