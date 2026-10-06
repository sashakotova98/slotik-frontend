import { useEffect, useState, type ReactNode } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { apiGetMe, type AuthMeResponse } from "../../api/auth";
import { ApiError } from "../../api/api";
import { useAuth } from "../../hooks/useAuth";


function getUserIdFromToken(token: string): number {

  //header.payload.signature - jwt token формат Base64URL atob() ожидает обычный Base64. {"userId":"25"}
  try {
    const payload = token.split(".")[1];
    if (!payload) throw new Error();

    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(
      Math.ceil(base64.length / 4) * 4,
      "=",
    );

    const decoded = JSON.parse(atob(padded));
    const userId = Number(decoded.userId);

    if (!Number.isSafeInteger(userId) || userId <= 0) {
      throw new Error();
    }

    return userId;
  } catch {
    throw new Error("Увійдіть у свій акаунт повторно.");
  }
}

type Props = {
  children?: ReactNode;
};

export default function MasterEntryRedirect({ children }: Props) {
  const { token, logout } = useAuth();
  const navigate = useNavigate();

  const [me, setMe] = useState<AuthMeResponse | null>(null);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    if (!token) return;

    let active = true;

    async function loadProfile(currentToken: string) {
      try {
        const userId = getUserIdFromToken(currentToken);
        const result = await apiGetMe(userId);

        if (typeof result.isOnboardingCompleted !== "boolean") {
          throw new Error("Некоректна відповідь сервера.");
        }

        if (active) {
          setMe(result);
        }
      } catch (err) {
        if (active) {
          // Відсутній користувач або недійсна авторизація — повторний вхід.
          if (err instanceof ApiError && (err.status === 404 || err.status === 401)) {
            logout();
            navigate("/login", { replace: true });
            return;
          }

          setError(
            err instanceof Error
              ? err.message
              : "Не вдалося перевірити профіль.",
          );
        }
      }
    }

    void loadProfile(token);

    return () => {
      active = false;
    };
  }, [token, retry, logout, navigate]);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (error) {
    return (
      <main className="min-h-screen bg-bg p-6 flex flex-col items-center justify-center gap-4">
        <p role="alert" className="text-danger text-center">
          {error}
        </p>

        <button
          type="button"
          onClick={() => {
            setError("");
            setMe(null);
            setRetry((value) => value + 1);
          }}
          className="rounded-field bg-accent px-6 py-3 text-on-accent"
        >
          Спробувати ще раз
        </button>
      </main>
    );
  }

  if (!me) {
    return (
      <main className="min-h-screen bg-bg flex items-center justify-center p-6">
        <p role="status">Перевіряємо профіль…</p>
      </main>
    );
  }

  if (!me.isOnboardingCompleted) {
    return <Navigate to="/cabinet/setup" replace />;
  }

  // Перевірка пройдена — показуємо захищену сторінку.
  if (children !== undefined) {
    return <>{children}</>;
  }

  // На головній сторінці переходимо до кабінету.
  return <Navigate to="/cabinet" replace />;
}
