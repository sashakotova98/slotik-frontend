import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { X } from "lucide-react";
import MasterBookingCard from "../../components/master/MasterBookingCard";
import { getMasterBookings, changeBookingStatus, type MasterBooking, type BookingStatus } from "../../api/bookings";
import { ApiError } from "../../api/api";


export default function MasterBookingsPage() {
  const [bookings, setBookings] = useState<MasterBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  // Повідомлення не зникає, коли запис переходить до історії після оновлення.
  const [statusMessage, setStatusMessage] = useState("");
  const [revision, setRevision] = useState(0);
  const [now, setNow] = useState(() => Date.now());

  const pendingUpdates = useRef(new Set<number>());
  const [updating, setUpdating] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 60_000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let active = true;

    async function loadBookings() {
      try {
        const result = await getMasterBookings();

        if (active) {
          setBookings(result);
          setError("");
          setNow(Date.now());
        }
      } catch (error) {
        if (active) {
          setError(
            error instanceof ApiError
              ? error.message
              : "Не вдалося завантажити записи. Спробуйте ще раз."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadBookings();

    return () => {
      active = false;
    };
  }, [revision]);

  function refresh() {
    setLoading(true);
    setError("");
    setRevision((value) => value + 1);
  }

  async function handleChangeStatus(id: number, status: BookingStatus) {
    if (pendingUpdates.current.has(id)) return;

    pendingUpdates.current.add(id);
    setUpdating(pendingUpdates.current.size);
    setStatusMessage("");

    try {
      const updated = await changeBookingStatus(id, status);

      // Оновлюємо картку лише після успішної відповіді сервера.
      setBookings((current) => current.map((booking) => (booking.id === updated.id ? { ...booking, status: updated.status } : booking)));
    } catch (error) {
      if (!(error instanceof ApiError) || error.code !== "pending_booking_expired") {
        throw error; // Інші помилки показуємо в картці запису.
      }

      // Бек уже скасував прострочений Pending, хоча повернув 409.
      // Читаємо збережений статус і залишаємо пояснення над списком.
      setStatusMessage(error.message);
      try {
        const currentBookings = await getMasterBookings();
        setBookings(currentBookings);
        setNow(Date.now());
        setError("");
      } catch {
        setError("Статус запису змінився, але список не вдалося оновити. Натисніть «Оновити».");
      }
    } finally {
      pendingUpdates.current.delete(id);
      setUpdating(pendingUpdates.current.size);
    }
    // Помилку запиту показує MasterBookingCard.
  }

  // перевіряє зо запис не прострочений і ще актуальний або майбутній.
  function isCurrentOrUpcoming(booking: MasterBooking): boolean {
    // Вибираємо строк підтвердження.
    // Якщо його немає, беремо час початку запису.
    const deadline = booking.pendingExpiresAt ?? booking.startsAt;

    const deadlineMs = Date.parse(deadline);
    const endsAtMs = Date.parse(booking.endsAt);

    // Pending прострочений, якщо час підтвердження вже минув.
    const pendingExpired =
      booking.status === 0 && deadlineMs <= now;

    // Активні статуси: очікує підтвердження або підтверджено.
    const hasActiveStatus =
      booking.status === 0 || booking.status === 1;

    // Процедура ще не закінчилася.
    const hasNotEnded = endsAtMs > now;

    // Запис підходить, лише якщо виконуються всі три умови.
    return !pendingExpired && hasActiveStatus && hasNotEnded;
  }

  // Залишаємо поточні та майбутні записи.
  const upcoming = bookings
    .filter((booking) => isCurrentOrUpcoming(booking))
    .sort((a, b) => {
      const firstStartMs = Date.parse(a.startsAt);
      const secondStartMs = Date.parse(b.startsAt);

      // Раніші записи показуємо першими.
      return firstStartMs - secondStartMs;
    });


  const history = bookings
    .filter((booking) => !isCurrentOrUpcoming(booking))
    .sort((a, b) => {
      const firstStartMs = Date.parse(a.startsAt);
      const secondStartMs = Date.parse(b.startsAt);

      // Пізніші записи показуємо першими.
      return secondStartMs - firstStartMs;
    });

  return (
    <div className="mx-auto w-full max-w-md space-y-5">
      <header className="flex items-center justify-between border-b border-border pb-3">
        <h1 className="text-xl font-semibold">Ваші записи</h1>

        <Link
          to="/cabinet/account"
          aria-label="Повернутися до акаунта"
          className="flex size-10 items-center justify-center rounded-full text-copy-500 hover:bg-panel-100"
        >
          <X size={22} aria-hidden="true" />
        </Link>
      </header>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={refresh}
          disabled={loading || updating > 0}
          className="min-h-10 text-sm text-blue-600 disabled:opacity-50"
        >
          {loading ? "Завантаження…" : "Оновити"}
        </button>
      </div>

      {statusMessage && (
        <p role="status" className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-800">
          {statusMessage}
        </p>
      )}

      {loading ? (
        <p role="status" className="text-sm text-copy-500">
          Завантажуємо ваші записи…
        </p>
      ) : error ? (
        <div role="alert" className="rounded-2xl bg-red-50 p-4">
          <p className="text-sm text-red-600">{error}</p>
          <button type="button" onClick={refresh} className="mt-3 min-h-10 text-sm font-medium text-red-700">
            Спробувати ще раз
          </button>
        </div>
      ) : (
        <>
          <section className="space-y-3">
            <h2 className="text-sm text-copy-500">Поточні та майбутні ({upcoming.length})</h2>

            {upcoming.length === 0 ? (
              <p className="rounded-2xl border border-border p-4 text-sm text-copy-500">Майбутніх активних записів поки немає.</p>
            ) : (
              upcoming.map((booking) => <MasterBookingCard key={booking.id} booking={booking} currentTime={now} onChangeStatus={handleChangeStatus} />)
            )}
          </section>

          <section className="space-y-3">
            <h2 className="text-sm text-copy-500">Минулі та скасовані ({history.length})</h2>

            {history.length === 0 ? (
              <p className="rounded-2xl border border-border p-4 text-sm text-copy-500">Історія записів поки порожня.</p>
            ) : (
              history.map((booking) => <MasterBookingCard key={booking.id} booking={booking} currentTime={now} onChangeStatus={handleChangeStatus} />)
            )}
          </section>
        </>
      )}
    </div>
  );
}
