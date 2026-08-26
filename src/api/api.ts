const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5024/api";

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