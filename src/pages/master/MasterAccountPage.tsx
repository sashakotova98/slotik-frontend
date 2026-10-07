import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

export default function MasterAccountPage() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold">Мій акаунт</h1>
      <section className="rounded-3xl border border-neutral-200 p-5">
        <h2 className="font-semibold">Профіль майстра</h2>
        <p className="mt-2 text-sm text-neutral-500">Фото, ім’я та телефон ще не підключено.</p>
        <div className="my-5 rounded-xl border border-dashed border-neutral-300 p-5 text-center text-sm text-neutral-500">Посилання і QR-код з’являться після завантаження профілю.</div>
        <nav aria-label="Налаштування акаунта" className="divide-y divide-neutral-200">
          {[
            { to: "/cabinet/account/tariff", label: "Тариф" },
            { to: "/cabinet/account/bookings", label: "Ваші записи" },
            { to: "/support", label: "Підтримка" },
            { to: "/faq", label: "Часті запитання" },
          ].map(({ to, label }) => <Link key={to} to={to} className="block py-4 hover:underline">{label}</Link>)}
        </nav>
        <p className="border-t border-neutral-200 py-4 text-sm text-neutral-500">Зміну пароля та налаштування мови ще не підключено.</p>
        <button type="button" onClick={() => { logout(); navigate("/login", { replace: true }); }} className="min-h-12 text-red-600">Вийти з акаунту</button>
      </section>
    </div>
  );
}
