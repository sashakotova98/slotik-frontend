import { ApiError } from "../api/api";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { type PublicMasterProfile, type PortfolioPhoto, getMasterBySlug, getMasterPortfolio } from "../api/masters";

import { type Service, getServicesByMasterId } from "../api/services";
import MasterProfileHeader from "../components/master/MasterProfileHeader";
import ProfileShareModal from "../components/master/ProfileShareModal";
import PublicMasterReviews from "../components/rewiews/PublicMasterReviews";

export default function MasterProfilePage() {
  const { slug } = useParams();
  if (!slug) {
    return <p role="alert">Не вказано майстра.</p>;
  }
  // Інший slug створює нову сторінку з початковим станом завантаження.
  return <MasterProfileContent key={slug} slug={slug} />;
}

function MasterProfileContent({ slug }: { slug: string }) {
  const navigate = useNavigate();
  const location = useLocation();
  const navigationState = location.state as { catalogPath?: string; returnTo?: string } | null;
  const catalogPath = navigationState?.catalogPath;
  const backPath = typeof catalogPath === "string" &&
    (["/catalog", "/client/search"].some((path) => catalogPath === path || catalogPath.startsWith(`${path}?`)))
    ? catalogPath
    : "/home";
  const [servicePage, setServicePage] = useState(0);
  const [selectedGroup, setSelectedGroup] = useState<"all" | "popular" | number>("all");
  const [shareOpen, setShareOpen] = useState(false);


  const [masterProfile, setMasterProfile] = useState<PublicMasterProfile | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const availableGroups = Array.from(
    new Map(services.flatMap((service) =>
      service.groupId !== null && service.groupName
        ? [[service.groupId, service.groupName] as const] : [],
    )),
    ([id, name]) => ({ id, name }),
  );
  const hasPopular = services.some((service) => service.isPopular);
  const filteredServices = services.filter((service) =>
    selectedGroup === "all" ? true
      : selectedGroup === "popular" ? service.isPopular
        : service.groupId === selectedGroup,
  );
  function selectGroup(group: "all" | "popular" | number) {
    setSelectedGroup(group);
    setServicePage(0);
    document.getElementById("master-services-list")?.scrollTo({ top: 0, left: 0 });
  }
  const servicesPerPage = 3;
  const servicePageCount = Math.ceil(filteredServices.length / servicesPerPage);
  const currentServicePage = Math.min(servicePage, Math.max(0, servicePageCount - 1));
  const [portfolioPhotos, setPortfolioPhotos] = useState<PortfolioPhoto[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function fetchData() {
      try {
        const profile = await getMasterBySlug(slug);
        if (!active) { return; }

        const [services, photos] = await Promise.all([
          getServicesByMasterId(profile.id),
          getMasterPortfolio(profile.id),
        ]);
        // Ігноруємо відповідь, якщо користувач уже відкрив іншу сторінку.
        if (!active) { return; }
        setMasterProfile(profile);
        setServices(services);
        setPortfolioPhotos(photos);
      } catch (error) {
        if (active) {
          setError(error instanceof ApiError ? error.message : "Не вдалося завантажити профіль майстра.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void fetchData();
    return () => {
      active = false;
    };
  }, [slug]);

  function handleBack() {
    // Повернення з перегляду після створення сторінки майстра.
    if (navigationState?.returnTo === "/cabinet") {
      navigate("/cabinet", { replace: true });
      return;
    }

    navigate(backPath, { replace: true });
  }

  if (loading) {
    return <p role="status">Завантаження…</p>;
  }

  if (error) {
    return <p role="alert">{error}</p>;
  }

  if (!masterProfile) return null;

  const profileUrl = `${window.location.origin}/m/${encodeURIComponent(masterProfile.slug)}`;

  // Публічний API не повертає дату реєстрації, тому її не показуємо.

  const { latitude, longitude } = masterProfile;
  const hasCoordinates =
    typeof latitude === "number" &&
    typeof longitude === "number" &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 && latitude <= 90 &&
    longitude >= -180 && longitude <= 180;

  let mapUrl: string | null = null;
  let directionsUrl: string | null = null;

  if (hasCoordinates) {
    const bounds = [
      Math.max(-180, longitude - 0.008),
      Math.max(-90, latitude - 0.005),
      Math.min(180, longitude + 0.008),
      Math.min(90, latitude + 0.005),
    ].join(",");
    const mapParams = new URLSearchParams({
      bbox: bounds,
      layer: "mapnik",
      marker: latitude + "," + longitude,
    });
    mapUrl = "https://www.openstreetmap.org/export/embed.html?" + mapParams.toString();
    const directionsParams = new URLSearchParams({
      api: "1",
      destination: latitude + "," + longitude,
    });
    directionsUrl = "https://www.google.com/maps/dir/?" + directionsParams.toString();
  }
  const fullName = [masterProfile.firstName, masterProfile.lastName].filter(Boolean).join(" ");

  const initials = [masterProfile.firstName, masterProfile.lastName]
    .map((part) => part.trim().charAt(0))
    .join("")
    .toUpperCase();

  return (
    <div className="min-h-screen bg-panel-100 text-text sm:px-6 sm:py-6 lg:px-8 lg:py-10">
      <div className="mx-auto min-h-screen w-full max-w-120 overflow-hidden bg-surface sm:min-h-0 sm:max-w-3xl sm:rounded-3xl sm:shadow-sm lg:max-w-7xl">
        <MasterProfileHeader onBack={handleBack} onShare={() => setShareOpen(true)} />

        <main className="lg:grid lg:grid-cols-[280px_minmax(0,1fr)] lg:items-stretch lg:bg-panel-100 xl:grid-cols-[320px_minmax(0,1fr)]">
          <section aria-labelledby="master-name" className="px-6 pb-8 text-center lg:px-7 lg:py-8 lg:text-left">
            <div className="relative mx-auto flex size-24 items-center justify-center overflow-hidden rounded-full bg-panel-100 text-3xl font-medium text-copy-500 lg:mx-0 lg:h-36 lg:w-28 lg:rounded-lg lg:bg-surface lg:text-4xl">
              <span aria-hidden="true">{initials || "М"}</span>

              {masterProfile.avatarUrl && (
                <img
                  key={masterProfile.avatarUrl}
                  src={masterProfile.avatarUrl}
                  alt={`Фото майстра ${fullName}`}
                  className="absolute inset-0 size-full object-cover"
                  onError={(e) => {
                    e.currentTarget.hidden = true;
                  }}
                />
              )}
            </div>
            <h1 id="master-name" className="mt-3 wrap-break-word text-2xl font-semibold tracking-tight lg:mt-5 lg:text-2xl">
              {fullName}
            </h1>
            <p className="mt-2 text-sm text-copy-600">{masterProfile.categoryName}</p>
            <p className="mt-3 text-sm text-copy-500">{masterProfile.districtName}</p>
            {masterProfile.about && <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-copy-600">{masterProfile.about}</p>}
            <div className="mt-6 hidden border-t border-border pt-5 lg:block">
              <a href="#services" className="flex min-h-11 items-center justify-center rounded-lg bg-black px-4 text-sm text-white focus-visible:outline-2 focus-visible:outline-offset-2">Переглянути послуги</a>
              {directionsUrl ? (
                <a href={directionsUrl} target="_blank" rel="noopener noreferrer" className="mt-3 flex min-h-11 w-full items-center justify-center rounded-lg border border-border px-4 text-sm hover:bg-surface focus-visible:outline-2">Прокласти маршрут</a>
              ) : (
                <button type="button" disabled className="mt-3 min-h-11 w-full cursor-not-allowed rounded-lg border border-border px-4 text-sm text-copy-400">Прокласти маршрут</button>
              )}
            </div>
          </section>

          <div className="min-w-0 lg:rounded-tl-3xl lg:bg-surface lg:px-8 lg:py-8 xl:px-10">
            <div className="hidden lg:block">
              <div className="flex items-start justify-between gap-6">
                <div>
                  <h2 className="text-3xl font-semibold tracking-tight">Послуги та портфоліо</h2>
                  <p className="mt-2 text-sm text-copy-500">Оберіть послугу та перегляньте роботи майстра</p>
                </div>

              </div>
              <nav aria-label="Розділи профілю" className="my-7 grid grid-cols-4 gap-1 rounded-xl bg-panel-100 p-1 text-center text-sm">
                <a href="#services" className="rounded-lg px-2 py-2 hover:bg-surface focus-visible:outline-2">Послуги</a>
                <a href="#portfolio" className="rounded-lg px-2 py-2 hover:bg-surface focus-visible:outline-2">Портфоліо</a>
                <a href="#reviews" className="rounded-lg px-2 py-2 hover:bg-surface focus-visible:outline-2">Відгуки</a>
                <a href="#location" className="rounded-lg px-2 py-2 hover:bg-surface focus-visible:outline-2">Локація</a>
              </nav>
            </div>
            <section id="services" aria-labelledby="services-title" className="min-w-0 bg-section px-4 py-5 sm:px-6 lg:bg-surface lg:p-0 lg:pb-6">
              <h2 id="services-title" className="text-2xl font-medium text-copy-600 lg:text-lg lg:text-text">
                Послуги
              </h2>
              <div role="group" aria-label="Фільтр послуг" className="mb-4 mt-4 flex gap-2 overflow-x-auto pb-2">
                {[
                  { id: "all" as const, name: "Усі послуги" },
                  ...availableGroups,
                  ...(hasPopular ? [{ id: "popular" as const, name: "Популярні" }] : []),
                ].map((group) => (
                  <button key={group.id} type="button" aria-pressed={selectedGroup === group.id}
                    onClick={() => selectGroup(group.id)}
                    className={`min-h-11 shrink-0 rounded-full border px-4 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 ${selectedGroup === group.id ? "border-text bg-text text-bg" : "border-border bg-surface text-copy-600"}`}>
                    {group.name}
                  </button>
                ))}
              </div>

              {services.length === 0 ? (
                <p className="rounded-2xl bg-surface p-5 text-sm text-copy-500">Майстер ще не додав послуг.</p>
              ) : filteredServices.length === 0 ? (
                <p role="status" className="rounded-2xl bg-surface p-5 text-sm text-copy-500">У цій групі поки немає послуг.</p>
              ) : (
                <>
                  <div className="mb-3 hidden items-center justify-end gap-2 lg:flex">
                    <span className="mr-3 text-xs text-copy-500">Послуг: {filteredServices.length}</span>
                    {servicePageCount > 1 && (
                      <nav aria-label="Сторінки послуг" className="flex items-center gap-2">
                        <button type="button" aria-label="Попередня сторінка послуг" aria-controls="master-services-list"
                          disabled={currentServicePage === 0} onClick={() => setServicePage(currentServicePage - 1)}
                          className="flex size-11 items-center justify-center rounded-full border border-border hover:bg-panel-100 focus-visible:outline-2 disabled:cursor-not-allowed disabled:opacity-40">
                          <ChevronLeft size={18} aria-hidden="true" />
                        </button>
                        <span role="status" aria-live="polite" className="min-w-24 text-center text-sm text-copy-500">
                          {currentServicePage + 1} з {servicePageCount}
                        </span>
                        <button type="button" aria-label="Наступна сторінка послуг" aria-controls="master-services-list"
                          disabled={currentServicePage === servicePageCount - 1} onClick={() => setServicePage(currentServicePage + 1)}
                          className="flex size-11 items-center justify-center rounded-full bg-black text-white focus-visible:outline-2 disabled:cursor-not-allowed disabled:opacity-40">
                          <ChevronRight size={18} aria-hidden="true" />
                        </button>
                      </nav>
                    )}
                  </div>
                  <ul
                    id="master-services-list"
                    aria-label="Послуги майстра"
                    tabIndex={0}
                    className="max-h-105 space-y-3 overflow-y-auto rounded-2xl pb-4 pl-1 pr-3 pt-1 sm:max-h-130 lg:grid lg:max-h-none lg:grid-cols-3 lg:gap-4 lg:space-y-0 lg:overflow-visible lg:rounded-none lg:px-1 lg:pb-5 lg:pt-2 scrollbar-thin focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text"
                  >
                    {filteredServices.map((service, index) => (
                      <li key={service.id} className={`rounded-3xl bg-surface px-5 py-4 shadow-[0_5px_12px_rgba(0,0,0,0.14)] lg:min-h-56 lg:min-w-0 lg:flex-col lg:rounded-xl lg:px-4 lg:shadow-[0_3px_10px_rgba(0,0,0,0.08)] ${Math.floor(index / servicesPerPage) === currentServicePage ? "lg:flex" : "lg:hidden"}`}>
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="min-w-0 wrap-break-word text-base font-medium leading-snug">{service.name}</h3>
                        </div>
                        <p className="mt-1 text-sm text-copy-600">{service.durationMin} хв</p>
                        <div className="mt-2 flex items-center justify-between gap-3 lg:flex-1 lg:flex-col lg:items-stretch lg:justify-between">
                          <p className="text-lg font-semibold">
                            {new Intl.NumberFormat("uk-UA", { maximumFractionDigits: 2 }).format(service.price)} ₴
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              navigate(
                                `/m/${encodeURIComponent(slug)}/services/${service.id}`,
                                { state: { fromProfile: true, catalogPath: backPath } }
                              );
                            }}
                            className="min-h-11 rounded-full border border-border px-5 text-sm text-copy-900 hover:bg-panel-100 focus-visible:outline-2 focus-visible:outline-offset-2 lg:mt-4 lg:w-full lg:rounded-lg lg:border-black lg:bg-black lg:text-white lg:hover:bg-neutral-800"
                          >
                            Обрати
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </section>

            <section id="portfolio" aria-labelledby="portfolio-title" className="min-w-0 px-5 py-6 lg:px-0 lg:py-6">
              <h2 id="portfolio-title" className="mb-4 text-2xl font-medium text-copy-600 lg:text-lg lg:text-text">
                Портфоліо
              </h2>
              {portfolioPhotos.length === 0 ? (
                <p className="rounded-2xl bg-panel-50 p-5 text-sm text-copy-500">Майстер ще не додав фото до портфоліо.</p>
              ) : (
                <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-3 lg:grid-cols-3 lg:gap-4">
                  {portfolioPhotos.map((photo) => (
                    <li key={photo.id} className="overflow-hidden rounded-xl bg-panel-100">
                      <img
                        src={photo.photoUrl}
                        alt="Робота з портфоліо майстра"
                        loading="lazy"
                        className="aspect-square w-full object-cover lg:aspect-4/3"
                      />
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section id="reviews" aria-labelledby="reviews-title" className="min-w-0 bg-section px-5 py-6 sm:px-6 lg:bg-surface lg:px-0 lg:py-6">
              <h2 id="reviews-title" className="mb-4 text-2xl font-medium text-copy-600 lg:text-lg lg:text-text">
                Відгуки
              </h2>
              <PublicMasterReviews key={masterProfile.id} masterId={masterProfile.id} />
            </section>

            <section id="location" aria-labelledby="location-title" className="min-w-0 px-5 py-6 sm:px-6 lg:grid lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-x-6 lg:px-0 lg:py-6">
              <h2 id="location-title" className="mb-4 text-2xl font-medium text-copy-600 lg:col-start-1 lg:row-start-1 lg:mb-2 lg:text-lg lg:text-text">
                Локація
              </h2>
              {mapUrl ? (
                <div className="aspect-4/3 min-h-64 overflow-hidden rounded-2xl border border-border bg-panel-50 sm:aspect-video lg:col-span-2 lg:row-start-3 lg:mt-5 lg:aspect-auto lg:h-44 lg:min-h-0 lg:rounded-xl">
                  <iframe
                    title={"Місце прийому: " + fullName}
                    src={mapUrl}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    className="h-full w-full border-0"
                  />
                </div>
              ) : (
                <div className="flex aspect-4/3 flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-panel-50 px-6 text-center sm:aspect-video lg:col-span-2 lg:row-start-3 lg:mt-5 lg:aspect-auto lg:h-44 lg:rounded-xl">
                  <MapPin size={36} strokeWidth={1.25} aria-hidden="true" className="text-copy-400" />
                  <p className="text-sm text-copy-500">Майстер ще не вказав розташування на карті.</p>
                </div>
              )}
              <div className="mt-4 lg:col-start-1 lg:row-start-2 lg:mt-0">
                <p className="flex items-start gap-2 text-sm lg:text-xs lg:text-copy-500">
                  <MapPin size={18} aria-hidden="true" className="shrink-0 lg:hidden" />
                  <span>{[masterProfile.cityName, masterProfile.address].filter(Boolean).join(", ") || "Точна адреса поки недоступна."}</span>
                </p>
                {masterProfile.districtName && (
                  <p className="mt-2 text-sm text-copy-500 lg:hidden">Район: {masterProfile.districtName}</p>
                )}
              </div>
              {directionsUrl ? (
                <a href={directionsUrl} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex min-h-11 items-center text-sm underline underline-offset-4 hover:text-copy-600 focus-visible:outline-2 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:mt-0 lg:w-52 lg:justify-center lg:self-end lg:rounded-lg lg:border lg:border-border lg:px-5 lg:text-xs lg:no-underline lg:hover:bg-panel-50">
                  Прокласти маршрут
                </a>
              ) : (
                <button type="button" disabled className="mt-1 min-h-11 cursor-not-allowed text-left text-sm text-copy-400 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:mt-0 lg:w-52 lg:self-end lg:rounded-lg lg:border lg:border-border lg:px-5 lg:text-center lg:text-xs">
                  Прокласти маршрут
                </button>
              )}
            </section>
          </div>
        </main>


        {shareOpen && <ProfileShareModal profileUrl={profileUrl} onClose={() => setShareOpen(false)} />}
      </div>
    </div>
  );
}







