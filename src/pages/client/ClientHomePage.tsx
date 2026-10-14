import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCities, type City } from "../../api/cities";
import { getHomeCategories, type HomeCategory } from "../../api/homeCategories";
import CityPicker from "../../components/search/CityPicker";
import DistrictPicker from "../../components/search/DistrictPicker";
import ServiceSearchForm from "../../components/search/ServiceSearchForm";
import CategoryGrid from "../../components/search/CategoryGrid";
import ClientBookingCard from "../../components/client/ClientBookingCard";
import ClientMasters from "../../components/client/ClientMasters";

export default function ClientHomePage() {
  const navigate = useNavigate();
  const [cities, setCities] = useState<City[]>([]);
  const [cityId, setCityId] = useState<number | null>(null);
  const [districtId, setDistrictId] = useState<number | null>(null);
  const [citiesLoading, setCitiesLoading] = useState(true);
  const [citiesError, setCitiesError] = useState("");
  const [categories, setCategories] = useState<HomeCategory[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadCities() {
      try {
        const data = await getCities();
        if (active) {
          setCities(data);
          setCityId(data.find((city) => city.id === 1)?.id ?? data[0]?.id ?? null);
        }
      } catch {
        if (active) setCitiesError("Не вдалося завантажити міста.");
      } finally {
        if (active) setCitiesLoading(false);
      }
    }

    async function loadCategories() {
      try {
        const data = await getHomeCategories();
        if (active) setCategories(data);
      } catch {
        if (active) setCategoriesError("Не вдалося завантажити категорії.");
      } finally {
        if (active) setCategoriesLoading(false);
      }
    }

    void loadCities();
    void loadCategories();
    return () => { active = false; };
  }, []);

  const selectedCity = cities.find((city) => city.id === cityId);

  function handleCityChange(id: number) {
    setCityId(id);
    setDistrictId(null);
  }

  function handleSearch(query: string) {
    const params = new URLSearchParams();
    if (cityId !== null) params.set("cityId", String(cityId));
    if (districtId !== null) params.set("districtId", String(districtId));
    if (query) params.set("search", query);
    navigate(`/catalog?${params.toString()}`);
  }

  return (
    <section aria-labelledby="client-home-title" className="min-w-0 w-full">
      <h1 id="client-home-title" className="sr-only">Головна клієнта</h1>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <CityPicker
          cities={cities}
          cityId={cityId}
          loading={citiesLoading}
          error={citiesError}
          onChange={handleCityChange}
        />
        <DistrictPicker
          key={cityId}
          districts={selectedCity?.districts ?? []}
          districtId={districtId}
          disabled={citiesLoading || Boolean(citiesError) || !selectedCity}
          onChange={setDistrictId}
        />
      </div>

      <ServiceSearchForm onSearch={handleSearch} className="mt-5" />

      <nav aria-label="Категорії послуг" className="mt-8">
        {categoriesLoading ? (
          <p role="status" className="text-sm text-muted">Завантаження категорій…</p>
        ) : categoriesError ? (
          <p role="alert" className="text-sm text-danger">{categoriesError}</p>
        ) : categories.length === 0 ? (
          <p className="text-sm text-muted">Категорій поки немає.</p>
        ) : (
          <CategoryGrid categories={categories} cityId={cityId} districtId={districtId} />
        )}
      </nav>

      <div className="mt-8">
        <ClientBookingCard />
      </div>
      <ClientMasters />
    </section>
  );
}
