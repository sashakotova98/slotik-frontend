// форма смены тарифа
import { useState, type FormEvent } from "react";
import type { Master, SubscriptionPlan } from "../../api/masters";

type Props = {
  currentTariff: Master["tariff"];
  saving: boolean;
  error: string;
  onBack: () => void;
  onSubmit: (plan: SubscriptionPlan) => Promise<void>;
};

const planValues: Record<Master["tariff"], SubscriptionPlan> = {
  free: 0,
  basic: 1,
  pro: 2,
};

export function ChangeTariffForm({
  currentTariff,
  saving,
  error,
  onBack,
  onSubmit,
}: Props) {
  const [plan, setPlan] = useState<SubscriptionPlan>(planValues[currentTariff]);

  const unchanged = plan === planValues[currentTariff];

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (saving || unchanged) return;

    await onSubmit(plan);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 id="change-tariff-title" className="text-xl font-semibold">
        Змінити тариф
      </h2>

      <div>
        <label htmlFor="subscription-plan" className="text-sm">
          Новий тариф
        </label>

        <select
          id="subscription-plan"
          value={plan}
          disabled={saving}
          onChange={(event) => {
            const value = Number(event.target.value);

            if (value === 0 || value === 1 || value === 2) {
              setPlan(value);
            }
          }}
          className="mt-2 w-full rounded-xl border border-border bg-surface px-4 py-3"
        >
          <option value={0}>Безкоштовний</option>
          <option value={1}>Базовий</option>
          <option value={2}>Професійний</option>
        </select>
      </div>

      <p className="text-sm text-muted">
        {plan === 0
          ? "Платну підписку буде припинено. Безкоштовний тариф не має строку дії."
          : currentTariff === "free"
            ? "Тариф буде призначено на 30 днів."
            : "Дата завершення підписки залишиться без змін."}
      </p>

      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          disabled={saving}
          onClick={onBack}
          className="flex-1 rounded-xl border border-border px-4 py-3 disabled:opacity-50"
        >
          Назад
        </button>

        <button
          type="submit"
          disabled={saving || unchanged}
          className="flex-1 rounded-xl bg-black px-4 py-3 text-white disabled:opacity-50"
        >
          {saving ? "Збереження…" : "Зберегти"}
        </button>
      </div>
    </form>
  );
}
