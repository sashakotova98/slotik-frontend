import { useEffect, useId, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, MapPin, MessageCircle, Star, X, Camera } from "lucide-react";
import { cancelClientBooking, type ClientBooking } from "../../api/bookings";
import { saveClientReview, type ReviewPhoto } from "../../api/reviews";
import { ApiError } from "../../api/api";
import ReviewPhotos from "../rewiews/ReviewPhotos";
import type { PublicMasterProfile } from "../../api/masters";

type Props = {
  booking: ClientBooking;
  master?: PublicMasterProfile;
  initialReview?: boolean;
  onClose: () => void;
  onCancelled: (id: number) => void;
  onReviewSaved: () => void;
};

function SelectedPhotoPreview({ file }: { file: File }) {
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    const image = imageRef.current;

    if (image) image.src = url;

    return () => {
      if (image) image.removeAttribute("src");
      URL.revokeObjectURL(url);
    };
  }, [file]);

  return (
    <img
      ref={imageRef}
      alt={`Вибране фото: ${file.name}`}
      className="aspect-square w-full rounded-xl object-cover"
    />
  );
}

export default function ClientBookingDetailsModal({ booking, master, initialReview = false, onClose, onCancelled, onReviewSaved }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const busyRef = useRef(false);
  const titleId = useId();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(initialReview && booking.status === 2);
  const hasSavedReview = Boolean(booking.review);
  const [rating, setRating] = useState(booking.review?.rating ?? 0);

  const [text, setText] = useState(booking.review?.text ?? "");

  const photoInputRef = useRef<HTMLInputElement>(null);

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [savedPhotos, setSavedPhotos] = useState<ReviewPhoto[]>(
    () => booking.review?.photos ?? [],
  );

  const [photoError, setPhotoError] = useState("");

  const totalPhotos = savedPhotos.length + selectedFiles.length;
  const remainingPhotoSlots = Math.max(0, 3 - totalPhotos);

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
  const cancellable = booking.status === 0 || booking.status === 1;
  const status = [
    { label: "Очікує підтвердження", color: "bg-amber-100 text-amber-800" },
    { label: "Підтверджено", color: "bg-[#ccebc7] text-green-800" },
    { label: "Завершено", color: "bg-orange-200 text-orange-900" },
    { label: "Скасовано", color: "bg-red-100 text-red-800" },
  ][booking.status];
  const name = master ? [master.firstName, master.lastName].filter(Boolean).join(" ") : "Майстер недоступний";
  const date = new Date(booking.startsAt);
  const day = new Intl.DateTimeFormat("uk-UA", { timeZone: "Europe/Kyiv", weekday: "short", day: "numeric", month: "long" }).format(date);
  const time = new Intl.DateTimeFormat("uk-UA", { timeZone: "Europe/Kyiv", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(
    date,
  );
  const destination =
    master?.latitude != null && master.longitude != null
      ? `${master.latitude},${master.longitude}`
      : [master?.cityName, master?.address].filter(Boolean).join(", ");
  const directions = destination ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}` : null;
  const bookAgain = master?.slug && !master.isBlocked ? `/m/${encodeURIComponent(master.slug)}/services/${booking.serviceId}/book` : null;

  function close() {
    if (!busyRef.current) onClose();
  }

  async function cancel() {
    if (busyRef.current || !cancellable) return;
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

  function handleSelectPhotos(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.currentTarget.files ?? []);

    // Дозволяє повторно вибрати той самий файл після видалення.
    event.currentTarget.value = "";

    if (busyRef.current || files.length === 0) return;

    setPhotoError("");

    if (totalPhotos + files.length > 3) {
      setPhotoError(
        "До відгуку можна додати максимум 3 фото разом із уже збереженими.",
      );
      return;
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (files.some((file) => !allowedTypes.includes(file.type))) {
      setPhotoError("Оберіть фотографії у форматі JPG, PNG або WebP.");
      return;
    }

    if (
      files.some(
        (file) => file.size === 0 || file.size > 5 * 1024 * 1024,
      )
    ) {
      setPhotoError("Кожне фото має бути непорожнім і розміром до 5 МБ.");
      return;
    }

    setSelectedFiles((previous) => [...previous, ...files]);
  }

  function removeSelectedPhoto(index: number) {
    if (busyRef.current) return;

    setSelectedFiles((previous) =>
      previous.filter((_, fileIndex) => fileIndex !== index),
    );
    setPhotoError("");
  }

  async function submitReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (
      busyRef.current ||
      rating < 1 ||
      rating > 5 ||
      !text.trim()
    ) {
      return;
    }

    if (totalPhotos > 3) {
      setPhotoError("У відгуку може бути максимум 3 фото.");
      return;
    }

    busyRef.current = true;
    setBusy(true);
    setError("");
    setPhotoError("");

    try {
      const response = await saveClientReview(booking.id, {
        rating,
        text: text.trim(),
        files: selectedFiles,
      });

      // Збережені файли більше не повинні надсилатися повторно.
      setSavedPhotos(response.photos);
      setSelectedFiles([]);

      onReviewSaved();
    } catch (err) {
      if (err instanceof ApiError) {
        switch (err.code) {
          case "review_photo_limit_exceeded":
            setError(
              "У відгуку вже забагато фото. Дозволено максимум 3 разом зі збереженими. Закрийте форму й оновіть записи, щоб перевірити актуальні фотографії.",
            );
            break;

          case "invalid_image":
            setError(
              "Одне з фото не пройшло перевірку. Оберіть інше зображення JPG, PNG або WebP до 5 МБ.",
            );
            break;

          case "image_upload_failed":
            setError(
              "Не вдалося завантажити фотографії. Спробуйте зберегти відгук ще раз.",
            );
            break;

          default:
            setError(
              err.status === 413
                ? "Фотографії перевищують дозволений розмір завантаження."
                : err.message,
            );
        }
      } else {
        setError("Не вдалося зберегти відгук. Перевірте з’єднання.");
      }
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const rect = event.currentTarget.getBoundingClientRect();
        if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) close();
      }}
      className="fixed inset-0 m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-3xl border-0 bg-surface p-4 text-text shadow-xl backdrop:bg-black/40 sm:p-5"
    >
      {reviewOpen ? (
        <div className="px-1 pt-2 sm:px-3">
          <header className="flex items-start justify-between gap-3">
            <h2 id={titleId} className="pt-1 text-2xl font-bold leading-tight">
              {hasSavedReview ? "Редагувати відгук" : "Як пройшов візит?"}
            </h2>
            <button
              type="button"
              autoFocus
              disabled={busy}
              onClick={close}
              aria-label="Закрити відгук"
              className="-mr-2 flex size-11 shrink-0 items-center justify-center rounded-full text-muted hover:bg-panel-100 disabled:opacity-50"
            >
              <X aria-hidden="true" size={25} />
            </button>
          </header>
          <p className="mt-4 text-base font-medium text-copy-600 wrap-anywhere">
            {name}
            {master?.categoryName ? ` • ${master.categoryName}` : ""}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-muted wrap-anywhere">
            {booking.serviceName} • {booking.price.toLocaleString("uk-UA")} ₴ • {booking.durationMin} хв
          </p>
        </div>
      ) : (
        <>
          <header className="flex items-center gap-2">
            <button
              type="button"
              autoFocus
              onClick={close}
              disabled={busy}
              aria-label="Закрити деталі запису"
              className="-ml-2 flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-panel-100 disabled:opacity-50"
            >
              <ArrowLeft size={21} />
            </button>
            <h2 id={titleId} className="flex-1 text-base font-semibold">
              Деталі запису
            </h2>
            <span className={`rounded-full px-2.5 py-1 text-[10px] font-medium ${status.color}`}>{status.label}</span>
          </header>

          <p className="my-5 text-center text-lg font-bold">
            {day} • {time}
          </p>
          <div className="flex items-center gap-3 rounded-2xl border border-border p-3">
            {master?.avatarUrl ? (
              <img src={master.avatarUrl} alt="" className="size-12 shrink-0 rounded-full object-cover" />
            ) : (
              <div aria-hidden="true" className="flex size-12 shrink-0 items-center justify-center rounded-full bg-panel-100">
                {name.slice(0, 1)}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-semibold wrap-anywhere">{name}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted wrap-anywhere">
                {booking.serviceName} • {booking.price.toLocaleString("uk-UA")} ₴ • {booking.durationMin} хв
              </p>
            </div>
          </div>
          <div className="mt-2 space-y-3 rounded-2xl border border-border p-3 text-xs text-copy-600">
            <div className="flex items-start gap-2">
              <MapPin aria-hidden="true" size={16} className="shrink-0" />
              <p className="min-w-0 flex-1 wrap-anywhere">
                {[master?.cityName, master?.address, master?.districtName].filter(Boolean).join(", ") || "Адреса недоступна"}
              </p>
              {directions && (
                <a href={directions} target="_blank" rel="noopener noreferrer" className="shrink-0 text-blue-500 underline">
                  Маршрут
                </a>
              )}
            </div>
            <div className="flex items-start gap-2">
              <MessageCircle aria-hidden="true" size={16} className="shrink-0" />
              <p className="whitespace-pre-wrap wrap-anywhere">
                {booking.comment ? `Ваш коментар: ${booking.comment}` : "Коментар не додано"}
              </p>
            </div>
          </div>
        </>
      )}

      {error && (
        <p role="alert" className="mt-3 text-sm text-danger">
          {error}
        </p>
      )}

      {reviewOpen ? (
        <form onSubmit={submitReview} className="px-1 pb-2 sm:px-3">
          <fieldset disabled={busy} className="my-7">
            <legend className="sr-only">Оцініть візит від 1 до 5 зірок</legend>
            <div className="flex items-center justify-between gap-1">
              {[1, 2, 3, 4, 5].map((value) => (
                <label key={value} className="relative flex min-h-12 min-w-0 flex-1 cursor-pointer items-center justify-center">
                  <input
                    type="radio"
                    name="review-rating"
                    value={value}
                    checked={rating === value}
                    onChange={() => setRating(value)}
                    required
                    aria-label={`${value} з 5 зірок`}
                    className="peer sr-only"
                  />
                  <Star
                    aria-hidden="true"
                    strokeWidth={1.3}
                    className={`size-10 rounded-sm peer-focus-visible:outline-2 peer-focus-visible:outline-offset-4 sm:size-12 ${value <= rating ? "fill-amber-400 text-amber-500" : "fill-transparent text-text"}`}
                  />
                </label>
              ))}
            </div>
          </fieldset>
          <label className="block text-sm font-medium text-copy-600">
            Розкажіть детальніше
            <textarea
              required
              value={text}
              onChange={(event) => setText(event.target.value)}
              disabled={busy}
              rows={3}
              placeholder="Що сподобалось, а що можна покращити?"
              className="mt-2 block w-full resize-y rounded-xl border border-border bg-surface px-3 py-3 text-sm font-normal text-text placeholder:text-muted focus-visible:outline-2"
            />
          </label>
          <div className="mt-4">
            <p className="text-sm font-medium">Фото відгуку · {totalPhotos}/3</p>

            {savedPhotos.length > 0 && (
              <>
                <ReviewPhotos photos={savedPhotos} />
                <p className="mt-2 text-xs text-muted">
                  Ці фото вже збережені. Видалення збережених фото поки недоступне.
                </p>
              </>
            )}

            {selectedFiles.length > 0 && (
              <ul className="mt-3 grid grid-cols-3 gap-2" aria-label="Нові фотографії перед надсиланням">
                {selectedFiles.map((file, index) => (
                  <li key={index} className="min-w-0">
                    <SelectedPhotoPreview file={file} />
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => removeSelectedPhoto(index)}
                      aria-label={`Прибрати вибране фото ${index + 1}: ${file.name}`}
                      className="mt-1 min-h-11 w-full rounded-lg border border-border px-2 text-xs text-danger disabled:opacity-50"
                    >
                      Прибрати
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <input
              ref={photoInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              hidden
              disabled={busy || remainingPhotoSlots === 0}
              onChange={handleSelectPhotos}
            />
            <button
              type="button"
              disabled={busy || remainingPhotoSlots === 0}
              onClick={() => photoInputRef.current?.click()}
              aria-describedby={`${titleId}-photos`}
              className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-xl border border-border px-3 text-sm disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Camera aria-hidden="true" size={22} />
              {remainingPhotoSlots === 0 ? "Додано 3 фото" : "Додати фото"}
            </button>
            <p id={`${titleId}-photos`} className="mt-2 text-xs text-muted">
              Необов’язково. До 3 фото загалом, JPG, PNG або WebP, до 5 МБ кожне.
            </p>
            {photoError && <p role="alert" className="mt-2 text-sm text-danger">{photoError}</p>}
          </div>
          <button
            type="submit"
            disabled={busy || rating === 0 || !text.trim()}
            className="mt-4 min-h-12 w-full rounded-2xl bg-black px-3 text-base font-semibold text-white disabled:cursor-not-allowed disabled:bg-panel-300 disabled:text-copy-600"
          >
            {busy ? "Збереження…" : hasSavedReview ? "Зберегти зміни" : "Надіслати відгук"}
          </button>
          <p className="mt-4 text-center text-sm text-muted">Відгук з’явиться у профілі майстра</p>
          {hasSavedReview && (
            <p className="mt-2 text-center text-xs leading-relaxed text-muted">Можна оновити текст і оцінку та додати фото. Раніше збережені фото залишаться.</p>
          )}
        </form>
      ) : completed ? (
        <div className="mt-4 grid grid-cols-2 gap-3">
          {bookAgain ? (
            <Link
              to={bookAgain}
              className="flex min-h-12 items-center justify-center rounded-xl border border-border px-2 text-center text-xs font-medium"
            >
              Записатися знову
            </Link>
          ) : (
            <button disabled className="min-h-12 rounded-xl bg-panel-100 px-2 text-xs text-muted">
              Повторний запис недоступний
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setError("");
              setReviewOpen(true);
            }}
            className="min-h-12 rounded-xl bg-orange-200 px-2 text-xs font-medium text-orange-900"
          >
            {hasSavedReview ? "Редагувати відгук" : "Залишити відгук"}
          </button>
        </div>
      ) : !cancellable ? null : confirmCancel ? (
        <div className="mt-4 space-y-3">
          <p className="text-sm">Скасувати цей запис?</p>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              disabled={busy}
              onClick={() => setConfirmCancel(false)}
              className="min-h-12 rounded-xl border border-border text-sm"
            >
              Залишити запис
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void cancel()}
              className="min-h-12 rounded-xl bg-red-600 text-sm text-white disabled:opacity-50"
            >
              {busy ? "Скасування…" : "Так, скасувати"}
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirmCancel(true)}
          className="mt-4 min-h-12 w-full rounded-xl border border-red-400 text-sm text-red-500"
        >
          Скасувати
        </button>
      )}
    </dialog>
  );
}
