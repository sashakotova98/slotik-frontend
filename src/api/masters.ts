import { api } from "./api";


export type Master = {
  id: number;
  firstName: string;
  lastName: string;
  category: string;
  city: string;
  status: "active" | "expired";
  subscriptionUntil: string | null;
  tariff: "free" | "basic" | "pro";
};

export function getMasters(): Promise<Master[]> {
  return api<Master[]>("/Master");
}