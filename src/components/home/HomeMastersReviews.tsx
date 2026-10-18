import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Users } from "lucide-react";
import { getMasterPortfolio, type PortfolioPhoto } from "../../api/masters";
import { getCatalogMasters, type CatalogMaster } from "../../api/catalogMasters";
import { getPublicMasterReviews, type ReviewsResponse } from "../../api/reviews";

type HomeMaster = {
  master: CatalogMaster;
  reviewsData: ReviewsResponse | null;
  portfolioPhotos: PortfolioPhoto[];
  photosFailed: boolean;
};

// Час процедури показуємо за Києвом.
function formatReviewTime(value: string) {
  return new Date(value).toLocaleTimeString("uk-UA", {
    timeZone: "Europe/Kyiv",
    hour: "2-digit",
    minute: "2-digit",
  });
}
export default function HomeMastersReviews() {
  const [items, setItems] = useState<HomeMaster[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadMasters() {
      try {
        const masters = await getCatalogMasters();

        const selected: { master: CatalogMaster; reviewsData: ReviewsResponse }[] = [];
        let reviewsFailed = false;

        // Перевіряємо відгуки, доки не знайдемо двох майстрів.
        // Наявність рейтингу сама по собі не замінює перевірку списку.
        for (const master of masters) {
          if (!active) {
            return;
          }
          if (master.isBlocked) {
            continue;
          }
          try {
            const reviewsData = await getPublicMasterReviews(master.id);
            if (reviewsData.reviews.length > 0) {
              selected.push({ master, reviewsData });
            }
          } catch {
            reviewsFailed = true;
          }
          if (selected.length === 2) {
            break;
          }
        }

        if (!active) {
          return;
        }
        // Портфоліо завантажуємо лише для вибраних майстрів.
        const result = await Promise.all(
          selected.map(async ({ master, reviewsData }) => {
            try {
              const portfolioPhotos = await getMasterPortfolio(master.id);
              return { master, reviewsData, portfolioPhotos: portfolioPhotos.slice(0, 3), photosFailed: false };
            } catch {
              return { master, reviewsData, portfolioPhotos: [], photosFailed: true };
            }
          }),
        );
        if (active) {
          setItems(result);
          setError(result.length === 0 && reviewsFailed ? "Не вдалося завантажити відгуки майстрів." : "");
        }
      } catch {
        if (active) {
          setError("Не вдалося завантажити майстрів.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadMasters();

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return <p className="px-4 py-8 text-center text-sm text-copy-500">Завантаження майстрів…</p>;
  }

  if (error) {
    return (
      <p role="alert" className="px-4 py-8 text-center text-sm text-red-600">
        {error}
      </p>
    );
  }

  if (items.length === 0) {
    return null;
  }

  return (
    <section aria-label="Майстри та відгуки клієнтів" className="px-4 py-8">
      <div className="mx-auto max-w-2xl space-y-8">
        {items.map(({ master, reviewsData, portfolioPhotos, photosFailed }) => {
          const latestReview = reviewsData?.reviews[0];
          const clientName = latestReview?.clientFirstName || "Клієнт";
          const fullName = `${master.firstName} ${master.lastName}`;
          const rating = reviewsData ? (reviewsData.totalCount > 0 ? reviewsData.averageRating : null) : master.rating;

          return (
            <article key={master.id}>
              {/* На вузькому екрані портфоліо переноситься під дані майстра. */}
              <div className="relative rounded-3xl bg-surface p-4 pb-7 shadow-[0_10px_24px_rgba(0,0,0,0.18)] sm:p-5 sm:pb-8">
                <div className="grid gap-4 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
                  <div className="flex min-w-0 items-center gap-3">
                    {master.avatarUrl ? (
                      <img src={master.avatarUrl} alt="" className="h-20 w-20 shrink-0 rounded-full object-cover sm:h-24 sm:w-24" />
                    ) : (
                      <span
                        aria-hidden="true"
                        className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-panel-200 text-3xl sm:h-24 sm:w-24"
                      >
                        {master.firstName.charAt(0)}
                      </span>
                    )}
                    <div className="min-w-0 space-y-1.5">
                      <h3 className="wrap-break-word text-base font-semibold leading-tight">{fullName}</h3>
                      {master.category && (
                        <p className="inline-block rounded-full bg-panel-100 px-3 py-1 text-[11px] text-copy-600">{master.category}</p>
                      )}
                      <p className="text-xs text-copy-600">
                        {rating !== null && (
                          <span>
                            <span className="text-amber-400">★</span> {rating.toFixed(1)}
                            {(master.city || master.districtName) && " • "}
                          </span>
                        )}
                        {[master.city, master.districtName].filter(Boolean).join(", ")}
                      </p>
                      <p className="flex items-center gap-2 text-xs text-copy-500">
                        <Users size={14} aria-hidden="true" />
                        Клієнтів: {master.clientsCount}
                      </p>
                    </div>
                  </div>
                  <div className="min-w-0">
                    {portfolioPhotos.length > 0 ? (
                      <div className="grid grid-cols-3 gap-2">
                        {portfolioPhotos.map((photo, index) => {
                          return (
                            <Link
                              key={photo.id}
                              to={`/m/${encodeURIComponent(master.slug)}`}
                              className="overflow-hidden rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2"
                            >
                              <img
                                src={photo.photoUrl}
                                alt={`Робота майстра ${fullName}, фото ${index + 1}`}
                                loading="lazy"
                                className="aspect-3/4 w-full object-cover transition hover:scale-105"
                              />
                            </Link>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="flex min-h-24 items-center justify-center rounded-xl bg-panel-50 p-3 text-center text-xs text-copy-500">
                        {photosFailed ? "Не вдалося завантажити портфоліо." : "Майстер ще не додав фото робіт."}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <div className="relative z-20 -mt-4 mr-2 flex justify-end sm:mr-1">
                <Link
                  to={`/m/${encodeURIComponent(master.slug)}`}
                  aria-label={`Переглянути профіль майстра ${fullName}`}
                  className="inline-flex min-h-12 items-center gap-1 rounded-full bg-blue-100/95 px-5 text-base font-medium text-blue-500 transition hover:bg-blue-200 focus-visible:outline-2 focus-visible:outline-offset-2"
                >
                  До майстра <ChevronRight size={26} aria-hidden="true" />
                </Link>
              </div>
              {/* Останній відгук частково перекриває картку майстра. */}
              {latestReview && (
                <div className="relative z-10 mt-3 mx-auto w-[92%] max-w-sm space-y-2 rounded-[20px] bg-surface p-3 shadow-[0_10px_24px_rgba(0,0,0,0.22)] sm:-mt-14 sm:ml-[25%] sm:mr-0 sm:w-[47%]">
                  <div className="flex items-center gap-2">
                    {latestReview.clientAvatarUrl ? (
                      <img src={latestReview.clientAvatarUrl} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" />
                    ) : (
                      <span
                        aria-hidden="true"
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#a38ba1] text-xl text-white"
                      >
                        {clientName.charAt(0)}
                      </span>
                    )}

                    <div className="min-w-0">
                      <p className="text-xs font-medium">{clientName}</p>
                      <p className="mt-1 rounded-lg bg-panel-100 px-2 py-1 text-[11px] text-copy-600">
                        {latestReview.serviceName || "Послуга"}
                        {latestReview.price != null && (
                          <> • {latestReview.price.toLocaleString("uk-UA")} ₴</>
                        )}
                        {latestReview.durationMin != null && (
                          <> • {latestReview.durationMin} хв</>
                        )}
                      </p>
                    </div>
                  </div>

                  <p aria-label={`Оцінка: ${latestReview.rating} з 5`} className="text-sm tracking-wider">
                    {[1, 2, 3, 4, 5].map((star) => {
                      return (
                        <span key={star} aria-hidden="true" className={star <= latestReview.rating ? "text-amber-400" : "text-neutral-200"}>
                          ★
                        </span>
                      );
                    })}
                  </p>

                  <p className="whitespace-pre-wrap wrap-break-word text-xs leading-relaxed">{latestReview.text}</p>

                  <div className="flex flex-wrap justify-between gap-2 text-[10px] text-copy-500">
                    <span>
                      {latestReview.createdAt && new Date(latestReview.createdAt).toLocaleDateString("uk-UA", { timeZone: "Europe/Kyiv" })}
                    </span>
                    {latestReview.startsAt && latestReview.endsAt && (
                      <span>
                        {formatReviewTime(latestReview.startsAt)}–{formatReviewTime(latestReview.endsAt)}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}



