import { useEffect, useId, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import CityPicker from "../../components/search/CityPicker";
import DistrictPicker from "../../components/search/DistrictPicker";
import ServiceSearchForm from "../../components/search/ServiceSearchForm";
import CatalogMasterCard from "../../components/catalog/CatalogMasterCard";
import { getCities, type City } from "../../api/cities";
import { getCatalogMasters, type CatalogMaster } from "../../api/catalogMasters";
import { getFavorites, type Favorite } from "../../api/favorites";
import { getPublicMasterReviews } from "../../api/reviews";

import CategoryGrid from "../../components/search/CategoryGrid";
import { getHomeCategories, type HomeCategory } from "../../api/homeCategories";

export default function ClientSearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const sortBy = searchParams.get("sort") === "newest" ? "newest" : "rating";
  const [categories, setCategories] = useState<HomeCategory[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState("");
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const categoriesId = useId();
  const searchPanelRef = useRef<HTMLDivElement>(null);
  const [cities, setCities] = useState<City[]>([]);
  const [citiesLoading, setCitiesLoading] = useState(true);
  const [citiesError, setCitiesError] = useState("");
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [favoritesLoading, setFavoritesLoading] = useState(true);
  const [favoritesError, setFavoritesError] = useState("");
  const [masters, setMasters] = useState<CatalogMaster[]>([]);
  const [mastersLoading, setMastersLoading] = useState(false);
  const [mastersError, setMastersError] = useState("");
  const [ratingsError, setRatingsError] = useState("");
  // Фільтри зберігаємо в URL: вони залишаються після оновлення та повернення з профілю.
  const categoryParam = searchParams.get("categoryId");
  const categoryId = categoryParam === null ? null : Number(categoryParam);
  const cityParam = searchParams.get("cityId");
  const districtParam = searchParams.get("districtId");
  const search = searchParams.get("search") ?? "";
  const cityId = cityParam === null ? (cities.find((city) => city.id === 1)?.id ?? cities[0]?.id ?? null) : Number(cityParam);
  const districtId = districtParam === null ? null : Number(districtParam);
  const selectedCity = cities.find((city) => city.id === cityId);
  const districts = selectedCity?.districts ?? [];
  const invalidFilters =
    (categoryId !== null && (!Number.isSafeInteger(categoryId) || categoryId <= 0)) ||
    (cityId !== null && (!Number.isSafeInteger(cityId) || cityId <= 0)) ||
    (districtId !== null && (!Number.isSafeInteger(districtId) || districtId <= 0)) ||
    (!citiesLoading && !citiesError && cities.length > 0 && !selectedCity) ||
    (!citiesLoading && Boolean(selectedCity) && districtId !== null && !districts.some((district) => district.id === districtId));

  useEffect(() => {
    let active = true;
    async function loadCities() {
      try {
        const data = await getCities();
        if (active) setCities(data);
      } catch {
        if (active) setCitiesError("Не вдалося завантажити міста. Оновіть сторінку.");
      } finally {
        if (active) setCitiesLoading(false);
      }
    }
    async function loadFavorites() {
      try {
        const data = await getFavorites();
        if (active) setFavorites(data);
      } catch {
        if (active) setFavoritesError("Не вдалося завантажити обране. Пошук майстрів залишається доступним.");
      } finally {
        if (active) setFavoritesLoading(false);
      }
    }
    async function loadCategories() {
      try {
        const data = await getHomeCategories();
        if (active) setCategories(data);
      } catch {
        if (active) setCategoriesError("Не вдалося завантажити категорії. Оновіть сторінку.");
      } finally {
        if (active) setCategoriesLoading(false);
      }
    }
    void loadCategories();
    void loadCities();
    void loadFavorites();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (citiesLoading || citiesError || invalidFilters || cityId === null) return;
    let active = true;

    async function loadMasters() {
      // Починаємо новий пошук і прибираємо попередні результати.
      setMastersLoading(true);
      setMastersError("");
      setRatingsError("");
      setMasters([]);

      try {
        const data = await getCatalogMasters(categoryId ?? undefined, cityId ?? undefined, search, districtId ?? undefined);
        if (!active) return;
        const visibleMasters = data.filter((master) => !master.isBlocked);

        // Додаємо оцінку з відгуків, якщо її немає у відповіді списку.
        const results = await Promise.allSettled(visibleMasters.map(async (master) => {
          if (master.rating !== null) return master;
          const reviews = await getPublicMasterReviews(master.id);
          return { ...master, rating: reviews.totalCount > 0 ? reviews.averageRating : null };
        }));
        if (!active) return;

        // Якщо відгуки не завантажились, сам майстер залишається у списку.
        setMasters(results.map((result, index) =>
          result.status === "fulfilled" ? result.value : visibleMasters[index],
        ));
        if (results.some((result) => result.status === "rejected")) {
          setRatingsError("Частину оцінок не вдалося завантажити.");
        }
      } catch {
        if (active) setMastersError("Не вдалося завантажити майстрів. Спробуйте повторити пошук.");
      } finally {
        if (active) setMastersLoading(false);
      }
    }

    void loadMasters();
    // Не записуємо відповідь старого запиту після зміни фільтрів.
    return () => { active = false; };
  }, [cityId, districtId, categoryId, search, citiesLoading, citiesError, invalidFilters]);


  function changeCity(id: number) {
    const params = new URLSearchParams(searchParams);
    params.set("cityId", String(id));
    params.delete("districtId");
    setSearchParams(params);
  }

  function changeDistrict(id: number | null) {
    const params = new URLSearchParams(searchParams);
    if (id === null) params.delete("districtId");
    else params.set("districtId", String(id));
    setSearchParams(params);
  }

  function changeSearch(query: string) {
    setCategoriesOpen(false);
    const params = new URLSearchParams(searchParams);
    if (query.trim()) params.set("search", query.trim());
    else params.delete("search");
    setSearchParams(params);
  }

  function changeCategory(id: number | null) {
    const params = new URLSearchParams(searchParams);
    if (id === null) params.delete("categoryId");
    else params.set("categoryId", String(id));
    params.delete("search");
    setSearchParams(params);
    setCategoriesOpen(false);
    searchPanelRef.current?.querySelector<HTMLInputElement>("input")?.focus();
    // focus відкриває панель, тому закриваємо її після повернення фокусу.
    setCategoriesOpen(false);
  }

  function changeSort(value: "rating" | "newest") {
    const params = new URLSearchParams(searchParams);
    if (value === "newest") params.set("sort", value);
    else params.delete("sort");
    setSearchParams(params);
  }

  // Майстри без коректної дати будуть наприкінці списку нових.
  function registrationTime(master: CatalogMaster) {
    const time = master.createdAt ? Date.parse(master.createdAt) : NaN;
    return Number.isFinite(time) ? time : -Infinity;
  }

  const favoriteIds = new Set(favorites.map((favorite) => favorite.masterId));
  const favoriteMasters = masters.filter((master) => favoriteIds.has(master.id));
  // Обраних майстрів показуємо лише у секції «Для Вас».
  const recommended = masters
    .filter((master) => !favoriteIds.has(master.id))
    .sort((a, b) => {
      if (sortBy === "newest") {
        return registrationTime(b) - registrationTime(a) || a.id - b.id;
      }
      return (b.rating ?? -1) - (a.rating ?? -1) || a.id - b.id;
    });
  const canShowResults = !citiesLoading && !mastersLoading && !citiesError && !invalidFilters && !mastersError && cityId !== null;
  const noteClass = "rounded-2xl bg-neutral-50 px-4 py-4 text-sm leading-relaxed text-neutral-500";

  function renderCard(master: CatalogMaster) {
    return (
      <CatalogMasterCard
        key={master.id}
        master={master}
        isFavorite={favoriteIds.has(master.id)}
        favoriteDisabled
        favoriteHint="Зміна обраного поки недоступна"
        // POST і DELETE поки дозволені лише адміністратору. Кнопка заблокована.
        onToggleFavorite={() => { }}
      />
    );
  }

  return (
    <section className="mx-auto w-full min-w-0 max-w-2xl pb-4 text-black" aria-labelledby="client-search-title">
      <h1 id="client-search-title" className="sr-only">
        Пошук майстрів
      </h1>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <CityPicker cities={cities} cityId={cityId} loading={citiesLoading} error={citiesError} onChange={changeCity} />
        <DistrictPicker
          key={cityId}
          districts={districts}
          districtId={districtId}
          disabled={!selectedCity || citiesLoading}
          onChange={changeDistrict}
        />
      </div>
      {categoriesOpen && <div aria-hidden="true" onClick={() => setCategoriesOpen(false)} className="fixed inset-0 z-40 bg-black/35" />}
      <div
        ref={searchPanelRef}
        className={`relative mt-5 ${categoriesOpen ? "z-50" : ""}`}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.stopPropagation();
            searchPanelRef.current?.querySelector<HTMLInputElement>("input")?.focus();
            setCategoriesOpen(false);
          }
        }}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setCategoriesOpen(false);
        }}
      >
        <ServiceSearchForm
          autoComplete="off"
          defaultValue={search}
          onSearch={changeSearch}
          onClear={() => changeSearch("")}
          onOpenCategories={() => setCategoriesOpen(true)}
          categoriesOpen={categoriesOpen}
          categoriesId={categoriesOpen ? categoriesId : undefined}
          className="z-10"
        />
        {categoriesOpen && (
          <div
            id={categoriesId}
            role="region"
            aria-label="Категорії послуг"
            className="absolute inset-x-0 top-full -mt-7 rounded-b-2xl bg-white px-3 pb-5 pt-11 shadow-xl sm:px-5"
          >
            <div className="max-h-[min(20rem,45dvh)] overflow-y-auto overscroll-contain px-1 pb-1">
              {categoriesLoading ? (
                <p role="status" className="text-sm text-neutral-500">
                  Завантаження категорій…
                </p>
              ) : categoriesError ? (
                <p role="alert" className="text-sm text-neutral-500">
                  {categoriesError}
                </p>
              ) : categories.length === 0 ? (
                <p className="text-sm text-neutral-500">Категорій поки немає.</p>
              ) : (
                <CategoryGrid categories={categories} selectedCategoryId={categoryId} onSelect={changeCategory} />
              )}
            </div>
            <button type="button" onClick={() => setCategoriesOpen(false)} className="mt-3 min-h-9 text-sm text-neutral-500 underline">
              Закрити
            </button>
          </div>
        )}
      </div>
      {categoryId !== null && (
        <button type="button" onClick={() => changeCategory(null)} className="mt-3 min-h-10 rounded-full bg-neutral-100 px-3 text-sm">
          {categories.find((category) => category.id === categoryId)?.name ?? "Обрана категорія"} · Скинути ×
        </button>
      )}

      {invalidFilters && (
        <p role="alert" className={`mt-6 ${noteClass}`}>
          Некоректне місто, район або категорія. Оберіть місто зі списку.
        </p>
      )}
      {(citiesLoading || (mastersLoading && !citiesError && !invalidFilters && cityId !== null)) && (
        <p role="status" className={`mt-6 ${noteClass}`}>
          Завантаження майстрів…
        </p>
      )}
      {mastersError && (
        <p role="alert" className={`mt-6 ${noteClass}`}>
          {mastersError}
        </p>
      )}

      <section className="mt-7" aria-labelledby="for-you-title">
        <h2 id="for-you-title" className="text-lg font-semibold sm:text-xl">
          Для Вас
        </h2>
        <p className="mt-1 text-xs text-neutral-500">Обрані майстри за вашими фільтрами</p>
        {favoritesLoading ? (
          <p role="status" className="mt-3 text-sm text-neutral-500">
            Завантаження обраного…
          </p>
        ) : favoritesError ? (
          <p role="alert" className={`mt-3 ${noteClass}`}>
            {favoritesError}
          </p>
        ) : (
          canShowResults &&
          (favoriteMasters.length > 0 ? (
            <ul className="mt-4 space-y-7">{favoriteMasters.map(renderCard)}</ul>
          ) : (
            <p className={`mt-3 ${noteClass}`}>За цими фільтрами немає обраних майстрів.</p>
          ))
        )}
      </section>

      <section className="mt-9" aria-labelledby="recommended-title">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <h2 id="recommended-title" className="text-lg font-semibold sm:text-xl">
            Рекомендуємо
          </h2>
          <div className="flex gap-2" aria-label="Сортування майстрів">
            <button
              type="button"
              aria-pressed={sortBy === "rating"}
              onClick={() => changeSort("rating")}
              className={`min-h-9 rounded-full border px-3 py-1 text-xs focus-visible:outline-2 focus-visible:outline-offset-2 ${sortBy === "rating" ? "border-black bg-black text-white" : "border-neutral-300 bg-white text-black"}`}
            >
              За рейтингом
            </button>
            <button
              type="button"
              aria-pressed={sortBy === "newest"}
              onClick={() => changeSort("newest")}
              className={`min-h-9 rounded-full border px-3 py-1 text-xs focus-visible:outline-2 focus-visible:outline-offset-2 ${sortBy === "newest" ? "border-black bg-black text-white" : "border-neutral-300 bg-white text-black"}`}
            >
              Спочатку нові
            </button>
          </div>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-neutral-500">Зміна обраного поки недоступна.</p>
        {ratingsError && (
          <p role="status" className="mt-2 text-xs text-neutral-500">
            {ratingsError}
          </p>
        )}
        {canShowResults &&
          !favoritesLoading &&
          (recommended.length > 0 ? (
            <ul className="mt-5 space-y-7">{recommended.map(renderCard)}</ul>
          ) : (
            <p className={`mt-4 ${noteClass}`}>
              {favoriteMasters.length > 0
                ? "Усі знайдені майстри вже у секції «Для Вас»."
                : "Майстрів не знайдено. Спробуйте інший запит або район."}
            </p>
          ))}
      </section>
    </section>
  );
}

// добавить favorite
