import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { ApiError } from "../../api/api";
import { createBooking } from "../../api/bookings";
import { getMasterBySlug } from "../../api/masters";
import { getServicesByMasterId, type Service } from "../../api/services";

type Details = {
  masterName: string;
  avatarUrl: string | null;
  subtitle: string;
  service: Service;
};

export default function ClientBookingConfirmPage() {
  //Майстер і послуга — від адреси, час — від параметра ?startsAt=...
  const { slug, serviceId } = useParams();
  const [params] = useSearchParams();
  const startsAt = params.get("startsAt") ?? "";
  const bookingPath = `/m/${encodeURIComponent(slug ?? "")}/services/${serviceId}/book`;

  const [details, setDetails] = useState<Details | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [created, setCreated] = useState(false);

  const navigate = useNavigate();

  // GET: завантажуємо дані для перевірки перед записом.
  useEffect(() => {
    let active = true;

    async function loadDetails() {
      setLoading(true);
      setError("");
      setDetails(null);
      setSubmitError("");
      setCreated(false);
      setComment("");

      try {
        const id = Number(serviceId);
        const time = new Date(startsAt).getTime();
        if (!slug || !Number.isSafeInteger(id) || id <= 0 ||
          !Number.isFinite(time) || time <= Date.now()) {
          setError("Некоректні дані запису. Оберіть майбутню дату й час.");
          return;
        }

        const master = await getMasterBySlug(slug);
        if (!active) return;
        const services = await getServicesByMasterId(master.id);
        if (!active) return;

        const service = services.find((item) => item.id === id);
        if (!service || master.isBlocked) {
          setError("Послуга або майстер недоступні для запису.");
          return;
        }
        setDetails({
          masterName: [master.firstName, master.lastName].filter(Boolean).join(" "),
          avatarUrl: master.avatarUrl,
          subtitle: [master.categoryName, [master.districtName, master.cityName].filter(Boolean).join(", ")].filter(Boolean).join(" • "),
          service,
        });
      } catch {
        if (active) setError("Не вдалося завантажити дані запису.");
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadDetails();
    return () => { active = false; };
  }, [slug, serviceId, startsAt]);

  // POST: створюємо запис тільки після натискання «Записатись».
  async function handleConfirm() {
    if (!details || loading || error || saving || created) return;
    setSaving(true);
    setSubmitError("");

    try {
      const booking = await createBooking({
        serviceId: details.service.id,
        startsAt,
        comment: comment.trim() || undefined,
      });

      navigate(`/client/bookings/${booking.id}/success`, {
        replace: true,
      });
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setSubmitError("Сесія завершилася. Увійдіть повторно.");
      } else if (
        err instanceof ApiError &&
        err.code === "slot_already_booked"
      ) {
        setSubmitError("Цей час уже зайняли. Оберіть інший.");
      } else {
        setSubmitError("Не вдалося оформити запис. Спробуйте пізніше.");
      }
    } finally {
      setSaving(false);
    }
  }

  const date = details ? new Date(startsAt) : null;
  const dateLabel = date?.toLocaleDateString("uk-UA", {
    timeZone: "Europe/Kyiv", weekday: "short", day: "numeric", month: "long",
  });
  function formatTime(value: Date) {
    return value.toLocaleTimeString("uk-UA", {
      timeZone: "Europe/Kyiv", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
    });
  }
  const timeLabel = date && details
    ? `${formatTime(date)}–${formatTime(new Date(date.getTime() + details.service.durationMin * 60000))}`
    : "";
  const price = details?.service.price.toLocaleString("uk-UA");

  return (
    <main className="min-h-dvh bg-white px-3 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] text-neutral-900 sm:px-4 sm:pt-4">
      <div className="mx-auto flex min-h-[calc(100dvh-1.5rem-env(safe-area-inset-bottom))] w-full max-w-md flex-col gap-3">
        <section className="flex min-w-0 flex-1 flex-col rounded-[28px] border border-neutral-400 px-4 py-4 sm:px-5">
          <header className="flex items-center gap-2">
            {!created && (
              <Link
                to={bookingPath}
                replace
                aria-label="Назад до вибору часу"
                aria-disabled={saving}
                onClick={(event) => { if (saving) event.preventDefault(); }}
                className={`-ml-2 flex size-11 shrink-0 items-center justify-center rounded-full hover:bg-neutral-100 focus-visible:outline-2 ${saving ? "pointer-events-none opacity-40" : ""}`}
              >
                <ArrowLeft aria-hidden="true" className="size-5" />
              </Link>
            )}
            <h1 className="min-w-0 text-lg font-semibold leading-snug sm:text-xl">
              {created ? "Заявку надіслано!" : "Підтвердження запису"}
            </h1>
          </header>

          {loading ? (
            <p role="status" className="mt-6 text-sm text-neutral-500">Завантаження даних…</p>
          ) : error ? (
            <p role="alert" className="mt-6 text-sm text-red-600">{error}</p>
          ) : details && (
            <>
              {created && <p role="status" className="mt-5 text-sm text-green-700">Запис очікує підтвердження майстра.</p>}

              <div className="mt-5 flex min-w-0 items-center gap-3 rounded-2xl border border-neutral-300 px-3 py-4">
                {details.avatarUrl ? (
                  <img src={details.avatarUrl} alt="" className="size-11 shrink-0 rounded-full object-cover" />
                ) : (
                  <span aria-hidden="true" className="flex size-11 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-sm font-medium">
                    {details.masterName.split(" ").filter(Boolean).map((part) => part[0]).slice(0, 2).join("")}
                  </span>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-semibold wrap-anywhere">{details.masterName}</p>
                  <p className="mt-1 text-xs leading-relaxed text-neutral-500 wrap-anywhere">{details.subtitle}</p>
                </div>
              </div>

              <dl className="mt-5 space-y-2.5 rounded-2xl border border-neutral-300 p-4 text-sm">
                <div className="grid grid-cols-[auto_minmax(0,1fr)] items-baseline gap-4">
                  <dt className="text-neutral-600">Послуга</dt>
                  <dd className="text-right font-semibold wrap-anywhere">{details.service.name}</dd>
                </div>
                <div className="grid grid-cols-[auto_minmax(0,1fr)] items-baseline gap-4">
                  <dt className="text-neutral-600">Дата</dt><dd className="text-right font-semibold">{dateLabel}</dd>
                </div>
                <div className="grid grid-cols-[auto_minmax(0,1fr)] items-baseline gap-4">
                  <dt className="text-neutral-600">Час</dt><dd className="text-right font-semibold">{timeLabel}</dd>
                </div>
                <div className="mt-4! flex items-baseline justify-between gap-3 border-t border-neutral-300 pt-3 font-semibold">
                  <dt>До сплати на місці</dt><dd className="shrink-0 whitespace-nowrap">{price} ₴</dd>
                </div>
              </dl>

              {!created && (
                <>
                  <label className="mt-9 block text-xs text-neutral-600">
                    Коментар майстру (необов’язково)
                    <textarea
                      value={comment}
                      onChange={(event) => setComment(event.target.value)}
                      disabled={saving}
                      placeholder="Наприклад: хочу дизайн як на 3-му фото в портфоліо"
                      className="mt-2 block min-h-24 w-full resize-y rounded-2xl border border-neutral-400 bg-white px-3 py-3 text-base leading-relaxed text-neutral-900 placeholder:text-neutral-400 focus-visible:outline-2 focus-visible:outline-neutral-900 disabled:opacity-60"
                    />
                  </label>
                  {submitError && (
                    <div role="alert" className="mt-3 text-sm text-neutral-500">
                      <p>{submitError}</p>
                      <Link to={bookingPath} replace className="mt-2 inline-block underline">Обрати інший час</Link>
                    </div>
                  )}
                  <p className="mt-auto pt-12 pb-1 text-center text-[11px] leading-relaxed text-neutral-500">
                    Запис потребує підтвердження майстра
                  </p>
                </>
              )}
            </>
          )}
        </section>

        {!loading && !error && details && (created ? (
          <Link to="/client" replace className="flex min-h-12 items-center justify-center rounded-2xl bg-black px-4 py-3 font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2">
            На головну
          </Link>
        ) : (
          <button
            type="button"
            onClick={handleConfirm}
            disabled={saving}
            className="min-h-12 w-full shrink-0 rounded-2xl border border-black bg-black px-4 py-3 text-lg font-semibold text-white hover:bg-neutral-800 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:bg-neutral-300 disabled:text-neutral-600"
          >
            {saving ? "Створюємо запис…" : `Записатись • ${price} ₴`}
          </button>
        ))}
      </div>
    </main>
  );
}