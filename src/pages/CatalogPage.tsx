import { useEffect, useRef, useState } from "react";
import { getCatalogMasters, type CatalogMaster, } from "../api/catalogMasters";
import { Link, useSearchParams } from "react-router-dom";
import { Check, ChevronRight, ChevronDown, MapPin, Search, ImageIcon, Star, Users } from "lucide-react";
import { getHomeCategories, type HomeCategory, } from "../api/homeCategories";
import { getCities, type City } from "../api/cities";

export default function CatalogPage() {


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
  const [categoryNameError, setCategoryNameError] = useState(false);

  const [cities, setCities] = useState<City[]>([]);
  const [citiesError, setCitiesError] = useState("");
  const [citiesLoading, setCitiesLoading] = useState(true);
  const [cityOpen, setCityOpen] = useState(false);
  const cityPickerRef = useRef<HTMLDivElement>(null);
  const cityButtonRef = useRef<HTMLButtonElement>(null);
  const [districtOpen, setDistrictOpen] = useState(false);
  const districtPickerRef = useRef<HTMLDivElement>(null);
  const districtButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!districtOpen) return;
    function closeOutside(event: PointerEvent) {
      if (event.target instanceof Node && !districtPickerRef.current?.contains(event.target)) {
        setDistrictOpen(false);
      }
    }
    document.addEventListener("pointerdown", closeOutside);
    return () => document.removeEventListener("pointerdown", closeOutside);
  }, [districtOpen]);

  useEffect(() => {
    if (!cityOpen) return;
    function closeOutside(event: PointerEvent) {
      if (event.target instanceof Node && !cityPickerRef.current?.contains(event.target)) {
        setCityOpen(false);
      }
    }
    document.addEventListener("pointerdown", closeOutside);
    return () => document.removeEventListener("pointerdown", closeOutside);
  }, [cityOpen]);



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
      } catch {
        if (!ignore) setError("Не вдалося завантажити майстрів.");
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
      } catch {
        setCategoryNameError(true);
      }
    }

    loadCategories();
  }, []);


  useEffect(() => {
    async function loadCities() {
      try {
        const data = await getCities();
        setCities(data);
      } catch {
        setCitiesError("Не вдалося завантажити міста.");
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

  function handleSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const query = String(formData.get("search") ?? "").trim();
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
    <main className="min-h-screen bg-white px-4 py-6 text-black sm:px-6">
      <div className="mx-auto w-full max-w-2xl">
        <div className="mx-auto mb-7 w-full max-w-2xl">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <div className="flex min-w-0 items-center gap-2">
              <MapPin aria-hidden="true" className="size-7 shrink-0 fill-red-400 stroke-black" />
              <div
                ref={cityPickerRef}
                className="relative min-w-0"
                onBlur={(event) => {
                  if (!event.currentTarget.contains(event.relatedTarget)) setCityOpen(false);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Escape") {
                    setCityOpen(false);
                    cityButtonRef.current?.focus();
                  }
                }}
              >
                <button
                  ref={cityButtonRef}
                  type="button"
                  aria-label={`Оберіть місто: ${selectedCity?.name ?? "не обрано"}`}
                  aria-expanded={cityOpen}
                  aria-controls="catalog-cities"
                  disabled={citiesLoading || Boolean(citiesError) || cities.length === 0}
                  onClick={() => { setDistrictOpen(false); setCityOpen((open) => !open); }}
                  className="flex min-h-11 max-w-60 items-center gap-3 rounded-xl border-0 bg-transparent px-2 py-1 text-2xl outline-none transition-colors hover:bg-neutral-100 focus-visible:ring-2 focus-visible:ring-blue-400 disabled:opacity-50 sm:text-3xl"
                >
                  <span className="truncate">{citiesLoading ? "Завантаження…" : citiesError ? "Міста недоступні" : selectedCity?.name ?? "Оберіть місто"}</span>
                  <ChevronDown aria-hidden="true" className={`size-4 shrink-0 text-neutral-500 transition-transform ${cityOpen ? "rotate-180" : ""}`} />
                </button>
                {cityOpen && (
                  <div id="catalog-cities" className="absolute left-0 top-full z-40 mt-2 w-64 max-w-[calc(100vw-80px)] rounded-2xl border border-neutral-100 bg-white p-2 shadow-xl">
                    <p className="px-3 pb-2 pt-1 text-xs font-medium text-neutral-500">Оберіть місто</p>
                    <ul aria-label="Міста" className="max-h-64 space-y-1 overflow-y-auto overscroll-contain">
                      {cities.map((city) => (
                        <li key={city.id}>
                          <button
                            type="button"
                            aria-pressed={city.id === cityId}
                            onClick={() => {
                              handleCityChange(String(city.id));
                              setCityOpen(false);
                              cityButtonRef.current?.focus();
                            }}
                            className={`flex min-h-11 w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-400 ${city.id === cityId ? "bg-blue-50 font-semibold text-blue-700" : "text-neutral-700 hover:bg-neutral-100"}`}
                          >
                            {city.name}
                            {city.id === cityId && <Check aria-hidden="true" className="size-4 shrink-0" />}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            <div
              ref={districtPickerRef}
              className="relative min-w-0 max-w-full"
              onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget)) setDistrictOpen(false);
              }}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  setDistrictOpen(false);
                  districtButtonRef.current?.focus();
                }
              }}
            >
              <button
                ref={districtButtonRef}
                type="button"
                aria-label="Оберіть район"
                aria-expanded={districtOpen}
                aria-controls="catalog-districts"
                disabled={citiesLoading || !selectedCity || districts.length === 0}
                onClick={() => { setCityOpen(false); setDistrictOpen((open) => !open); }}
                className="flex min-h-11 max-w-64 items-center gap-3 rounded-full border border-neutral-200 bg-neutral-50 px-4 py-2 text-sm text-neutral-700 outline-none transition-colors hover:bg-neutral-100 focus-visible:ring-2 focus-visible:ring-blue-400 disabled:opacity-50 sm:text-base"
              >
                <span className="truncate">{!selectedCity ? "Спочатку оберіть місто" : districtId !== undefined ? districts.find((district) => district.id === districtId)?.name ?? "Район недоступний" : districts.length === 0 ? "Районів немає" : "Усі райони"}</span>
                <ChevronDown aria-hidden="true" className={`size-4 shrink-0 text-neutral-500 transition-transform duration-200 motion-reduce:transition-none ${districtOpen ? "rotate-180" : ""}`} />
              </button>
              <div
                id="catalog-districts"
                aria-hidden={!districtOpen}
                inert={!districtOpen}
                className={`absolute left-0 top-full z-40 mt-2 w-full min-w-56 max-w-[calc(100vw-32px)] origin-top rounded-2xl border border-neutral-100 bg-white p-2 shadow-xl transition-[opacity,transform,visibility] duration-200 ease-out motion-reduce:transition-none ${districtOpen ? "visible translate-y-0 scale-100 opacity-100" : "invisible -translate-y-1 scale-95 opacity-0"}`}
              >
                <p className="px-3 pb-2 pt-1 text-xs font-medium text-neutral-500">Оберіть район</p>
                <ul aria-label="Райони" className="max-h-64 space-y-1 overflow-y-auto overscroll-contain">
                  {[{ id: "", name: "Усі райони" }, ...districts.map((district) => ({ id: String(district.id), name: district.name }))].map((district) => (
                    <li key={district.id}>
                      <button
                        type="button"
                        aria-pressed={district.id === (districtIdParam ?? "")}
                        onClick={() => {
                          handleDistrictChange(district.id);
                          setDistrictOpen(false);
                          districtButtonRef.current?.focus();
                        }}
                        className={`flex min-h-11 w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-400 ${district.id === (districtIdParam ?? "") ? "bg-blue-50 font-semibold text-blue-700" : "text-neutral-700 hover:bg-neutral-100"}`}
                      >
                        {district.name}
                        {district.id === (districtIdParam ?? "") && <Check aria-hidden="true" className="size-4 shrink-0" />}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <form onSubmit={handleSearch} role="search" className="relative mt-5 sm:mt-6">
            <button type="submit" aria-label="Знайти послугу, категорію або майстра" className="absolute left-1 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2">
              <Search aria-hidden="true" className="size-5" />
            </button>
            <input
              key={searchParam}
              name="search"
              type="search"
              defaultValue={searchParam}
              onChange={(event) => {
                if (event.target.value === "" && searchParam) clearSearch();
              }}
              aria-label="Пошук послуги або майстра"
              placeholder="Послуга, категорія або майстер..."
              className="block h-14 w-full rounded-full bg-white pl-12 pr-5 text-sm text-black placeholder:text-border shadow-[0_5px_8px_rgba(0,0,0,0.2)] outline-none focus-visible:ring-2 focus-visible:ring-black lg:h-16 lg:text-base"
            />
          </form>
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

            {citiesError && (
              <p role="alert" className="text-sm text-danger">
                {citiesError}
              </p>
            )}

            {categoryId !== undefined && categoryNameError && (
              <p className="mt-1 text-sm text-muted">
                Не вдалося завантажити назву категорії.
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
  );
}

