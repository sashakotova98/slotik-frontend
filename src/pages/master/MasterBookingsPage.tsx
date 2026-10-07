import { Link } from "react-router-dom";
import { X } from "lucide-react";

export default function MasterBookingsPage() {
  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between border-b border-neutral-200 pb-3">
        <h1 className="text-2xl font-semibold">Ваші записи</h1>
        <Link to="/cabinet/account" aria-label="Повернутися до акаунта" className="flex size-11 items-center justify-center"><X aria-hidden="true" /></Link>
      </header>
      {["Найближчі записи", "Минулі записи"].map((title) => (
        <section key={title}><h2 className="font-semibold">{title}</h2><p className="mt-3 rounded-2xl border border-neutral-200 p-4 text-sm text-neutral-500">Історію записів ще не підключено.</p></section>
      ))}
    </div>
  );
}
