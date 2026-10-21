import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Check, CreditCard, Send } from "lucide-react";
import { ApiError } from "../../api/api";
import { getClientBookings, type ClientBooking } from "../../api/bookings";
import { getMasterById } from "../../api/masters";

export default function ClientBookingSuccessPage() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<ClientBooking | null>(null);
  const [masterName, setMasterName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [payOnSite, setPayOnSite] = useState(false);

  // завантажуємо лише записи поточного клієнта, а потім ім'я майстра.
  useEffect(() => {
    let active = true;

    async function loadBooking() {
      setLoading(true);
      setError("");
      setBooking(null);
      setMasterName("");
      setPayOnSite(false);
      try {
        const id = Number(bookingId);
        if (!Number.isSafeInteger(id) || id <= 0) {
          setError("Некоректний номер запису.");
          return;
        }
        const bookings = await getClientBookings();
        if (!active) return;
        const found = bookings.find((item) => item.id === id);
        if (!found) {
          setError("Запис не знайдено у вашому акаунті.");
          return;
        }
        setBooking(found);
        // Якщо профіль недоступний, сама запис залишається видимою.
        try {
          const master = await getMasterById(found.masterId);
          if (active) setMasterName([master.firstName, master.lastName].filter(Boolean).join(" "));
        } catch {
          if (active) setMasterName("Ім’я майстра недоступне");
        }
      } catch (err) {
        if (active) setError(err instanceof ApiError ? err.message : "Не вдалося завантажити запис.");
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadBooking();
    return () => { active = false; };
  }, [bookingId]);

  const price = booking?.price != null ? `${booking.price.toLocaleString("uk-UA")} ₴` : "Не вказано";
  const date = booking ? new Date(booking.startsAt) : null;
  const dateLabel = date && Number.isFinite(date.getTime())
    ? new Intl.DateTimeFormat("uk-UA", {
      timeZone: "Europe/Kyiv", weekday: "short", day: "numeric", month: "long",
      hour: "2-digit", minute: "2-digit", hourCycle: "h23",
    }).format(date)
    : "Дата недоступна";
  const isActive = booking?.status === 0 || booking?.status === 1;
  const title = booking?.status === 1 ? "Вас записано!"
    : booking?.status === 2 ? "Візит завершено"
      : booking?.status === 3 ? "Запис скасовано" : "Заявку надіслано!";
  const subtitle = booking?.status === 0 ? "Майстер має підтвердити вашу заявку"
    : booking?.status === 1 ? "Майстер підтвердив ваш запис"
      : booking?.status === 2 ? "Дякуємо за ваш візит" : "Ви можете обрати іншу дату й час";

  return (
    <main className="min-h-dvh bg-surface px-3 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] text-copy-900 sm:px-4 sm:pt-4">
      <div className="mx-auto flex min-h-[calc(100dvh-1.5rem-env(safe-area-inset-bottom))] w-full max-w-md flex-col gap-3">
        <section className="flex min-w-0 flex-1 flex-col rounded-[28px] border border-border px-4 py-7 sm:px-5">
          {loading ? (
            <p role="status" className="text-center text-sm text-copy-500">Завантаження запису…</p>
          ) : error ? (
            <p role="alert" className="text-center text-sm text-red-600">{error}</p>
          ) : booking && (
            <>
              <header className="text-center">
                {booking.status !== 3 && (
                  <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-[#ccebc7] text-[#507d43]">
                    <Check aria-hidden="true" className="size-8" strokeWidth={2.5} />
                  </div>
                )}
                <h1 className="mt-4 text-xl font-bold">{title}</h1>
                <p role="status" className="mx-auto mt-4 max-w-60 text-sm leading-relaxed text-copy-500">{subtitle}</p>
              </header>

              <dl className="mt-8 space-y-3 rounded-2xl border border-border p-4 text-sm">
                <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-4">
                  <dt className="text-copy-600">Майстер</dt>
                  <dd className="text-right font-semibold wrap-anywhere">{masterName || "Майстер"}</dd>
                </div>
                <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-4">
                  <dt className="text-copy-600">Коли</dt>
                  <dd className="text-right font-semibold">{dateLabel}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-copy-600">Вартість</dt>
                  <dd className="text-right font-semibold">{price}</dd>
                </div>
              </dl>

              {isActive && (
                <section aria-label="Спосіб оплати" className="mt-6 rounded-2xl bg-[#d7e9ff] p-4 text-[#246c9b]">
                  <h2 className="flex items-center gap-2 text-sm font-semibold">
                    <CreditCard aria-hidden="true" className="size-5 shrink-0" />
                    Бажаєте передплатити онлайн?
                  </h2>
                  <p className="mt-3 text-xs leading-relaxed">Онлайн-оплата поки недоступна. Можна розрахуватися на місці.</p>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button type="button" disabled className="min-h-12 rounded-xl bg-panel-300 px-2 py-2 text-xs font-semibold text-copy-600 disabled:cursor-not-allowed">
                      Оплати {price} • LiqPay
                    </button>
                    <button
                      type="button"
                      aria-pressed={payOnSite}
                      onClick={() => setPayOnSite(true)}
                      className={`min-h-12 rounded-xl border px-2 py-2 text-xs font-semibold text-copy-900 focus-visible:outline-2 focus-visible:outline-offset-2 ${payOnSite ? "border-blue-700 bg-surface ring-1 ring-blue-700" : "border-blue-300 hover:bg-surface/50"}`}
                    >
                      {payOnSite ? "✓ Оплата на місці" : "Оплачу на місці"}
                    </button>
                  </div>
                </section>
              )}

              <div className="mt-6 flex items-start gap-3 rounded-2xl border border-border p-4">
                <Send aria-hidden="true" className="size-5 shrink-0 text-blue-400" />
                <p className="text-sm leading-snug text-copy-600">Нагадування в Telegram поки не підключені.</p>
              </div>
            </>
          )}
        </section>

        {!loading && (error || !isActive) ? (
          <Link to="/client/account/bookings" replace className="flex min-h-12 items-center justify-center rounded-2xl bg-black px-4 py-3 text-lg font-semibold text-white">
            До всіх записів
          </Link>
        ) : (
          <button
            type="button"
            disabled={loading || !booking}
            onClick={() => navigate("/client/account/bookings", { replace: true })}
            className="min-h-12 w-full rounded-2xl border border-border bg-black px-4 py-3 text-lg font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:bg-panel-300 disabled:text-copy-600"
          >
            До всіх записів
          </button>
        )}
      </div>
    </main>
  );
}
