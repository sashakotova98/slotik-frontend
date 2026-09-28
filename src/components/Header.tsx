import type { ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CircleUserRound, LogOut } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import logo from "../assets/logo.svg";

type HeaderProps = {
  menu?: ReactNode;
};

export default function Header({ menu }: HeaderProps) {
  const { token, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/home", { replace: true });
  }

  return (
    <header className="relative z-30 bg-white text-black">
      <div className="relative mx-auto grid max-w-6xl grid-cols-[44px_1fr_44px] items-center gap-3 px-3 py-4 sm:px-6 sm:py-5">
        <div>{menu}</div>

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