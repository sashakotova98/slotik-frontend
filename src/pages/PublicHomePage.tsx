import { useState } from "react";
import { Menu, CircleUserRound, Search, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import chooseService from "../assets/public-home/choose-service.svg";
import chooseTime from "../assets/public-home/choose-time.svg";
import chooseBook from "../assets/public-home/book.svg";
import bookingGirl from "../assets/public-home/booking-person.svg";
import logo from "../assets/logo.svg";
import { CategoryIcon } from "../components/categories/CategoryIcon";
import joinMasterLeft from "../assets/public-home/join-master-left.svg";
import joinMasterRight from "../assets/public-home/join-master-right.svg";
import telegramIcon from "../assets/social/telegram.svg";
import instagramIcon from "../assets/social/instagram.svg";
import facebookIcon from "../assets/social/facebook.svg";

const categories = [
  { icon: "manicure-pedicure", title: "Манікюр / Педикюр" },
  { icon: "massage", title: "Масаж" },
  { icon: "haircut-styling", title: "Зачіски та стрижки" },
  { icon: "hair-coloring", title: "Фарбування волосся" },
  { icon: "brows-lashes", title: "Брови та вії" },
  { icon: "makeup", title: "Макіяж" },
  { icon: "cosmetology", title: "Косметологія" },
  { icon: "depilation", title: "Депіляція" },
];

export default function PublicHomePage() {
  // const [search, setSearch] = setState<string>(null);

  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-bg text-text">
      {menuOpen && (
        <div
          aria-hidden="true"
          onClick={() => setMenuOpen(false)}
          className="fixed inset-0 z-20 bg-bg"
        />
      )}
      <header onKeyDown={(event) => {
        if (event.key === "Escape") setMenuOpen(false);
      }} className="relative z-30 flex items-center justify-between bg-surface px-4 py-6">
        <button type="button" aria-label={menuOpen ? "Закрити меню" : "Відкрити меню"} aria-expanded={menuOpen} aria-controls="home-menu" onClick={() => setMenuOpen((previous) => !previous)} >
          <Menu aria-hidden="true" className="h-6 w-6" />
        </button>

        <img src={logo} alt="Slotik" className="h-8 w-auto lg:h-10" />

        <Link to="/login" aria-label="Увійти">
          <CircleUserRound aria-hidden="true" className="h-6 w-6" />
        </Link>

        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-full h-10 bg-linear-to-b from-surface to-transparent"
        />

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
      </header>

      <main>
        <section aria-labelledby="hero-title" className="px-4 pt-8 text-center text-black lg:pt-12">
          <p className="text-[15px] italic leading-snug lg:text-xl">Знайдіть та забронюйте ваших</p>

          <h1 id="hero-title" className="mt-2 text-[28px] font-bold leading-tight lg:text-5xl">
            ІДЕАЛЬНИХ ФАХІВЦІВ
          </h1>

          <p className="mt-1 text-[15px] leading-snug lg:mt-2 lg:text-xl">з краси і здоров’я поруч із вами</p>

          <div className="relative z-10 mx-auto mt-6 w-full max-w-2xl lg:mt-8">
            <Search aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-black" />

            <input
              type="search"
              aria-label="Пошук послуги або майстра"
              placeholder="Послуга або майстер..."
              className="block h-14 w-full rounded-[47px] bg-white pl-12 pr-5 text-sm text-black placeholder:text-border shadow-[0_5px_8px_rgba(0,0,0,0.2)] outline-none focus-visible:ring-2 focus-visible:ring-black lg:h-16 lg:text-base"
            />
          </div>

          {/* <CategoryIcon name={category.icon} /> */}
          {/* category.icon здесь — пример: нужно использовать реальное название поля из API. 
          В CategoryIconPicker заменишь вывод Lucide: <Icon size={22} strokeWidth={1.25} aria-hidden="true" /> на общий компонент: <CategoryIcon name={optionValue} />  */}

          {/* категории и то не все где у нас не 0 мастеров и ве кликабельны выборка мастеров и вопрос у меня картинки с lucide-react  */}

          <nav
            id="services"
            aria-label="Категорії послуг"
            className="mx-auto -mt-7 w-[calc(100%-16px)] max-w-164 rounded-b-[36px] bg-[#f5f5f5] px-3 pb-8 pt-13 lg:px-6 lg:pb-10"
          >
            <ul className="grid grid-cols-4 gap-x-2 gap-y-5 lg:gap-6">
              {categories.map((category) => (
                <li key={category.icon} className="min-w-0">
                  <Link
                    to={`/catalog?category=${category.icon}`}
                    className="group flex h-full flex-col items-center gap-2 rounded-xl text-black focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black"
                  >
                    <span className="flex h-14.5 w-14.5 items-center justify-center rounded-[17px] border border-border/11 bg-[#f5f5f5] transition-colors group-hover:bg-white lg:h-20 lg:w-20">
                      <CategoryIcon name={category.icon} className="h-9 w-9 object-contain lg:h-12 lg:w-12" />
                    </span>

                    <span className="text-center text-[11px] leading-tight lg:text-sm">{category.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
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

        <section aria-labelledby="masters-preview-title" className="px-4 py-8 lg:py-12">
          <div className="mx-auto max-w-2xl rounded-4xl bg-surface px-6 py-8 text-center shadow-md lg:py-12">
            <h2 id="masters-preview-title" className="text-xl font-semibold text-text lg:text-3xl">
              Знайдіть свого майстра
            </h2>

            <p className="mx-auto mt-3 max-w-md text-sm text-muted lg:text-base">
              Незабаром тут з’являться профілі майстрів та фотографії їхніх робіт.
            </p>

            <span className="mt-5 inline-block rounded-full bg-[#eeeeee] px-4 py-2 text-xs text-muted lg:text-sm">Готуємо до запуску</span>
          </div>
        </section>

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
              disabled
              title="Пропозиція незабаром стане доступною"
              className="absolute -bottom-4 right-1 min-h-11 rounded-full bg-black px-6 py-2 text-sm text-white disabled:cursor-not-allowed lg:right-3 lg:px-9 lg:text-lg"
            >
              Далі…
            </button>
          </div>
        </section>

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
              <button type="button" disabled className="min-h-11 disabled:cursor-not-allowed disabled:text-[#777]">
                FAQ
              </button>
            </li>

            <li>
              <a href="#about" className="inline-flex min-h-11 items-center hover:underline">
                Про нас
              </a>
            </li>

            <li>
              <button type="button" disabled className="min-h-11 disabled:cursor-not-allowed disabled:text-[#777]">
                Підтримка
              </button>
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
