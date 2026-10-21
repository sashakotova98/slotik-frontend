import { useEffect, useState } from "react";
import { MoreVertical } from "lucide-react";

import ClientBookingDetailsModal from "../../components/client/ClientBookingDetailsModal";
import CityPicker from "../../components/search/CityPicker";
import ServiceSearchForm from "../../components/search/ServiceSearchForm";
import ClientMonthCalendar from "../../components/client/ClientMonthCalendar";

import { getCities, type City } from "../../api/cities";
import {
  getClientBookings,
  type ClientBooking,
  type BookingStatus,
} from "../../api/bookings";
import {
  getMasterById,
  type PublicMasterProfile,
} from "../../api/masters";

// Дата запису за київським часом: "2026-10-19".
function getBookingDate(value: string): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Kyiv",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(value));

  const get = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return `${get("year")}-${get("month")}-${get("day")}`;
}

function formatBookingDate(value: string): string {
  const date = new Date(value);
  const day = new Intl.DateTimeFormat("uk-UA", {
    timeZone: "Europe/Kyiv", weekday: "short", day: "numeric", month: "long",
  }).format(date);
  const time = new Intl.DateTimeFormat("uk-UA", {
    timeZone: "Europe/Kyiv", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).format(date);
  return `${day} • ${time}`;
}

const statuses: Record<
  BookingStatus,
  { label: string; className: string }
> = {
  0: {
    label: "Очікує підтвердження",
    className: "bg-amber-100 text-amber-800",
  },
  1: {
    label: "Підтверджено",
    className: "bg-[#ccebc7] text-green-800",
  },
  2: {
    label: "Залишити відгук",
    className: "bg-orange-200 text-orange-900",
  },
  3: {
    label: "Скасовано",
    className: "bg-red-100 text-red-800",
  },
};

export default function ClientBookingsPage() {
  const [cities, setCities] = useState<City[]>([]);
  const [cityId, setCityId] = useState<number | null>(null);
  const [citiesLoading, setCitiesLoading] = useState(true);
  const [citiesError, setCitiesError] = useState("");

  const [bookings, setBookings] = useState<ClientBooking[]>([]);
  const [masters, setMasters] = useState<
    Record<number, PublicMasterProfile>
  >({});

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mastersError, setMastersError] = useState("");
  const [revision, setRevision] = useState(0);

  const [selectedDate, setSelectedDate] = useState("");
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [details, setDetails] = useState<{ booking: ClientBooking; review: boolean } | null>(null);

  const [now, setNow] = useState(() => Date.now());

  // Оновлюємо час, щоб записи переходили до минулих.
  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 60_000);

    return () => window.clearInterval(timer);
  }, []);

  // Міста завантажуються незалежно від записів.
  useEffect(() => {
    let active = true;

    async function loadCities() {
      try {
        const data = await getCities();

        if (active) {
          setCities(data);
          setCityId(data.find((city) => city.id === 1)?.id
            ?? data[0]?.id
            ?? null);
        }
      } catch {
        if (active) {
          setCitiesError("Не вдалося завантажити міста.");
        }
      } finally {
        if (active) setCitiesLoading(false);
      }
    }

    void loadCities();

    return () => {
      active = false;
    };
  }, []);

  // Один список записів використовують і календар, і картки.
  useEffect(() => {
    let active = true;

    async function loadBookings() {
      setLoading(true);
      setError("");
      setMastersError("");

      try {
        const data = await getClientBookings();
        if (!active) return;

        const masterIds = [
          ...new Set(data.map((booking) => booking.masterId)),
        ];

        const results = await Promise.allSettled(
          masterIds.map((id) => getMasterById(id)),
        );

        if (!active) return;

        const profiles: Record<number, PublicMasterProfile> = {};

        for (const result of results) {
          if (result.status === "fulfilled") {
            profiles[result.value.id] = result.value;
          }
        }

        setBookings(data);
        setMasters(profiles);

        if (results.some((result) => result.status === "rejected")) {
          setMastersError(
            "Дані деяких майстрів недоступні. Записи без визначеного міста також показані.",
          );
        }
      } catch {
        if (active) {
          setError("Не вдалося завантажити записи. Спробуйте ще раз.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadBookings();

    return () => {
      active = false;
    };
  }, [revision]);

  const selectedCity = cities.find((city) => city.id === cityId);

  // У ClientBooking немає cityId.
  // Визначаємо місто через район або назву міста профілю майстра.
  const cityBookings = bookings.filter((booking) => {
    if (!selectedCity) return true;

    const master = masters[booking.masterId];

    // Недоступний профіль не повинен приховувати запис.
    if (!master) return true;

    const belongsToDistrict = selectedCity.districts.some(
      (district) => district.id === master.districtId,
    );

    const matchesCityName =
      master.cityName?.trim().toLocaleLowerCase("uk-UA") ===
      selectedCity.name.trim().toLocaleLowerCase("uk-UA");

    if (!master.cityName && !master.districtId) return true;

    return belongsToDistrict || matchesCityName;
  });

  const bookingDates = new Set(
    cityBookings
      .filter((booking) => booking.status === 1 && isUpcoming(booking))
      .map((booking) => getBookingDate(booking.startsAt)),
  );

  const completedDates = new Set(
    cityBookings
      .filter((booking) => booking.status === 2)
      .map((booking) => getBookingDate(booking.startsAt)),
  );

  function isUpcoming(booking: ClientBooking): boolean {
    if (booking.status === 1) {
      return new Date(booking.startsAt).getTime() > now;
    }

    if (booking.status === 0) {
      const expiresAt = new Date(
        booking.pendingExpiresAt ?? booking.startsAt,
      ).getTime();

      return new Date(booking.startsAt).getTime() > now
        && expiresAt > now;
    }

    return false;
  }

  // Спочатку актуальні підтверджені, потім очікування.
  // Решта — від найновіших до старіших.
  function sortBookings(items: ClientBooking[]) {
    return [...items].sort((a, b) => {
      const aUpcoming = isUpcoming(a);
      const bUpcoming = isUpcoming(b);

      if (aUpcoming !== bUpcoming) return aUpcoming ? -1 : 1;

      if (aUpcoming && bUpcoming && a.status !== b.status) {
        return a.status === 1 ? -1 : 1;
      }

      const difference =
        new Date(a.startsAt).getTime() -
        new Date(b.startsAt).getTime();

      return aUpcoming ? difference : -difference;
    });
  }

  // Під календарем — актуальні підтверджені та завершені записи.
  const visibleBookings = sortBookings(
    cityBookings.filter((booking) =>
      ((booking.status === 1 && isUpcoming(booking)) || booking.status === 2) &&
      (!selectedDate || getBookingDate(booking.startsAt) === selectedDate),
    ),
  );

  // Пошук: лише майбутні підтверджені та завершені записи в обраному місті.
  const searchResults = sortBookings(
    cityBookings.filter((booking) => {
      if (booking.status !== 2 && !(booking.status === 1 && isUpcoming(booking))) return false;
      const master = masters[booking.masterId];

      const text = [
        booking.serviceName,
        master?.firstName,
        master?.lastName,
      ]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase("uk-UA");

      return text.includes(search.trim().toLocaleLowerCase("uk-UA"));
    }),
  );

  // Найближчий запис визначаємо за часом, незалежно від порядку статусів.
  const nearestBooking = cityBookings
    .filter((booking) =>
      booking.status === 1 && isUpcoming(booking) && new Date(booking.startsAt).getTime() > now,
    )
    .sort((a, b) =>
      new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
    )[0];

  function handleSearch(value: string) {
    const query = value.trim();
    setSearch(query);
    setSearchOpen(query.length > 0);
  }

  function clearSearch() {
    setSearch("");
    setSearchOpen(false);
  }

  function highlightMatch(text: string) {
    const query = search.trim();
    if (!query) return text;
    const lower = text.toLocaleLowerCase("uk-UA");
    const needle = query.toLocaleLowerCase("uk-UA");
    const pieces = [];
    let cursor = 0;
    let index = lower.indexOf(needle);
    while (index !== -1) {
      pieces.push(text.slice(cursor, index));
      pieces.push(
        <mark key={index} className="bg-sky-200 text-neutral-800">
          {text.slice(index, index + query.length)}
        </mark>,
      );
      cursor = index + query.length;
      index = lower.indexOf(needle, cursor);
    }
    pieces.push(text.slice(cursor));
    return pieces;
  }

  function renderCard(booking: ClientBooking, inSearch = false) {
    const master = masters[booking.masterId];
    const masterName = master
      ? [master.firstName, master.lastName].filter(Boolean).join(" ")
      : "Майстер недоступний";
    const status = statuses[booking.status];
    const title = booking.status === 3
      ? "Скасований запис"
      : booking.status === 2 || !isUpcoming(booking)
        ? "Минулий запис"
        : booking.id === nearestBooking?.id
          ? "Найближчий запис"
          : "Майбутній запис";

    return (
      <article
        key={booking.id}
        className={inSearch
          ? "relative min-w-0 rounded-3xl border border-border/50 bg-surface px-4 py-4 sm:px-5 sm:py-5"
          : "relative min-w-0 rounded-3xl border border-border bg-surface p-5 shadow-[0_4px_16px_rgba(0,0,0,0.08)]"}
      >
        <div className="flex min-h-6 items-center justify-between gap-3">
          <p className="text-xs leading-5 text-muted sm:text-sm">{title}</p>
          <button type="button" onClick={() => setDetails({ booking, review: false })} aria-label="Відкрити деталі запису"
              title="Деталі запису"
              className="-mr-2 -my-2 flex size-10 shrink-0 items-center justify-center rounded-full text-muted hover:bg-panel-100 focus-visible:outline-2">
              <MoreVertical aria-hidden="true" className="size-5" />
            </button>
        </div>
        <h2 className="mt-2 text-base font-bold leading-snug text-text sm:text-xl">
          {formatBookingDate(booking.startsAt)}
        </h2>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <p className="min-w-0 flex-1 text-xs leading-relaxed text-copy-600 wrap-anywhere sm:text-sm">
            {inSearch ? highlightMatch(masterName) : masterName}
            {" • "}
            {inSearch ? highlightMatch(booking.serviceName) : booking.serviceName}
            {!inSearch && (
              <span className="whitespace-nowrap"> • {booking.price.toLocaleString("uk-UA")} ₴</span>
            )}
          </p>
          {booking.status === 2 ? (
            booking.review ? (
              <span className="shrink-0 rounded-full bg-orange-200 px-3 py-1 text-xs text-orange-900">
                Відгук залишено · {booking.review.rating}/5
              </span>
            ) : (
            <button type="button" onClick={() => setDetails({ booking, review: true })}
              className={`min-h-11 shrink-0 rounded-full px-3 text-xs font-medium focus-visible:outline-2 ${status.className}`}>
              {status.label}
            </button>
            )
          ) : (
            <span className={`shrink-0 whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-medium leading-tight sm:text-xs ${status.className}`}>
              {status.label}
            </span>
          )}
        </div>
      </article>
    );
  }

  return (
    <section className="mx-auto w-full max-w-xl space-y-5 text-text">
      <h1 className="sr-only">Мої записи</h1>
      {details && (
        <ClientBookingDetailsModal
          key={details.booking.id}
          booking={details.booking}
          master={masters[details.booking.masterId]}
          initialReview={details.review}
          onClose={() => setDetails(null)}
          onReviewSaved={() => {
            setDetails(null);
            setRevision((value) => value + 1);
          }}
          onCancelled={(id) => {
            setBookings((current) => current.map((booking) =>
              booking.id === id ? { ...booking, status: 3 } : booking,
            ));
            setDetails(null);
          }}
        />
      )}

      <CityPicker
        cities={cities}
        cityId={cityId}
        loading={citiesLoading}
        error={citiesError}
        onChange={(id) => {
          setCityId(id);
          setSelectedDate("");
          clearSearch();
        }}
      />

      {searchOpen && (
        <div
          aria-hidden="true"
          onClick={() => setSearchOpen(false)}
          className="fixed inset-0 z-40 bg-black/40"
        />
      )}

      <div
        className={`relative ${searchOpen ? "z-50" : ""}`}
        onKeyDown={(event) => {
          if (event.key === "Escape") setSearchOpen(false);
        }}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) {
            setSearchOpen(false);
          }
        }}
      >
        <ServiceSearchForm
          defaultValue={search}
          onSearch={handleSearch}
          onClear={clearSearch}
          autoComplete="off"
          className="z-10"
        />

        {searchOpen && (
          <div
            aria-label="Результати пошуку записів"
            className="absolute inset-x-0 top-full -mt-6 max-h-[60dvh] overflow-y-auto rounded-b-3xl bg-surface px-3 pt-9 pb-4 shadow-xl"
          >
            <div className="space-y-3">
              {loading ? (
                <p role="status">Завантаження…</p>
              ) : error ? (
                <p role="alert" className="text-danger">{error}</p>
              ) : searchResults.length > 0 ? (
                searchResults.map((booking) => renderCard(booking, true))
              ) : (
                <p role="status" className="p-4 text-sm text-muted">
                  Записів за цим запитом не знайдено.
                </p>
              )}

              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="min-h-11 w-full rounded-xl text-sm underline"
              >
                Закрити пошук
              </button>
            </div>
          </div>
        )}
      </div>

      <ClientMonthCalendar
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        bookingDates={bookingDates}
        completedDates={completedDates}
      />

      {selectedDate && (
        <button
          type="button"
          onClick={() => setSelectedDate("")}
          className="min-h-11 rounded-xl px-3 text-sm underline"
        >
          Усі дати
        </button>
      )}

      {loading ? (
        <p role="status" className="text-sm text-muted">
          Завантаження записів…
        </p>
      ) : error ? (
        <div className="space-y-3">
          <p role="alert" className="text-sm text-danger">{error}</p>
          <button
            type="button"
            onClick={() => setRevision((value) => value + 1)}
            className="min-h-11 rounded-xl border border-border px-4"
          >
            Спробувати ще раз
          </button>
        </div>
      ) : (
        <>
          {mastersError && (
            <p role="status" className="text-sm text-muted">
              {mastersError}
            </p>
          )}

          <div className="space-y-4">
            {visibleBookings.length > 0 ? (
              visibleBookings.map((booking) => renderCard(booking))
            ) : (
              <p className="rounded-3xl bg-surface p-5 text-sm text-muted">
                {selectedDate
                  ? "На обраний день підтверджених або завершених записів немає."
                  : "У цьому місті підтверджених або завершених записів немає."}
              </p>
            )}
          </div>
        </>
      )}
    </section>
  );
}
