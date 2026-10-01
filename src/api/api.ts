const BASE_URL = import.meta.env.VITE_API_URL ?? "https://localhost:7041/api";
// env-переменная (на Vercel)

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem("token");

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    try {
      const j = JSON.parse(text);
      throw new Error(j.error ?? JSON.stringify(j.errors ?? j));
    } catch {
      throw new Error(text || `HTTP ${res.status}`);
    }
  }

  return res.json();
}

export async function apiText(
  path: string,
  options: RequestInit = {}
): Promise<string> {
  const token = localStorage.getItem("token");

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const text = await res.text();

  if (!res.ok) {
    let message = text || `HTTP ${res.status}`;

    try {
      const json = JSON.parse(text);

      message =
        json.error ??
        json.message ??
        JSON.stringify(json.errors ?? json);
    } catch {
      
    }

    throw new Error(message);
  }

  return text;
}