import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { X } from "lucide-react";
import { getOwnSubscriptions, type Subscription } from "../../api/subscriptions";

const planNames = { 0: "Безкоштовний", 1: "Базовий", 2: "Професійний" };
const statusNames = { 0: "Активна", 1: "Термін дії завершено", 2: "Скасована", 3: "Очікує активації" };
function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Дата не вказана" : date.toLocaleDateString("uk-UA", { timeZone: "Europe/Kyiv" });
}
function money(amount: number, currency: string) {
  return new Intl.NumberFormat("uk-UA", { style: "currency", currency }).format(amount);
}

export default function MasterTariffPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    let active = true;
    void getOwnSubscriptions()
      .then((data) => {
        if (active) {
          setSubscriptions(data);
          setNow(Date.now());
        }
      })
      .catch(() => {
        if (active) setError("Не вдалося завантажити тариф. Оновіть сторінку, щоб повторити запит.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  // Платна активна підписка має пріоритет над збереженим Free.
  const current = subscriptions
    .filter((sub) => sub.status === 0 && Date.parse(sub.expiresAt) > now)
    .sort((a, b) => Number(b.plan !== 0) - Number(a.plan !== 0) || Date.parse(b.expiresAt) - Date.parse(a.expiresAt))[0];
  const payments = subscriptions
    .flatMap((sub) => sub.payments.map((payment) => ({ ...payment, plan: sub.plan })))
    .filter((payment) => payment.status === 1)
    .sort((a, b) => Date.parse(b.paidAt ?? b.createdAt) - Date.parse(a.paidAt ?? a.createdAt));

  return (
    <div className="mx-auto w-full max-w-md space-y-6">
      <header className="flex items-center justify-between border-b border-neutral-200 pb-3">
        <h1 className="text-xl font-semibold">Ваш тариф</h1>
        <Link to="/cabinet/account" aria-label="Повернутися до акаунта" className="flex size-11 items-center justify-center">
          <X aria-hidden="true" />
        </Link>
      </header>
      {loading ? (
        <p role="status">Завантажуємо тариф…</p>
      ) : error ? (
        <p role="alert" className="text-red-600">
          {error}
        </p>
      ) : (
        <>
          <section className="space-y-3">
            <h2 className="text-sm text-neutral-500">Поточний тариф</h2>
            <div className="rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm">
              {current ? (
                <>
                  <div className="flex items-center justify-between gap-3 font-semibold">
                    <span>{planNames[current.plan]}</span>
                    {current.plan === 0 && <span>0 ₴</span>}
                    {current.isTrial && <span className="text-sm text-blue-600">Пробний період</span>}
                  </div>
                  {current.plan === 0 && (
                    <p className="mt-3 text-sm text-neutral-500">Сторінка з прайсом і портфоліо, посилання та QR-код. Без онлайн-запису.</p>
                  )}
                  <p className="mt-4 border-t border-neutral-200 pt-3 text-sm text-neutral-500">Діє до {formatDate(current.expiresAt)}</p>
                  <p className="mt-2 text-sm text-green-700">{statusNames[current.status]}</p>
                </>
              ) : (
                <p className="text-sm text-neutral-600">
                  {subscriptions.length === 0 ? "Підписку ще не збережено." : "Немає активної підписки."}
                </p>
              )}
            </div>
          </section>
          <section className="space-y-3">
            <h2 className="text-sm text-neutral-500">Наступна оплата</h2>
            <p className="rounded-2xl border border-neutral-100 bg-white p-4 text-sm shadow-sm">
              {current?.plan === 0 ? "Для безкоштовного тарифу оплата не потрібна." : "Дата та сума наступної оплати не надані сервером."}
            </p>
          </section>
          <section className="space-y-3">
            <h2 className="text-sm text-neutral-500">Попередні оплати</h2>
            <div className="divide-y divide-neutral-200 rounded-2xl border border-neutral-100 bg-white px-4 shadow-sm">
              {payments.length === 0 ? (
                <p className="py-4 text-sm text-neutral-500">Оплат поки немає.</p>
              ) : (
                payments.map((payment) => (
                  <div key={payment.id} className="py-3 text-sm">
                    <div className="flex justify-between gap-3">
                      <span>{formatDate(payment.paidAt ?? payment.createdAt)}</span>
                      <span>{money(payment.amount, payment.currency)}</span>
                    </div>
                    <p className="mt-1 text-xs text-neutral-500">
                      {planNames[payment.plan]}
                      {payment.providerStatus === "sandbox" ? " • Тестова оплата" : ""}
                    </p>
                  </div>
                ))
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
