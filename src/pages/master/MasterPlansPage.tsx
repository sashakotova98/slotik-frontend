import { useAuth } from "../../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import PaymentSummary, { type PaidPlan } from "../../components/master/PaymentSummary";
import { useEffect, useRef, useState } from "react";
import { apiCreateCheckout, openLiqPay } from "../../api/payments";

import { getOwnProfile } from "../../api/users";

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
  const { token, logout } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<PaidPlan | null>(null);
  const [message, setMessage] = useState("");

  const [paying, setPaying] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const paymentInFlight = useRef(false);

  const [masterName, setMasterName] = useState("Завантаження…");

  useEffect(() => {
    let active = true;
    const loadProfile = async () => {
      if (!token) return;
      setMasterName("Завантаження…");
      try {
        const user = await getOwnProfile(token);
        if (active) {
          const name = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
          setMasterName(name || "Ім’я не вказано");
        }
      } catch {
        if (active) setMasterName("Не вдалося завантажити ім’я");
      }
    };
    loadProfile();
    return () => { active = false; };
  }, [token]);

  const handlePay = async () => {
    if (!selectedPlan || paymentInFlight.current) return;

    paymentInFlight.current = true;
    setPaying(true);
    setPaymentError("");

    try {
      const result = await apiCreateCheckout(selectedPlan.id); // basic
      openLiqPay(result.checkout);
    } catch {
      setPaymentError("Не вдалося відкрити оплату. Спробуйте пізніше.");
    } finally {
      paymentInFlight.current = false;
      setPaying(false);
    }
  };

  const handleSelect = (plan: Plan) => {
    setMessage("");
    setPaymentError("");

    if (plan.id === "free") {
      setMessage("Ви обрали безкоштовний тариф. Збереження вибору ще не підключене.");
      return;
    }

    setSelectedPlan({ id: plan.id, name: plan.name, price: plan.price });
  };

  return (
    <div className="flex min-h-screen flex-col bg-linear-to-br from-neutral-200 via-neutral-300 to-neutral-400 text-black">
      <header className="flex justify-end px-6 py-4">
        <button
          type="button"
          disabled={paying}
          onClick={() => {
            logout();
            navigate("/login", { replace: true });
          }}
          className="rounded-xl bg-white px-4 py-2 text-sm font-medium shadow-sm transition hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black disabled:opacity-50"
        >
          Вийти
        </button>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 pt-4 pb-10">
        <div className="w-full max-w-sm rounded-[40px] bg-neutral-100 px-7 pt-8 pb-5 shadow-2xl">
          {selectedPlan ? (
            <PaymentSummary
              plan={selectedPlan}
              masterName={masterName}
              periodLabel="30 днів"
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
                    onClick={() => handleSelect(plan)}
                    className="w-full rounded-xl border border-neutral-400 p-4 text-left transition hover:border-black hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black"
                  >
                    <span className="flex items-start justify-between gap-3 font-semibold">
                      <span>{plan.name}</span>
                      <span className="shrink-0">
                        {plan.price === 0 ? "0 ₴" : `${plan.price} ₴/міс`}
                      </span>
                    </span>

                    <span className="mt-2 block text-sm leading-5 text-neutral-600">
                      {plan.description}
                    </span>
                  </button>
                ))}
              </div>

              {message && (
                <p role="status" className="mt-4 text-sm text-neutral-600">
                  {message}
                </p>
              )}

              <button
                type="button"
                onClick={() => navigate("/cabinet/setup")}
                className="mt-4 w-full py-2 text-sm text-neutral-500 hover:text-black"
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
