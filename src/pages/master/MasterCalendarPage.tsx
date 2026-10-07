import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import MasterMonthCalendar from "../../components/master/MasterMonthCalendar";
import MasterBookingCard from "../../components/master/MasterBookingCard";
import { changeBookingStatus, getMasterBookings, type BookingStatus, type MasterBooking } from "../../api/bookings";
import { getOwnSchedule, type WeeklySchedule } from "../../api/schedules";

function kyivDate(value: string | Date) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Kyiv", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(date);
  const part = (type: string) => parts.find((item) => item.type === type)?.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export default function MasterCalendarPage() {
  const [selectedDate, setSelectedDate] = useState("");
  const [query, setQuery] = useState("");
  const [bookings, setBookings] = useState<MasterBooking[]>([]);
  const [schedule, setSchedule] = useState<WeeklySchedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [scheduleError, setScheduleError] = useState(false);
  const [revision, setRevision] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const pendingUpdates = useRef(new Set<number>());
  const [updating, setUpdating] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let active = true;
    // Помилка графіка не приховує записи клієнтів.
    void Promise.allSettled([getMasterBookings(), getOwnSchedule()]).then(([records, hours]) => {
      if (!active) return;
      if (records.status === "fulfilled") {
        setBookings(records.value);
        setError("");
      } else {
        setError("Не вдалося завантажити записи. Натисніть «Оновити».");
      }
      setSchedule(hours.status === "fulfilled" ? hours.value : null);
      setScheduleError(hours.status === "rejected");
      setLoading(false);
    });
    return () => { active = false; };
  }, [revision]);

  async function handleChangeStatus(id: number, status: BookingStatus) {
    if (pendingUpdates.current.has(id)) return;
    pendingUpdates.current.add(id);
    setUpdating(pendingUpdates.current.size);
    try {
      const saved = await changeBookingStatus(id, status);
      setBookings((current) => current.map((booking) =>
        booking.id === saved.id ? { ...booking, status: saved.status } : booking,
      ));
    } finally {
      pendingUpdates.current.delete(id);
      setUpdating(pendingUpdates.current.size);
    }
  }

  const counts: Record<string, number> = {};
  for (const booking of bookings) {
    const date = kyivDate(booking.startsAt);
    if (date && (booking.status === 0 || booking.status === 1)) {
      counts[date] = (counts[date] ?? 0) + 1;
    }
  }
  const search = query.trim().toLocaleLowerCase("uk-UA");
  const visibleBookings = bookings.filter((booking) => {
    const date = kyivDate(booking.startsAt);
    const [year, month, day] = date.split("-");
    const matchesSearch = `${booking.serviceName} ${booking.clientFirstName} ${booking.clientLastName} ${date} ${day}.${month}.${year}`
      .toLocaleLowerCase("uk-UA").includes(search);
    if (!matchesSearch) return false;
    if (selectedDate) return date === selectedDate;
    if (search) return true;
    return (booking.status === 0 || booking.status === 1) && new Date(booking.startsAt).getTime() >= now;
  }).sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt));
  const workingWeekdays = schedule?.days.filter((day) => day.isWorking && day.intervals.length > 0).map((day) => day.weekday);

  return (
    <div className="mx-auto w-full max-w-md space-y-5">
      <h1 className="sr-only">Календар записів</h1>
      <label className="flex items-center gap-3 rounded-full bg-white px-5 py-4 shadow-md">
        <Search size={20} aria-hidden="true" />
        <input aria-label="Пошук за послугою, клієнтом або датою" type="search" value={query}
          onChange={(event) => setQuery(event.target.value)} placeholder="Послуга, клієнт або дата…"
          className="min-w-0 flex-1 bg-transparent text-sm outline-none focus-visible:ring-2 focus-visible:ring-neutral-300" />
      </label>
      <MasterMonthCalendar selectedDate={selectedDate} onSelectDate={setSelectedDate}
        bookingCounts={counts} workingWeekdays={workingWeekdays} todayDate={kyivDate(new Date(now))} />
      <p className="text-xs text-neutral-500">Зелені дні — активні записи. Сірі — робочі дні за тижневим графіком. Час — за Києвом.</p>
      {scheduleError && <p role="status" className="text-sm text-amber-800">Не вдалося завантажити робочий графік.</p>}
      <section aria-busy={loading} className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold">{selectedDate ? `Записи на ${selectedDate.split("-").reverse().join(".")}` : search ? "Результати пошуку" : "Найближчі записи"}</h2>
          <button type="button" disabled={loading || updating > 0} onClick={() => { setLoading(true); setRevision((value) => value + 1); }} className="min-h-10 text-sm text-blue-600 disabled:opacity-50">Оновити</button>
        </div>
        {selectedDate && <button type="button" onClick={() => { setSelectedDate(""); setQuery(""); }} className="min-h-10 text-sm text-blue-600">Показати найближчі записи</button>}
        {loading ? <p role="status">Завантажуємо записи…</p> : error ? <p role="alert" className="text-red-600">{error}</p> : visibleBookings.length === 0 ? (
          <p role="status" className="rounded-2xl border border-neutral-200 p-5 text-sm text-neutral-500">{search ? "За вашим пошуком записів немає." : selectedDate ? "На цю дату записів немає." : "Майбутніх активних записів поки немає."}</p>
        ) : visibleBookings.map((booking) => <MasterBookingCard key={booking.id} booking={booking} onChangeStatus={handleChangeStatus} />)}
      </section>
    </div>
  );
}
