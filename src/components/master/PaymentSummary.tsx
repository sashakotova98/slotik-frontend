import { CreditCard } from "lucide-react";

export type PaidPlan = {
  id: "basic" | "pro";
  name: string;
  price: number;
};

type Props = {
  plan: PaidPlan;
  masterName?: string;
  periodLabel?: string;
  // Умови покупки або зміни тарифу, які потрібно показати до оплати.
  notice?: string;
  paying: boolean;
  error: string;
  onPay: () => void;
  onBack: () => void;
};

export default function PaymentSummary({ plan, masterName, periodLabel, notice, paying, error, onPay, onBack }: Props) {
  return (
    <>
      <h1 className="mb-5 text-lg font-semibold">Оплата підписки</h1>

      <dl className="rounded-xl border border-border p-4 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-copy-600">Тариф</dt>
          <dd className="text-right">{plan.name}</dd>
        </div>

        <div className="mt-2 flex justify-between gap-4">
          <dt className="text-copy-600">Період</dt>
          <dd className="text-right">{periodLabel ?? "Буде уточнено"}</dd>
        </div>

        <div className="mt-2 flex justify-between gap-4">
          <dt className="text-copy-600">Майстер</dt>
          <dd className="text-right">{masterName ?? "Дані профілю ще не підключені"}</dd>
        </div>

        <div className="mt-3 flex justify-between gap-4 border-t border-border pt-3 font-semibold">
          <dt>Орієнтовна вартість</dt>
          <dd>{plan.price} ₴ за {periodLabel ?? "обраний період"}</dd>
        </div>
      </dl>

      {/* Пояснюємо умови до переходу на платіжну сторінку LiqPay. */}
      {notice && (
        <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm leading-5 text-amber-900">
          {notice}
        </p>
      )}

      <button
        type="button"
        disabled={paying}
        onClick={onPay}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-lime-600 px-4 py-3 text-sm font-semibold text-white disabled:cursor-wait disabled:opacity-60"
      >
        <CreditCard size={20} aria-hidden="true" />
        {paying ? "Відкриваємо оплату..." : "Оплатити карткою"}
      </button>

      {error && (
        <p role="alert" className="mt-3 text-center text-sm text-danger">
          {error}
        </p>
      )}

      <p className="mt-2 text-center text-xs text-copy-500">
        Оплата на захищеній сторінці LiqPay.
      </p>

      <button type="button" disabled={paying} onClick={onBack} className="mt-5 w-full py-2 text-sm text-copy-500 hover:text-text">
        Назад
      </button>
    </>
  );
}
