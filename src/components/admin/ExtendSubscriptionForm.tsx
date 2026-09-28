//  форма продления
import { useState, type FormEvent } from "react";

type Props = {
  saving: boolean;
  error: string;
  onBack: () => void;
  onSubmit: (days: number) => Promise<void>;
};

export function ExtendSubscriptionForm({ saving, error, onBack, onSubmit }: Props) {
  const [days, setDays] = useState("30");
  const [validationError, setValidationError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (saving) return;

    const numberOfDays = Number(days);

    if (!Number.isSafeInteger(numberOfDays) || numberOfDays <= 0) {
      setValidationError("Вкажіть цілу кількість днів, більшу за нуль.");
      return;
    }

    setValidationError("");
    await onSubmit(numberOfDays);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-xl font-semibold">
        Продовжити підписку
      </h2>

      <div>
        <label htmlFor="extend-days" className="text-sm">
          Додати днів
        </label>

        <input
          id="extend-days"
          type="number"
          min="1"
          step="1"
          required
          disabled={saving}
          value={days}
          onChange={(event) => {
            setDays(event.target.value);
            setValidationError("");
          }}
          className="mt-2 w-full rounded-xl border border-border px-4 py-3"
        />
      </div>

      {(validationError || error) && (
        <p role="alert" className="text-sm text-danger">
          {validationError || error}
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
          disabled={saving}
          className="flex-1 rounded-xl bg-black px-4 py-3 text-white disabled:opacity-50"
        >
          {saving ? "Збереження…" : "Продовжити"}
        </button>
      </div>
    </form>
  );
}