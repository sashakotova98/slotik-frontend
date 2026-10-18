import { useAuth } from "../../hooks/useAuth";
import { useNavigate, useSearchParams } from "react-router-dom";
import PaymentSummary, { type PaidPlan } from "../../components/master/PaymentSummary";
import { useEffect, useRef, useState } from "react";
import { apiCreateCheckout, openLiqPay } from "../../api/payments";
// import PaymentSuccess from "../../components/master/PaymentSuccess";
import { getOwnProfile } from "../../api/users";

import { apiGetMe } from "../../api/auth";
import { ApiError } from "../../api/api";
import { activateFreePlan, getOwnSubscriptions, type Subscription } from "../../api/subscriptions";

const planCodes: Record<Plan["id"], Subscription["plan"]> = {
  free: 0,
  basic: 1,
  pro: 2,
};

type Plan = {
  id: "free" | "basic" | "pro";
  name: string;
  price: number;
  description: string;
};

const plans: Plan[] = [
  {
    id: "free",
    name: "Безкоштовний",
    price: 0,
    description: "Сторінка з прайсом і портфоліо • посилання та QR • без онлайн-запису",
  },
  {
    id: "basic",
    name: "Базовий",
    price: 150,
    description: "Усе з Безкоштовного • онлайн-запис і календар • журнал клієнтів",
  },
  {
    id: "pro",
    name: "Професійний",
    price: 200,
    description: "Все з Базового • Telegram нагадування • статистика • рекомендація профілю",
  },
];

export default function MasterPlansPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // При зміні тарифу з кабінету повертаємося до тарифу, а не до онбордингу.
  const isChangingPlan = searchParams.get("mode") === "change";
  const { token, logout } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<PaidPlan | null>(null);
  const [message, setMessage] = useState("");

  const [paying, setPaying] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const paymentInFlight = useRef(false);

  const [masterName, setMasterName] = useState("Завантаження…");
  const [profileError, setProfileError] = useState("");

  // const [showSuccess, setShowSuccess] = useState(false);
  const [slug, setSlug] = useState<string | null>(null);

  const [userId, setUserId] = useState<number | null>(null); //check onboarding
  const [savingFree, setSavingFree] = useState(false); //true, showing «Зберігаємо…»
  const freeInFlight = useRef(false); //protection against repeated requests

  const busy = paying || savingFree; //Blocks the button both during the start of the paid plan and while maintaining the free plan.

  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [subscriptionsLoading, setSubscriptionsLoading] = useState(true);
  const [subscriptionsError, setSubscriptionsError] = useState("");
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    // Оновлюємо строк дії для підказки, поки сторінка відкрита.
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let active = true;
    const loadProfile = async () => {
      if (!token) return;
      setMasterName("Завантаження…");
      setProfileError("");
      setSlug(null);
      setUserId(null);
      try {
        const user = await getOwnProfile(token);
        if (active) {
          const name = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
          setMasterName(name || "Ім’я не вказано");
          setSlug(user.master?.slug ?? null);
          setUserId(user.id);
        }
      } catch (error) {
        if (active) {
          setMasterName("Ім’я не завантажено");
          setProfileError(error instanceof ApiError ? error.message : "Не вдалося завантажити профіль. Оновіть сторінку.");
        }
      }
    };
    loadProfile();
    return () => {
      active = false;
    };
  }, [token]);

  useEffect(() => {
    let active = true;

    async function loadSubscriptions() {
      setSubscriptionsLoading(true);
      setSubscriptionsError("");

      try {
        const result = await getOwnSubscriptions();

        if (active) {
          setSubscriptions(result);
          setNow(Date.now());
        }
      } catch (error) {
        if (active) {
          setSubscriptionsError(
            error instanceof ApiError
              ? error.message
              : "Не вдалося завантажити підписки. Оновіть сторінку."
          );
        }
      } finally {
        if (active) {
          setSubscriptionsLoading(false);
        }
      }
    }

    void loadSubscriptions();

    return () => {
      active = false;
    };
  }, [token]);


  // Знаходимо чинну оплачену підписку.
  const activePaidSubscription = subscriptions.find(
    (subscription) =>
      subscription.plan !== 0 &&
      !subscription.isTrial &&
      subscription.status === 0 &&
      Date.parse(subscription.expiresAt) > now
  );

  // Пробний період також припиняється після активації платного тарифу.
  const activeTrial = subscriptions.find(
    (subscription) =>
      subscription.isTrial &&
      subscription.status === 0 &&
      Date.parse(subscription.expiresAt) > now
  );

  let paymentNotice =
    "Після успішної оплати тариф активується на 30 днів. Автоматичного списання немає.";

  if (activePaidSubscription) {
    paymentNotice =
      "Після успішної оплати поточний тариф буде замінено одразу. Невикористані оплачені дні не переносяться, їхня вартість не зараховується. Ви сплачуєте повну вартість нового тарифу на 30 днів. Автоматичного списання немає.";
  } else if (activeTrial) {
    paymentNotice =
      "Після успішної оплати пробний період завершиться. Платний тариф активується на 30 днів. Залишок пробного періоду не переноситься. Автоматичного списання немає.";
  }

  const handlePay = async () => {
    if (!selectedPlan || paymentInFlight.current || freeInFlight.current) return;
    // Без даних підписок не можемо показати коректні умови зміни тарифу.
    if (subscriptionsLoading || subscriptionsError) return;

    paymentInFlight.current = true;
    setPaying(true);
    setPaymentError("");

    try {
      const result = await apiCreateCheckout(selectedPlan.id); // створємо платіж
      openLiqPay(result.checkout); // відкриваємо отриманні дані на liqpay
    } catch (error) {
      setPaymentError(error instanceof Error ? error.message : "Не вдалося відкрити оплату. Спробуйте пізніше.");
    } finally {
      paymentInFlight.current = false;
      setPaying(false);
    }
  };

  const handleSelect = async (plan: Plan) => {
    if (paymentInFlight.current || freeInFlight.current) return;
    if (subscriptionsLoading || subscriptionsError) return;

    setMessage("");
    setPaymentError("");

    // Платний тариф: відкриваємо підсумок оплати.
    if (plan.id !== "free") {
      const selectedCode = planCodes[plan.id]; //["free"]; // 0

      // Перевіряємо саме обраний тариф серед усіх підписок.
      const alreadyActive = subscriptions.some(
        (subscription) =>
          subscription.plan === selectedCode &&
          !subscription.isTrial &&
          subscription.status === 0 &&
          Date.parse(subscription.expiresAt) > Date.now()
      );

      if (alreadyActive) {
        setMessage(
          "Цей платний тариф уже активний. Повторна оплата доступна після завершення його строку."
        );
        return;
      }

      setSelectedPlan({
        id: plan.id,
        name: plan.name,
        price: plan.price,
      });
      return;
    }

    if (!token || userId === null || !slug) {
      setMessage("Дані профілю ще не завантажено. Оновіть сторінку та спробуйте ще раз.");
      return;
    }

    freeInFlight.current = true;
    setSavingFree(true);

    try {
      const subscriptions = await getOwnSubscriptions();

      const hasActivePaidPlan = subscriptions.some(
        (subscription) => subscription.plan !== 0 && subscription.status === 0 && Date.parse(subscription.expiresAt) > Date.now(),
      );

      if (hasActivePaidPlan) {
        setMessage("У вас уже діє платний тариф. Його не було змінено.");
        return;
      }

      await activateFreePlan();
      const me = await apiGetMe();

      if (me.isOnboardingCompleted === true) {
        // Після зміни тарифу повертаємося до нього; онбординг має свій екран успіху.
        navigate(
          isChangingPlan ? "/cabinet/account/tariff" : "/cabinet/created",
          { replace: true }
        );
      } else {
        setMessage("Налаштування ще не завершено. Перевірте профіль, послуги та робочий графік.");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Не вдалося зберегти тариф. Спробуйте ще раз.");
    } finally {
      freeInFlight.current = false;
      setSavingFree(false);
    }
  };

  // if (showSuccess) {
  // //   return (
  // //     <main className="flex min-h-screen items-center justify-center bg-linear-to-br from-neutral-200 to-neutral-400 px-4 py-10">
  // //       <PaymentSuccess slug={slug} />
  // //     </main>
  // //   );
  // }

  return (
    <div className="flex min-h-screen flex-col bg-linear-to-br from-panel-100 via-panel-200 to-panel-300 text-text">
      <header className="flex justify-end px-6 py-4">
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            logout();
            navigate("/login", { replace: true });
          }}
          className="rounded-xl bg-surface px-4 py-2 text-sm font-medium shadow-sm transition hover:bg-panel-100 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-text disabled:opacity-50"
        >
          Вийти
        </button>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 pt-4 pb-10">
        <div className="w-full max-w-sm rounded-[40px] bg-panel-100 px-7 pt-8 pb-5 shadow-2xl">
          {/* Помилка профілю видима і при виборі тарифу, і в підсумку оплати. */}
          {profileError && (
            <p role="alert" className="mb-4 text-sm text-red-600">
              {profileError}
            </p>
          )}

          {subscriptionsLoading && (
            <p role="status" className="mb-4 text-sm text-copy-500">
              Завантажуємо ваш тариф…
            </p>
          )}

          {subscriptionsError && (
            <p role="alert" className="mb-4 text-sm text-red-600">
              {subscriptionsError}
            </p>
          )}

          {selectedPlan ? (
            <PaymentSummary
              plan={selectedPlan}
              masterName={masterName}
              periodLabel="30 днів"
              notice={paymentNotice}
              paying={paying}
              error={paymentError}
              onPay={handlePay}
              onBack={() => {
                setPaymentError("");
                setSelectedPlan(null);
              }}
            />
          ) : (
            <>
              <h1 className="mb-5 text-lg font-semibold">Тарифи</h1>

              <div className="space-y-4">
                {plans.map((plan) => (
                  <button
                    key={plan.id}
                    type="button"
                    disabled={busy || subscriptionsLoading || Boolean(subscriptionsError)}
                    onClick={() => handleSelect(plan)}
                    className="w-full rounded-xl border border-border p-4 text-left transition hover:border-black hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-text"
                  >
                    <span className="flex items-start justify-between gap-3 font-semibold">
                      <span>{plan.name}</span>
                      <span className="shrink-0">{plan.price === 0 ? "0 ₴" : `${plan.price} ₴/міс`}</span>
                    </span>

                    <span className="mt-2 block text-sm leading-5 text-copy-600">{plan.description}</span>
                  </button>
                ))}
              </div>

              {savingFree && (
                <p role="status" className="mt-4 text-sm text-copy-500">
                  Зберігаємо безкоштовний тариф…
                </p>
              )}

              {message && (
                <p role="status" className="mt-4 text-sm text-copy-600">
                  {message}
                </p>
              )}

              <button
                type="button"
                disabled={busy}
                onClick={() => navigate(isChangingPlan ? "/cabinet/account/tariff" : "/cabinet/setup")}
                className="mt-4 w-full py-2 text-sm text-copy-500 hover:text-text"
              >
                Назад
              </button>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
