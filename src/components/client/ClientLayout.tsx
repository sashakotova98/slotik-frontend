import { Outlet } from "react-router-dom";
import ClientBottomNav from "./ClientBottomNav";

export default function ClientLayout() {
  return (
    <div className="min-h-dvh bg-bg text-text">
      <main className="mx-auto min-w-0 w-full max-w-3xl px-4 pt-6 pb-[calc(7rem+env(safe-area-inset-bottom))] sm:px-6">
        <Outlet />
      </main>

      <ClientBottomNav />
    </div>
  );
}