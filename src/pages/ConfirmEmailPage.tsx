import { useEffect, useRef, useState } from "react";
import {
  Check,
  TriangleAlert,
  LoaderCircle,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { apiConfirmEmail } from "../api/auth";

type ConfirmStatus =
  | "loading"
  | "success"
  | "error";

export default function ConfirmEmailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get("token");

  const [status, setStatus] =
    useState<ConfirmStatus>("loading");

  const [message, setMessage] = useState("");

  const processedToken = useRef<string | null>(null);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage(
        "Посилання не містить токена підтвердження."
      );
      return;
    }

    // React StrictMode може двічі викликати effect
    if (processedToken.current === token) {
      return;
    }

    processedToken.current = token;

    const confirm = async () => {
      try {
        await apiConfirmEmail(token);

        setStatus("success");
      } catch (error) {
        setStatus("error");

        setMessage(
          error instanceof Error
            ? error.message
            : "Не вдалося підтвердити email."
        );
      }
    };

    confirm();
  }, [token]);

  return (
    <div className="min-h-screen bg-[#f3f3f3] flex items-center justify-center p-4">
      <div
        className="
          w-full max-w-[330px]
          min-h-[520px]
          rounded-[24px]
          border border-neutral-200
          bg-white
          px-7 py-6
          shadow-sm
          flex flex-col
        "
      >
        {/* LOGO */}
        <div className="text-center">
          <div className="text-[18px] font-semibold tracking-[0.32em]">
            SLOTIK
          </div>

          <div className="mt-1 text-[7px] tracking-[0.24em] text-neutral-400">
            КРАСА МАЄ СВІЙ ЧАС
          </div>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center text-center">

          {/* LOADING */}
          {status === "loading" && (
            <>
              <div className="flex size-[72px] items-center justify-center rounded-full bg-neutral-100">
                <LoaderCircle
                  size={34}
                  strokeWidth={1.6}
                  className="animate-spin"
                />
              </div>

              <h1 className="mt-6 text-[21px] font-semibold">
                Підтвердження email
              </h1>

              <p className="mt-3 text-[14px] leading-6 text-neutral-600">
                Зачекайте, перевіряємо посилання...
              </p>
            </>
          )}

          {/* SUCCESS */}
          {status === "success" && (
            <>
              <div className="flex size-[72px] items-center justify-center rounded-full bg-[#dcf8df]">
                <Check
                  size={36}
                  strokeWidth={1.8}
                  className="text-black"
                />
              </div>

              <h1 className="mt-6 text-[22px] font-semibold">
                Email підтверджено
              </h1>

              <p className="mt-3 text-[14px] leading-6 text-neutral-600">
                Акаунт створено.
                <br />
                Увійдіть, щоб продовжити.
              </p>

              <button
                type="button"
                onClick={() =>
                  navigate("/login", { replace: true })
                }
                className="
                  mt-7 w-full
                  rounded-[12px]
                  bg-black
                  px-4 py-3
                  text-sm font-medium text-white
                  transition hover:bg-neutral-800
                "
              >
                Перейти до входу
              </button>
            </>
          )}

          {/* ERROR */}
          {status === "error" && (
            <>
              <div className="flex size-[72px] items-center justify-center rounded-full bg-neutral-100">
                <TriangleAlert
                  size={36}
                  strokeWidth={1.6}
                />
              </div>

              <h1 className="mt-6 text-[22px] font-semibold">
                Посилання недійсне
              </h1>

              <p className="mt-3 text-[14px] leading-6 text-neutral-600">
                Можливо, термін дії минув
                <br />
                або ви вже підтвердили email.
              </p>

              {message && (
                <p className="mt-3 text-[12px] text-neutral-400">
                  {message}
                </p>
              )}

              <button
                type="button"
                onClick={() =>
                  navigate("/login", { replace: true })
                }
                className="
                  mt-7 w-full
                  rounded-[12px]
                  bg-black
                  px-4 py-3
                  text-sm font-medium text-white
                  transition hover:bg-neutral-800
                "
              >
                Перейти до входу
              </button>

              <p className="mt-4 text-[11px] text-neutral-400">
                Якщо підтвердження не вдалося —
                зверніться до підтримки.
              </p>
            </>
          )}
        </div>

        <div className="text-center text-[7px] tracking-[0.24em] text-neutral-400">
          КРАСИВІ ЛЮДИ — БЛИЖЧЕ
        </div>
      </div>
    </div>
  );
}