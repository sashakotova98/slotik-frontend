const BASE_URL = import.meta.env.VITE_API_URL ?? "https://localhost:7041/api";
// env-переменная (на Vercel)

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem("token");

  const headers = new Headers(options.headers);

  if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let message = "Не вдалося виконати запит.";

    try {
      const data = await res.json();

      if (typeof data.message === "string") {
        message = data.message;
      } else if (typeof data.error === "string") {
        message = data.error;
      }
    } catch {
       // Якщо відповідь не JSON, залишаємо загальне повідомлення.
    }

    if (res.status >= 500) {
      message = "Помилка сервера. Спробуйте пізніше.";
    }

    throw new Error(message);
  }

  return res.json();
}

