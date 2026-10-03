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

export async function apiCreateCheckout(plan: PaidPlanId): Promise<CheckoutResponse> {
  return api<CheckoutResponse>("/Payment/checkout", {
    method: "POST",
    body: JSON.stringify({ plan: planCodes[plan] }),
  });
}

export function openLiqPay(checkout: CheckoutResponse) {
  if (
    checkout.checkoutUrl !== "https://www.liqpay.ua/api/3/checkout" ||
    !checkout.data ||
    !checkout.signature ||
    !checkout.orderId
  ) {
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