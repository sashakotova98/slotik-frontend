import { api } from "./api";

export type AuthResponse = { token: string; role: "Client" | "Master" | "Superadmin" };

export async function apiLogin(email: string, password: string): Promise<AuthResponse> {
  return api<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

// superadmin@slotik.local / SuperAdmin123!

// 409  "User with the same Email already exists"
// 409  "User with the same Phone already exists"
// 400  ошибки валидации DTO (если бек строже фронта)
//{serverError && <p className="text-sm text-danger mb-2 text-center">{serverError}</p>}