import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import logo from "../assets/logo.svg";

export default function SplashPage() {
  const [done, setDone] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDone(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  if (done) return <Navigate to="/home" replace />;

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center">
      <img src={logo} alt="Slotik" className="w-56 animate-pulse" />
      <p className="text-muted text-sm mt-2">Онлайн-запис до майстрів</p>
    </div>
  );
}