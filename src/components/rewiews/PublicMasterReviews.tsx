import { useEffect, useState } from "react";
import {
  getPublicMasterReviews,
  type ReviewsResponse,
} from "../../api/reviews";

type Props = {
  masterId: number;
};

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString("uk-UA", {
    timeZone: "Europe/Kyiv",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function PublicMasterReviews({ masterId }: Props) {
  const [data, setData] = useState<ReviewsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [visibleCount, setVisibleCount] = useState(2);
  const [showEndMessage, setShowEndMessage] = useState(false);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadReviews() {
      try {
        const result = await getPublicMasterReviews(masterId);

        if (active) {
          setData(result);
          setError("");
        }
      } catch {
        if (active) {
          setError("Не вдалося завантажити відгуки.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadReviews();

    return () => {
      active = false;
    };
  }, [masterId, revision]);

  function retry() {
    setLoading(true);
    setError("");

    setRevision((current) => {
      return current + 1;
    });
  }

  if (loading) {
    return (
      <p role="status" className="py-4 text-sm text-neutral-500">
        Завантаження відгуків…
      </p>
    );
  }

  if (error) {
    return (
      <div className="space-y-3 rounded-2xl bg-neutral-50 p-4">
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>

        <button
          type="button"
          onClick={retry}
          className="min-h-11 rounded-xl border border-neutral-300 px-4 text-sm hover:bg-neutral-100"
        >
          Спробувати ще раз
        </button>
      </div>
    );
  }

  if (!data || data.reviews.length === 0) {
    return (
      <p className="rounded-2xl bg-neutral-50 p-5 text-sm text-neutral-500">
        Відгуків поки немає.
      </p>
    );
  }

  // Бек уже повертає нові відгуки першими.
  const visibleReviews = data.reviews.slice(0, visibleCount);
  const hasMore = visibleCount < data.reviews.length;

  return (
    <div className="space-y-4">
      <p className="flex items-center gap-2">
        <span className="text-3xl font-semibold">
          {data.averageRating.toFixed(1)}
        </span>
        <span aria-hidden="true" className="text-3xl text-amber-400">
          ★
        </span>
        <span className="text-sm text-neutral-500">
          Відгуків: {data.totalCount}
        </span>
      </p>

      {visibleReviews.map((review) => {
        const clientName = review.clientFirstName || "Клієнт";

        return (
          <article
            key={review.id}
            className="min-w-0 space-y-3 rounded-2xl bg-white p-3.5 shadow-[0_4px_16px_rgba(0,0,0,0.10)] sm:p-5"
          >
            <div className="grid grid-cols-[36px_minmax(0,1fr)_auto] items-start gap-x-2 gap-y-2 sm:gap-x-3">
              {review.clientAvatarUrl ? (
                <img
                  src={review.clientAvatarUrl}
                  alt=""
                  loading="lazy"
                  className="h-9 w-9 shrink-0 rounded-full object-cover"
                />
              ) : (
                <span
                  aria-hidden="true"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#a38ba1] text-xl text-white"
                >
                  {clientName.charAt(0)}
                </span>
              )}

              <div className="min-w-0">
                <p className="wrap-break-word text-sm font-semibold leading-5">{clientName}</p>

                <div className="mt-1.5 space-y-1 text-xs text-neutral-600">
                  <p className="wrap-break-word leading-4">{review.serviceName}</p>
                  <p className="hidden flex-wrap items-center gap-x-2 gap-y-1 rounded-lg bg-neutral-100 px-2 py-1 text-xs sm:inline-flex">
                    <span className="whitespace-nowrap">{review.durationMin} хв</span>
                    <span aria-hidden="true">•</span>
                    <span className="whitespace-nowrap">{review.price.toLocaleString("uk-UA")} ₴</span>
                  </p>
                </div>
              </div>

              <div className="col-start-3 row-start-1 flex flex-col items-end gap-2">
                <p className="inline-flex items-center gap-1 whitespace-nowrap rounded-lg bg-neutral-100 px-2 py-1 text-[11px] text-neutral-600 sm:hidden">
                  <span>{review.durationMin} хв</span>
                  <span aria-hidden="true">•</span>
                  <span>{review.price.toLocaleString("uk-UA")} ₴</span>
                </p>
              <span
                role="img"
                aria-label={`Оцінка: ${review.rating} з 5`}
                className="flex gap-0.5 text-base leading-none sm:gap-1 sm:text-lg sm:pt-1"
              >
                {[1, 2, 3, 4, 5].map((star) => {
                  return (
                    <span
                      key={star}
                      aria-hidden="true"
                      className={
                        star <= review.rating
                          ? "text-amber-400"
                          : "text-neutral-200"
                      }
                    >
                      ★
                    </span>
                  );
                })}
              </span>
              </div>
            </div>

            <p className="whitespace-pre-wrap wrap-break-word text-sm leading-relaxed">
              {review.text}
            </p>

            <div className="flex flex-wrap justify-between gap-x-3 gap-y-1 border-t border-neutral-100 pt-2 text-[11px] tabular-nums text-neutral-500 sm:text-xs">
              <span>
                {review.createdAt &&
                  new Date(review.createdAt).toLocaleDateString("uk-UA", {
                    timeZone: "Europe/Kyiv",
                  })}
              </span>

              {review.startsAt && review.endsAt && (
                <span>
                  {formatTime(review.startsAt)}
                  {"–"}
                  {formatTime(review.endsAt)}
                </span>
              )}
            </div>

            {review.reply && (
              <div className="rounded-xl border-l-2 border-neutral-200 bg-neutral-50 px-3 py-2.5">
                <p className="mb-1 text-xs font-medium text-neutral-500">
                  Відповідь майстра
                </p>
                <p className="whitespace-pre-wrap wrap-break-word text-sm">
                  {review.reply}
                </p>
              </div>
            )}
          </article>
        );
      })}

      <button
        type="button"
        onClick={() => {
          // Розкриваємо ще до десяти відгуків, не виходячи за межі списку.
          const nextCount = Math.min(visibleCount + 10, data.reviews.length);
          setVisibleCount(nextCount);
          setShowEndMessage(nextCount >= data.reviews.length);
        }}
        className="min-h-11 w-full rounded-full border border-neutral-400 px-5 py-2 text-sm font-medium text-neutral-600 transition hover:bg-neutral-100"
      >
        Дивитись більше
      </button>
      {showEndMessage && !hasMore && (
        <p role="status" className="py-2 text-center text-sm text-neutral-500">
          Більше відгуків немає.
        </p>
      )}
    </div>
  );
}


