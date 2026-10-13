import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { TrendingUp } from "lucide-react";
import { ApiError } from "../../api/api";
import { getMasterBookings, changeBookingStatus, type MasterBooking, type BookingStatus } from "../../api/bookings";
import MasterBookingCard from "../../components/master/MasterBookingCard";
import { getOwnProfile, type UserProfile } from "../../api/users";
import { useAuth } from "../../hooks/useAuth";

// Однакові місяць і рік дають однаковий текст, наприклад «жовтень 2026 р.».
function formatMonth(value: string | number) {
  return new Date(value).toLocaleDateString("uk-UA", {
    timeZone: "Europe/Kyiv",
    month: "long",
    year: "numeric",
  });
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString("uk-UA", {
    timeZone: "Europe/Kyiv",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function MasterCabinetPage() {
  // Список із сервера, стан завантаження та повідомлення для користувача.
  const [bookings, setBookings] = useState<MasterBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  // Зміна цього числа повторно запускає завантаження в useEffect.
  const [revision, setRevision] = useState(0);
  // Час оновлюємо разом із даними: при завантаженні та зміні статусу.
  const [now, setNow] = useState(() => {
    return Date.now();
  });
  // ID записів, які зараз зберігаються. Не надсилаємо той самий запит двічі.
  const pendingUpdates = useRef(new Set<number>());
  const [updating, setUpdating] = useState(0);

  const { token } = useAuth();

  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    let active = true;

    async function loadBookings() {
      try {
        const result = await getMasterBookings();
        if (active) {
          setBookings(result);
          setNow(Date.now());
          setError("");
        }
      } catch (err) {
        if (active) {
          if (err instanceof ApiError) {
            setError(err.message);
          } else {
            setError("Не вдалося завантажити записи. Спробуйте ще раз.");
          }
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }
    void loadBookings();
    // Не оновлюємо стан після виходу зі сторінки.
    return () => {
      active = false;
    };
  }, [revision]);

  function refresh() {
    if (loading || pendingUpdates.current.size > 0) {
      return;
    }
    setLoading(true);
    setError("");
    setRevision((value) => {
      return value + 1;
    });
  }

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      if (!token) {
        setProfile(null);
        return;
      }

      try {
        const result = await getOwnProfile(token);

        if (active) {
          setProfile(result);
        }
      } catch {
        // Якщо ім'я не завантажилося, залишаємо звичайний заголовок.
        if (active) {
          setProfile(null);
        }
      }
    }

    void loadProfile();

    return () => {
      active = false;
    };
  }, [token]);

  async function handleChangeStatus(id: number, status: BookingStatus) {
    if (pendingUpdates.current.has(id)) {
      return;
    }
    pendingUpdates.current.add(id);
    setUpdating(pendingUpdates.current.size);
    setStatusMessage("");
    try {
      const updated = await changeBookingStatus(id, status);
      // Картки та лічильники змінюються після відповіді сервера.
      setBookings((current) => {
        return current.map((booking) => {
          if (booking.id === updated.id) {
            return { ...booking, status: updated.status };
          }

          return booking;
        });
      });
      setNow(Date.now());
      if (updated.status === 1) {
        setStatusMessage("Запис підтверджено.");
      } else {
        setStatusMessage("Статус запису оновлено.");
      }
    } catch (err) {
      if (!(err instanceof ApiError) || err.code !== "pending_booking_expired") {
        // Інші помилки покаже MasterBookingCard біля кнопки.
        throw err;
      }
      // Прострочену заявку бек міг уже скасувати — перечитуємо список.
      setStatusMessage(err.message);
      try {
        const result = await getMasterBookings();
        setBookings(result);
        setNow(Date.now());
      } catch {
        setError("Статус запису змінився, але список не вдалося оновити. Натисніть «Оновити».");
      }
    } finally {
      pendingUpdates.current.delete(id);
      setUpdating(pendingUpdates.current.size);
    }
  }

  const monthLabel = formatMonth(now);
  // Рахуємо за датою процедури, а не датою створення заявки.
  const monthlyBookings = bookings.filter((booking) => {
    return formatMonth(booking.startsAt) === monthLabel;
  });

  const completed = monthlyBookings.filter((booking) => {
    return booking.status === 2;
  });

  // Спочатку відбираємо актуальні заявки, потім сортуємо за часом початку.
  const pending = bookings.filter((booking) => {
    const isPending = booking.status === 0;
    const deadline = booking.pendingExpiresAt ?? booking.startsAt;
    const canStillConfirm = Date.parse(deadline) > now;
    const hasNotStarted = Date.parse(booking.startsAt) > now;

    return isPending && canStillConfirm && hasNotStarted;
  });

  pending.sort((first, second) => {
    return Date.parse(first.startsAt) - Date.parse(second.startsAt);
  });

  // Поточна процедура залишається тут до закінчення її часу.
  const confirmed = bookings.filter((booking) => {
    const isConfirmed = booking.status === 1;
    const hasNotEnded = Date.parse(booking.endsAt) > now;

    return isConfirmed && hasNotEnded;
  });

  confirmed.sort((first, second) => {
    return Date.parse(first.startsAt) - Date.parse(second.startsAt);
  });

  const nearest = confirmed[0];

  // Готуємо текст окремо, щоб у JSX не було довгих обчислень.
  let nearestDate = "";
  let nearestClient = "Клієнт";
  let isInProgress = false;

  if (nearest) {
    nearestDate = new Date(nearest.startsAt).toLocaleDateString("uk-UA", {
      timeZone: "Europe/Kyiv",
      day: "numeric",
      month: "long",
    });
    const clientName = `${nearest.clientFirstName} ${nearest.clientLastName}`.trim();
    if (clientName) {
      nearestClient = clientName;
    }
    isInProgress = Date.parse(nearest.startsAt) <= now;
  }

  // Групуємо за ID: різні послуги можуть мати однакову назву.
  const serviceCounts = new Map<number, { id: number; name: string; count: number }>();
  for (const booking of completed) {
    const service = serviceCounts.get(booking.serviceId);
    if (service) {
      service.count += 1;
    } else {
      serviceCounts.set(booking.serviceId, {
        id: booking.serviceId,
        name: booking.serviceName,
        count: 1,
      });
    }
  }

  const services = [...serviceCounts.values()];
  services.sort((first, second) => {
    if (first.count === second.count) {
      return first.id - second.id;
    }
    return second.count - first.count;
  });
  const popular = services[0];
  const stats = [
    { label: "Записів за місяць", value: monthlyBookings.length },
    { label: "Завершено за місяць", value: completed.length },
    { label: "Чекають підтвердження", value: pending.length },
    { label: "Найближчі підтверджені", value: confirmed.length },
  ];

  return (
    <div className="mx-auto w-full max-w-md space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">
          {profile?.firstName
            ? `Вітаємо, ${profile.firstName}!`
            : "Кабінет майстра"}
        </h1>
        <div className="mt-2 flex items-center justify-between gap-3">
          <p className="text-sm capitalize text-neutral-500">{monthLabel}</p>
          <button
            type="button"
            onClick={refresh}
            disabled={loading || updating > 0}
            className="min-h-11 text-sm text-blue-600 disabled:opacity-50"
          >
            {loading ? "Завантаження…" : "Оновити"}
          </button>
        </div>
      </header>
      {statusMessage && (
        <p role="status" className="rounded-2xl bg-blue-50 p-4 text-sm text-blue-800">
          {statusMessage}
        </p>
      )}

      {loading && (
        <p role="status" className="text-sm text-neutral-500">
          Завантажуємо ваші записи…
        </p>
      )}

      {!loading && error && (
        <div role="alert" className="rounded-2xl bg-red-50 p-4">
          <p className="text-sm text-red-600">{error}</p>
          <button
            type="button"
            onClick={refresh}
            disabled={updating > 0}
            className="mt-2 min-h-11 text-sm text-red-700 disabled:opacity-50"
          >
            Спробувати ще раз
          </button>
        </div>
      )}

      {!loading && !error && (
        <>
          <section aria-label="Статистика записів" className="grid grid-cols-2 gap-x-5 gap-y-7 border-y border-neutral-200 py-6">
            {stats.map((stat) => {
              return (
                <div key={stat.label}>
                  <p className="text-4xl font-semibold tabular-nums">{stat.value}</p>
                  <p className="mt-1 text-sm">{stat.label}</p>
                </div>
              );
            })}
          </section>
          <p className="text-xs leading-relaxed text-neutral-500">
            За місяць — усі записи, включно зі скасованими. Очікування — усі актуальні заявки. Найближчі підтверджені — поточні та майбутні
            процедури. Час — за Києвом.
          </p>
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Потребують підтвердження</h2>
            {/* Бек обмежує строк: 24 години від створення або до початку процедури. */}
            <p className="text-sm leading-relaxed text-neutral-500">
              Підтвердьте заявку протягом 24 годин після її створення.
              Якщо процедура починається раніше — підтвердьте до її початку.
              Після завершення цього строку підтвердження недоступне.
            </p>
            {pending.length === 0 && (
              <p className="rounded-2xl border border-neutral-200 p-4 text-sm text-neutral-500">Нових заявок поки немає.</p>
            )}

            {pending.slice(0, 3).map((booking) => {
              return <MasterBookingCard key={booking.id} booking={booking} currentTime={now} onChangeStatus={handleChangeStatus} />;
            })}

            {pending.length > 3 && <p className="text-sm text-neutral-500">Показано 3 із {pending.length} заявок.</p>}
            <Link to="/cabinet/account/bookings" className="inline-flex min-h-11 items-center text-sm text-blue-600">
              Усі записи
            </Link>
          </section>
          <section className="rounded-3xl border border-neutral-200 p-5 shadow-sm">
            <h2 className="text-sm text-neutral-500">Найближчий запис</h2>
            {nearest ? (
              <div className="mt-3 space-y-2">
                {isInProgress && <p className="text-sm text-green-700">Триває зараз</p>}
                <p className="font-semibold">
                  {nearestDate} • {formatTime(nearest.startsAt)}–{formatTime(nearest.endsAt)}
                </p>
                <p className="wrap-break-word text-sm text-neutral-600">
                  {nearestClient} • {nearest.serviceName}
                </p>
              </div>
            ) : (
              <p className="mt-3 text-sm text-neutral-500">Найближчих підтверджених записів поки немає.</p>
            )}
            <Link to="/cabinet/calendar" className="mt-3 inline-flex min-h-11 items-center text-sm text-blue-600">
              Відкрити календар
            </Link>
          </section>
          <section className="flex items-start gap-3 rounded-3xl bg-blue-50 p-5 text-blue-700">
            <TrendingUp className="mt-1 shrink-0" size={26} aria-hidden="true" />
            <div className="min-w-0">
              <h2 className="text-sm font-medium">Найпопулярніша послуга за місяць</h2>
              {popular ? (
                <p className="mt-1 wrap-break-word text-sm">
                  {popular.name} • Завершених записів: {popular.count}
                </p>
              ) : (
                <p className="mt-1 text-sm">Цього місяця ще немає завершених записів.</p>
              )}
            </div>
          </section>
        </>
      )}

      <section className="space-y-3" aria-labelledby="reviews-heading">
        <h2 id="reviews-heading" className="text-lg font-semibold">
          Відгуки
        </h2>
        <p className="rounded-2xl border border-neutral-200 p-4 text-sm text-neutral-500">Перегляд відгуків поки недоступний.</p>
      </section>
    </div>
  );
}
