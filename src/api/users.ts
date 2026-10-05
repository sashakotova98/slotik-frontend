import { api } from "./api";

// Поля користувача для відображення імені.
export type UserProfile = {
  id: number;
  firstName: string;
  lastName: string;
};

// GET /api/User/{id} — отримати користувача за ID.
export function getUserById(id: number): Promise<UserProfile> {
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new Error("Некоректний ID користувача.");
  }
  return api<UserProfile>("/User/" + id);
}

// Читаємо ID з токена. Авторизацію запиту перевіряє бекенд.
export async function getOwnProfile(token: string): Promise<UserProfile> {
  let userId: number;
  try {
    const payload = token.split(".")[1];
    if (!payload) throw new Error();
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = JSON.parse(atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "=")));
    userId = Number(decoded.userId);
    if (!Number.isSafeInteger(userId) || userId <= 0) throw new Error();
  } catch {
    throw new Error("Увійдіть у свій акаунт повторно.");
  }
  return getUserById(userId);
}
