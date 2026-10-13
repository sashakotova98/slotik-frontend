//MasterCabinetLayout будет отображать текущую страницу через <Outlet />, а под ней — MasterBottomNav
import { Outlet } from "react-router-dom";
import MasterBottomNav from "./MasterBottomNav";

export default function MasterCabinetLayout() {
  return (
    <div className="min-h-dvh bg-white text-neutral-900">
      {/* Залишаємо місце для нижньої панелі. */}
      <main className="mx-auto max-w-100 px-4 pt-6 pb-[calc(7rem+env(safe-area-inset-bottom))]">
        <Outlet />
      </main>

      <MasterBottomNav />
    </div>
  );
}

// <Outlet /> — место, куда React Router подставляет выбранную страницу в зависимости от текущего маршрута.
