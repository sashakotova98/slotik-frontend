import { useEffect, useRef, useState } from "react";
import { Menu, ChevronRight, CloudOff, RefreshCw } from "lucide-react";
import Header from "../components/Header";
import ServiceSearchForm from "../components/search/ServiceSearchForm";
import { Link } from "react-router-dom";
import chooseService from "../assets/public-home/choose-service.svg";
import chooseTime from "../assets/public-home/choose-time.svg";
import chooseBook from "../assets/public-home/book.svg";
import bookingGirl from "../assets/public-home/booking-person.svg";
import CategoryGrid from "../components/search/CategoryGrid";
import joinMasterLeft from "../assets/public-home/join-master-left.svg";
import joinMasterRight from "../assets/public-home/join-master-right.svg";
import telegramIcon from "../assets/social/telegram.svg";
import instagramIcon from "../assets/social/instagram.svg";
import facebookIcon from "../assets/social/facebook.svg";
import { useNavigate } from "react-router-dom";
import { getHomeCategories, type HomeCategory } from "../api/homeCategories";

import { useAuth } from "../hooks/useAuth";
import { apiGetMe } from "../api/auth";
import { ApiError } from "../api/api";
import HomeMastersReviews from "../components/home/HomeMastersReviews";
import { activateProTrial, getProTrialAvailability } from "../api/subscriptions";

export default function PublicHomePage() {

  const [categories, setCategories] = useState<HomeCategory[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState("");
  const [categoriesRetry, setCategoriesRetry] = useState(0);


  const navigate = useNavigate();
  const { token, role } = useAuth();
  const [trialBusy, setTrialBusy] = useState(false);
  const [trialMessage, setTrialMessage] = useState("");
  const [trialActivated, setTrialActivated] = useState(false);
  const trialInFlight = useRef(false);

  // Перевірка не витрачає trial. Активація виконується лише після натискання.
  async function handleStartTrial() {
    if (trialInFlight.current) return;
    if (!token) {
      navigate("/login");
      return;
    }
    if (role !== "Master") {
      setTrialMessage("Пропозиція доступна лише для акаунта майстра.");
      return;
    }

    trialInFlight.current = true;
    setTrialBusy(true);
    setTrialMessage("");

    try {
      // Якщо POST уже пройшов, повторюємо тільки перевірку профілю.
      // Це потрібно, коли наступний GET завершився мережевою помилкою.
      if (!trialActivated) {
        const availability = await getProTrialAvailability();

        if (!availability.canStartProTrial) {
          setTrialMessage(
            availability.reason === "trial_already_used"
              ? "Ви вже скористалися пробним Pro."
              : availability.reason === "active_pro_exists"
                ? "У вас уже є активна підписка Pro."
                : "Пробний Pro зараз недоступний."
          );
          return;
        }

        await activateProTrial();
        setTrialActivated(true);
      }

      // Trial починається одразу; незавершений профіль направляємо на налаштування.
      const me = await apiGetMe();
      navigate(
        me.isOnboardingCompleted ? "/cabinet/account/tariff" : "/cabinet/setup"
      );
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        setTrialMessage("Сесія завершилася. Вийдіть з акаунта та увійдіть знову.");
      } else if (error instanceof ApiError && error.status === 404) {
        setTrialMessage("Профіль майстра не знайдено. Завершіть налаштування профілю.");
      } else if (error instanceof ApiError && error.status === 409) {
        setTrialMessage("Пробний Pro уже використано або у вас уже діє Pro. Перевірте свій тариф.");
      } else {
        setTrialMessage(error instanceof Error
          ? error.message
          : "Не вдалося активувати пробний Pro. Спробуйте ще раз.");
      }
    } finally {
      trialInFlight.current = false;
      setTrialBusy(false);
    }
  }


  useEffect(() => {
    let active = true;

    async function loadCategories() {
      try {
        const data = await getHomeCategories();
        if (active) {
          setCategories(data);
          setCategoriesError("");
        }
      } catch {
        if (active) setCategoriesError("Не вдалося завантажити категорії");
      } finally {
        if (active) setCategoriesLoading(false);
      }
    }

    void loadCategories();
    // Після виходу зі сторінки не оновлюємо її стан.
    return () => { active = false; };
  }, [categoriesRetry]);

  function handleRetryCategories() {
    if (categoriesLoading) return;
    setCategoriesLoading(true);
    // Повторюємо лише запит категорій, зберігаючи решту сторінки.
    setCategoriesRetry((previous) => previous + 1);
  }



  function handleSearch(query: string) {

    if (!query) return;

    const params = new URLSearchParams();
    params.set("search", query);

    navigate(`/catalog?${params.toString()}`);
  }

  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-bg text-text">
      {menuOpen && <div aria-hidden="true" onClick={() => setMenuOpen(false)} className="fixed inset-0 z-20 bg-bg" />}
      <Header
        menu={
          <div
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                setMenuOpen(false);
              }
            }}
          >
            <button
              type="button"
              aria-label={menuOpen ? "Закрити меню" : "Відкрити меню"}
              aria-expanded={menuOpen}
              aria-controls="home-menu"
              onClick={() => setMenuOpen((previous) => !previous)}
              className="flex size-11 items-center justify-center rounded-lg focus-visible:outline-2"
            >
              <Menu aria-hidden="true" className="size-6" />
            </button>

            {menuOpen && (
              <nav
                id="home-menu"
                aria-label="Головна навігація"
                className="absolute left-3 top-full z-40 w-[calc(100%-24px)] max-w-72 rounded-b-4xl bg-[#f5f5f5] px-3 pb-4 shadow-[0_20px_30px_rgba(0,0,0,0.25)] lg:left-6 lg:max-w-80"
              >
                <ul className="divide-y divide-border">
                  <li>
                    <Link
                      to="/login"
                      onClick={() => setMenuOpen(false)}
                      className="flex min-h-12 items-center px-3 py-3 text-sm text-black hover:bg-black/5"
                    >
                      Увійти / зареєструватися
                    </Link>
                  </li>

                  {[
                    { href: "#about", label: "Про нас" },
                    { href: "#services", label: "Послуги" },
                    { href: "#offers", label: "Пропозиції" },
                    { href: "#socials", label: "Соцмережі" },
                  ].map(({ href, label }) => (
                    <li key={href}>
                      <a
                        href={href}
                        onClick={() => setMenuOpen(false)}
                        className="flex min-h-12 items-center px-3 py-3 text-sm text-black hover:bg-black/5"
                      >
                        {label}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            )}
          </div>
        }
      />

      <main>
        <section aria-labelledby="hero-title" className="px-4 pt-8 text-center text-black lg:pt-12">
          <p className="text-[15px] italic leading-snug lg:text-xl">Знайдіть та забронюйте ваших</p>

          <h1 id="hero-title" className="mt-2 text-[28px] font-bold leading-tight lg:text-5xl">
            ІДЕАЛЬНИХ ФАХІВЦІВ
          </h1>

          <p className="mt-1 text-[15px] leading-snug lg:mt-2 lg:text-xl">з краси і здоров’я поруч із вами</p>

          <div className="relative z-10 mx-auto mt-6 w-full max-w-2xl lg:mt-8">
            <ServiceSearchForm onSearch={handleSearch} className="z-10 mx-auto mt-6 w-full max-w-2xl lg:mt-8" />
          </div>

          <nav
            id="services"
            aria-label="Категорії послуг"
            className="mx-auto -mt-7 w-[calc(100%-16px)] max-w-164 rounded-b-[36px] bg-[#f5f5f5] px-3 pb-8 pt-13 lg:px-6 lg:pb-10"
          >

            {categoriesLoading && !categoriesError && (
              <p role="status" className="py-4 text-center text-sm">
                Завантаження категорій…
              </p>
            )}

            {categoriesError && (
              <div className="flex flex-col items-center gap-3 px-2 py-4 text-center">
                <CloudOff size={32} strokeWidth={1.5} aria-hidden="true" className="text-neutral-500" />
                <div role="alert">
                  <p className="text-base font-semibold text-black">{categoriesError}</p>
                  <p className="mt-2 max-w-sm text-sm text-neutral-600">
                    Перевірте з’єднання з інтернетом або спробуйте пізніше.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleRetryCategories}
                  disabled={categoriesLoading}
                  className="mt-1 flex min-h-11 items-center justify-center gap-2 rounded-full bg-black px-5 py-3 text-sm text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black disabled:cursor-wait disabled:opacity-60"
                >
                  <RefreshCw size={16} aria-hidden="true" className={categoriesLoading ? "animate-spin motion-reduce:animate-none" : ""} />
                  <span role="status">{categoriesLoading ? "Завантажуємо…" : "Спробувати ще раз"}</span>
                </button>
              </div>
            )}

            {!categoriesLoading &&
              !categoriesError &&
              categories.length === 0 && (
                <p className="py-4 text-center text-sm text-muted">
                  Категорій поки немає.
                </p>
              )}
            <CategoryGrid categories={categories} />
          </nav>
        </section>

        <section aria-label="Як це працює" className="mx-auto flex w-full max-w-2xl flex-col items-center px-4">
          <img src={bookingGirl} alt="" className="relative z-0 block h-50 w-auto object-contain lg:h-64" />

          <div className="relative z-10 grid w-full grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-x-1 rounded-3xl bg-surface px-3 py-4 shadow-[0_12px_24px_rgba(0,0,0,0.2)] lg:gap-x-4 lg:rounded-[40px] lg:px-8 lg:py-6">
            <div className="flex min-w-0 flex-col items-center gap-2">
              <img src={chooseService} alt="picture chooseService" className="h-9 w-9 lg:h-12 lg:w-12" />
              <p className="text-center text-[10px] leading-tight text-text lg:text-base">1. Оберіть послугу</p>
            </div>

            <ChevronRight aria-hidden="true" className="h-5 w-5 self-start mt-2 text-blue-500 lg:mt-3 lg:h-6 lg:w-6" />

            <div className="flex min-w-0 flex-col items-center gap-2">
              <img src={chooseTime} alt="" className="h-9 w-9 lg:h-12 lg:w-12" />
              <p className="text-center text-[10px] leading-tight text-text lg:text-base">2. Оберіть час</p>
            </div>

            <ChevronRight aria-hidden="true" className="h-5 w-5 self-start mt-2 text-blue-500 lg:mt-3 lg:h-6 lg:w-6" />

            <div className="flex min-w-0 flex-col items-center gap-2">
              <img src={chooseBook} alt="" className="h-9 w-9 lg:h-12 lg:w-12" />
              <p className="text-center text-[10px] leading-tight text-text lg:text-base">3. Забронюйте</p>
            </div>
          </div>
        </section>

        <section id="about" aria-labelledby="about-title" className="bg-white px-4 pb-8 pt-10 text-black lg:pb-12 lg:pt-14">
          <div className="mx-auto max-w-2xl">
            <h2 id="about-title" className="text-center text-xl font-medium leading-tight lg:text-3xl">
              Що таке <span className="font-bold italic">Slotik</span>?
            </h2>

            <div className="mt-3 text-xs leading-[1.341] lg:mt-5 lg:text-base">
              <p className="italic">Сервіс швидкого онлайн-запису до майстрів краси та здоров’я у вашому місті.</p>

              <ul className="list-disc pl-4 lg:pl-5">
                <li>Запис за 1 хвилину — 24/7 без дзвінків і листувань.</li>
                <li>Чесний вибір — реальні відгуки, фото робіт та рейтинги.</li>
                <li>Нічого зайвого — прозорі ціни та автоматичні нагадування про візит.</li>
              </ul>
            </div>
          </div>
        </section>

        <HomeMastersReviews />

        <section id="offers" aria-label="Пропозиція для майстрів" className="px-3 py-2 lg:pt-4 lg:pb-6">
          <div className="relative mx-auto max-w-2xl">
            <div className="flex items-stretch rounded-[40px] bg-[#f5f5f5] px-4 py-3 text-black shadow-[0_16px_30px_rgba(0,0,0,0.25)] lg:rounded-[56px] lg:px-7 lg:py-5">
              <div className="flex shrink-0 items-center border-r border-border pr-3 lg:pr-6">
                <span className="text-[28px] font-medium leading-none lg:text-5xl">-100%</span>
              </div>

              <div className="min-w-0 py-2 pl-3 lg:py-3 lg:pl-6">
                <div className="flex flex-wrap items-baseline gap-2 lg:gap-3">
                  <span className="text-xl text-border line-through lg:text-3xl">200₴</span>

                  <span className="text-xl font-semibold lg:text-3xl">0₴</span>
                </div>

                <p className="mt-1 text-xs leading-snug lg:text-lg">1 тиждень Професійної підписки</p>
              </div>
            </div>

            <button
              type="button"
              disabled={trialBusy}
              onClick={handleStartTrial}
              aria-describedby="trial-offer-description"
              className="relative z-10 -mt-2 mr-2 ml-auto block min-h-11 max-w-[calc(100%-16px)] rounded-full bg-black px-4 py-2 text-xs leading-tight text-white disabled:cursor-not-allowed lg:absolute lg:-bottom-4 lg:right-3 lg:m-0 lg:px-9 lg:text-lg"
            >
              {trialBusy ? "Перевіряємо…" : trialActivated ? "Продовжити" : !token ? "Увійти та спробувати" : "Спробувати Pro"}
            </button>
          </div>
        </section>

        <div className="mx-auto max-w-2xl px-4 pb-4 pt-6">
          <p id="trial-offer-description" className="text-sm text-muted">
            Пробний Pro на 7 днів доступний один раз для майстра. Відлік починається після активації.
          </p>
          {trialActivated && (
            <p role="status" className="mt-2 text-sm">
              Пробний Pro активовано. Повторна активація не потрібна.
            </p>
          )}
          {trialMessage && (
            <p role="status" className="mt-2 text-sm">{trialMessage}</p>
          )}
          {token && role === "Master" && trialMessage && (
            <Link to="/cabinet" className="mt-2 inline-block underline">
              Перейти до кабінету
            </Link>
          )}
        </div>
        <section aria-labelledby="join-title" className="bg-linear-to-b from-transparent to-white px-2 lg:px-6 lg:pt-4">
          <div className="mx-auto grid min-h-45 w-full max-w-105 grid-cols-[minmax(0,1fr)_minmax(0,1.8fr)_minmax(0,1fr)] items-end gap-1 sm:gap-2 lg:min-h-75 lg:max-w-225 lg:grid-cols-[1fr_1.4fr_1fr] lg:gap-6">
            <img src={joinMasterLeft} alt="" className="block h-40 w-full object-contain object-bottom sm:h-45 lg:h-70" />

            <div className="relative z-10 mb-9 min-w-0 rounded-xl bg-white px-2 py-3 text-black shadow-[0_12px_24px_rgba(0,0,0,0.25)] sm:px-3 lg:mb-16 lg:rounded-3xl lg:px-6 lg:py-7">
              <h2 id="join-title" className="text-xs font-bold leading-snug sm:text-sm lg:text-xl">
                Ви майстер?
              </h2>

              <p className="mt-1 text-xs leading-snug sm:text-sm lg:mt-2 lg:text-lg">
                Приєднуйтесь до <span className="font-bold italic">Slotik!</span>
              </p>

              <Link
                to="/login?tab=register"
                className="mt-3 flex min-h-11 w-full items-center justify-center rounded-full bg-black px-2 py-2 text-center text-[11px] font-medium text-white transition-colors hover:bg-black/80 sm:text-xs lg:mt-5 lg:min-h-12 lg:px-4 lg:text-base"
              >
                Зареєструватися
              </Link>
            </div>

            <img src={joinMasterRight} alt="" className="block h-40 w-full object-contain object-bottom sm:h-45 lg:h-70" />
          </div>
        </section>
      </main>

      <footer id="socials" className="bg-white px-4 pb-6 pt-4 text-black lg:pb-10 lg:pt-6">
        <nav aria-label="Посилання в підвалі">
          <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs lg:gap-x-8 lg:text-base">
            <li>
              <Link to="/faq" className="inline-flex min-h-11 items-center hover:underline">
                FAQ
              </Link>
            </li>

            <li>
              <a href="#about" className="inline-flex min-h-11 items-center hover:underline">
                Про нас
              </a>
            </li>

            <li>
              <Link to="/support" className="inline-flex min-h-11 items-center hover:underline">
                Підтримка
              </Link>
            </li>

            <li>
              <a href="#services" className="inline-flex min-h-11 items-center hover:underline">
                Послуги
              </a>
            </li>
          </ul>
        </nav>

        <div role="group" aria-label="Соціальні мережі" className="flex items-center justify-center gap-1 lg:gap-3">
          {[
            { label: "Telegram", icon: telegramIcon },
            { label: "Instagram", icon: instagramIcon },
            { label: "Facebook", icon: facebookIcon },
          ].map(({ label, icon }) => (
            <button
              key={label}
              type="button"
              disabled
              aria-label={`${label} — незабаром`}
              title={`${label} — незабаром`}
              className="flex h-11 w-11 items-center justify-center rounded-full disabled:cursor-not-allowed"
            >
              <img src={icon} alt="" className="h-6 w-6 lg:h-7 lg:w-7" />
            </button>
          ))}
        </div>
      </footer>
    </div>
  );
}



