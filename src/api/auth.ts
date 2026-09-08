import { api } from "./api";

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

export async function apiRegister(data: RegisterData): Promise<AuthResponse> {
  return api<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// superadmin@slotik.local / SuperAdmin123!
//localStorage.setItem("token", "test"); localStorage.setItem("role", "Client"); location.reload();
//localStorage.setItem("token", "test"); localStorage.setItem("role", "Master"); location.reload();
//localStorage.clear(); location.reload();

//console.log(localStorage.getItem("token"), localStorage.getItem("role"));

// 409  "User with the same Email already exists"
// 409  "User with the same Phone already exists"
// 400  ошибки валидации DTO (если бек строже фронта)
//{serverError && <p className="text-sm text-danger mb-2 text-center">{serverError}</p>}