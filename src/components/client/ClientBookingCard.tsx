import { useEffect, useState } from "react";
import { getClientBookings, type ClientBooking } from "../../api/bookings";
import { getMasterById, type PublicMasterProfile } from "../../api/masters";
import BookingSummaryCard from "./BookingSummaryCard";

// Перевіряє, чи є запис активним (підтверджений або очікує підтвердження і ще не минув час).
function isActiveBooking(booking: ClientBooking, now: number) {
  const startsAt = new Date(booking.startsAt).getTime();
  const endsAt = new Date(booking.endsAt).getTime();

  if (!Number.isFinite(startsAt) || !Number.isFinite(endsAt)) {
    return false;
  }

  // Підтверджений запис вважається активним, якщо його час закінчення ще не настав.
  if (booking.status === 1) {
    return endsAt > now;
  }

  // Очікує підтвердження — активний лише до початку та закінчення терміну підтвердження.
  if (booking.status === 0) {
    const expiresAt = new Date(booking.pendingExpiresAt ?? booking.startsAt).getTime();

    return startsAt > now && expiresAt > now;
  }

  // Завершені та скасовані записи не вважаються активними.
  return false;
}

export default function ClientBookingCard() {
  const [bookings, setBookings] = useState<ClientBooking[]>([]);
  // Профілі зберігаємо за ID, щоб знаходити майстра для кожної картки.
  const [masters, setMasters] = useState<Record<number, PublicMasterProfile>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mastersError, setMastersError] = useState("");

  // Щохвилини оновлюємо час для відбору активних записів.
  // Це не повторний запит API: нові статуси завантажаться після відкриття сторінки.
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 60_000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let active = true;

    async function loadData() {
      try {
        // Один запит отримує записи для обох блоків.
        const data = await getClientBookings();
        if (!active) return;

        setBookings(data);

        // Set прибирає повтори ID: профіль кожного майстра запитуємо лише один раз.
        const currentTime = Date.now();
        const masterIds = [...new Set(data.filter((booking) => isActiveBooking(booking, currentTime)).map((booking) => booking.masterId))];

        // Помилка одного профілю не заважає показати решту майстрів і записи.
        const results = await Promise.allSettled(masterIds.map((id) => getMasterById(id)));

        if (!active) return;

        // Record: ключ — ID майстра, значення — його профіль.
        const profiles: Record<number, PublicMasterProfile> = {};

        for (const result of results) {
          if (result.status === "fulfilled") {
            profiles[result.value.id] = result.value;
          }
        }

        setMasters(profiles);

        if (results.some((result) => result.status === "rejected")) {
          setMastersError("Не вдалося завантажити імена деяких майстрів.");
        }
      } catch {
        if (active) {
          setError("Не вдалося завантажити ваші записи.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadData();

    return () => {
      active = false;
    };
  }, []);

  // Сортуємо активні записи за початком: від найближчих до пізніших.
  // filter створює новий масив, тому sort не змінює стан bookings.
  const activeBookings = bookings
    .filter((booking) => isActiveBooking(booking, now))
    .sort((first, second) => new Date(first.startsAt).getTime() - new Date(second.startsAt).getTime());

  // Для верхньої картки беремо перший запис, який ще не почався.
  // Поточний підтверджений візит залишається лише в блоці «Активні записи».
  const nearestBooking = activeBookings.find((booking) => new Date(booking.startsAt).getTime() > now);

  if (loading) {
    return (
      <p role="status" className="text-sm text-neutral-500">
        Завантаження записів…
      </p>
    );
  }

  if (error) {
    return (
      <p role="alert" className="text-sm text-neutral-500">
        {error}
      </p>
    );
  }

  return (
    <div className="space-y-7">
      {/* Найближчий майбутній запис також залишається в загальному списку активних. */}
      {nearestBooking ? (
        <BookingSummaryCard
          title="Найближчий запис"
          booking={nearestBooking}
          master={masters[nearestBooking.masterId]}
        />
      ) : (
        <section className="rounded-3xl border border-neutral-100 bg-white p-5">
          <h2 className="text-sm text-neutral-400">Найближчий запис</h2>
          <p className="mt-2 text-sm text-neutral-500">Найближчих записів немає.</p>
        </section>
      )}

      <section aria-labelledby="active-bookings-title">
        <h2 id="active-bookings-title" className="text-xl font-semibold">
          Активні записи
        </h2>
        {activeBookings.length === 0 ? (
          <p className="mt-3 text-sm text-neutral-500">Активних записів поки немає.</p>
        ) : (
          <div className="mt-4 space-y-4">
            {/* Кожна картка отримує свій запис і відповідний профіль майстра. */}
            {activeBookings.map((booking) => (
              <BookingSummaryCard
                key={booking.id}
                booking={booking}
                master={masters[booking.masterId]}
              />
            ))}
          </div>
        )}
      </section>

      {/* Відсутність профілю майстра не приховує самі записи. */}
      {mastersError && (
        <p role="status" className="text-xs text-neutral-500">{mastersError}</p>
      )}
    </div>
  );
}