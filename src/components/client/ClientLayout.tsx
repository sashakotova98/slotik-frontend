import { Outlet, useLocation } from "react-router-dom";
import ClientBottomNav from "./ClientBottomNav";

export default function ClientLayout() {
  const { pathname } = useLocation();
  const isAccount = pathname.replace(/\/$/, "") === "/client/account";

  return (
    <div className={`min-h-dvh text-text ${isAccount ? "bg-panel-200" : "bg-bg"}`}>
      <main className={isAccount
        ? "mx-auto flex min-h-dvh w-full min-w-0 max-w-3xl items-end px-4 pt-10 pb-[calc(6rem+env(safe-area-inset-bottom))] sm:px-6"
        : "mx-auto min-w-0 w-full max-w-3xl px-4 pt-6 pb-[calc(7rem+env(safe-area-inset-bottom))] sm:px-6"}>
        <Outlet />
      </main>

      <ClientBottomNav />
    </div>
  );
}
