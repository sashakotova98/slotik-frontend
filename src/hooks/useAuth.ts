import { useState } from "react";

export function useAuth() {
  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem("token")
  );

  const login = (newToken: string, role: string) => {
    localStorage.setItem("token", newToken);
    localStorage.setItem("role", role);
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    setToken(null);
  };

  return { token, login, logout };
}