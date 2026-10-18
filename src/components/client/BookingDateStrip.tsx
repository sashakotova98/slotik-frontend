import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  selectedDate: string; // "2026-10-15".
  onChange: (date: string) => void;
};

function parseDate(value: string) {
  return new Date(`${value}T00:00:00Z`);
}


// // "2026-10-15T00:00:00.000Z"  slice "2026-10-15"
function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function addDays(date: Date, count: number) {
  const result = new Date(date); //копія дати, щоб не змінювати оригінал
  result.setUTCDate(result.getUTCDate() + count); //getUTCDate отримує день місяця у форматі UTC. 15
  return result;
}

function getTodayInKyiv() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Kyiv",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  return ["year", "month", "day"]
    .map((type) => parts.find((part) => part.type === type)!.value)
    .join("-");
}

export default function BookingDateStrip({ selectedDate, onChange }: Props) {
  const today = getTodayInKyiv();

  // Початок видимої смуги незалежний від обраного дня.
  const [startDate, setStartDate] = useState(getTodayInKyiv);
  const visibleStart = startDate < today ? today : startDate;

  const days = Array.from({ length: 7 }, (_, index) =>
    addDays(parseDate(visibleStart), index),
  );

  const monthTitle = parseDate(visibleStart).toLocaleDateString("uk-UA", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

  function changeWeek(offset: number) {
    const nextStart = formatDate(addDays(parseDate(visibleStart), offset));
    setStartDate(nextStart < today ? today : nextStart);
  }
  return (
    <section aria-label="Оберіть дату запису">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold capitalize">
          {monthTitle}
        </h2>

        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => changeWeek(-7)}
            disabled={visibleStart <= today}
            aria-label="Попередній тиждень"
            className="flex size-11 items-center justify-center rounded-full hover:bg-panel-100 focus-visible:outline-2 disabled:pointer-events-none disabled:opacity-30"
          >
            <ChevronLeft aria-hidden="true" className="size-6" />
          </button>

          <button
            type="button"
            onClick={() => changeWeek(7)}
            aria-label="Наступний тиждень"
            className="flex size-11 items-center justify-center rounded-full hover:bg-panel-100 focus-visible:outline-2 disabled:pointer-events-none disabled:opacity-30"
          >
            <ChevronRight aria-hidden="true" className="size-6" />
          </button>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-7 gap-1.5">
        {days.map((day) => {
          const value = formatDate(day);
          const isSelected = value === selectedDate;

          const weekdayName = day.toLocaleDateString("uk-UA", {
            weekday: "short",
            timeZone: "UTC",
          });

          const fullDate = day.toLocaleDateString("uk-UA", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
            timeZone: "UTC",
          });

          return (
            <button
              key={value}
              type="button"
              onClick={() => onChange(value)}
              aria-label={fullDate}
              aria-pressed={isSelected}
              className={`flex min-h-20 min-w-0 flex-col items-center justify-center gap-1 rounded-2xl border px-1 py-2 focus-visible:outline-2 focus-visible:outline-offset-2 ${isSelected
                ? "border-black bg-black text-white"
                : "border-border bg-surface text-text hover:bg-panel-100"
                }`}
            >
              <span className="text-xs">{weekdayName}</span>
              <span className="text-xl font-medium">
                {day.getUTCDate()}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}