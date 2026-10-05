import { api } from "./api";

export type PaidPlanId = "basic" | "pro";

export type CheckoutResponse = {
  checkoutUrl: string;
  data: string;
  signature: string;
  orderId: string;
};

const planCodes: Record<PaidPlanId, number> = {
  basic: 1,
  pro: 2,
};

// Відповідь POST /api/Payment/checkout.
export type CreateCheckoutResponse = {
  paymentId: number;
  checkout: CheckoutResponse;
};

// 0 — очікування, 1 — успішна оплата, 2 — помилка.
export type PaymentStatus = 0 | 1 | 2;

export type PaymentResult = {
  id: number;
  status: PaymentStatus;
  amount: number;
  currency: string;
  paidAt: string | null;
};

// Створює платіж і повертає дані для переходу до LiqPay.
export async function apiCreateCheckout(plan: PaidPlanId): Promise<CreateCheckoutResponse> {
  return api<CreateCheckoutResponse>("/Payment/checkout", {
    method: "POST",
    body: JSON.stringify({ plan: planCodes[plan] }),
  });
}

// Отримує поточний стан платежу після повернення з LiqPay.
export async function getPayment(paymentId: number): Promise<PaymentResult> {
  return api<PaymentResult>(`/Payment/${paymentId}`);
}

export function openLiqPay(checkout: CheckoutResponse) {
  if (checkout.checkoutUrl !== "https://www.liqpay.ua/api/3/checkout" || !checkout.data || !checkout.signature || !checkout.orderId) {
    throw new Error("Не вдалося отримати дані для оплати.");
  }

  const form = document.createElement("form");
  form.method = "POST";
  form.action = checkout.checkoutUrl;
  form.hidden = true;

  for (const [name, value] of Object.entries({
    data: checkout.data,
    signature: checkout.signature,
  })) {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = value;
    form.appendChild(input);
  }

  document.body.appendChild(form);
  form.submit();
  form.remove();
}
