import { Link } from "react-router-dom";
import { X } from "lucide-react";

export default function MasterTariffPage() {
  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between border-b border-neutral-200 pb-3">
        <h1 className="text-2xl font-semibold">Ваш тариф</h1>
        <Link to="/cabinet/account" aria-label="Повернутися до акаунта" className="flex size-11 items-center justify-center"><X aria-hidden="true" /></Link>
      </header>
      {/* Не показуємо вигадану підписку чи оплату. */}
      {["Поточний тариф і термін дії", "Наступна оплата", "Попередні оплати"].map((title) => (
        <section key={title} className="rounded-2xl border border-neutral-200 p-4"><h2 className="font-semibold">{title}</h2><p className="mt-2 text-sm text-neutral-500">Дані підписки ще не підключено.</p></section>
      ))}
      <Link to="/cabinet/plans" className="flex min-h-12 items-center justify-center rounded-2xl border border-neutral-300 px-4">Переглянути тарифи</Link>
    </div>
  );
}
