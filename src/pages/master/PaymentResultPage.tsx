import { Link } from "react-router-dom";
import { useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { CircleAlert, Clock } from "lucide-react";
import { getPayment, type PaymentResult } from "../../api/payments";
import PaymentSuccess from "../../components/master/PaymentSuccess";


export default function PaymentResultPage() {

  //http://localhost:5173/payment/result?paymentId=13
  const [searchParams] = useSearchParams();
  const paymentId = Number(searchParams.get("paymentId"));
  //для кнопки «Перевірити статус» или «Спробувати знову»
  const [retry, setRetry] = useState(0);

  const [payment, setPayment] = useState<PaymentResult | null>(null);
  const [error, setError] = useState("");


  useEffect(() => {
    // Ігноруємо відповідь після виходу зі сторінки або зміни платежу.
    let active = true;

    const fetchPayment = async () => {
      setError("");
      setPayment(null);

      if (!Number.isSafeInteger(paymentId) || paymentId <= 0) {
        setError("Некоректний ID платежу.");
        return;
      }


      try {
        const result = await getPayment(paymentId);
        if (active) {
          setPayment(result);
        }
      } catch {
        if (active) {
          setError("Не вдалося перевірити оплату.");
        }
      }
    };

    fetchPayment();

    return () => {
      active = false;
    };
  }, [paymentId, retry]);

  const checking = !payment;

  // Успіх показуємо лише після підтвердження від бекенда.
  if (!error && payment?.status === 1) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-linear-to-br from-neutral-200 to-neutral-400 px-4 py-10">
        <PaymentSuccess slug={null} />
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-200 px-4 py-10">
      <section className="flex min-h-140 w-full max-w-md flex-col rounded-[40px] bg-neutral-50 px-7 py-10 text-center shadow-xl">
        <p className="text-xl font-semibold tracking-[0.3em]">
          SLOTIK
        </p>

        <div className="mt-14 flex flex-1 flex-col" aria-live="polite">
          {/* Помилка запиту не означає, що оплата не пройшла. */}
          {error ? (
            <>
              <CircleAlert
                size={96}
                strokeWidth={1.5}
                aria-hidden="true"
                className="mx-auto text-neutral-500"
              />

              <h1 className="mt-8 text-2xl font-semibold">
                Не вдалося перевірити оплату
              </h1>

              <p role="alert" className="mt-4 text-neutral-500">
                {error}
              </p>

              <button
                type="button"
                onClick={() => setRetry((prev) => prev + 1)}
                className="mt-auto rounded-full border border-neutral-500 px-5 py-3"
              >
                Спробувати знову
              </button>
            </>
          ) : checking || payment?.status === 0 ? (
            <>
              {/* Початкова перевірка або очікування підтвердження. */}
              <Clock
                size={96}
                strokeWidth={1.5}
                aria-hidden="true"
                className="mx-auto text-neutral-500"
              />

              <h1 className="mt-8 text-2xl font-semibold">
                Перевіряємо оплату
              </h1>

              <p className="mt-4 text-neutral-500">
                {checking
                  ? "Отримуємо інформацію про платіж…"
                  : "Очікуємо підтвердження від платіжної системи."}
              </p>

              <p className="mt-6 text-sm text-neutral-400">
                Це може зайняти кілька хвилин.
              </p>

              <button
                type="button"
                disabled={checking}
                onClick={() => setRetry((prev) => prev + 1)}
                className="mt-auto rounded-full border border-neutral-500 px-5 py-3 disabled:opacity-50"
              >
                {checking ? "Перевіряємо…" : "Перевірити статус"}
              </button>
            </>
            // ) : payment?.status === 1 ? (
            //   <>
            //     {/* Успішна оплата. */}
            //     <CircleCheck
            //       size={96}
            //       strokeWidth={1.5}
            //       aria-hidden="true"
            //       className="mx-auto text-green-600"
            //     />

            //     <h1 className="mt-8 text-2xl font-semibold">
            //       Оплату підтверджено
            //     </h1>

            //     <p className="mt-4 text-neutral-500">
            //       Ваш платіж успішно проведено.
            //     </p>

            //     <Link
            //       to="/cabinet"
            //       className="mt-auto rounded-full bg-black px-5 py-3 font-medium text-white"
            //     >
            //       Перейти в кабінет
            //     </Link>

            //     <p className="mt-4 text-sm text-neutral-400">
            //       Дякуємо, що обираєте Slotik
            //     </p>
            //   </>
          ) : payment?.status === 2 ? (
            <>
              {/* Бекенд підтвердив невдалу оплату. */}
              <CircleAlert
                size={96}
                strokeWidth={1.5}
                aria-hidden="true"
                className="mx-auto text-red-500"
              />

              <h1 className="mt-8 text-2xl font-semibold">
                Оплата не пройшла
              </h1>

              <p className="mt-4 text-neutral-500">
                Не вдалося завершити оплату. Спробуйте ще раз.
              </p>

              <Link
                to="/cabinet/plans"
                className="mt-auto rounded-full bg-black px-5 py-3 font-medium text-white"
              >
                Повернутися до тарифів
              </Link>
            </>
          ) : (
            <p role="alert">Невідомий статус платежу.</p>
          )}
        </div>
      </section>
    </main>
  );
}
