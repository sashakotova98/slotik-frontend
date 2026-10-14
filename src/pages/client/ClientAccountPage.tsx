import { startTransition } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";

export default function ClientAccountPage() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    startTransition(() => {
      logout();
      navigate("/home", { replace: true });
    });
  }

  return (
    <section>
      <h1 className="text-2xl font-semibold text-text">Профіль</h1>
      <div className="mt-6 rounded-2xl border border-border bg-white p-5">
        <p className="text-sm text-muted">Тут будуть ваші дані та налаштування акаунта.</p>
        <button
          type="button"
          onClick={handleLogout}
          className="mt-5 flex min-h-12 w-full items-center gap-3 border-t border-neutral-200 pt-3 text-red-600 focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          <LogOut size={20} aria-hidden="true" />
          Вийти з акаунту
        </button>
      </div>
    </section>
  );
}
