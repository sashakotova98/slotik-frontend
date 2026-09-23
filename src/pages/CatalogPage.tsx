import { useEffect, useState } from "react";
import { getCatalogMasters, type CatalogMaster, } from "../api/catalogMasters";
import { Link, useSearchParams } from "react-router-dom";
import { ChevronRight, ImageIcon, Star, Users } from "lucide-react";

export default function CatalogPage() {

  const [searchParams] = useSearchParams();
  const categoryIdParam = searchParams.get("categoryId");
  // const searchParam = searchParams.get("search") ?? "";

  const categoryId = categoryIdParam === null ? undefined : Number(categoryIdParam);

  const isInvalidCategory = categoryId !== undefined && (!Number.isSafeInteger(categoryId) || categoryId <= 0);


  const [masters, setMasters] = useState<CatalogMaster[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isInvalidCategory) return;

    async function loadMasters() {
      setLoading(true);
      setError("");
      setMasters([]);

      try {
        const data = await getCatalogMasters(categoryId);
        setMasters(data);
      } catch {
        setError("Не вдалося завантажити майстрів.");
      } finally {
        setLoading(false);
      }
    }

    loadMasters();
  }, [categoryId, isInvalidCategory]);




  return (
    <main className="px-4 py-6">
      <h1 className="text-left text-2xl font-bold lg:text-center">
        Майстри
      </h1>


      {isInvalidCategory ? (
        <p role="alert" className="mt-2 text-danger">
          Некоректний ID категорії.
        </p>
      ) : (
        <>
          <p className="mt-2 text-left text-muted lg:text-center">
            {categoryId === undefined
              ? "Усі категорії"
              : `ID категорії: ${categoryId}`}
          </p>

          {loading && (
            <p role="status" className="mt-4">
              Завантаження майстрів…
            </p>
          )}

          {!loading && error && (
            <p role="alert" className="mt-4 text-danger">
              {error}
            </p>
          )}

          {!loading && !error && (
            masters.length > 0 ? (
              <ul className="mx-auto mt-6 w-full max-w-3xl space-y-7">
                {masters.map((master) => (
                  <li
                    key={master.id}
                    className="relative rounded-2xl bg-white p-3 pb-5 shadow-lg sm:p-5 sm:pb-6"
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
                        <h2 className="wrap-break-word text-xs font-semibold leading-tight text-black sm:text-base">
                          {master.firstName} {master.lastName}
                        </h2>

                        <p className="mt-1 inline-block max-w-full rounded-full bg-gray-100 px-2 py-0.5 text-[9px] text-gray-600 sm:text-xs">
                          {master.category}
                        </p>

                        <div className="mt-1 flex flex-wrap items-center gap-x-1 gap-y-0.5 text-[9px] text-gray-500 sm:text-xs">
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

                        <p className="mt-1 flex items-center gap-1 text-[9px] text-gray-500 sm:text-xs">
                          <Users aria-hidden="true" className="size-3 shrink-0" />
                          Клієнтів: {master.clientsCount}
                        </p>
                      </div>

                      <div
                        role="img"
                        aria-label="Фото робіт поки недоступні"
                        className="grid w-24 shrink-0 grid-cols-3 gap-1 sm:w-48 sm:gap-2"
                      >
                        {[0, 1, 2].map((index) => (
                          <div
                            key={index}
                            className="flex aspect-3/4 items-center justify-center rounded-lg bg-gray-100"
                          >
                            <ImageIcon
                              aria-hidden="true"
                              className="size-4 text-gray-300 sm:size-6"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <Link
                      to={`/m/${encodeURIComponent(master.slug)}`}
                      aria-label={`Переглянути профіль: ${master.firstName} ${master.lastName}`}
                      className="absolute -bottom-3 right-3 flex size-11 items-center justify-center rounded-full bg-blue-100 text-blue-500 shadow-sm transition-colors hover:bg-blue-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 sm:right-5"
                    >
                      <ChevronRight aria-hidden="true" className="size-7" />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-muted">
                Майстрів не знайдено.
              </p>
            )
          )}
        </>
      )}
    </main>
  );
}

