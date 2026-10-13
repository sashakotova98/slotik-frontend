import { Link, useLocation, useNavigate } from "react-router-dom";
import { useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { CircleAlert, Clock } from "lucide-react";
import { getPayment, type PaymentResult } from "../../api/payments";
import PaymentSuccess from "../../components/master/PaymentSuccess";
import { getOwnProfile } from "../../api/users";
import { ApiError } from "../../api/api";
import { useAuth } from "../../hooks/useAuth";
import { apiGetMe } from "../../api/auth";

export default function PaymentResultPage() {
  const { token, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [slug, setSlug] = useState<string | null>(null);
  const [profileError, setProfileError] = useState("");

  //http://localhost:5173/payment/result?paymentId=13
  const [searchParams] = useSearchParams();
  const paymentId = Number(searchParams.get("paymentId"));
  //для кнопки «Перевірити статус» или «Спробувати знову» Збільшує лічильник, що спричиняє повторне виконання fetchPayment () другим useEffect. 
  const [retry, setRetry] = useState(0); // нову оплату не створюємо

  const [payment, setPayment] = useState<PaymentResult | null>(null);
  const [error, setError] = useState("");
  // Від помилки залежить дія: повторний вхід, повтор запиту або повернення.
  const [errorAction, setErrorAction] = useState<"login" | "retry" | "back">("retry");

  // Чи виконується запит зараз.
  const [checking, setChecking] = useState(false);

  // Чи завершився час автоматичної перевірки.
  const [autoCheckFinished, setAutoCheckFinished] = useState(false);

  // null — завершення налаштування ще не перевірене. Якщо майстер безпосередньо не пройшов onboarding а в url перейшов на /cabinet/plans , буде false.
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | null>(null);

  const [onboardingError, setOnboardingError] = useState("");
  const [onboardingRetry, setOnboardingRetry] = useState(0);

  // оплата успішна, але профіль ще не завантажено або виникла помилка slug і не вдалося отримати посилання на профіль.
  const [profileRetry, setProfileRetry] = useState(0);



  function handleLogin() {
    // Зберігаємо paymentId в адресі, щоб після входу перевірити той самий платіж.
    const from = {
      pathname: location.pathname,
      search: location.search,
      hash: location.hash,
    };
    logout(); //401 помилка, потрібно повторно увійти якщо токен минув
    navigate("/login", { replace: true, state: { from } }); //запамятовує адресу  /payment/result?paymentId=80 
  }

  useEffect(() => {
    // Завантажуємо профіль лише після успішної оплати отримуємо slug майстра.
    if (!token || payment?.status !== 1) return;

    let active = true;

    const loadProfile = async () => {
      setProfileError("");
      setSlug(null);

      try {
        const user = await getOwnProfile(token);
        const savedSlug = user.master?.slug;

        if (!active) return;

        if (!savedSlug) {
          setProfileError("Не вдалося знайти посилання на профіль.");
          return;
        }

        setSlug(savedSlug);
      } catch {
        if (active) {
          setProfileError("Не вдалося завантажити профіль.");
        }
      }
    };

    loadProfile();

    return () => {
      active = false;
    };
  }, [token, payment?.status, profileRetry]);




  useEffect(() => {
    // Ігноруємо відповідь після виходу зі сторінки або зміни платежу.
    let active = true;

    let controller: AbortController | undefined;
    let requestTimer: ReturnType<typeof setTimeout> | undefined;

    let timer: ReturnType<typeof setTimeout> | undefined;

    // Повторне натискання починає нову серію перевірок на одну хвилину.
    const deadline = Date.now() + 60_000;

    const fetchPayment = async () => {
      if (!active) return;


      if (!Number.isSafeInteger(paymentId) || paymentId <= 0) {
        setErrorAction("back");
        setError("Некоректний ID платежу.");
        return;
      }


      setChecking(true); //Заблокували кнопку.
      try {
        // Окремий контролер для кожного GET, а не для самої оплати.
        controller = new AbortController();
        const requestController = controller;

        // Чекаємо до 10 секунд, але не довше залишку хвилинного ліміту.
        const timeoutMs = Math.max(1, Math.min(10_000, deadline - Date.now()));
        requestTimer = setTimeout(() => requestController.abort(), timeoutMs);

        const result = await getPayment(paymentId, requestController.signal);
        if (!active) return;

        setPayment(result);

        // Лише Pending потребує повторного GET. Успіх і помилка оплати завершують цикл.
        if (result.status !== 0) return;

        const remaining = deadline - Date.now(); //скільки залишилось мілісекунд до кінця перевірки
        if (remaining <= 0) {
          setAutoCheckFinished(true); // автоматична перевірка завершена через тайм-аут
          return;
        }

        // Плануємо наступний запит після відповіді, щоб запити не накладалися.
        timer = setTimeout(() => {
          if (!active) return; // якщо користувач залишив сторінку і ефект більше не активний
          if (Date.now() >= deadline) {
            setAutoCheckFinished(true); // автоматична перевірка завершена через тайм-аут
            return;
          }
          void fetchPayment();
        }, Math.min(5_000, remaining));
      } catch (error) {
        if (!active) return;

        // HTTP-помилка перевірки не означає невдалу оплату.
        if (error instanceof Error && error.name === "AbortError") {
          setErrorAction("retry");
          setError("Сервер не відповів вчасно. Статус оплати невідомий. Повторіть перевірку.");
        } else if (error instanceof ApiError) {
          if (error.status === 401) {
            setErrorAction("login");
            setError("Сесія завершилася. Увійдіть повторно, щоб перевірити оплату.");
          } else if (error.status === 403) {
            setErrorAction("back");
            setError("У вас немає доступу до цього платежу. Перевірте, чи ви увійшли в потрібний акаунт.");
          } else if (error.status === 404) {
            setErrorAction("back");
            setError("Платіж не знайдено. Перевірте посилання на результат оплати.");
          } else if (error.status === 429) {
            setError("Забагато запитів. Зачекайте трохи та повторіть перевірку.");
          } else {
            setError("Не вдалося перевірити оплату. Повторіть перевірку пізніше.");
          }
        } else {
          setError("Не вдалося з’єднатися із сервером. Перевірте інтернет і повторіть перевірку.");
        }
      } finally {
        clearTimeout(requestTimer);
        if (active) setChecking(false);
      }
    };

    // Початковий запуск також скасовується при демонтуванні компонента.
    timer = setTimeout(() => {
      if (!active) return;
      setError("");
      setErrorAction("retry");
      setPayment(null);
      setAutoCheckFinished(false);
      setChecking(false);
      void fetchPayment();
    }, 0);

    return () => {
      active = false;
      clearTimeout(timer); // Скасовуємо наступну перевірку.
      clearTimeout(requestTimer); // Прибираємо тайм-аут поточного запиту.
      controller?.abort(); // Скасовуємо GET при виході або зміні платежу.
    };
  }, [paymentId, retry]);

  // Перевірка завершення onboarding майстра.
  useEffect(() => {
    if (payment?.status !== 1) return;

    let active = true; // запуск useeffect ще актуальний але false якщо компонент демонтується покидаємо сторінку

    async function checkOnboarding() {

      try {
        setOnboardingCompleted(null); // скидаємо стан перед новою перевіркою
        setOnboardingError(""); // скидаємо помилку перед новою перевіркою
        const me = await apiGetMe();

        if (active) {
          setOnboardingCompleted(me.isOnboardingCompleted);
          setOnboardingError("");
        }
      } catch {
        if (active) {
          setOnboardingError(
            "Оплату підтверджено, але не вдалося перевірити налаштування профілю."
          );
        }
      }
    }

    void checkOnboarding();

    return () => {
      active = false; //якщо покидаємо сторінку, більше не оновлюємо старий стан компонента
    };
  }, [payment?.id, payment?.status, onboardingRetry]);



  // Успіх показуємо лише після підтвердження від бекенда.
  if (!error && payment?.status === 1) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-linear-to-br from-neutral-200 to-neutral-400 px-4 py-10">
        {/* Оплата вже успішна. Помилка Auth/Me не змінює цей результат. */}
        {onboardingError ? (
          <>
            <h1>Оплату підтверджено!</h1>
            <p role="alert">{onboardingError}</p>
            <button
              type="button"
              onClick={() => setOnboardingRetry((value) => value + 1)}
            >
              Повторити перевірку профілю
            </button>
          </>
        ) : onboardingCompleted === null ? (
          <p role="status">
            Оплату підтверджено. Перевіряємо налаштування профілю…
          </p>
        ) : onboardingCompleted === false ? (
          <>
            <h1>Оплату підтверджено!</h1>
            <p>Завершіть налаштування сторінки майстра.</p>
            <Link to="/cabinet/setup">Завершити налаштування</Link>
          </>
        ) : (
          <PaymentSuccess slug={slug} title="Оплату підтверджено!" />
        )}
        {/* Повторюємо завантаження профілю у разі помилки і не створює нову заявку на оплату */}
        {profileError && (
          <div>
            <p role="alert">{profileError}</p>

            <button
              type="button"
              onClick={() => setProfileRetry((value) => value + 1)}
            >
              Повторити завантаження посилання
            </button>
          </div>
        )}
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

              <p className="mt-3 text-sm text-neutral-500">
                Це не означає, що оплата не пройшла. Не оплачуйте повторно, поки не перевірите статус.
              </p>

              {errorAction === "back" ? (
                <Link to="/cabinet" className="mt-auto rounded-full border border-neutral-500 px-5 py-3">
                  Повернутися до кабінету
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={errorAction === "login" ? handleLogin : () => setRetry((prev) => prev + 1)}
                  className="mt-auto rounded-full border border-neutral-500 px-5 py-3"
                >
                  {errorAction === "login" ? "Увійти повторно" : "Повторити перевірку"}
                </button>
              )}
            </>
          ) : !payment || checking || payment.status === 0 ? (
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
                {autoCheckFinished
                  ? "Підтвердження ще очікується. Автоматичну перевірку завершено. Перевірте статус трохи пізніше."
                  : "Перевіряємо автоматично кожні 5 секунд протягом однієї хвилини."}
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
