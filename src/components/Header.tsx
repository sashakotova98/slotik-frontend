import type { ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronLeft, CircleUserRound, LogOut } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import logo from "../assets/logo.svg";

type HeaderProps = {
  menu?: ReactNode;
  showBack?: boolean;
  backFallback?: string;
};

export default function Header({ menu, showBack = false, backFallback = "/home" }: HeaderProps) {
  const { token, logout } = useAuth();
  const navigate = useNavigate();

  function handleBack() {
    const historyIndex = window.history.state?.idx;
    if (typeof historyIndex === "number" && historyIndex > 0) {
      navigate(-1);
    } else {
      navigate(backFallback, { replace: true });
    }
  }

  function handleLogout() {
    logout();
    navigate("/home", { replace: true });
  }

  return (
    <header className="relative z-30 bg-white text-black">
      <div className="relative mx-auto grid max-w-6xl grid-cols-[44px_1fr_44px] items-center gap-3 px-3 py-4 sm:px-6 sm:py-5">
        <div>
          {showBack ? (
            <button
              type="button"
              onClick={handleBack}
              aria-label="Повернутися назад"
              title="Повернутися назад"
              className="flex size-11 items-center justify-center rounded-lg text-neutral-500 hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              <ChevronLeft aria-hidden="true" className="size-6" />
            </button>
          ) : menu}
        </div>

        <Link
          to="/home"
          aria-label="Slotik — головна"
          className="justify-self-center"
        >
          <img
            src={logo}
            alt="Slotik"
            className="h-8 w-auto sm:h-10"
          />
        </Link>

        {token ? (
          <button
            type="button"
            onClick={handleLogout}
            aria-label="Вийти з акаунта"
            title="Вийти з акаунта"
            className="flex size-11 items-center justify-center rounded-lg hover:bg-black/5 focus-visible:outline-2"
          >
            <LogOut aria-hidden="true" className="size-6" />
          </button>
        ) : (
          <Link
            to="/login"
            aria-label="Увійти / зареєструватися"
            className="flex size-11 items-center justify-center rounded-lg hover:bg-black/5 focus-visible:outline-2"
          >
            <CircleUserRound aria-hidden="true" className="size-6" />
          </Link>
        )}
      </div>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-full h-6 bg-linear-to-b from-white to-transparent"
      />
    </header>
  );
}