import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, EllipsisVertical, MapPin, MessageSquare } from "lucide-react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { type PublicMasterProfile, getMasterBySlug } from "../api/masters";
import { getServicePhotosByMasterId, type ServicePhoto } from "../api/servicePhotos";
import { type Service, getServicesByMasterId } from "../api/services";
import MasterProfileHeader from "../components/master/MasterProfileHeader";
import ProfileShareModal from "../components/master/ProfileShareModal";

export default function MasterProfilePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const serviceListRef = useRef<HTMLUListElement>(null);
  const [shareOpen, setShareOpen] = useState(false);

  const { slug } = useParams();
  const [masterProfile, setMasterProfile] = useState<PublicMasterProfile | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [servicePhotos, setServicePhotos] = useState<ServicePhoto[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    setMasterProfile(null);
    setServices([]);
    setServicePhotos([]);

    if (!slug) {
      setError("Не вказано майстра.");
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const profile = await getMasterBySlug(slug);
        setMasterProfile(profile);

        const services = await getServicesByMasterId(profile.id);
        setServices(services);

        const photos = await getServicePhotosByMasterId(profile.id);
        setServicePhotos(photos);
      } catch (error) {
        console.error(error);
        setError("Не вдалося завантажити профіль майстра.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [slug]);

  function handleBack() {
    // Повернення з перегляду після створення сторінки майстра.
    if (location.state?.returnTo === "/cabinet") {
      navigate("/cabinet", { replace: true });
      return;
    }

    const historyIndex = window.history.state?.idx;

    if (typeof historyIndex === "number" && historyIndex > 0) {
      navigate(-1);
    } else {
      navigate("/home", { replace: true });
    }
  }

  if (loading) {
    return <p role="status">Завантаження…</p>;
  }

  if (error) {
    return <p role="alert">{error}</p>;
  }

  if (!masterProfile) return null;

  const profileUrl = `${window.location.origin}/m/${encodeURIComponent(masterProfile.slug)}`;

  const joinedAt = new Date(masterProfile.user.createdAt ?? "");
  const joinedDate = Number.isNaN(joinedAt.getTime())
    ? null
    : new Intl.DateTimeFormat("uk-UA", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone: "Europe/Kyiv",
    }).format(joinedAt);

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
  const fullName = [masterProfile.user.firstName, masterProfile.user.lastName].filter(Boolean).join(" ");

  const initials = [masterProfile.user.firstName, masterProfile.user.lastName]
    .map((part) => part.trim().charAt(0))
    .join("")
    .toUpperCase();

  return (
    <div className="min-h-screen bg-neutral-100 text-black sm:px-6 sm:py-6 lg:px-8 lg:py-10">
      <div className="mx-auto min-h-screen w-full max-w-120 overflow-hidden bg-white sm:min-h-0 sm:max-w-3xl sm:rounded-3xl sm:shadow-sm lg:max-w-7xl">
        <MasterProfileHeader onBack={handleBack} onShare={() => setShareOpen(true)} />

        <main className="lg:grid lg:grid-cols-[280px_minmax(0,1fr)] lg:items-stretch lg:bg-neutral-100 xl:grid-cols-[320px_minmax(0,1fr)]">
          <section aria-labelledby="master-name" className="px-6 pb-8 text-center lg:px-7 lg:py-8 lg:text-left">
            <div className="relative mx-auto flex size-24 items-center justify-center overflow-hidden rounded-full bg-neutral-100 text-3xl font-medium text-neutral-500 lg:mx-0 lg:h-36 lg:w-28 lg:rounded-lg lg:bg-white lg:text-4xl">
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
            <p className="mt-2 text-sm text-neutral-600">{masterProfile.categoryName}</p>
            <p className="mt-3 text-sm text-neutral-500">{masterProfile.districtName}</p>
            {masterProfile.about && <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-neutral-600">{masterProfile.about}</p>}
            <div className="mt-6 hidden border-t border-neutral-200 pt-5 lg:block">
              {joinedDate && <p className="mb-5 text-xs text-neutral-500">В Slotik з <time dateTime={joinedAt.toISOString()}>{joinedDate}</time></p>}
              <a href="#services" className="flex min-h-11 items-center justify-center rounded-lg bg-black px-4 text-sm text-white focus-visible:outline-2 focus-visible:outline-offset-2">Переглянути послуги</a>
              {directionsUrl ? (
                <a href={directionsUrl} target="_blank" rel="noopener noreferrer" className="mt-3 flex min-h-11 w-full items-center justify-center rounded-lg border border-neutral-200 px-4 text-sm hover:bg-white focus-visible:outline-2">Прокласти маршрут</a>
              ) : (
                <button type="button" disabled className="mt-3 min-h-11 w-full cursor-not-allowed rounded-lg border border-neutral-200 px-4 text-sm text-neutral-400">Прокласти маршрут</button>
              )}
            </div>
          </section>

          <div className="min-w-0 lg:rounded-tl-3xl lg:bg-white lg:px-8 lg:py-8 xl:px-10">
            <div className="hidden lg:block">
              <div className="flex items-start justify-between gap-6">
                <div>
                  <h2 className="text-3xl font-semibold tracking-tight">Послуги та портфоліо</h2>
                  <p className="mt-2 text-sm text-neutral-500">Оберіть послугу та перегляньте роботи майстра</p>
                </div>

              </div>
              <nav aria-label="Розділи профілю" className="my-7 grid grid-cols-4 gap-1 rounded-xl bg-neutral-100 p-1 text-center text-sm">
                <a href="#services" className="rounded-lg px-2 py-2 hover:bg-white focus-visible:outline-2">Послуги</a>
                <a href="#portfolio" className="rounded-lg px-2 py-2 hover:bg-white focus-visible:outline-2">Портфоліо</a>
                <a href="#reviews" className="rounded-lg px-2 py-2 hover:bg-white focus-visible:outline-2">Відгуки</a>
                <a href="#location" className="rounded-lg px-2 py-2 hover:bg-white focus-visible:outline-2">Локація</a>
              </nav>
            </div>
            <section id="services" aria-labelledby="services-title" className="min-w-0 bg-[#efefef] px-4 py-5 sm:px-6 lg:bg-white lg:p-0 lg:pb-6">
              <h2 id="services-title" className="text-2xl font-medium text-neutral-600 lg:text-lg lg:text-black">
                Послуги
              </h2>
              <div className="mb-4 mt-4 lg:hidden">
                <span className="inline-flex rounded-full bg-black px-3 py-1 text-sm text-white">Усі послуги</span>
              </div>

              {services.length === 0 ? (
                <p className="rounded-2xl bg-white p-5 text-sm text-neutral-500">Майстер ще не додав послуг.</p>
              ) : (
                <>
                  <div className="mb-3 hidden items-center justify-end gap-2 lg:flex">
                    <span className="mr-3 text-xs text-neutral-500">Послуг: {services.length}</span>
                    <button type="button" aria-label="Попередні послуги" onClick={() => serviceListRef.current?.scrollBy({ left: -serviceListRef.current.clientWidth, behavior: "smooth" })} className="flex size-9 items-center justify-center rounded-full border border-neutral-200 hover:bg-neutral-100 focus-visible:outline-2"><ChevronLeft size={18} aria-hidden="true" /></button>
                    <button type="button" aria-label="Наступні послуги" onClick={() => serviceListRef.current?.scrollBy({ left: serviceListRef.current.clientWidth, behavior: "smooth" })} className="flex size-9 items-center justify-center rounded-full bg-black text-white focus-visible:outline-2"><ChevronRight size={18} aria-hidden="true" /></button>
                  </div>
                  <ul
                    ref={serviceListRef}
                    aria-label="Послуги майстра"
                    tabIndex={0}
                    className="max-h-105 space-y-3 overflow-y-auto rounded-2xl pb-4 pl-1 pr-3 pt-1 sm:max-h-130 lg:grid lg:max-h-none lg:auto-cols-[calc((100%-2rem)/3)] lg:grid-flow-col lg:gap-4 lg:space-y-0 lg:overflow-x-auto lg:overflow-y-hidden lg:rounded-none lg:px-1 lg:pb-5 lg:pt-2 scrollbar-thin focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
                  >
                    {services.map((service) => (
                      <li key={service.id} className="rounded-3xl bg-white px-5 py-4 shadow-[0_5px_12px_rgba(0,0,0,0.14)] lg:flex lg:min-h-56 lg:flex-col lg:rounded-xl lg:px-4 lg:shadow-[0_3px_10px_rgba(0,0,0,0.08)]">
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="min-w-0 wrap-break-word text-base font-medium leading-snug">{service.name}</h3>
                          <button
                            type="button"
                            disabled
                            aria-label="Подробиці послуги поки недоступні"
                            className="-mr-2 -mt-2 flex size-9 shrink-0 cursor-not-allowed items-center justify-center rounded-full text-neutral-400"
                          >
                            <EllipsisVertical size={20} aria-hidden="true" />
                          </button>
                        </div>
                        <p className="mt-1 text-sm text-neutral-600">{service.durationMin} хв</p>
                        <div className="mt-2 flex items-center justify-between gap-3 lg:flex-1 lg:flex-col lg:items-stretch lg:justify-between">
                          <p className="text-lg font-semibold">
                            {new Intl.NumberFormat("uk-UA", { maximumFractionDigits: 2 }).format(service.price)} ₴
                          </p>
                          <button
                            type="button"
                            disabled
                            aria-describedby="booking-unavailable"
                            className="min-h-11 rounded-full border border-neutral-300 px-5 text-sm text-neutral-400 disabled:cursor-not-allowed lg:mt-4 lg:w-full lg:rounded-lg lg:border-black lg:bg-black lg:text-white/60"
                          >
                            Обрати
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                  <p id="booking-unavailable" className="mt-2 text-xs leading-relaxed text-neutral-500">
                    Онлайн-запис поки недоступний.
                  </p>
                </>
              )}
            </section>

            <section id="portfolio" aria-labelledby="portfolio-title" className="min-w-0 px-5 py-6 lg:px-0 lg:py-6">
              <h2 id="portfolio-title" className="mb-4 text-2xl font-medium text-neutral-600 lg:text-lg lg:text-black">
                Портфоліо
              </h2>
              {servicePhotos.length === 0 ? (
                <p className="rounded-2xl bg-neutral-50 p-5 text-sm text-neutral-500">Майстер ще не додав фотографій.</p>
              ) : (
                <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-3 lg:grid-cols-3 lg:gap-4">
                  {servicePhotos.map((photo) => (
                    <li key={photo.id} className="overflow-hidden rounded-xl bg-neutral-100">
                      <img
                        src={photo.photoUrl}
                        alt={services.find((service) => service.id === photo.serviceId)?.name ?? "Робота майстра"}
                        loading="lazy"
                        className="aspect-square w-full object-cover lg:aspect-4/3"
                      />
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section id="reviews" aria-labelledby="reviews-title" className="min-w-0 bg-[#efefef] px-5 py-6 sm:px-6 lg:bg-white lg:px-0 lg:py-6">
              <h2 id="reviews-title" className="mb-4 text-2xl font-medium text-neutral-600 lg:text-lg lg:text-black">
                Відгуки
              </h2>
              <div className="flex flex-col items-center rounded-2xl bg-white px-5 py-7 text-center shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
                <MessageSquare size={28} strokeWidth={1.25} aria-hidden="true" className="mb-3 text-neutral-400" />
                <p className="text-sm text-neutral-600">Перегляд відгуків поки недоступний.</p>
              </div>
            </section>

            <section id="location" aria-labelledby="location-title" className="min-w-0 px-5 py-6 sm:px-6 lg:grid lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-x-6 lg:px-0 lg:py-6">
              <h2 id="location-title" className="mb-4 text-2xl font-medium text-neutral-600 lg:col-start-1 lg:row-start-1 lg:mb-2 lg:text-lg lg:text-black">
                Локація
              </h2>
              {mapUrl ? (
                <div className="aspect-4/3 min-h-64 overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-50 sm:aspect-video lg:col-span-2 lg:row-start-3 lg:mt-5 lg:aspect-auto lg:h-44 lg:min-h-0 lg:rounded-xl">
                  <iframe
                    title={"Місце прийому: " + fullName}
                    src={mapUrl}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    className="h-full w-full border-0"
                  />
                </div>
              ) : (
                <div className="flex aspect-4/3 flex-col items-center justify-center gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 px-6 text-center sm:aspect-video lg:col-span-2 lg:row-start-3 lg:mt-5 lg:aspect-auto lg:h-44 lg:rounded-xl">
                  <MapPin size={36} strokeWidth={1.25} aria-hidden="true" className="text-neutral-400" />
                  <p className="text-sm text-neutral-500">Майстер ще не вказав розташування на карті.</p>
                </div>
              )}
              <div className="mt-4 lg:col-start-1 lg:row-start-2 lg:mt-0">
                <p className="flex items-start gap-2 text-sm lg:text-xs lg:text-neutral-500">
                  <MapPin size={18} aria-hidden="true" className="shrink-0 lg:hidden" />
                  <span>{[masterProfile.cityName, masterProfile.address].filter(Boolean).join(", ") || "Точна адреса поки недоступна."}</span>
                </p>
                {masterProfile.districtName && (
                  <p className="mt-2 text-sm text-neutral-500 lg:hidden">Район: {masterProfile.districtName}</p>
                )}
              </div>
              {directionsUrl ? (
                <a href={directionsUrl} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex min-h-11 items-center text-sm underline underline-offset-4 hover:text-neutral-600 focus-visible:outline-2 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:mt-0 lg:w-52 lg:justify-center lg:self-end lg:rounded-lg lg:border lg:border-neutral-300 lg:px-5 lg:text-xs lg:no-underline lg:hover:bg-neutral-50">
                  Прокласти маршрут
                </a>
              ) : (
                <button type="button" disabled className="mt-1 min-h-11 cursor-not-allowed text-left text-sm text-neutral-400 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:mt-0 lg:w-52 lg:self-end lg:rounded-lg lg:border lg:border-neutral-200 lg:px-5 lg:text-center lg:text-xs">
                  Прокласти маршрут
                </button>
              )}
            </section>
          </div>
        </main>

        {joinedDate && (
          <footer className="px-5 pb-8 pt-6 text-center text-sm text-neutral-600 lg:hidden">
            В Slotik з <time dateTime={joinedAt.toISOString()}>{joinedDate}</time>
          </footer>
        )}

        {shareOpen && <ProfileShareModal profileUrl={profileUrl} onClose={() => setShareOpen(false)} />}
      </div>
    </div>
  );
}
