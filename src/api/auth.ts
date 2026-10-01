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

export async function apiForgotPassword(
  email: string
): Promise<string> {
  return apiText("/auth/forgotPassword", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

type ConfirmResetResponse = {
  token: string;
};

export async function apiConfirmReset(
  token: string
): Promise<string> {
  const params = new URLSearchParams({
    token,
  });

  const result = await api<ConfirmResetResponse>(
    `/auth/confirmReset?${params.toString()}`,
    {
      method: "GET",
    }
  );

  return result.token;
}

export async function apiResetPassword(
  token: string,
  newPassword: string
): Promise<string> {
  return apiText("/auth/resetPassword", {
    method: "POST",
    body: JSON.stringify({
      token,
      newPassword,
    }),
  });
}

// superadmin@slotik.local / SuperAdmin123!
