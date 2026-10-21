import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Star, X } from "lucide-react";
import { getClientBookings, type ClientBooking } from "../../api/bookings";
import { getMasterById, type PublicMasterProfile } from "../../api/masters";
import ClientBookingDetailsModal from "../../components/client/ClientBookingDetailsModal";

function isUpcoming(booking: ClientBooking, now: number) {
  if (new Date(booking.startsAt).getTime() <= now) return false;
  if (booking.status === 1) return true;
  return booking.status === 0 && new Date(booking.pendingExpiresAt ?? booking.startsAt).getTime() > now;
}

export default function ClientAllBookingsPage() {
  const [bookings, setBookings] = useState<ClientBooking[]>([]);
  const [masters, setMasters] = useState<Record<number, PublicMasterProfile>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mastersError, setMastersError] = useState("");
  const [revision, setRevision] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const [details, setDetails] = useState<{ booking: ClientBooking; review: boolean } | null>(null);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError("");
      setMastersError("");
      try {
        const data = await getClientBookings();
        if (!active) return;
        const ids = [...new Set(data.map((booking) => booking.masterId))];
        const results = await Promise.allSettled(ids.map(getMasterById));
        if (!active) return;
        const profiles: Record<number, PublicMasterProfile> = {};
        for (const result of results) {
          if (result.status === "fulfilled") profiles[result.value.id] = result.value;
        }
        setBookings(data);
        setMasters(profiles);
        setNow(Date.now());
        if (results.some((result) => result.status === "rejected")) {
          setMastersError("Дані деяких майстрів недоступні. Усі ваші записи показані.");
        }
      } catch {
        if (active) setError("Не вдалося завантажити записи. Спробуйте ще раз.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [revision]);

  const upcoming = bookings
    .filter((booking) => isUpcoming(booking, now))
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime() || a.id - b.id);
  const historyStatusOrder = { 1: 0, 2: 1, 0: 2, 3: 3 };
  const history = bookings
    .filter((booking) => !isUpcoming(booking, now))
    .sort((a, b) => historyStatusOrder[a.status] - historyStatusOrder[b.status]
      || new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime()
      || b.id - a.id);

  function renderBooking(booking: ClientBooking) {
    const master = masters[booking.masterId];
    const name = master ? [master.firstName, master.lastName].filter(Boolean).join(" ") : "Майстер недоступний";
    const date = new Date(booking.startsAt);
    const day = date.toLocaleDateString("uk-UA", { timeZone: "Europe/Kyiv", weekday: "short", day: "numeric", month: "long" });
    const time = date.toLocaleTimeString("uk-UA", { timeZone: "Europe/Kyiv", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
    const completed = booking.status === 2;
    const status = [
      { label: "Очікує підтвердження", color: "bg-amber-100 text-amber-800" },
      { label: "Підтверджено", color: "bg-[#ccebc7] text-green-800" },
      { label: booking.review ? "Відгук залишено" : "Залишити відгук", color: "bg-orange-200 text-orange-900" },
      { label: "Скасовано", color: "bg-red-100 text-red-800" },
    ][booking.status];
    const bookAgain = master?.slug && !master.isBlocked
      ? `/m/${encodeURIComponent(master.slug)}/services/${booking.serviceId}/book` : null;
    return (
      <article key={booking.id} className="min-w-0 rounded-3xl border border-border/40 bg-surface p-4 shadow-[0_4px_14px_rgba(0,0,0,0.07)]">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <h3 className="text-base font-bold leading-snug sm:text-lg">
            <button type="button" onClick={() => setDetails({ booking, review: false })}
              aria-label={`Деталі запису: ${day}, ${time}`}
              className="min-h-8 rounded text-left focus-visible:outline-2 focus-visible:outline-offset-4">
              {day} • {time}
            </button>
          </h3>
          <span className={`rounded-full px-2.5 py-1 text-[10px] font-medium sm:text-xs ${status.color}`}>{status.label}</span>
        </div>
        <p className="mt-2 text-sm text-copy-600 wrap-anywhere">{name}{master?.categoryName ? ` • ${master.categoryName}` : ""}</p>
        <p className="mt-1 text-sm text-muted wrap-anywhere">{booking.serviceName} • {booking.price.toLocaleString("uk-UA")} ₴ • {booking.durationMin} хв</p>
        {booking.review && (
          <p className="mt-2 text-sm text-amber-500" aria-label={`Оцінка: ${booking.review.rating} з 5`}>
            <span aria-hidden="true">
              {[1, 2, 3, 4, 5].map((value) => value <= booking.review!.rating ? "★" : "☆").join("")}
            </span>
          </p>
        )}
        {!isUpcoming(booking, now) && (
          <div className={`mt-3 grid gap-3 ${completed ? "grid-cols-1 min-[360px]:grid-cols-2" : "grid-cols-1"}`}>
            {completed && (
              <button type="button" onClick={() => setDetails({ booking, review: true })}
                className="flex min-h-12 items-center justify-center gap-1.5 rounded-lg bg-accent px-3 text-sm font-medium text-on-accent focus-visible:outline-2 focus-visible:outline-offset-2">
                <Star aria-hidden="true" size={20} fill="currentColor" className="shrink-0" />
                {booking.review ? "Редагувати відгук" : "Оцінити візит"}
              </button>
            )}
            {bookAgain ? (
              <Link to={bookAgain} className="flex min-h-12 items-center justify-center rounded-lg border border-border px-3 text-center text-sm text-copy-600 hover:bg-panel-50 focus-visible:outline-2 focus-visible:outline-offset-2">Записатися знову</Link>
            ) : (
              <button type="button" disabled className="min-h-12 rounded-lg border border-border px-3 text-sm text-muted disabled:cursor-not-allowed">Повторний запис недоступний</button>
            )}
          </div>
        )}
      </article>
    );
  }

  return (
    <section className="mx-auto w-full max-w-xl space-y-5 pt-4 text-text">
      <header className="flex items-center justify-between gap-3 border-b border-border pb-3">
        <h1 className="text-2xl font-medium">Ваші записи</h1>
        <Link
          to="/client/account"
          aria-label="Закрити записи"
          className="-mr-2 flex size-11 items-center justify-center rounded-full text-muted hover:bg-panel-100 focus-visible:outline-2"
        >
          <X aria-hidden="true" size={23} />
        </Link>
      </header>
      {loading ? (
        <p role="status" className="text-sm text-muted">
          Завантаження записів…
        </p>
      ) : error ? (
        <div className="space-y-3">
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
          <button type="button" onClick={() => setRevision((value) => value + 1)} className="min-h-11 rounded-xl border border-border px-4">
            Спробувати ще раз
          </button>
        </div>
      ) : (
        <>
          {mastersError && (
            <p role="status" className="text-sm text-muted">
              {mastersError}
            </p>
          )}
          {bookings.length === 0 ? (
            <div className="space-y-3 rounded-3xl border border-border bg-surface p-5">
              <p>У вас ще немає записів.</p>
              <Link to="/client/search" className="inline-flex min-h-11 items-center underline">
                Знайти майстра
              </Link>
            </div>
          ) : (
            <>
              <section aria-labelledby="upcoming-title" className="space-y-4">
                <h2 id="upcoming-title" className="text-lg font-medium text-muted">
                  Найближчий запис
                </h2>
                {upcoming.length ? renderBooking(upcoming[0]) : <p className="text-sm text-muted">Майбутніх записів немає.</p>}
              </section>
              {upcoming.length > 1 && (
                <section aria-labelledby="other-upcoming-title" className="space-y-4 pt-3">
                  <h2 id="other-upcoming-title" className="text-lg font-medium text-muted">Інші майбутні записи</h2>
                  {upcoming.slice(1).map(renderBooking)}
                </section>
              )}
              <section aria-labelledby="history-title" className="space-y-4 pt-3">
                <h2 id="history-title" className="text-lg font-medium text-muted">
                  Минулі
                </h2>
                {history.length ? history.map(renderBooking) : <p className="text-sm text-muted">Історія записів поки порожня.</p>}
              </section>
            </>
          )}
        </>
      )}
      {details && (
        <ClientBookingDetailsModal
          key={details.booking.id}
          booking={details.booking}
          master={masters[details.booking.masterId]}
          initialReview={details.review}
          onClose={() => setDetails(null)}
          onReviewSaved={() => {
            setDetails(null);
            setRevision((value) => value + 1);
          }}
          onCancelled={(id) => {
            setBookings((current) => current.map((booking) => (booking.id === id ? { ...booking, status: 3 } : booking)));
            setDetails(null);
          }}
        />
      )}
    </section>
  );
}
