import { api } from "./api";

export type Master = {
  id: number;
  firstName: string;
  lastName: string;
  category: string;
  city: string;
  status: "active" | "blocked";
  subscriptionUntil: string | null;
  tariff: "free" | "basic" | "pro";
  isBlocked: boolean;
  avatarUrl: string | null;
  districtName: string;
  createdAt: string;
};

export function getMasters(): Promise<Master[]> {
  return api<Master[]>("/Master");
}

export type Payment = {
  id: number;
  paidAt: string;
  amount: number;
  status: 0 | 1 | 2;
};

export type MasterDetails = Master & {
  slug: string;
  email: string;
  phone: string;
  tariffPrice: number | null;
  currency: string;
  billingPeriod: string | null;
  nextPaymentAt: string | null;
  bookingsCount: number | null;
  payments: Payment[] | null;
};

export function getMasterDetails(id: number): Promise<MasterDetails> {
  return api<MasterDetails>(`/Admin/Master/${id}`);
}

type BlockMasterResponse = {
  message: string;
  isBlocked: boolean;
};

export function toggleMasterBlock(id: number): Promise<BlockMasterResponse> {
  return api<BlockMasterResponse>(`/Master/${id}/block`, {
    method: "PATCH",
  });
}

export function isSubscriptionExpiring(master: Master, now: number): boolean {
  if (master.isBlocked || master.tariff === "free" || !master.subscriptionUntil)
    return false;
  const expiresAt = new Date(master.subscriptionUntil).getTime();
  return expiresAt > now && expiresAt <= now + 27 * 60 * 60 * 1000;
}

export type SubscriptionPlan = 0 | 1 | 2;

export type SubscriptionUpdate = {
  plan?: SubscriptionPlan;
  days?: number;
};

export async function updateMasterSubscription(
  masterId: number,
  data: SubscriptionUpdate,
): Promise<void> {
  const params = new URLSearchParams();

  if (data.plan !== undefined) {
    params.set("plan", String(data.plan));
  }

  if (data.days !== undefined) {
    params.set("days", String(data.days));
  }

  await api<unknown>(`/Master/${masterId}/subscription?${params.toString()}`, {
    method: "PATCH",
  });
}
