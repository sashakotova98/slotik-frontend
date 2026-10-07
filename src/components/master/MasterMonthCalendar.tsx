import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  selectedDate: string;
  onSelectDate: (date: string) => void;
  // Например: { "2026-10-07": 2, "2026-10-10": 1 }
  bookingCounts?: Record<string, number>;
  workingWeekdays?: number[];
  todayDate?: string;
};

const weekdays = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"];

function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export default function MasterMonthCalendar({
  selectedDate,
  onSelectDate,
  bookingCounts = {},
  workingWeekdays,
  todayDate,
}: Props) {
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const date = selectedDate
      ? new Date(`${selectedDate}T12:00:00`)
      : todayDate ? new Date(`${todayDate}T12:00:00`) : new Date();

    return new Date(date.getFullYear(), date.getMonth(), 1);
  });

  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();

  // Починаємо тиждень із понеділка.
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cellCount = Math.ceil((firstWeekday + daysInMonth) / 7) * 7;

  const days = Array.from(
    { length: cellCount },
    (_, index) => new Date(year, month, index - firstWeekday + 1),
  );

  const monthTitle = visibleMonth.toLocaleDateString("uk-UA", {
    month: "long",
    year: "numeric",
  });

  const today = todayDate ?? dateKey(new Date());

  function changeMonth(offset: number) {
    setVisibleMonth(new Date(year, month + offset, 1));
  }

  return (
    <section
      aria-label="Календар записів"
      className="border-y border-neutral-300 py-4"
    >
      <div className="mb-5 flex items-center justify-between">
        <button
          type="button"
          onClick={() => changeMonth(-1)}
          aria-label="Попередній місяць"
          className="flex size-10 items-center justify-center rounded-full hover:bg-neutral-100"
        >
          <ChevronLeft size={22} />
        </button>

        <h2
          aria-live="polite"
          className="rounded-full bg-black px-6 py-1 text-center text-white"
        >
          {monthTitle}
        </h2>

        <button
          type="button"
          onClick={() => changeMonth(1)}
          aria-label="Наступний місяць"
          className="flex size-10 items-center justify-center rounded-full hover:bg-neutral-100"
        >
          <ChevronRight size={22} />
        </button>
      </div>

      <div className="grid grid-cols-7">
        {weekdays.map((day, index) => (
          <div
            key={day}
            className={`pb-3 text-center text-sm ${index >= 5 ? "text-blue-500" : "text-neutral-400"
              }`}
          >
            {day}
          </div>
        ))}

        {days.map((date) => {
          const key = dateKey(date);
          const isSelected = key === selectedDate;
          const isCurrentMonth = date.getMonth() === month;
          const isWeekend = date.getDay() === 0 || date.getDay() === 6;
          const count = bookingCounts[key] ?? 0;
          const isWorking = workingWeekdays?.includes(date.getDay() || 7);

          const appearance = isSelected
            ? "bg-black text-white"
            : count > 0
              ? "bg-[#c9eac3] text-neutral-800"
              : isWorking
                ? "bg-neutral-200 text-neutral-600"
              : isWeekend
                ? "text-blue-500"
                : "text-neutral-600";

          return (
            <button
              key={key}
              type="button"
              aria-pressed={isSelected}
              aria-current={key === today ? "date" : undefined}
              aria-label={`${date.toLocaleDateString("uk-UA")}. Записів: ${count}`}
              onClick={() => {
                onSelectDate(key);

                if (!isCurrentMonth) {
                  setVisibleMonth(
                    new Date(date.getFullYear(), date.getMonth(), 1),
                  );
                }
              }}
              className={`flex min-h-11 items-center justify-center rounded-lg focus-visible:outline-2 focus-visible:outline-blue-500 ${isCurrentMonth ? "" : "opacity-40"
                }`}
            >
              <span
                className={`relative flex size-7 items-center justify-center rounded-md text-sm ${appearance}`}
              >
                {date.getDate()}

                {count > 0 && (
                  <span
                    aria-hidden="true"
                    className="absolute -right-1 -bottom-1 flex min-w-3.5 items-center justify-center rounded-full bg-neutral-200 px-0.5 text-[9px] text-black"
                  >
                    {count}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
