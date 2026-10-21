import { useRef, useState } from "react";
import { Send } from "lucide-react";
import { ApiError } from "../api/api";
import { getTelegramBindUrl } from "../api/telegram";

function getErrorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) {
    return "Не вдалося отримати посилання. Перевірте з’єднання та спробуйте ще раз.";
  }

  switch (error.message) {
    case "You already linked to Telegram.":
      return "Telegram уже підключено до вашого акаунта.";

    case "Pending link already exists and not expired yet.":
      return (
        "Посилання для підключення вже створено. " +
        "Якщо ви відкрили бота, натисніть у ньому «Запустити». " +
        "Якщо посилання втрачено, нове можна отримати після завершення " +
        "його дії — через 5 хвилин від моменту створення."
      );

    case "User Not Found.":
      return "Акаунт не знайдено. Спробуйте увійти повторно.";
  }

  if (error.status === 401) {
    return "Увійдіть у свій акаунт повторно.";
  }

  if (error.status === 403) {
    return "У вас немає доступу до підключення Telegram.";
  }

  return "Не вдалося отримати посилання. Спробуйте пізніше.";
}

export default function TelegramBinding({
  description = "Підключіть Telegram до свого акаунта для отримання повідомлень.",
}: { description?: string }) {
  const requestInProgress = useRef(false);

  const [loading, setLoading] = useState(false);
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");

  async function handleConnect() {
    if (requestInProgress.current) return;

    requestInProgress.current = true;
    setLoading(true);
    setError("");

    try {
      const response = await getTelegramBindUrl();

      const link = new URL(response.url);

      if (
        link.protocol !== "https:" ||
        link.hostname !== "t.me" ||
        link.pathname !== "/SlotikNotificationBot" ||
        !link.searchParams.get("start")
      ) {
        throw new Error("Invalid Telegram binding URL");
      }

      setUrl(link.href);
    } catch (error) {
      setError(getErrorMessage(error));
    } finally {
      requestInProgress.current = false;
      setLoading(false);
    }
  }

  return (
    <div className="py-3">
      <div className="flex items-center gap-3">
        <Send
          size={19}
          aria-hidden="true"
          className="shrink-0 text-muted"
        />
        <p className="text-sm font-medium">Підключення Telegram</p>
      </div>

      <p className="mt-2 text-sm text-muted">
        {description}
      </p>

      {!url ? (
        <button
          type="button"
          onClick={() => void handleConnect()}
          disabled={loading}
          className="mt-3 min-h-11 w-full rounded-xl border border-border px-4 py-2 text-sm hover:bg-selected disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Отримуємо посилання…" : "Підключити Telegram"}
        </button>
      ) : (
        <>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 flex min-h-11 w-full items-center justify-center rounded-xl bg-accent px-4 py-2 text-sm text-on-accent"
          >
            Відкрити Telegram
          </a>

          <p className="mt-2 text-sm text-muted" role="status">
            У Telegram натисніть «Запустити / Start», щоб завершити
            підключення. Посилання діє 5 хвилин із моменту створення.
          </p>

          <button
            type="button"
            onClick={() => void handleConnect()}
            disabled={loading}
            className="mt-2 min-h-11 text-sm text-muted underline disabled:opacity-50"
          >
            {loading
              ? "Отримуємо посилання…"
              : "Отримати нове посилання після закінчення строку дії"}
          </button>
        </>
      )}

      {error && (
        <p className="mt-3 text-sm text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
