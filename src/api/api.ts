const BASE_URL = import.meta.env.VITE_API_URL ?? "https://localhost:7041/api";
// env-переменная (на Vercel)

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function api<T>(path: string, options: RequestInit = {}, responseType: "json" | "text" = "json"): Promise<T> {
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

    // Зберігаємо HTTP-код для обробки на сторінці.
    throw new ApiError(message, res.status);
  }
  if (res.status === 204) {
    return undefined as T;
  }

  // Деякі запити повертають звичайний текст замість JSON.
  if (responseType === "text") return await res.text() as T;
  return res.json();
}
