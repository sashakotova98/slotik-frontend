import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, MapPin, MessageCircle, Star, X, Camera } from "lucide-react";
import { cancelClientBooking, type ClientBooking } from "../../api/bookings";
import { saveClientReview } from "../../api/reviews";
import type { PublicMasterProfile } from "../../api/masters";

type Props = {
  booking: ClientBooking;
  master?: PublicMasterProfile;
  initialReview?: boolean;
  onClose: () => void;
  onCancelled: (id: number) => void;
};

export default function ClientBookingDetailsModal({ booking, master, initialReview = false, onClose, onCancelled }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const busyRef = useRef(false);
  const titleId = useId();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(initialReview && booking.status === 2);
  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");

  useEffect(() => {
    const dialog = dialogRef.current;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    dialog?.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      dialog?.close();
      document.body.style.overflow = previousOverflow;
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
    };
  }, []);

  const completed = booking.status === 2;
  const name = master ? [master.firstName, master.lastName].filter(Boolean).join(" ") : "Майстер недоступний";
  const date = new Date(booking.startsAt);
  const day = new Intl.DateTimeFormat("uk-UA", { timeZone: "Europe/Kyiv", weekday: "short", day: "numeric", month: "long" }).format(date);
  const time = new Intl.DateTimeFormat("uk-UA", { timeZone: "Europe/Kyiv", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(date);
  const destination = master?.latitude != null && master.longitude != null
    ? `${master.latitude},${master.longitude}`
    : [master?.cityName, master?.address].filter(Boolean).join(", ");
  const directions = destination ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}` : null;
  const bookAgain = master?.slug && !master.isBlocked
    ? `/m/${encodeURIComponent(master.slug)}/services/${booking.serviceId}/book` : null;

  function close() {
    if (!busyRef.current) onClose();
  }

  async function cancel() {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError("");
    try {
      await cancelClientBooking(booking.id);
      onCancelled(booking.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не вдалося скасувати запис.");
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }

  async function submitReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busyRef.current || rating < 1 || !text.trim()) return;
    busyRef.current = true;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await saveClientReview(booking.id, { rating, text: text.trim() });
      setMessage("Відгук збережено. Дякуємо!");
      setReviewOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не вдалося зберегти відгук.");
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }

  return (
    <dialog ref={dialogRef} aria-labelledby={titleId}
      onCancel={(event) => { event.preventDefault(); close(); }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const rect = event.currentTarget.getBoundingClientRect();
        if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) close();
      }}
      className="fixed inset-0 m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-3xl border-0 bg-surface p-4 text-text shadow-xl backdrop:bg-black/40 sm:p-5">
      {reviewOpen ? (
        <div className="px-1 pt-2 sm:px-3">
          <header className="flex items-start justify-between gap-3">
            <h2 id={titleId} className="pt-1 text-2xl font-bold leading-tight">Як пройшов візит?</h2>
            <button type="button" autoFocus disabled={busy} onClick={close} aria-label="Закрити відгук"
              className="-mr-2 flex size-11 shrink-0 items-center justify-center rounded-full text-muted hover:bg-panel-100 disabled:opacity-50">
              <X aria-hidden="true" size={25} />
            </button>
          </header>
          <p className="mt-4 text-base font-medium text-copy-600 wrap-anywhere">{name}{master?.categoryName ? ` • ${master.categoryName}` : ""}</p>
          <p className="mt-2 text-sm leading-relaxed text-muted wrap-anywhere">{booking.serviceName} • {booking.price.toLocaleString("uk-UA")} ₴ • {booking.durationMin} хв</p>
        </div>
      ) : (
        <>
      <header className="flex items-center gap-2">
        <button type="button" autoFocus onClick={close} disabled={busy} aria-label="Закрити деталі запису" className="-ml-2 flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-panel-100 disabled:opacity-50">
          <ArrowLeft size={21} />
        </button>
        <h2 id={titleId} className="flex-1 text-base font-semibold">Деталі запису</h2>
        <span className={`rounded-full px-2.5 py-1 text-[10px] font-medium ${completed ? "bg-orange-200 text-orange-900" : "bg-[#ccebc7] text-green-800"}`}>{completed ? "Завершено" : "Підтверджено"}</span>
      </header>

      <p className="my-5 text-center text-lg font-bold">{day} • {time}</p>
      <div className="flex items-center gap-3 rounded-2xl border border-border p-3">
        {master?.avatarUrl
          ? <img src={master.avatarUrl} alt="" className="size-12 shrink-0 rounded-full object-cover" />
          : <div aria-hidden="true" className="flex size-12 shrink-0 items-center justify-center rounded-full bg-panel-100">{name.slice(0, 1)}</div>}
        <div className="min-w-0">
          <p className="text-sm font-semibold wrap-anywhere">{name}</p>
          <p className="mt-1 text-xs leading-relaxed text-muted wrap-anywhere">{booking.serviceName} • {booking.price.toLocaleString("uk-UA")} ₴ • {booking.durationMin} хв</p>
        </div>
      </div>
      <div className="mt-2 space-y-3 rounded-2xl border border-border p-3 text-xs text-copy-600">
        <div className="flex items-start gap-2">
          <MapPin aria-hidden="true" size={16} className="shrink-0" />
          <p className="min-w-0 flex-1 wrap-anywhere">{[master?.cityName, master?.address, master?.districtName].filter(Boolean).join(", ") || "Адреса недоступна"}</p>
          {directions && <a href={directions} target="_blank" rel="noopener noreferrer" className="shrink-0 text-blue-500 underline">Маршрут</a>}
        </div>
        <div className="flex items-start gap-2">
          <MessageCircle aria-hidden="true" size={16} className="shrink-0" />
          <p className="whitespace-pre-wrap wrap-anywhere">{booking.comment ? `Ваш коментар: ${booking.comment}` : "Коментар не додано"}</p>
        </div>
      </div>

        </>
      )}

      {error && <p role="alert" className="mt-3 text-sm text-danger">{error}</p>}
      {message && <p role="status" className="mt-3 text-sm text-text">{message}</p>}

      {reviewOpen ? (
        <form onSubmit={submitReview} className="px-1 pb-2 sm:px-3">
          <fieldset disabled={busy} className="my-7">
            <legend className="sr-only">Оцініть візит від 1 до 5 зірок</legend>
            <div className="flex items-center justify-between gap-1">
              {[1, 2, 3, 4, 5].map((value) => (
                <label key={value} className="relative flex min-h-12 min-w-0 flex-1 cursor-pointer items-center justify-center">
                  <input type="radio" name="review-rating" value={value} checked={rating === value}
                    onChange={() => setRating(value)} required aria-label={`${value} з 5 зірок`}
                    className="peer sr-only" />
                  <Star aria-hidden="true" strokeWidth={1.3}
                    className={`size-10 rounded-sm peer-focus-visible:outline-2 peer-focus-visible:outline-offset-4 sm:size-12 ${value <= rating ? "fill-amber-400 text-amber-500" : "fill-transparent text-text"}`} />
                </label>
              ))}
            </div>
          </fieldset>
          <label className="block text-sm font-medium text-copy-600">
            Розкажіть детальніше
            <textarea required value={text} onChange={(event) => setText(event.target.value)} disabled={busy}
              rows={3} placeholder="Що сподобалось, а що можна покращити?"
              className="mt-2 block w-full resize-y rounded-xl border border-border bg-surface px-3 py-3 text-sm font-normal text-text placeholder:text-muted focus-visible:outline-2" />
          </label>
          <button type="button" disabled aria-describedby={`${titleId}-photos`}
            className="mt-2 inline-flex min-h-11 items-center gap-2 rounded-xl border border-border px-3 text-sm text-muted disabled:cursor-not-allowed">
            <Camera aria-hidden="true" size={22} /> Додати фото
          </button>
          <p id={`${titleId}-photos`} className="mt-1 text-xs text-muted">Додавання фото до відгуку поки недоступне.</p>
          <button type="submit" disabled={busy || rating === 0 || !text.trim()}
            className="mt-4 min-h-12 w-full rounded-2xl bg-black px-3 text-base font-semibold text-white disabled:cursor-not-allowed disabled:bg-panel-300 disabled:text-copy-600">
            {busy ? "Надсилання…" : "Надіслати відгук"}
          </button>
          <p className="mt-4 text-center text-sm text-muted">Відгук з’явиться у профілі майстра</p>
          <p className="mt-2 text-center text-xs leading-relaxed text-muted">Якщо відгук на цей запис уже є, його текст та оцінка будуть оновлені.</p>
        </form>
      ) : completed ? (
        <div className="mt-4 grid grid-cols-2 gap-3">
          {bookAgain ? <Link to={bookAgain} className="flex min-h-12 items-center justify-center rounded-xl border border-border px-2 text-center text-xs font-medium">Записатися знову</Link>
            : <button disabled className="min-h-12 rounded-xl bg-panel-100 px-2 text-xs text-muted">Повторний запис недоступний</button>}
          <button type="button" onClick={() => { setError(""); setReviewOpen(true); }} className="min-h-12 rounded-xl bg-orange-200 px-2 text-xs font-medium text-orange-900">Залишити відгук</button>
        </div>
      ) : confirmCancel ? (
        <div className="mt-4 space-y-3">
          <p className="text-sm">Скасувати цей запис?</p>
          <div className="grid grid-cols-2 gap-3">
            <button type="button" disabled={busy} onClick={() => setConfirmCancel(false)} className="min-h-12 rounded-xl border border-border text-sm">Залишити запис</button>
            <button type="button" disabled={busy} onClick={() => void cancel()} className="min-h-12 rounded-xl bg-red-600 text-sm text-white disabled:opacity-50">{busy ? "Скасування…" : "Так, скасувати"}</button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => setConfirmCancel(true)} className="mt-4 min-h-12 w-full rounded-xl border border-red-400 text-sm text-red-500">Скасувати</button>
      )}
    </dialog>
  );
}