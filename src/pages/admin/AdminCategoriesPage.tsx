import { Link, useNavigate } from "react-router-dom";
import AdminLayout from "../../components/admin/AdminLayout";
import { useAuth } from "../../hooks/useAuth";

export default function AdminCategoriesPage() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <AdminLayout title="Категорії"
      action={
        <button type="button" aria-label="Вийти" title="Вийти" onClick={handleLogout}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-field hover:bg-selected transition-colors">
          <img
            src="/icons/logout.svg"
            alt=""
            className="h-5.25 w-5.25"
          />
        </button>
      }>

      <Link to="/admin" className="text-sm text-muted">← Дашборд</Link>
      <p className="text-muted mt-3">Тут буде список категорій</p>
    </AdminLayout>
  );
}