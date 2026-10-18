import { Link, useLocation } from "react-router-dom";
import { ChevronRight, Heart, ImageIcon, Star, Users } from "lucide-react";
import type { CatalogMaster } from "../../api/catalogMasters";

type Props = {
  master: CatalogMaster;
  isFavorite?: boolean;
  favoriteLoading?: boolean;
  favoriteDisabled?: boolean;
  favoriteHint?: string;
  onToggleFavorite?: () => void;
};

export default function CatalogMasterCard({
  master,
  isFavorite = false,
  favoriteLoading = false,
  favoriteDisabled = false,
  favoriteHint,
  onToggleFavorite,
}: Props) {
  // Зберігаємо адресу списку з фільтрами для повернення з профілю.
  const location = useLocation();
  const previewPhotos = [...master.portfolioPhotos].sort((a, b) => a.id - b.id).slice(0, 3);

  return (
    <li
      className="relative rounded-2xl bg-surface p-3 pb-5 shadow-lg sm:p-5 sm:pb-6"
    >
      <div className="flex items-center gap-2 sm:gap-4">
        <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-200 text-lg font-semibold text-slate-600 sm:size-20 sm:text-2xl">
          {master.avatarUrl ? (
            <img
              src={master.avatarUrl}
              alt={`${master.firstName} ${master.lastName}`}
              className="size-full object-cover"
              loading="lazy"
            />
          ) : (
            <span>
              {master.firstName?.trim().charAt(0)}
              {master.lastName?.trim().charAt(0)}
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h2 className="wrap-break-word text-xs font-semibold leading-tight text-text sm:text-base">
            {master.firstName} {master.lastName}
          </h2>

          <p className="mt-1 inline-block max-w-full rounded-full bg-panel-100 px-2 py-0.5 text-[9px] text-copy-600 sm:text-xs">
            {master.category}
          </p>

          <div className="mt-1 flex flex-wrap items-center gap-x-1 gap-y-0.5 text-[9px] text-copy-500 sm:text-xs">
            {master.rating !== null && master.rating > 0 ? (
              <span className="inline-flex items-center gap-1">
                <Star
                  aria-hidden="true"
                  className="size-3 fill-amber-400 text-amber-400"
                />
                {master.rating}
              </span>
            ) : (
              <span>Ще немає відгуків</span>
            )}

            {(master.districtName || master.city) && (
              <span>
                · {master.districtName || master.city}
              </span>
            )}
          </div>

          {master.clientsCount !== null && <p className="mt-1 flex items-center gap-1 text-[9px] text-copy-500 sm:text-xs">
            <Users aria-hidden="true" className="size-3 shrink-0" />
            Клієнтів: {master.clientsCount}
          </p>}
        </div>

        <div
          aria-label="Портфоліо майстра"
          className="grid w-[34%] max-w-48 shrink-0 grid-cols-3 gap-1 sm:w-48 sm:gap-2"
        >
          {[0, 1, 2].map((index) => (
            <div
              key={index}
              className="flex aspect-3/4 items-center justify-center overflow-hidden rounded-lg bg-panel-100"
            >
              {previewPhotos[index] ? (
                <img src={previewPhotos[index].photoUrl} alt={`Робота майстра ${master.firstName} — ${index + 1}`} loading="lazy" className="size-full object-cover" />
              ) : (
                <ImageIcon aria-hidden="true" className="size-4 text-copy-400 sm:size-6" />
              )}
            </div>
          ))}
        </div>
      </div>


      {onToggleFavorite && (
        <button
          type="button"
          onClick={onToggleFavorite}
          disabled={favoriteLoading || favoriteDisabled}
          title={favoriteHint}
          aria-label={isFavorite ? "Прибрати з обраного" : "Додати до обраного"}
          aria-pressed={isFavorite}
          className="absolute -bottom-3 right-16 flex size-11 items-center justify-center rounded-full bg-pink-100 text-pink-600 shadow-sm hover:bg-pink-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-500 disabled:cursor-not-allowed sm:right-18"
        >
          <Heart aria-hidden="true" className={`size-6 ${isFavorite ? "fill-current" : ""}`} />
        </button>
      )}
      <Link
        to={`/m/${encodeURIComponent(master.slug)}`}

        state={{
          catalogPath: location.pathname + location.search,
        }}
        aria-label={`Переглянути профіль: ${master.firstName} ${master.lastName}`}
        className="absolute -bottom-3 right-3 flex size-11 items-center justify-center rounded-full bg-blue-100 text-blue-500 shadow-sm transition-colors hover:bg-blue-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 sm:right-5"
      >
        <ChevronRight aria-hidden="true" className="size-7" />
      </Link>
    </li>
  );
}
