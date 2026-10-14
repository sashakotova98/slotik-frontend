import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import BookingDateStrip from "../../components/client/BookingDateStrip";
import BookingTimeSlots from "../../components/client/BookingTimeSlots";
import { getMasterBySlug, type PublicMasterProfile } from "../../api/masters";
import { getServicesByMasterId, type Service } from "../../api/services";
import { getAvailableSlots, type AvailableSlot } from "../../api/bookings";


//отримуємо сьогоднішню дату в Києві у форматі "YYYY-MM-DD".
function getTodayInKyiv() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Kyiv",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const year = parts.find((part) => part.type === "year")!.value;
  const month = parts.find((part) => part.type === "month")!.value;
  const day = parts.find((part) => part.type === "day")!.value;

  return `${year}-${month}-${day}`;
}

export default function ClientBookingDatePage() {
  // /m/:slug/services/:serviceId/book
  const { slug, serviceId } = useParams();
  const navigate = useNavigate();

  // дані майстра. Його id пізніше знадобиться для завантаження слотів.
  const [master, setMaster] = useState<PublicMasterProfile | null>(null);

  // обрана послуга: назва, тривалість, ціна.
  const [service, setService] = useState<Service | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [slotsError, setSlotsError] = useState<string>("");

  const [selectedDate, setSelectedDate] = useState(getTodayInKyiv);

  const [selectedSlot, setSelectedSlot] =
    useState<AvailableSlot | null>(null);

  const [slots, setSlots] = useState<AvailableSlot[]>([]);

  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadDetails() {
      setLoading(true);
      setError("");
      setSlotsError("");
      setMaster(null);
      setService(null);

      try {
        // serviceId з URL спочатку перетворюємо в число, потім перевіряємо.
        const id = Number(serviceId);

        if (!Number.isSafeInteger(id) || id <= 0) {
          setError("Некоректний ID послуги.");
          return;
        }

        if (!slug) {
          throw new Error("Некоректне посилання на майстра.");
        }

        // GET /api/Master/slug/{slug} -  master.id
        const masterData = await getMasterBySlug(slug);

        if (!active) return;

        // GET /api/Service?masterId=...а. (отримуємо послуги майстра)
        const services = await getServicesByMasterId(masterData.id);

        if (!active) return;

        // шукаємо послугу, зазначену в URL.
        const selectedService = services.find((item) => item.id === id);

        if (!selectedService) {
          throw new Error("Послугу цього майстра не знайдено.");
        }

        setMaster(masterData);
        setService(selectedService);
      } catch {
        if (active) {
          setError("Не вдалося завантажити послугу. Перевірте посилання або спробуйте пізніше.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadDetails();

    //не використовуємо результат старого запиту після того, як компонент буде розмонтувано або зміняться параметри URL.
    return () => {
      active = false;
    };
  }, [slug, serviceId]);

  useEffect(() => {
    // Сначала должны загрузиться мастер и выбранная услуга.
    if (!master || !service) return;

    const masterId = master.id;
    const currentServiceId = service.id;
    let active = true;

    async function loadSlots() {
      setLoadingSlots(true);
      setSlotsError("");
      setSlots([]);
      setSelectedSlot(null);

      try {
        const data = await getAvailableSlots(
          masterId,
          currentServiceId,
          selectedDate,
        );

        if (active) {
          setSlots(data.slots);
        }
      } catch {
        if (active) {
          setSlotsError("Не вдалося завантажити вільний час.");
        }
      } finally {
        if (active) {
          setLoadingSlots(false);
        }
      }
    }

    void loadSlots();

    return () => {
      active = false;
    };
  }, [master, service, selectedDate]);

  if (loading) {
    return (
      <p role="status" className="p-4 text-sm text-neutral-500">
        Завантаження послуги…
      </p>
    );
  }

  if (error || !master || !service) {
    return (
      <p role="alert" className="p-4 text-sm text-red-600">
        {error || "Послугу не знайдено."}
      </p>
    );
  }

  const servicePath = `/m/${encodeURIComponent(slug!)}/services/${service.id}`;
  const selectedDateTime = selectedSlot
    ? new Intl.DateTimeFormat("uk-UA", {
        timeZone: "Europe/Kyiv",
        weekday: "short",
        day: "numeric",
        month: "long",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
      }).format(new Date(selectedSlot.startsAt))
    : "";

  function handleNext() {
    if (!selectedSlot || loadingSlots || slotsError) return;
    const params = new URLSearchParams({ startsAt: selectedSlot.startsAt });
    navigate(`${servicePath}/book/confirm?${params.toString()}`);
  }

  return (
    <main className="min-h-dvh bg-white px-4 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))] text-black">
      <div className="mx-auto flex min-h-[calc(100dvh-2rem-env(safe-area-inset-bottom))] w-full max-w-md flex-col gap-4">
        <section className="min-w-0 flex-1 rounded-[28px] border border-neutral-400 px-4 py-5 sm:px-5">
          <div className="flex items-center gap-2">
            <Link to={servicePath} replace aria-label="Назад до послуги" className="-ml-2 flex size-11 shrink-0 items-center justify-center rounded-full hover:bg-neutral-100 focus-visible:outline-2">
              <ArrowLeft aria-hidden="true" className="size-6" />
            </Link>
            <h1 className="text-xl font-semibold">Оберіть дату і час</h1>
          </div>

          <p className="mt-4 text-sm leading-relaxed text-neutral-400">
            {service.name} • {service.durationMin} хв • <span className="whitespace-nowrap">{service.price.toLocaleString("uk-UA")} ₴</span>
          </p>
          <hr className="my-6 border-neutral-300" />

          <BookingDateStrip
            selectedDate={selectedDate}
            onChange={(date) => {
              if (date === selectedDate) return;
              setSelectedDate(date);
              setSelectedSlot(null);
              setSlots([]);
              setSlotsError("");
              setLoadingSlots(true);
            }}
          />

          {loadingSlots ? (
            <p role="status" className="mt-8 text-sm leading-relaxed text-neutral-500">Завантаження вільного часу…</p>
          ) : slotsError ? (
            <p role="alert" className="mt-8 text-sm leading-relaxed text-red-600">{slotsError}</p>
          ) : slots.length === 0 ? (
            <p className="mt-8 rounded-2xl bg-neutral-50 px-4 py-5 text-sm leading-relaxed text-neutral-500">
              На цей день немає вільного часу.
            </p>
          ) : (
            <BookingTimeSlots slots={slots} selectedSlot={selectedSlot} onSelect={setSelectedSlot} />
          )}
        </section>

        <button
          type="button"
          onClick={handleNext}
          disabled={!selectedSlot || loadingSlots || Boolean(slotsError)}
          className="min-h-14 w-full shrink-0 rounded-2xl bg-black px-3 py-3 text-center text-base font-semibold leading-snug text-white hover:bg-neutral-800 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:bg-neutral-300 disabled:text-neutral-600 sm:text-lg"
        >
          {selectedSlot ? `Далі • ${selectedDateTime}` : "Оберіть дату й час"}
        </button>
      </div>
    </main>
  );
}