import { Link, useLocation } from "react-router-dom";
import { Home, Users, LayoutGrid } from "lucide-react";

export default function AdminNav() {
  const location = useLocation();
  const path = location.pathname;

  const base = "flex items-center justify-center w-18 h-14 rounded-full transition-colors";
  const active = base + " bg-selected text-text";
  const normal = base + " text-muted";

  return (
    <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-2 bg-surface border border-border rounded-full shadow-lg">
      <Link to="/admin" className={path === "/admin" ? active : normal}>
        <Home size={20} />
      </Link>
      <Link to="/admin/masters" className={path === "/admin/masters" ? active : normal}>
        <Users size={20} />
      </Link>
      <Link to="/admin/finance" className={path === "/admin/finance" ? active : normal}>
        <span aria-hidden="true" className="text-xl leading-none">
          ₴
        </span>
      </Link>
      <Link to="/admin/categories" className={path === "/admin/categories" ? active : normal}>
        <LayoutGrid size={20} />
      </Link>
    </nav>
  );
}