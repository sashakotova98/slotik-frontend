import { api,apiText } from "./api";

export type AuthResponse = { token: string; role: "Client" | "Master" | "Superadmin" };

export async function apiLogin(email: string, password: string): Promise<AuthResponse> {
  return api<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export type RegisterData = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  role: "Client" | "Master";
};

export async function apiRegister(
  data: RegisterData
): Promise<string> {
  return apiText("/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function apiConfirmEmail(token: string): Promise<string> {
  const params = new URLSearchParams({
    token,
  });

  return apiText(`/auth/confirm?${params.toString()}`, {
    method: "GET",
  });
}

// superadmin@slotik.local / SuperAdmin123!
