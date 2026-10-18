import { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { Link, useNavigate, useParams, useLocation } from "react-router-dom";
import { ChevronLeft, Clock3, UserRound } from "lucide-react";
import { getMasterBySlug, type PublicMasterProfile } from "../../api/masters";
import { getServicesByMasterId, type Service } from "../../api/services";
import { getServicePhotosByMasterId, type ServicePhoto } from "../../api/servicePhotos";

type Details = {
  master: PublicMasterProfile;
  service: Service;
  photos: ServicePhoto[];
};

export default function ServiceDetailsPage() {
  const { slug, serviceId } = useParams();
  const id = Number(serviceId);

  if (!slug || !Number.isSafeInteger(id) || id <= 0) {
    return (
      <main className="p-6 text-center">
        <p role="alert">Некоректне посилання на послугу.</p>
        <Link to="/home" className="mt-4 inline-block underline">
          На головну
        </Link>
      </main>
    );
  }

  return <ServiceDetailsContent key={`${slug}/${id}`} slug={slug} serviceId={id} />;
}

function ServiceDetailsContent({ slug, serviceId }: { slug: string; serviceId: number }) {
  const navigate = useNavigate();
  const { token, role } = useAuth();
  const [bookingError, setBookingError] = useState("");
  const location = useLocation();
  const navigationState = location.state as { fromProfile?: boolean; catalogPath?: string } | null;

  const [details, setDetails] = useState<Details | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const profilePath = `/m/${encodeURIComponent(slug)}`;
  const servicePath = `${profilePath}/services/${serviceId}`;
  const bookingPath = `${servicePath}/book`;

  function handleBook() {
    if (!token) {
      navigate("/login", {
        state: {
          from: {
            pathname: bookingPath,
            search: "",
            hash: "",
          },
        },
      });
      return;
    }

    if (role === "Client") {
      navigate(bookingPath);
      return;
    }

    setBookingError("Для запису увійдіть як клієнт.");
  }

  function handleBack() {
    const historyIndex = window.history.state?.idx;
    if (navigationState?.fromProfile && typeof historyIndex === "number" && historyIndex > 0) {
      navigate(-1);
      return;
    }
    navigate(profilePath, {
      replace: true,
      state: { catalogPath: navigationState?.catalogPath },
    });
  }

  useEffect(() => {
    let active = true;

    async function loadDetails() {
      try {
        const master = await getMasterBySlug(slug);

        if (!active) {
          return;
        }

        const [services, photos] = await Promise.all([getServicesByMasterId(master.id), getServicePhotosByMasterId(master.id)]);

        if (!active) {
          return;
        }

        // Шукаємо послугу саме цього майстра.
        const service = services.find((item) => {
          return item.id === serviceId;
        });

        if (!service) {
          setError("Послугу цього майстра не знайдено.");
          return;
        }

        const servicePhotos = photos
          .filter((photo) => {
            return photo.serviceId === serviceId;
          })
          .sort((first, second) => {
            return first.sortOrder - second.sortOrder;
          });

        setDetails({
          master,
          service,
          photos: servicePhotos,
        });
      } catch {
        if (active) {
          setError("Не вдалося завантажити послугу. Спробуйте пізніше.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadDetails();

    return () => {
      active = false;
    };
  }, [slug, serviceId]);

  if (loading) {
    return (
      <main className="p-6 text-center">
        <p role="status" className="text-sm text-copy-500">
          Завантаження послуги…
        </p>
      </main>
    );
  }

  if (error || !details) {
    return (
      <main className="mx-auto max-w-md p-6 text-center">
        <p role="alert">{error || "Послугу не знайдено."}</p>

        <button type="button" onClick={handleBack} className="mt-4 inline-block underline underline-offset-4">
          До профілю майстра
        </button>
      </main>
    );
  }

  const { master, service, photos } = details;

  const fullName = [master.firstName, master.lastName].filter(Boolean).join(" ");

  const price = new Intl.NumberFormat("uk-UA", {
    maximumFractionDigits: 2,
  }).format(service.price);

  return (
    <main className="min-h-dvh bg-surface px-4 py-4 text-copy-900 sm:py-8">
      <div className="mx-auto w-full max-w-md">
        <article className="rounded-[28px] border border-border px-4 pb-6 pt-4 sm:px-5">
          <header>
            <div className="flex items-start gap-2">
              <button
                type="button"
                onClick={handleBack}
                aria-label="Назад до профілю майстра"
                className="-ml-2 -mt-1 flex size-11 shrink-0 items-center justify-center rounded-full hover:bg-panel-100 focus-visible:outline-2"
              >
                <ChevronLeft size={28} strokeWidth={1.75} aria-hidden="true" />
              </button>

              <h1 className="min-w-0 pt-1 text-xl font-medium wrap-break-word">{service.name}</h1>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-copy-600">
              <span className="inline-flex items-center gap-2">
                <Clock3 size={16} aria-hidden="true" />
                {service.durationMin} хв
              </span>

              <span className="whitespace-nowrap">{price} ₴</span>

              <span className="inline-flex min-w-0 items-center gap-2">
                <UserRound size={17} className="shrink-0" aria-hidden="true" />
                <span className="wrap-break-word">{fullName}</span>
              </span>
            </div>
          </header>

          {photos.length > 0 ? (
            <div
              role="region"
              aria-label="Фотографії послуги"
              tabIndex={0}
              className="mt-5 flex snap-x snap-mandatory gap-3 overflow-x-auto rounded-xl pb-2 focus-visible:outline-2"
            >
              {photos.map((photo, index) => {
                return (
                  <img
                    key={photo.id}
                    src={photo.photoUrl}
                    alt={`${service.name}, фото ${index + 1}`}
                    loading="lazy"
                    className="aspect-square w-[calc((100%-0.75rem)/2)] shrink-0 snap-start rounded-xl object-cover"
                  />
                );
              })}
            </div>
          ) : (
            <p className="mt-5 rounded-xl bg-panel-50 p-4 text-sm text-copy-500">Фото послуги ще не додано.</p>
          )}

          <section aria-labelledby="description-title" className="mt-5">
            <h2 id="description-title" className="text-xl font-medium">
              Опис
            </h2>

            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-copy-600 wrap-break-word">
              {service.description?.trim() || "Майстер ще не додав опис процедури."}
            </p>
          </section>

          <section aria-labelledby="included-title" className="mt-5">
            <h2 id="included-title" className="text-lg font-medium">
              Що входить у послугу
            </h2>

            {service.included?.trim() ? (
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed text-copy-600 wrap-break-word">
                {service.included.split(/\r?\n/).map((item) => item.trim()).filter(Boolean).map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm leading-relaxed text-copy-600">Майстер ще не вказав, що входить у послугу.</p>
            )}
          </section>
        </article>

        <button
          type="button"
          onClick={handleBook}
          className="mt-4 flex min-h-12 w-full items-center justify-center rounded-2xl bg-black px-5 py-3 text-lg font-medium text-white hover:bg-neutral-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text"
        >
          Обрати зараз
        </button>
        {bookingError && <p role="alert" className="mt-3 text-sm text-red-600">{bookingError}</p>}
      </div>
    </main>
  );
}

