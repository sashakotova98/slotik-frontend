import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  CheckCircle2,
  CircleX,
  LoaderCircle,
} from "lucide-react";

import { apiConfirmEmail } from "../api/auth";

type ConfirmStatus = "loading" | "success" | "error";

export default function ConfirmEmailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get("token");

  const [status, setStatus] =
    useState<ConfirmStatus>("loading");

  const [message, setMessage] = useState(
    "Підтверджуємо вашу електронну пошту..."
  );

 
  const processedToken = useRef<string | null>(null);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Токен підтвердження відсутній.");
      return;
    }

    if (processedToken.current === token) {
      return;
    }

    processedToken.current = token;

    const confirmEmail = async () => {
      try {
        await apiConfirmEmail(token);

        setStatus("success");
        setMessage("Email успішно підтверджено!");
      } catch (error) {
        setStatus("error");

        setMessage(
          error instanceof Error
            ? error.message
            : "Не вдалося підтвердити Email."
        );
      }
    };

    confirmEmail();
  }, [token]);

  return (
    <div className="min-h-screen bg-[#d4d4d4] flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-surface rounded-card p-6 shadow-xl">

        <h1 className="text-xl font-semibold text-center mb-6">
          Підтвердження Email
        </h1>

        {status === "loading" && (
          <div className="flex flex-col items-center py-6">
            <LoaderCircle
              size={42}
              className="animate-spin mb-4"
            />

            <p className="text-sm text-muted text-center">
              {message}
            </p>
          </div>
        )}

        {status === "success" && (
          <>
            <div className="flex items-center gap-3 rounded-2xl bg-green-100 border border-green-200 px-4 py-4 mb-6">
              <CheckCircle2
                size={28}
                className="text-green-700 shrink-0"
              />

              <div>
                <p className="font-semibold text-green-900">
                  Готово!
                </p>

                <p className="text-sm text-green-800">
                  {message}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                navigate("/login", { replace: true })
              }
              className="w-full bg-accent text-on-accent rounded-field py-3 font-medium"
            >
              Увійти
            </button>
          </>
        )}

        {status === "error" && (
          <>
            <div className="flex items-start gap-3 rounded-2xl bg-red-50 border border-red-200 px-4 py-4 mb-6">
              <CircleX
                size={28}
                className="text-red-600 shrink-0"
              />

              <div>
                <p className="font-semibold text-red-800">
                  Помилка
                </p>

                <p className="text-sm text-red-700">
                  {message}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                navigate("/login", { replace: true })
              }
              className="w-full border border-border rounded-field py-3 font-medium"
            >
              До входу
            </button>
          </>
        )}

      </div>
    </div>
  );
}