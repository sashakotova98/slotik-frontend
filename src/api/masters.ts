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
