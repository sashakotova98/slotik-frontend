import { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../components/admin/AdminLayout";
import { getAdminStats } from "../../api/stats";
import type { AdminStats } from "../../api/stats";


export default function AdminDashboardPage() {

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getAdminStats();
        setStats(data);
      } catch (err) {
        console.error(err);
        setError("Помилка при завантаженні статистики");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <AdminLayout
      title="Дашборд"
      action={
        <button type="button" aria-label="Вийти" title="Вийти" onClick={handleLogout}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-field hover:bg-selected transition-colors">
          <img
            src="/icons/logout.svg"
            alt=""
            className="h-5.25 w-5.25"
          />
        </button>
      }
    >
      {loading && (
        <p className="py-8 text-muted" role="status">
          Завантаження статистики…
        </p>
      )}

      {error && (
        <p className="py-8 text-danger" role="alert">
          {error}
        </p>
      )}
      {stats && (
        <div className="grid grid-cols-2 gap-x-6 gap-y-6 py-8 border-b border-border text-left">
          <div>
            <p className="text-4xl font-semibold text-text">
              {stats.mastersTotal}
            </p>
            <p className="mt-1 text-sm text-text">Майстрів усього</p>
          </div>

          <div>
            <p className="text-4xl font-semibold text-text">
              {stats.activeSubscriptions}
            </p>
            <p className="mt-1 text-sm text-text">Активних підписок</p>
          </div>

          <div>
            <p className="text-4xl font-semibold text-text">
              {stats.revenueTotal} ₴
            </p>
            <p className="mt-1 text-sm text-text">Дохід/міс</p>
          </div>

          <div>
            <p className="text-4xl font-semibold text-text">
              {stats.bookingsTotal}
            </p>
            <p className="mt-1 text-sm text-text">Записів</p>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}