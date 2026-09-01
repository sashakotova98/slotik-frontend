import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";

export default function ClientHomePage() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-bg p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text">Кабінет клієнта</h1>
        <button onClick={handleLogout}
          className="text-sm text-muted border border-border rounded-field px-4 py-2 hover:text-text transition-colors">
          Вийти
        </button>
      </div>
    </div>
  );
}