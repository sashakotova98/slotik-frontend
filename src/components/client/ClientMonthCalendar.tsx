import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  selectedDate: string;
  onSelectDate: (date: string) => void;
  bookingDates: Set<string>;
  completedDates: Set<string>;
};

// Перетворюємо дату ячейки на "2026-10-19".
function getDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

const weekdays = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"];

export default function ClientMonthCalendar({
  selectedDate,
  onSelectDate,
  bookingDates,
  completedDates,
}: Props) {
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const date = selectedDate
      ? new Date(`${selectedDate}T12:00:00`)
      : new Date();

    return new Date(date.getFullYear(), date.getMonth(), 1);
  });

  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();

  // Понеділок — 0, неділя — 6.
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Заповнюємо календар повними тижнями.
  const cellCount = Math.ceil((firstWeekday + daysInMonth) / 7) * 7;

  const days = Array.from(
    { length: cellCount },
    (_, index) => new Date(year, month, index - firstWeekday + 1),
  );

  const monthTitle = visibleMonth.toLocaleDateString("uk-UA", {
    month: "long",
    year: "numeric",
  });

  function changeMonth(offset: number) {
    setVisibleMonth(new Date(year, month + offset, 1));
  }

  return (
    <section
      aria-label="Календар записів"
      className="border-y border-border py-4"
    >
      <div className="mb-5 flex items-center justify-between">
        <button
          type="button"
          onClick={() => changeMonth(-1)}
          aria-label="Попередній місяць"
          className="flex size-11 items-center justify-center rounded-full hover:bg-panel-100"
        >
          <ChevronLeft aria-hidden="true" size={22} />
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
          className="flex size-11 items-center justify-center rounded-full hover:bg-panel-100"
        >
          <ChevronRight aria-hidden="true" size={22} />
        </button>
      </div>

      <div className="grid grid-cols-7">
        {weekdays.map((day, index) => (
          <div
            key={day}
            className={`pb-3 text-center text-sm ${index >= 5 ? "text-blue-500" : "text-muted"
              }`}
          >
            {day}
          </div>
        ))}

        {days.map((date) => {
          // У кожної ячейки своя дата.
          const dateKey = getDateKey(date);
          const isSelected = dateKey === selectedDate;
          const hasBooking = bookingDates.has(dateKey);
          const hasCompleted = completedDates.has(dateKey);
          const isCurrentMonth = date.getMonth() === month;
          const isWeekend = date.getDay() === 0 || date.getDay() === 6;

          const dayClass = isSelected
            ? "bg-black text-white"
            : hasBooking
              ? "bg-[#c9eac3] text-neutral-800"
              : hasCompleted
                ? "bg-orange-200 text-orange-900"
                : isWeekend
                  ? "text-blue-500"
                  : "text-text";

          return (
            <button
              key={dateKey}
              type="button"
              aria-pressed={isSelected}
              aria-label={[date.toLocaleDateString("uk-UA"), hasBooking ? "Є підтверджений запис" : "", hasCompleted ? "Є завершений запис" : ""].filter(Boolean).join(". ")}
              onClick={() => {
                onSelectDate(dateKey);

                // Натискання на день сусіднього місяця відкриває його.
                if (!isCurrentMonth) {
                  setVisibleMonth(
                    new Date(date.getFullYear(), date.getMonth(), 1),
                  );
                }
              }}
              className={`flex min-h-12 items-center justify-center rounded-lg focus-visible:outline-2 focus-visible:outline-blue-500 ${isCurrentMonth ? "" : "opacity-40"
                }`}
            >
              <span
                className={`flex size-7 items-center justify-center rounded-md text-sm ${dayClass}`}
              >
                {date.getDate()}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}