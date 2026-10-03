import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { KeyRound, LoaderCircle, TriangleAlert } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";

import Field from "../components/Field";
import { validatePassword, validateConfirmPassword } from "../utils/validation";
import { apiConfirmReset, apiResetPassword } from "../api/auth";

type PageState = "checking" | "form" | "error";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  // Нове посилання отримує власний стан форми та запиту.
  return <ResetPasswordContent key={token} token={token} />;
}

function ResetPasswordContent({ token }: { token: string | null }) {
  const navigate = useNavigate();
  const [pageState, setPageState] = useState<PageState>(token ? "checking" : "error");
  const [finalToken, setFinalToken] = useState("");
  const [tokenError, setTokenError] = useState(token ? "" : "У посиланні відсутній токен відновлення.");
  const [values, setValues] = useState({ password: "", confirmPassword: "" });
  const [errors, setErrors] = useState({ password: "", confirmPassword: "" });
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  const requestRef = useRef<ReturnType<typeof apiConfirmReset> | null>(null);
  const activeRef = useRef(false);
  const submittingRef = useRef(false);

  useEffect(() => {
    let active = true;
    activeRef.current = true;

    if (token) {
      // StrictMode повторно очікує той самий запит.
      requestRef.current ??= apiConfirmReset(token);
      const request = requestRef.current;

      const checkToken = async () => {
        try {
          const result = await request;

          if (!active) return;

          if (typeof result !== "string" || !result.trim()) {
            throw new Error("Missing reset token");
          }

          setFinalToken(result);
          setPageState("form");
        } catch {
          if (!active) return;

          setTokenError("Не вдалося перевірити посилання. Спробуйте пізніше або запросіть нове посилання для відновлення.");
          setPageState("error");
        }
      };

      void checkToken();
    }

    return () => {
      active = false;
      activeRef.current = false;
    };
  }, [token]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const nextValues = { ...values, [name]: value };

    setValues(nextValues);
    setServerError("");

    if (name === "password") {
      setErrors({
        password: validatePassword(value),
        confirmPassword: validateConfirmPassword(nextValues.confirmPassword, value),
      });
    }

    if (name === "confirmPassword") {
      setErrors((prev) => ({
        ...prev,
        confirmPassword: validateConfirmPassword(value, nextValues.password),
      }));
    }
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();

    if (submittingRef.current) return;

    const passwordError = validatePassword(values.password);
    const confirmError = validateConfirmPassword(values.confirmPassword, values.password);

    setErrors({ password: passwordError, confirmPassword: confirmError });

    if (passwordError || confirmError) return;

    if (pageState !== "form" || !finalToken) {
      setTokenError("Не вдалося підтвердити можливість зміни пароля. Запросіть нове посилання.");
      setPageState("error");
      return;
    }

    submittingRef.current = true;
    setLoading(true);
    setServerError("");

    try {
      await apiResetPassword(finalToken, values.password);

      if (!activeRef.current) return;

      navigate("/login", { replace: true, state: { passwordChanged: true } });
    } catch {
      if (!activeRef.current) return;

      setServerError("Не вдалося змінити пароль. Спробуйте пізніше або запросіть нове посилання для відновлення.");
    } finally {
      submittingRef.current = false;

      if (activeRef.current) setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#d7d7d7] flex items-center justify-center p-4">

      <div className="w-full max-w-90 rounded-3xl bg-white px-7 py-8 shadow-xl">

        {pageState === "checking" && (
          <div className="py-16 text-center">
            <LoaderCircle className="mx-auto animate-spin" size={36} />

            <p className="mt-4 text-sm text-neutral-500">Перевіряємо посилання...</p>
          </div>
        )}

        {pageState === "form" && (
          <>
            <div className="mx-auto flex size-18 items-center justify-center rounded-full bg-neutral-100">
              <KeyRound size={34} strokeWidth={1.6} />
            </div>

            <h1 className="mt-6 text-center text-[21px] font-semibold">Встановіть новий пароль</h1>

            <p className="mt-2 text-center text-sm leading-5 text-neutral-500">Введіть новий пароль і підтвердіть його для доступу.</p>

            <form onSubmit={submit} className="mt-6">
              <Field
                id="new-password"
                name="password"
                label="Новий пароль"
                type="password"
                value={values.password}
                onChange={handleChange}
                error={errors.password}
              />

              <Field
                id="confirm-new-password"
                name="confirmPassword"
                label="Підтвердіть пароль"
                type="password"
                value={values.confirmPassword}
                onChange={handleChange}
                error={errors.confirmPassword}
              />

              {serverError && (
                <p className="mb-3 text-center text-sm text-danger">{serverError}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mt-2 w-full rounded-field bg-black py-3 text-sm font-medium text-white disabled:opacity-50"
              >
                {loading ? "Зачекайте..." : "Зберегти"}
              </button>
            </form>
          </>
        )}

        {pageState === "error" && (
          <div className="text-center">
            <div className="mx-auto flex size-18 items-center justify-center rounded-full bg-neutral-100">
              <TriangleAlert size={34} strokeWidth={1.6} />
            </div>

            <h1 className="mt-6 text-[21px] font-semibold">Не вдалося відновити пароль</h1>

            <p className="mt-3 text-sm leading-6 text-neutral-500">{tokenError}</p>

            <button
              type="button"
              onClick={() => navigate("/login?forgot=1", { replace: true })}
              className="mt-7 w-full rounded-field bg-black py-3 text-sm font-medium text-white"
            >
              Запросити відновлення заново
            </button>

            <button
              type="button"
              onClick={() => navigate("/login", { replace: true })}
              className="mt-3 w-full py-2 text-sm underline"
            >
              Повернутися до входу
            </button>
          </div>
        )}

      </div>
    </div>
  );
}