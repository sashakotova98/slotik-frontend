import { useState } from "react";
import { Mail, X } from "lucide-react";

import Field from "./Field";
import { validateEmail } from "../utils/validation";
import { apiForgotPassword } from "../api/auth";

type Props = {
  onClose: () => void;
};

export default function ForgotPasswordModal({ onClose }: Props) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateEmail(email);

    setError(validationError);

    if (validationError) {
      return;
    }

    setLoading(true);
    setServerError("");

    try {
      await apiForgotPassword(email.trim());

      setSent(true);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Не вдалося відправити лист.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4">
      <div className="relative w-full max-w-90 rounded-3xl bg-white px-7 py-7 shadow-2xl">

        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 text-neutral-500"
          aria-label="Закрити"
        >
          <X size={20} />
        </button>

        {!sent ? (
          <>
            <div className="mx-auto mt-4 flex size-18 items-center justify-center rounded-full bg-neutral-100">
              <Mail size={34} strokeWidth={1.6} />
            </div>

            <h2 className="mt-6 text-center text-[21px] font-semibold">Відновлення пароля</h2>

            <p className="mt-2 text-center text-sm leading-5 text-neutral-500">Введіть електронну пошту — ми надішлемо лист, щоб скинути старий пароль.</p>

            <form onSubmit={submit} className="mt-6">
              <Field
                id="restore-email"
                name="email"
                label="Email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);

                  if (error) {
                    setError(validateEmail(e.target.value));
                  }
                }}
                onBlur={() => setError(validateEmail(email))}
                error={error}
              />

              {serverError && (
                <p className="mb-3 text-center text-sm text-danger">{serverError}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mt-2 w-full rounded-field bg-black py-3 text-sm font-medium text-white disabled:opacity-50"
              >
                {loading ? "Зачекайте..." : "Відправити"}
              </button>
            </form>
          </>
        ) : (
          <>
            <div className="mx-auto mt-4 flex size-18 items-center justify-center rounded-full bg-neutral-100">
              <Mail size={34} strokeWidth={1.6} />
            </div>

            <h2 className="mt-6 text-center text-[21px] font-semibold">Перевірте пошту</h2>

            <p className="mt-3 text-center text-sm leading-6 text-neutral-500">Ми надіслали посилання для відновлення пароля на</p>

            <p className="mt-2 break-all text-center text-sm font-medium">{email}</p>

            <p className="mt-3 text-center text-xs text-neutral-400">Перевірте також папку «Спам».</p>

            <button
              type="button"
              onClick={onClose}
              className="mt-7 w-full rounded-field border border-black py-3 text-sm font-medium"
            >
              Повернутися до входу
            </button>
          </>
        )}

      </div>
    </div>
  );
}