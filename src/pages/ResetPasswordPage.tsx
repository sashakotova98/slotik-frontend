import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from "react";

import {
  KeyRound,
  LoaderCircle,
  TriangleAlert,
} from "lucide-react";

import {
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import Field from "../components/Field";

import {
  validatePassword,
  validateConfirmPassword,
} from "../utils/validation";

import {
  apiConfirmReset,
  apiResetPassword,
} from "../api/auth";

type PageState =
  | "checking"
  | "form"
  | "error";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token =
    searchParams.get("token");

  const [pageState, setPageState] =
    useState<PageState>("checking");

  const [finalToken, setFinalToken] =
    useState("");

  const [tokenError, setTokenError] =
    useState("");

  const [values, setValues] = useState({
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({
    password: "",
    confirmPassword: "",
  });

  const [loading, setLoading] =
    useState(false);

  const [serverError, setServerError] =
    useState("");

  const processedToken =
    useRef<string | null>(null);

  useEffect(() => {
    if (!token) {
      setTokenError(
        "У посиланні відсутній токен відновлення."
      );
      setPageState("error");
      return;
    }

    if (
      processedToken.current === token
    ) {
      return;
    }

    processedToken.current = token;

    const checkToken = async () => {
      try {
        const result =
          await apiConfirmReset(token);

        setFinalToken(result);
        setPageState("form");
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "";

        if (
          message
            .toLowerCase()
            .includes("expired")
        ) {
          setTokenError(
            "Термін дії посилання минув."
          );
        } else {
          setTokenError(
            "Посилання недійсне або вже не може бути використане."
          );
        }

        setPageState("error");
      }
    };

    checkToken();
  }, [token]);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } =
      e.target;

    const nextValues = {
      ...values,
      [name]: value,
    };

    setValues(nextValues);

    if (name === "password") {
      setErrors({
        password:
          validatePassword(value),

        confirmPassword:
          validateConfirmPassword(
            nextValues.confirmPassword,
            value
          ),
      });
    }

    if (name === "confirmPassword") {
      setErrors((prev) => ({
        ...prev,
        confirmPassword:
          validateConfirmPassword(
            value,
            nextValues.password
          ),
      }));
    }
  };

  const submit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    const passwordError =
      validatePassword(
        values.password
      );

    const confirmError =
      validateConfirmPassword(
        values.confirmPassword,
        values.password
      );

    setErrors({
      password: passwordError,
      confirmPassword: confirmError,
    });

    if (
      passwordError ||
      confirmError
    ) {
      return;
    }

    if (!finalToken) {
      setPageState("error");
      setTokenError(
        "Токен відновлення недійсний."
      );
      return;
    }

    setLoading(true);
    setServerError("");

    try {
      await apiResetPassword(
        finalToken,
        values.password
      );

      navigate("/login", {
        replace: true,
        state: {
          passwordChanged: true,
        },
      });
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "";

      if (
        message
          .toLowerCase()
          .includes("expired")
      ) {
        setPageState("error");
        setTokenError(
          "Термін дії посилання минув."
        );
      } else if (
        message
          .toLowerCase()
          .includes("token")
      ) {
        setPageState("error");
        setTokenError(
          "Посилання недійсне."
        );
      } else {
        setServerError(
          message ||
            "Не вдалося змінити пароль."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#d7d7d7] flex items-center justify-center p-4">

      <div className="w-full max-w-[360px] rounded-[24px] bg-white px-7 py-8 shadow-xl">

        {pageState === "checking" && (
          <div className="py-16 text-center">
            <LoaderCircle
              className="mx-auto animate-spin"
              size={36}
            />

            <p className="mt-4 text-sm text-neutral-500">
              Перевіряємо посилання...
            </p>
          </div>
        )}

        {pageState === "form" && (
          <>
            <div className="mx-auto flex size-[72px] items-center justify-center rounded-full bg-neutral-100">
              <KeyRound
                size={34}
                strokeWidth={1.6}
              />
            </div>

            <h1 className="mt-6 text-center text-[21px] font-semibold">
              Встановіть новий пароль
            </h1>

            <p className="mt-2 text-center text-sm leading-5 text-neutral-500">
              Введіть новий пароль і підтвердіть його для доступу.
            </p>

            <form
              onSubmit={submit}
              className="mt-6"
            >
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
                value={
                  values.confirmPassword
                }
                onChange={handleChange}
                error={
                  errors.confirmPassword
                }
              />

              {serverError && (
                <p className="mb-3 text-center text-sm text-danger">
                  {serverError}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mt-2 w-full rounded-field bg-black py-3 text-sm font-medium text-white disabled:opacity-50"
              >
                {loading
                  ? "Зачекайте..."
                  : "Зберегти"}
              </button>
            </form>
          </>
        )}

        {pageState === "error" && (
          <div className="text-center">
            <div className="mx-auto flex size-[72px] items-center justify-center rounded-full bg-neutral-100">
              <TriangleAlert
                size={34}
                strokeWidth={1.6}
              />
            </div>

            <h1 className="mt-6 text-[21px] font-semibold">
              Посилання недійсне
            </h1>

            <p className="mt-3 text-sm leading-6 text-neutral-500">
              {tokenError}
            </p>

            <button
              type="button"
              onClick={() =>
                navigate(
                  "/login?forgot=1",
                  { replace: true }
                )
              }
              className="mt-7 w-full rounded-field bg-black py-3 text-sm font-medium text-white"
            >
              Запросити відновлення заново
            </button>

            <button
              type="button"
              onClick={() =>
                navigate(
                  "/login",
                  { replace: true }
                )
              }
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