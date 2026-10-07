import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { X } from "lucide-react";
import MasterBookingCard from "../../components/master/MasterBookingCard";
import {
  getMasterBookings,
  changeBookingStatus,
  type MasterBooking,
  type BookingStatus,
} from "../../api/bookings";

export default function MasterBookingsPage() {
  const [bookings, setBookings] = useState<MasterBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
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
      } catch {
        if (active) {
          setError("Не вдалося завантажити записи. Спробуйте ще раз.");
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

  async function handleChangeStatus(
    id: number,
    status: BookingStatus,
  ) {
    if (pendingUpdates.current.has(id)) return;

    pendingUpdates.current.add(id);
    setUpdating(pendingUpdates.current.size);

    try {
      const updated = await changeBookingStatus(id, status);

      // Оновлюємо картку лише після успішної відповіді сервера.
      setBookings((current) =>
        current.map((booking) =>
          booking.id === updated.id
            ? { ...booking, status: updated.status }
            : booking,
        ),
      );
    } finally {
      pendingUpdates.current.delete(id);
      setUpdating(pendingUpdates.current.size);
    }
    // Помилку запиту показує MasterBookingCard.
  }

  // Запис залишається поточним до завершення його часу.
  function isCurrentOrUpcoming(booking: MasterBooking) {
    return (
      (booking.status === 0 || booking.status === 1) &&
      Date.parse(booking.endsAt) > now
    );
  }

  const upcoming = bookings
    .filter(isCurrentOrUpcoming)
    .sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt));

  const history = bookings
    .filter((booking) => !isCurrentOrUpcoming(booking))
    .sort((a, b) => Date.parse(b.startsAt) - Date.parse(a.startsAt));

  return (
    <div className="mx-auto w-full max-w-md space-y-5">
      <header className="flex items-center justify-between border-b border-neutral-300 pb-3">
        <h1 className="text-xl font-semibold">Ваші записи</h1>

        <Link
          to="/cabinet/account"
          aria-label="Повернутися до акаунта"
          className="flex size-10 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100"
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

      {loading ? (
        <p role="status" className="text-sm text-neutral-500">
          Завантажуємо ваші записи…
        </p>
      ) : error ? (
        <div role="alert" className="rounded-2xl bg-red-50 p-4">
          <p className="text-sm text-red-600">{error}</p>
          <button
            type="button"
            onClick={refresh}
            className="mt-3 min-h-10 text-sm font-medium text-red-700"
          >
            Спробувати ще раз
          </button>
        </div>
      ) : (
        <>
          <section className="space-y-3">
            <h2 className="text-sm text-neutral-500">
              Поточні та майбутні ({upcoming.length})
            </h2>

            {upcoming.length === 0 ? (
              <p className="rounded-2xl border border-neutral-200 p-4 text-sm text-neutral-500">
                Майбутніх активних записів поки немає.
              </p>
            ) : (
              upcoming.map((booking) => (
                <MasterBookingCard
                  key={booking.id}
                  booking={booking}
                  onChangeStatus={handleChangeStatus}
                />
              ))
            )}
          </section>

          <section className="space-y-3">
            <h2 className="text-sm text-neutral-500">
              Минулі та скасовані ({history.length})
            </h2>

            {history.length === 0 ? (
              <p className="rounded-2xl border border-neutral-200 p-4 text-sm text-neutral-500">
                Історія записів поки порожня.
              </p>
            ) : (
              history.map((booking) => (
                <MasterBookingCard
                  key={booking.id}
                  booking={booking}
                  onChangeStatus={handleChangeStatus}
                />
              ))
            )}
          </section>
        </>
      )}
    </div>
  );
}