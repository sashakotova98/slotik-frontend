import { api } from "./api";

export type AuthResponse = { token: string; role: "Client" | "Master" | "Superadmin" };

export type MessageResponse = {
  message: string;  // "message": "Email confirmed! You can now log in."
};

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

export async function apiRegister(data: RegisterData): Promise<MessageResponse> {
  return api<MessageResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function apiConfirmEmail(token: string): Promise<MessageResponse> {
  const params = new URLSearchParams({ token });

  return api<MessageResponse>(`/auth/confirm?${params.toString()}`, {
    method: "GET",
  });
}

// superadmin@slotik.local / SuperAdmin123!
