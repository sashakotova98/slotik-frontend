import { useAuth } from "../hooks/useAuth";
import { Link, useNavigate } from "react-router-dom";

export default function MasterCabinetPage() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-bg p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text">Кабінет майстра</h1>
        <button onClick={handleLogout}
          className="text-sm text-muted border border-border rounded-field px-4 py-2 hover:text-text transition-colors">
          Вийти
        </button>
      </div>
      <nav aria-label="Допомога" className="mt-6 flex flex-wrap gap-4">
        <Link to="/support" className="inline-flex min-h-11 items-center rounded-lg px-3 text-text underline underline-offset-4 hover:bg-selected focus-visible:outline-2 focus-visible:outline-offset-2">
          Підтримка
        </Link>
        <Link to="/faq" className="inline-flex min-h-11 items-center rounded-lg px-3 text-text underline underline-offset-4 hover:bg-selected focus-visible:outline-2 focus-visible:outline-offset-2">
          Часті запитання
        </Link>
      </nav>
    </div>
  );
}