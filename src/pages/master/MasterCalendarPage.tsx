import { useEffect, useRef, useState } from "react";
import { CalendarDays, LockKeyhole, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { getOwnSubscriptions, type Subscription } from "../../api/subscriptions";
import { ApiError } from "../../api/api";
import { changeBookingStatus, getMasterBookings, type BookingStatus, type MasterBooking } from "../../api/bookings";
import { getOwnSchedule, type WeeklySchedule } from "../../api/schedules";
import MasterMonthCalendar from "../../components/master/MasterMonthCalendar";
import MasterBookingCard from "../../components/master/MasterBookingCard";
import { getOwnDaysOff, type DayOff } from "../../api/daysOff";

// Перетворюємо час запису на дату YYYY-MM-DD за Києвом.
function getKyivDate(value: string | Date): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Kyiv",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;
  return `${year}-${month}-${day}`;
}

export default function MasterCalendarPage() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [checking, setChecking] = useState(true);
  const [accessError, setAccessError] = useState("");
  const [retry, setRetry] = useState(0);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    let active = true;

    async function loadAccess() {
      try {
        const subscriptions = await getOwnSubscriptions();
        const current = subscriptions.find((item) => {
          return item.isEffective;
        });

        if (active) {
          setSubscription(current ?? null);
          setNow(Date.now());
          setAccessError("");
        }
      } catch {
        if (active) {
          setAccessError("Не вдалося перевірити тариф. Перевірте з’єднання та спробуйте ще раз.");
        }
      } finally {
        if (active) {
          setChecking(false);
        }
      }
    }

    void loadAccess();
    return () => {
      active = false;
    };
  }, [retry]);

  // Після повернення з оплати або іншої вкладки перевіряємо тариф знову.
  useEffect(() => {
    function recheckAccess() {
      setChecking(true);
      setRetry((previous) => {
        return previous + 1;
      });
    }

    window.addEventListener("focus", recheckAccess);
    return () => {
      window.removeEventListener("focus", recheckAccess);
    };
  }, []);

  // Якщо тариф закінчиться на відкритій сторінці, календар також закриється.
  useEffect(() => {
    if (!subscription || subscription.plan === 0) {
      return;
    }

    const remaining = Date.parse(subscription.expiresAt) - Date.now();
    if (!Number.isFinite(remaining) || remaining <= 0) {
      return;
    }

    // У браузера є обмеження максимальної тривалості одного таймера.
    const timer = window.setTimeout(() => {
      setNow(Date.now());
    }, Math.min(remaining + 1, 2_147_483_647));

    return () => {
      window.clearTimeout(timer);
    };
  }, [subscription, now]);

  function retryAccess() {
    setChecking(true);
    setAccessError("");
    setRetry((previous) => {
      return previous + 1;
    });
  }

  if (checking) {
    return (
      <div role="status" className="mx-auto max-w-md rounded-3xl border border-neutral-200 bg-white p-8 text-center">
        <CalendarDays size={28} className="mx-auto mb-4 text-neutral-400" aria-hidden="true" />
        <p className="text-sm text-neutral-500">Перевіряємо доступ до календаря…</p>
      </div>
    );
  }

  if (accessError) {
    return (
      <div className="mx-auto max-w-md space-y-4 rounded-3xl border border-neutral-200 bg-white p-6">
        <h1 className="text-xl font-semibold">Календар</h1>
        <p role="alert" className="text-sm leading-relaxed text-red-600">{accessError}</p>
        <button type="button" onClick={retryAccess} className="min-h-11 w-full rounded-xl bg-black px-5 py-3 text-sm font-medium text-white focus-visible:outline-2 focus-visible:outline-offset-4">
          Спробувати ще раз
        </button>
      </div>
    );
  }

  let canUseCalendar = false;
  if (subscription) {
    const isPaidPlan = subscription.plan === 1 || subscription.plan === 2;
    const isActive = subscription.status === 0;
    const hasNotExpired = Date.parse(subscription.expiresAt) > now;
    canUseCalendar = isPaidPlan && isActive && hasNotExpired;
  }

  if (!canUseCalendar) {
    return (
      <div className="mx-auto w-full max-w-md space-y-6">
        <h1 className="text-2xl font-semibold">Календар</h1>
        <section className="rounded-3xl border border-neutral-200 bg-white px-5 py-8 text-center shadow-sm sm:px-8">
          <div className="relative mx-auto mb-6 flex size-20 items-center justify-center rounded-3xl bg-neutral-100">
            <CalendarDays size={36} strokeWidth={1.5} aria-hidden="true" />
            <span className="absolute -bottom-1 -right-1 rounded-full border-4 border-white bg-black p-2 text-white">
              <LockKeyhole size={14} aria-hidden="true" />
            </span>
          </div>
          <p className="mb-3 text-xs font-medium uppercase tracking-widest text-neutral-500">Базовий · Професійний</p>
          <h2 className="text-xl font-semibold">Усі записи — в одному календарі</h2>
          <p className="mt-3 text-sm leading-relaxed text-neutral-500">
            Переглядайте записи за датами, робочі дні та відпустки.
            Календар доступний з активним тарифом «Базовий», «Професійний» або пробним Pro.
          </p>
          <Link to="/cabinet/plans?mode=change" className="mt-6 flex min-h-12 items-center justify-center rounded-xl bg-black px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-neutral-800 focus-visible:outline-2 focus-visible:outline-offset-4">
            Обрати тариф
          </Link>
          <Link to="/cabinet/account/bookings" className="mt-3 flex min-h-11 items-center justify-center rounded-xl border border-neutral-300 px-5 py-3 text-sm font-medium transition-colors hover:bg-neutral-50 focus-visible:outline-2 focus-visible:outline-offset-4">
            Переглянути мої записи
          </Link>
          <p className="mt-4 text-xs leading-relaxed text-neutral-500">
            Наявні записи збережені. Ви можете переглядати їх і змінювати статус у розділі «Ваші записи».
          </p>
        </section>
      </div>
    );
  }

  // Дані календаря завантажуються лише після успішної перевірки тарифу.
  return <MasterCalendarContent />;
}

function MasterCalendarContent() {
  // Вибрана дата та текст пошуку. Порожня дата означає, що день не вибрано.
  const [selectedDate, setSelectedDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Дані, отримані з бекенду.
  const [bookings, setBookings] = useState<MasterBooking[]>([]);
  const [schedule, setSchedule] = useState<WeeklySchedule | null>(null);

  // Кожен запит має своє повідомлення про помилку.
  const [loading, setLoading] = useState(true);
  const [bookingsError, setBookingsError] = useState("");
  // Зберігаємо пояснення окремо від картки, яка може зникнути зі списку.
  const [statusMessage, setStatusMessage] = useState("");
  const [scheduleError, setScheduleError] = useState("");
  const [reloadCount, setReloadCount] = useState(0);
  const [currentTime, setCurrentTime] = useState(() => Date.now());

  // Set зберігає ID записів, статус яких зараз змінюється.
  // Ref блокує повторний запит одразу, а стан оновлює кнопку «Оновити».
  const updatingBookingIds = useRef(new Set<number>());
  const [updatingCount, setUpdatingCount] = useState(0);

  const [daysOff, setDaysOff] = useState<DayOff[]>([]);
  const [daysOffError, setDaysOffError] = useState("");

  // Раз на хвилину оновлюємо час для списку найближчих записів.
  // Цей таймер не робить запитів до бекенду.
  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrentTime(Date.now());
    }, 60_000);

    return () => window.clearInterval(timer);
  }, []);

  // Завантажуємо дані при відкритті сторінки та після натискання «Оновити».
  useEffect(() => {
    let active = true;

    async function loadCalendar() {
      // Запити незалежні. allSettled повертає результат кожного,
      // навіть якщо один із них завершився помилкою.
      const [bookingsResult, scheduleResult, daysOffResult] = await Promise.allSettled([
        getMasterBookings(), // GET /api/Booking/master/me
        getOwnSchedule(),   // GET /api/Schedule/me
        getOwnDaysOff(),   // GET /api/DaysOff/me
      ]);

      // Після виходу зі сторінки або початку нового завантаження
      // ігноруємо відповідь попереднього ефекту.
      if (!active) return;

      if (bookingsResult.status === "fulfilled") {
        setBookings(bookingsResult.value);
        setBookingsError("");
      } else {
        const error: unknown = bookingsResult.reason;
        setBookingsError(
          error instanceof ApiError
            ? error.message
            : "Не вдалося завантажити записи. Натисніть «Оновити».",
        );
      }

      if (scheduleResult.status === "fulfilled") {
        setSchedule(scheduleResult.value);
        setScheduleError("");
      } else {
        const error: unknown = scheduleResult.reason;
        setSchedule(null);
        setScheduleError(
          error instanceof ApiError
            ? error.message
            : "Не вдалося завантажити робочий графік. Натисніть «Оновити».",
        );
      }

      // Помилка відпусток не приховує графік та записи, які завантажилися.
      if (daysOffResult.status === "fulfilled") {
        setDaysOff(daysOffResult.value.daysOff);
        setDaysOffError("");
      } else {
        const error: unknown = daysOffResult.reason;
        setDaysOff([]);
        setDaysOffError(
          error instanceof ApiError
            ? error.message
            : "Не вдалося завантажити відпустки. Натисніть «Оновити».",
        );
      }

      setLoading(false);
    }

    void loadCalendar();

    return () => {
      active = false;
    };
  }, [reloadCount]);

  function refreshCalendar() {
    setLoading(true);
    setBookingsError("");
    setScheduleError("");
    setDaysOffError("");
    setReloadCount((previous) => previous + 1);
  }

  function showUpcomingBookings() {
    setSelectedDate("");
    setSearchQuery("");
  }

  // Картка викликає цю функцію при підтвердженні, завершенні або скасуванні запису.
  async function handleChangeStatus(id: number, status: BookingStatus) {
    if (updatingBookingIds.current.has(id)) return;

    updatingBookingIds.current.add(id);
    setUpdatingCount(updatingBookingIds.current.size);
    setStatusMessage("");

    try {
      // PATCH /api/Booking/master/{id}/status
      const savedBooking = await changeBookingStatus(id, status);

      // Оновлюємо лише змінений запис після успішної відповіді бекенду.
      setBookings((previousBookings) => {
        return previousBookings.map((booking) => {
          if (booking.id === savedBooking.id) {
            return { ...booking, status: savedBooking.status };
          }
          return booking;
        });
      });
    } catch (error) {
      if (!(error instanceof ApiError) || error.code !== "pending_booking_expired") {
        throw error; // Інші помилки показуємо в картці запису.
      }

      // При цій помилці бек уже зберіг Cancelled. Оновлюємо лише записи.
      setStatusMessage(error.message);
      try {
        const currentBookings = await getMasterBookings();
        setBookings(currentBookings);
        setCurrentTime(Date.now());
        setBookingsError("");
      } catch {
        setBookingsError("Статус запису змінився, але список не вдалося оновити. Натисніть «Оновити».");
      }
    } finally {
      // Блокування знімаємо і після успіху, і після помилки.
      updatingBookingIds.current.delete(id);
      setUpdatingCount(updatingBookingIds.current.size);
    }
  }

  // Прострочений Pending не є активним, навіть якщо бек ще не змінив його статус.
  function isActiveBooking(booking: MasterBooking) {
    if (booking.status === 1) return true;
    return booking.status === 0 &&
      Date.parse(booking.pendingExpiresAt ?? booking.startsAt) > currentTime;
  }

  // Підраховуємо активні записи для зелених позначок календаря.
  const bookingCounts: Record<string, number> = {};
  for (const booking of bookings) {
    const date = getKyivDate(booking.startsAt);
    if (date && isActiveBooking(booking)) {
      bookingCounts[date] = (bookingCounts[date] ?? 0) + 1;
    }
  }

  // Пошук працює за послугою, ім’ям клієнта та датою в обох форматах.
  const searchText = searchQuery.trim().toLocaleLowerCase("uk-UA");
  const visibleBookings = bookings.filter((booking) => {
    const date = getKyivDate(booking.startsAt);
    const displayDate = date.split("-").reverse().join(".");
    const searchableText = [
      booking.serviceName,
      booking.clientFirstName,
      booking.clientLastName,
      date,
      displayDate,
    ].join(" ").toLocaleLowerCase("uk-UA");   //"манікюр анна попова 2026-10-13 13.10.2026"

    if (!searchableText.includes(searchText)) return false;

    // Якщо день вибрано, пошук обмежується цим днем.
    if (selectedDate) return date === selectedDate;

    // Без вибраного дня шукаємо серед усіх завантажених записів.
    if (searchText) return true;

    // Поточна процедура залишається у списку до закінчення її часу.
    const hasNotEnded = Date.parse(booking.endsAt) > currentTime;
    return isActiveBooking(booking) && hasNotEnded;
  });
  visibleBookings.sort((first, second) => Date.parse(first.startsAt) - Date.parse(second.startsAt));
  // Робочі дні потрібні календарю для сірого позначення дат.
  const workingWeekdays = schedule?.days
    .filter((day) => day.isWorking && day.intervals.length > 0)
    .map((day) => day.weekday);

  // Тексти визначаємо окремо, щоб не вкладати кілька умов у JSX.
  let listTitle = "Найближчі записи";
  if (selectedDate) {
    listTitle = `Записи на ${selectedDate.split("-").reverse().join(".")}`;
  } else if (searchText) {
    listTitle = "Результати пошуку";
  }

  let emptyMessage = "Поточних і майбутніх активних записів поки немає.";
  if (searchText) {
    emptyMessage = "За вашим пошуком записів немає.";
  } else if (selectedDate) {
    emptyMessage = "На цю дату записів немає.";
  }

  // Вибираємо один стан списку: завантаження, помилка, порожній список або картки.
  function renderBookings() {
    if (loading) return <p role="status">Завантажуємо записи…</p>;
    if (bookingsError) return <p role="alert" className="text-red-600">{bookingsError}</p>;
    if (visibleBookings.length === 0) {
      return (
        <p role="status" className="rounded-2xl border border-neutral-200 p-5 text-sm text-neutral-500">
          {emptyMessage}
        </p>
      );
    }

    return visibleBookings.map((booking) => (
      <MasterBookingCard
        key={booking.id}
        booking={booking}
        currentTime={currentTime}
        onChangeStatus={handleChangeStatus}
      />
    ));
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-5">
      <h1 className="sr-only">Календар записів</h1>

      {/* Пошук фільтрує вже завантажені записи без нового запиту. */}
      <label className="flex items-center gap-3 rounded-full bg-white px-5 py-4 shadow-md">
        <Search size={20} aria-hidden="true" />
        <input
          aria-label="Пошук за послугою, клієнтом або датою"
          type="search"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Послуга, клієнт або дата…"
          className="min-w-0 flex-1 bg-transparent text-sm outline-none focus-visible:ring-2 focus-visible:ring-neutral-300"
        />
      </label>

      <MasterMonthCalendar
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        bookingCounts={bookingCounts}
        workingWeekdays={workingWeekdays}
        daysOff={daysOff}
        todayDate={getKyivDate(new Date(currentTime))}
      />
      <p className="text-xs text-neutral-500">
        Червоні дні — відпустка. Зелені — активні записи. Сірі — робочі дні за тижневим графіком. Час — за Києвом.
      </p>

      {/* Помилка графіка не приховує успішно завантажені записи клієнтів. */}
      {daysOffError && (
        <p role="alert" className="text-sm text-amber-800">
          Відпустки: {daysOffError}
        </p>
      )}
      {scheduleError && (
        <p role="alert" className="text-sm text-amber-800">
          Робочий графік: {scheduleError}
        </p>
      )}

      <section aria-busy={loading} className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold">{listTitle}</h2>
          <button
            type="button"
            disabled={loading || updatingCount > 0}
            onClick={refreshCalendar}
            className="min-h-10 text-sm text-blue-600 disabled:opacity-50"
          >
            Оновити
          </button>
        </div>

        {selectedDate && (
          <button
            type="button"
            onClick={showUpcomingBookings}
            className="min-h-10 text-sm text-blue-600"
          >
            Показати найближчі записи
          </button>
        )}

        {statusMessage && (
          <p role="status" className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-800">
            {statusMessage}
          </p>
        )}

        {renderBookings()}
      </section>
    </div>
  );
}
