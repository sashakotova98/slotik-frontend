import { api } from "./api";

// Відповідь GET /api/User/me.
type UserMeResponse = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  role: string;
  masterId: number | null;
};

// Поля, які потрібні з GET /api/Master/{masterId}.
type MasterProfileResponse = {
  id: number;
  slug: string;
};

// Зберігаємо звичний формат для компонентів.
export type UserProfile = {
  id: number;
  firstName: string;
  lastName: string;
  phone: string | null;
  avatarUrl: string | null;
  master: {
    id: number;
    slug: string;
  } | null;
};

// GET /api/User/me
// → имя, телефон, фото и masterId
// → GET /api/Master/{masterId}
// → данные страницы мастера, включая slug
// /Auth/Me — роль и завершён ли онбординг.

export async function getOwnProfile(token: string): Promise<UserProfile> {
  if (!token) {
    throw new Error("Увійдіть у свій акаунт повторно.");
  }

  // api() сам додає токен із localStorage.
  const user = await api<UserMeResponse>("/User/me");

  let master: UserProfile["master"] = null;

  if (user.masterId !== null) {
    const profile = await api<MasterProfileResponse>(`/Master/${user.masterId}`);

    master = {
      id: profile.id,
      slug: profile.slug,
    };
  }

  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    avatarUrl: user.avatarUrl,
    master,
  };
}

// GET /api/User/me
// → получить masterId
// → GET /api/Master/{masterId}
// → получить slug

// Читаємо ID з токена. Авторизацію запиту перевіряє бекенд.
// export async function getOwnProfile(token: string): Promise<UserProfile> {
//   let userId: number;
//   try {
//     const payload = token.split(".")[1];
//     if (!payload) throw new Error();
//     const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
//     const decoded = JSON.parse(atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "=")));
//     userId = Number(decoded.userId);
//     if (!Number.isSafeInteger(userId) || userId <= 0) throw new Error();
//   } catch {
//     throw new Error("Увійдіть у свій акаунт повторно.");
//   }
//   return getUserById(userId);
// }
