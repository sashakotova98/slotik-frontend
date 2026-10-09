import { api } from "./api";
import type { PaymentResult } from "./payments";

export type Subscription = {
  id: number;
  masterId: number;
  plan: 0 | 1 | 2;
  expiresAt: string;
  status: 0 | 1 | 2 | 3;
  isTrial: boolean;
  payments: (PaymentResult & { createdAt: string; providerStatus: string | null })[];
};

export function getOwnSubscriptions() {
  return api<Subscription[]>("/Subscription");
}

export function activateFreePlan() {
  return api<{ message: string }>("/Subscription/free", {
    method: "POST",
  });
}
