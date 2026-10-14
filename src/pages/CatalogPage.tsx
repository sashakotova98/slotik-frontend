import { ApiError } from "../api/api";
import Header from "../components/Header";
import ServiceSearchForm from "../components/search/ServiceSearchForm";
import CityPicker from "../components/search/CityPicker";
import DistrictPicker from "../components/search/DistrictPicker";
import { useEffect, useState } from "react";
import { getCatalogMasters, type CatalogMaster, } from "../api/catalogMasters";
import { Link, useSearchParams, useLocation } from "react-router-dom";
import { ChevronRight, ImageIcon, Star, Users } from "lucide-react";
import { getHomeCategories, type HomeCategory, } from "../api/homeCategories";
import { getCities, type City } from "../api/cities";

export default function CatalogPage() {
  const location = useLocation();

  const [searchParams, setSearchParams] = useSearchParams();
  const categoryIdParam = searchParams.get("categoryId");
  const cityIdParam = searchParams.get("cityId") ?? "1";
  const searchParam = searchParams.get("search") ?? "";
  const districtIdParam = searchParams.get("districtId");

  const categoryId = categoryIdParam === null ? undefined : Number(categoryIdParam);
  const isInvalidCategory = categoryId !== undefined && (!Number.isSafeInteger(categoryId) || categoryId <= 0);

  const cityId = Number(cityIdParam);// київ
  const isInvalidCity = cityId !== undefined && (!Number.isSafeInteger(cityId) || cityId <= 0);

  const districtId = districtIdParam === null ? undefined : Number(districtIdParam);

  const isInvalidDistrict = districtId !== undefined && (!Number.isSafeInteger(districtId) || districtId <= 0);


  const [masters, setMasters] = useState<CatalogMaster[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [categories, setCategories] = useState<HomeCategory[]>([]);
  const [categoryNameError, setCategoryNameError] = useState("");

  const [cities, setCities] = useState<City[]>([]);
  const [citiesError, setCitiesError] = useState("");
  const [citiesLoading, setCitiesLoading] = useState(true);

  useEffect(() => {
    if (isInvalidCategory || isInvalidCity || isInvalidDistrict) return;
    let ignore = false;

    async function loadMasters() {
      setLoading(true);
      setError("");
      setMasters([]);

      try {
        const data = await getCatalogMasters(categoryId, cityId, searchParam, districtId);
        if (!ignore) setMasters(data);
      } catch (error) {
        if (!ignore) setError(error instanceof ApiError ? error.message : "Не вдалося завантажити майстрів.");
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadMasters();
    return () => { ignore = true; };
  }, [categoryId, cityId, searchParam, districtId, isInvalidCategory, isInvalidCity, isInvalidDistrict]);


  useEffect(() => {
    async function loadCategories() {
      try {
        const data = await getHomeCategories();
        setCategories(data);
      } catch (error) {
        setCategoryNameError(error instanceof ApiError ? error.message : "Не вдалося завантажити назву категорії.");
      }
    }

    loadCategories();
  }, []);


  useEffect(() => {
    async function loadCities() {
      try {
        const data = await getCities();
        setCities(data);
      } catch (error) {
        setCitiesError(error instanceof ApiError ? error.message : "Не вдалося завантажити міста.");
      } finally {
        setCitiesLoading(false);
      }
    }

    loadCities();
  }, []);

  function clearSearch() {
    const params = new URLSearchParams(searchParams);
    params.delete("search");
    setSearchParams(params);
  }

  function handleSearch(query: string) {
    const params = new URLSearchParams(searchParams);

    if (query) {
      params.set("search", query);
    } else {
      params.delete("search");
    }

    setSearchParams(params);
  }


  const selectedCategory = categories.find(
    (category) => category.id === categoryId
  );

  const selectedCity = cities.find(
    (city) => city.id === Number(cityId)
  );
  const districts = selectedCity?.districts ?? [];


  function handleCityChange(city: string) {
    const params = new URLSearchParams(searchParams);

    if (city) {
      params.set("cityId", city);
    } else {
      params.delete("cityId");
    }

    params.delete("districtId");

    setSearchParams(params);
  }

  function handleDistrictChange(district: string) {
    const params = new URLSearchParams(searchParams);

    if (district) {
      params.set("districtId", district);
    } else {
      params.delete("districtId");
    }

    setSearchParams(params);
  }



  return (
    <div className="min-h-screen bg-white text-black">
      <Header showBack backFallback="/home" />
      <main className="px-4 py-6 sm:px-6">
        <div className="mx-auto w-full max-w-2xl">
          <div className="mx-auto mb-7 w-full max-w-2xl">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              <CityPicker
                cities={cities}
                cityId={cityId}
                loading={citiesLoading}
                error={citiesError}
                onChange={(id) => handleCityChange(String(id))}
              />
              <DistrictPicker
                key={cityId}
                districts={districts}
                districtId={districtId ?? null}
                disabled={citiesLoading || Boolean(citiesError) || !selectedCity}
                onChange={(id) => handleDistrictChange(id === null ? "" : String(id))}
              />
            </div>

            <ServiceSearchForm
              defaultValue={searchParam}
              onSearch={handleSearch}
              onClear={() => {
                if (searchParam) clearSearch();
              }}
              className="mt-5 sm:mt-6"
            />
            {searchParam && (
              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                <p className="wrap-break-word text-neutral-500">Пошук: «{searchParam}»</p>
                <button type="button" onClick={clearSearch} className="min-h-11 rounded-lg px-2 font-medium text-blue-600 underline-offset-4 hover:underline focus-visible:outline-2">
                  Очистити пошук
                </button>
              </div>
            )}
          </div>
          <div className={searchParam.trim() && !loading && !error && masters.length === 0 ? "sr-only" : "flex flex-wrap items-center justify-start gap-x-3 gap-y-2"}>
            <h1 className="text-2xl font-bold leading-tight">Майстри</h1>
            {!isInvalidCategory && (
              <span className="inline-flex max-w-full items-center rounded-full bg-black px-3 py-1 text-xs font-medium leading-snug text-white sm:text-sm">
                {categoryId === undefined
                  ? "Усі категорії"
                  : selectedCategory?.name ?? "Обрана категорія"}
              </span>
            )}
          </div>


          {isInvalidCategory || isInvalidCity || isInvalidDistrict ? (
            <p role="alert" className="mt-2 text-danger">
              Некоректний ID категорії, міста або району.
            </p>
          ) : (
            <>

              {categoryId !== undefined && categoryNameError && (
                <p role="alert" className="mt-1 text-sm text-muted">
                  {categoryNameError}
                </p>
              )}

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
                  <ul className="mx-auto mt-6 w-full max-w-2xl space-y-7">
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

                          state={{
                            catalogPath: location.pathname + location.search,
                          }}
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
        </div>
      </main>
    </div>
  );
}









