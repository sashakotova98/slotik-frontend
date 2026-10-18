import { ApiError } from "../api/api";
import Header from "../components/Header";
import ServiceSearchForm from "../components/search/ServiceSearchForm";
import CityPicker from "../components/search/CityPicker";
import DistrictPicker from "../components/search/DistrictPicker";
import { useEffect, useState } from "react";
import { getCatalogMasters, type CatalogMaster, } from "../api/catalogMasters";
import { useSearchParams } from "react-router-dom";
import CatalogMasterCard from "../components/catalog/CatalogMasterCard";
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
    <div className="min-h-screen bg-surface text-text">
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
                <p className="wrap-break-word text-copy-500">Пошук: «{searchParam}»</p>
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
                      <CatalogMasterCard key={master.id} master={master} />
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









