import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { X } from "lucide-react";
import { getOwnSubscriptions, type Subscription } from "../../api/subscriptions";

// Коди тарифів і статусів приходять із бекенда, назви показуємо українською.
const planNames = { 0: "Безкоштовний", 1: "Базовий", 2: "Професійний" };
const statusNames = {
  0: "Активна",
  1: "Термін дії завершено",
  2: "Скасована",
  3: "Очікує активації",
};

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Дата не вказана";
  return date.toLocaleDateString("uk-UA", { timeZone: "Europe/Kyiv" });
}

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat("uk-UA", { style: "currency", currency }).format(amount);
}

function formatPeriod(period: string | null) {
  if (period === "month") return " / міс.";
  if (period === "year") return " / рік";
  return "";
}

// Показуємо лише явно заплановану оплату, а не дату завершення підписки. автоматическое списание не настроено
function getNextPaymentText(subscription: Subscription | undefined) {
  if (!subscription) return "Поточну підписку не визначено.";
  if (subscription.plan === 0) return "Для безкоштовного тарифу оплата не потрібна.";

  const { nextPaymentAt, nextPaymentAmount, currency } = subscription;

  if (nextPaymentAt === null && nextPaymentAmount === null) {
    return `Автоматичного списання не буде. Поточний тариф діє до ${formatDate(subscription.expiresAt)}.`;
  }

  // зараз показуємо дату та суму наступного платежу, якщо вони відомі. але немає зараз автоматичного списання. nextPaymentAt: null nextPaymentAmount: null
  const date = nextPaymentAt ? formatDate(nextPaymentAt) : "Дату не вказано";
  const amount = nextPaymentAmount !== null
    ? formatMoney(nextPaymentAmount, currency)
    : "Суму не вказано";

  return `${date} — ${amount}`;
}

export default function MasterTariffPage() {
  // Дані запиту та два стани інтерфейсу: завантаження й помилка.
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadSubscriptions() {
      try {
        // GET /api/Subscription. Токен додає спільна функція api().
        const data = await getOwnSubscriptions();
        if (active) setSubscriptions(data);
      } catch (error) {
        if (active) {
          setError(error instanceof Error
            ? error.message
            : "Не вдалося завантажити тариф. Оновіть сторінку, щоб повторити запит.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadSubscriptions();

    // Не оновлюємо стан після виходу зі сторінки.
    return () => { active = false; };
  }, []);

  // Бек сам визначає поточний тариф серед усіх підписок.
  const currentSubscription = subscriptions.find((subscription) => subscription.isEffective);

  // Збираємо платежі всіх підписок і додаємо тариф для підпису в історії.
  const allPayments = subscriptions.flatMap((subscription) =>
    subscription.payments.map((payment) => ({ ...payment, plan: subscription.plan }))
  );

  // Залишаємо успішні платежі та показуємо найновіші першими.
  const successfulPayments = allPayments
    .filter((payment) => payment.status === 1)
    .sort((first, second) =>
      Date.parse(second.paidAt ?? second.createdAt) - Date.parse(first.paidAt ?? first.createdAt)
    );

  return (
    <div className="mx-auto w-full max-w-md space-y-6">
      <header className="flex items-center justify-between border-b border-neutral-200 pb-3">
        <h1 className="text-xl font-semibold">Ваш тариф</h1>
        <Link to="/cabinet/account" aria-label="Повернутися до акаунта" className="flex size-11 items-center justify-center">
          <X aria-hidden="true" />
        </Link>
      </header>

      {loading && <p role="status">Завантажуємо тариф…</p>}
      {!loading && error && <p role="alert" className="text-red-600">{error}</p>}

      {!loading && !error && (
        <>
          {/* Поточна підписка та її строк дії. Ціну беремо з API. */}
          <section className="space-y-3">
            <h2 className="text-sm text-neutral-500">Поточний тариф</h2>
            <div className="rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm">
              {currentSubscription ? (
                <>
                  <div className="flex items-start justify-between gap-3 font-semibold">
                    <span>{planNames[currentSubscription.plan]}</span>
                    <span>
                      {formatMoney(currentSubscription.price, currentSubscription.currency)}
                      {currentSubscription.plan !== 0 && formatPeriod(currentSubscription.billingPeriod)}
                    </span>
                  </div>

                  {/* Ціна тарифу під час trial не означає заплановане списання. */}
                  {currentSubscription.isTrial && (
                    <p className="mt-3 text-sm text-blue-600">
                      Пробний період. Вище вказано звичайну вартість тарифу.
                    </p>
                  )}

                  {currentSubscription.plan === 0 && (
                    <p className="mt-3 text-sm text-neutral-500">
                      Сторінка з прайсом і портфоліо, посилання та QR-код. Без онлайн-запису.
                    </p>
                  )}

                  <p className="mt-4 border-t border-neutral-200 pt-3 text-sm text-neutral-500">
                    {currentSubscription.plan === 0
                      ? "Безстроково"
                      : `Діє до ${formatDate(currentSubscription.expiresAt)}`}
                  </p>
                  <p className="mt-2 text-sm text-green-700">{statusNames[currentSubscription.status]}</p>
                </>
              ) : (
                <p className="text-sm text-neutral-600">
                  {subscriptions.length === 0
                    ? "Підписку ще не збережено."
                    : "Поточну підписку не визначено."}
                </p>
              )}
            </div>
          </section>

          {/* null означає відсутність даних про заплановану оплату. */}
          <section className="space-y-3">
            <h2 className="text-sm text-neutral-500">Наступна оплата</h2>
            <p className="rounded-2xl border border-neutral-100 bg-white p-4 text-sm shadow-sm">
              {getNextPaymentText(currentSubscription)}
            </p>
          </section>

          {/* Історія містить лише платежі, успішність яких підтвердив бек. */}
          <section className="space-y-3">
            <h2 className="text-sm text-neutral-500">Попередні оплати</h2>
            <div className="divide-y divide-neutral-200 rounded-2xl border border-neutral-100 bg-white px-4 shadow-sm">
              {successfulPayments.length === 0 ? (
                <p className="py-4 text-sm text-neutral-500">Оплат поки немає.</p>
              ) : (
                successfulPayments.map((payment) => (
                  <div key={payment.id} className="py-3 text-sm">
                    <div className="flex justify-between gap-3">
                      <span>{formatDate(payment.paidAt ?? payment.createdAt)}</span>
                      <span>{formatMoney(payment.amount, payment.currency)}</span>
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
