import { api } from "./api";
import type { PaymentResult } from "./payments";

export type Subscription = {
  id: number;
  masterId: number;
  plan: 0 | 1 | 2; // Free, Basic, Pro
  expiresAt: string;
  status: 0 | 1 | 2 | 3; // Active, Expired, Cancelled, Pending
  isTrial: boolean;

  payments: (PaymentResult & {
    createdAt: string;
    providerStatus: string | null;
  })[];

  // Дані для відображення тарифу.
  planName: string;
  price: number;
  currency: string;
  billingPeriod: string | null;
  nextPaymentAt: string | null;
  nextPaymentAmount: number | null;

  // Чи визначив бек цю підписку як поточну.
  isEffective: boolean;
};

// Усі підписки поточного майстра.
export function getOwnSubscriptions(): Promise<Subscription[]> {
  return api<Subscription[]>("/Subscription");
}

// Створює Free або повертає наявний коректний Free.
// Тіло запиту не потрібне, токен додає api().
export function activateFreePlan(): Promise<Subscription> {
  return api<Subscription>("/Subscription/free", {
    method: "POST",
  });
}


// plan: 2       // Pro
// isTrial: true // Пробный период

// GET /api/Subscription/pro-trial/availability
// POST /api/Subscription/pro-trial
// Доступність одноразового пробного Pro для поточного майстра.
export type ProTrialAvailability =
  | { canStartProTrial: true; trialDays: number } //trial доступний
  | {
      canStartProTrial: false;
      reason: string;
      proTrialUsedAt?: string;
    };

export type ProTrialResponse = {
  message: string;
  trialDays: number;
  isTrial: boolean;
  subscription: Subscription;
};


//перевіряє чи доступний одноразовий пробний Pro для поточного майстра.
export function getProTrialAvailability(): Promise<ProTrialAvailability> {
  return api<ProTrialAvailability>("/Subscription/pro-trial/availability");
}

// Активує одноразовий пробний Pro для поточного майстра.
export function activateProTrial(): Promise<ProTrialResponse> {
  return api<ProTrialResponse>("/Subscription/pro-trial", { method: "POST" });
}
