import { CalendarDays, Check, ChevronDown, Plus, SquarePen, X } from "lucide-react";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { getOwnSchedule, saveScheduleDay, type ScheduleDay, type ScheduleInterval, type Weekday } from "../../api/schedules";

type Props = {
  onFormStateChange: (hasChanges: boolean, busy: boolean, hasWorkingDays: boolean) => void;
};
type Pause = { start: string; duration: string };
const weekdays = ["Понеділок", "Вівторок", "Середа", "Четвер", "П’ятниця", "Субота", "Неділя"];
const ranges = ["08:00-17:00", "09:00-18:00", "10:00-18:00", "10:00-19:00", "11:00-20:00"];

// Перетворюємо час на хвилини, щоб перевіряти межі та перетини пауз.
function toMinutes(time: string): number {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) throw new Error("Вкажіть коректний час.");
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}
function toTime(minutes: number): string {
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}:00`;
}

// API отримує робочі інтервали. Паузи між ними не надсилаємо окремо.
function buildIntervals(start: string, end: string, pauses: Pause[]): ScheduleInterval[] {
  const from = toMinutes(start);
  const until = toMinutes(end);
  if (from >= until) throw new Error("Кінець роботи має бути пізніше початку. Оберіть час у межах одного дня.");
  const breaks = pauses.map((pause) => {
    const begin = toMinutes(pause.start);
    const duration = Number(pause.duration);
    if (!Number.isInteger(duration) || duration <= 0) throw new Error("Вкажіть тривалість паузи у цілих хвилинах.");
    return { begin, end: begin + duration };
  }).sort((a, b) => a.begin - b.begin);
  const intervals: ScheduleInterval[] = [];
  let cursor = from;
  for (const pause of breaks) {
    if (pause.begin <= from || pause.end >= until) throw new Error("Пауза має бути всередині робочого часу.");
    if (pause.begin < cursor) throw new Error("Паузи не можуть перетинатися.");
    if (pause.begin > cursor) intervals.push({ startTime: toTime(cursor), endTime: toTime(pause.begin) });
    cursor = pause.end;
  }
  intervals.push({ startTime: toTime(cursor), endTime: toTime(until) });
  return intervals;
}

export default function MasterScheduleStep({ onFormStateChange }: Props) {
  const [days, setDays] = useState<ScheduleDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [retry, setRetry] = useState(0);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [weekday, setWeekday] = useState<Weekday | "">("");
  const [isWorking, setIsWorking] = useState(true);
  const [range, setRange] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [pauses, setPauses] = useState<Pause[]>([]);
  const [dirty, setDirty] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const hasWorkingDays = days.some((day) => day.isWorking && day.intervals.length > 0);

  // Повідомляємо сторінці, коли не можна виходити з кроку.
  useEffect(() => {
    onFormStateChange(dirty, loading || saving, !loadError && hasWorkingDays);
  }, [dirty, loading, saving, loadError, hasWorkingDays, onFormStateChange]);

  useEffect(() => {
    let active = true;
    getOwnSchedule().then((schedule) => {
      if (active) setDays(schedule.days);
    }).catch((reason: unknown) => {
      if (active) setLoadError(reason instanceof Error ? reason.message : "Не вдалося завантажити графік.");
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [retry]);

  // Відновлюємо паузи з проміжків між збереженими інтервалами.
  function selectDay(value: Weekday | "") {
    const day = days.find((item) => item.weekday === value);
    const intervals = [...(day?.intervals ?? [])].sort((a, b) => a.startTime.localeCompare(b.startTime));
    const first = intervals[0]?.startTime.slice(0, 5) ?? "";
    const last = intervals.at(-1)?.endTime.slice(0, 5) ?? "";
    const savedRange = `${first}-${last}`;
    setWeekday(value);
    setIsWorking(day?.isWorking ?? true);
    // Незбережені дні API повертає як вихідні; для нової форми обираємо робочий день.
    if (!intervals.length) setIsWorking(true);
    setStart(first);
    setEnd(last);
    setRange(first ? (ranges.includes(savedRange) ? savedRange : "custom") : "");
    setPauses(intervals.slice(1).flatMap((item, index) => {
      const previousEnd = intervals[index].endTime.slice(0, 5);
      const gap = toMinutes(item.startTime.slice(0, 5)) - toMinutes(previousEnd);
      return gap > 0 ? [{ start: previousEnd, duration: String(gap) }] : [];
    }));
    setDirty(false);
    setError("");
    setNotice("");
  }

  function clearForm() {
    setWeekday(""); setRange(""); setStart(""); setEnd("");
    setIsWorking(true); setPauses([]); setDirty(false); setError("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (savingRef.current || loading) return;
    setError(""); setNotice("");
    if (weekday === "") { setError("Оберіть день тижня."); return; }
    let intervals: ScheduleInterval[];
    try {
      intervals = isWorking ? buildIntervals(start, end, pauses) : [];
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Перевірте час роботи."); return;
    }
    savingRef.current = true;
    setSaving(true);
    onFormStateChange(dirty, true, hasWorkingDays);
    try {
      // PUT створює графік дня або замінює його попередні інтервали.
      const saved = await saveScheduleDay(weekday, { isWorking, intervals });
      setDays((previous) => [...previous.filter((day) => day.weekday !== saved.weekday), saved].sort((a, b) => a.weekday - b.weekday));
      clearForm();
      setNotice("Графік збережено.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Не вдалося зберегти графік.");
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  const fieldClass = "h-12 w-full min-w-0 rounded-[14px] border border-neutral-400 bg-transparent px-3 text-base text-neutral-600 outline-none focus-visible:ring-2 focus-visible:ring-neutral-300 sm:text-lg";
  const dayIsSaved = days.some((day) => day.weekday === weekday && day.isWorking);

  if (loading) return <p role="status" className="py-6 text-neutral-500">Завантаження графіка…</p>;
  if (loadError) return <div><p role="alert" className="text-sm text-red-500">{loadError}</p><button type="button" onClick={() => { setLoading(true); setLoadError(""); setRetry((value) => value + 1); }} className="mt-3 rounded-xl bg-black px-4 py-2 text-white">Спробувати знову</button></div>;

  return (
    <div className="space-y-4">
      {days.filter((day) => day.isWorking).map((day) => (
        <div key={day.weekday} className="flex min-h-19 items-center gap-2 rounded-xl border border-neutral-400 px-3 py-3">
          <CalendarDays size={28} strokeWidth={1.7} className="shrink-0" aria-hidden="true" />
          <div className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
            <p className="wrap-break-word text-sm font-semibold sm:text-base">{weekdays[day.weekday - 1]}</p>
            <div className="whitespace-nowrap text-sm leading-snug sm:text-base">{day.intervals.map((interval) => <p key={interval.id}>{interval.startTime.slice(0, 5)}–{interval.endTime.slice(0, 5)}</p>)}</div>
          </div>
          <button type="button" disabled={saving || dirty} aria-label={`Редагувати ${weekdays[day.weekday - 1]}`} onClick={() => { selectDay(day.weekday); formRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" }); }} className="flex size-8 shrink-0 items-center justify-center text-neutral-500 disabled:opacity-40"><SquarePen size={22} strokeWidth={1.5} /></button>
        </div>
      ))}
      {notice && <p role="status" className="text-sm text-green-700">{notice}</p>}
      <form ref={formRef} onSubmit={handleSubmit} onChange={() => { setDirty(true); setNotice(""); }}>
        <fieldset disabled={saving} className="m-0 min-w-0 space-y-4 rounded-xl border border-dashed border-neutral-400 px-4 py-5">
          <h3 className="mb-5 text-lg font-semibold">{dayIsSaved ? "Редагування робочого дня" : "+ Нова робоча година"}</h3>
          <div className="grid grid-cols-2 gap-2.5">
            <ScheduleSelect label="День" value={String(weekday)} placeholder="Оберіть день" disabled={dirty || saving}
              options={weekdays.map((label, index) => ({ value: String(index + 1), label }))}
              onChange={(value) => selectDay(Number(value) as Weekday)} />
            <ScheduleSelect label="Час" value={range} placeholder="Оберіть час" disabled={!isWorking || saving || weekday === ""}
              options={[...ranges.map((value) => ({ value, label: value.replace("-", "–") })), { value: "custom", label: "Інший час" }]}
              onChange={(value) => {
                setRange(value);
                if (value !== "custom") { const [from, until] = value.split("-"); setStart(from); setEnd(until); }
                setDirty(true); setNotice("");
              }} />
          </div>
          {isWorking && range === "custom" && <div className="grid grid-cols-2 gap-3">
            <label className="min-w-0 text-neutral-600">Початок роботи<input type="time" step="60" value={start} onChange={(event) => setStart(event.target.value)} required className={fieldClass + " mt-1"} /></label>
            <label className="min-w-0 text-neutral-600">Кінець роботи<input type="time" step="60" value={end} onChange={(event) => setEnd(event.target.value)} required className={fieldClass + " mt-1"} /></label>
          </div>}
          <label className="flex items-center gap-2 text-sm text-neutral-500"><input type="checkbox" checked={!isWorking} onChange={(event) => setIsWorking(!event.target.checked)} className="size-4 accent-black" />Вихідний день</label>
          {isWorking && pauses.map((pause, index) => (
            <div key={index} className="relative grid grid-cols-2 gap-3">
              <ScheduleSelect label="Пауза" value={pause.duration} disabled={saving}
                options={Array.from(new Set([15, 30, 45, 60, 90, 120, Number(pause.duration)])).sort((a, b) => a - b).map((value) => ({ value: String(value), label: `${value} хв` }))}
                onChange={(value) => { setPauses((previous) => previous.map((item, i) => i === index ? { ...item, duration: value } : item)); setDirty(true); setNotice(""); }} />
              <ScheduleSelect label="Початок" value={pause.start} placeholder="Оберіть час" disabled={saving}
                options={Array.from(new Set([...Array.from({ length: 288 }, (_, i) => toTime(i * 5).slice(0, 5)), ...(pause.start ? [pause.start] : [])])).sort().map((value) => ({ value, label: value }))}
                onChange={(value) => { setPauses((previous) => previous.map((item, i) => i === index ? { ...item, start: value } : item)); setDirty(true); setNotice(""); }} />
              <button type="button" aria-label={`Прибрати паузу ${index + 1}`} onClick={() => { setPauses((previous) => previous.filter((_, i) => i !== index)); setDirty(true); }} className="absolute -right-2 -top-3 flex size-6 items-center justify-center rounded-full bg-neutral-200 text-neutral-600"><X size={14} /></button>
            </div>
          ))}
          {isWorking && <button type="button" disabled={weekday === ""} onClick={() => { setPauses((previous) => [...previous, { start: "", duration: "60" }]); setDirty(true); setNotice(""); }} className="mx-auto flex h-10 w-40 items-center justify-center gap-2 rounded-[14px] border border-neutral-400 text-lg text-neutral-600 disabled:opacity-40">Пауза <Plus size={23} strokeWidth={1.5} /></button>}
          {error && <p role="alert" className="text-sm text-red-500">{error}</p>}
          <button type="submit" disabled={saving || weekday === "" || !dirty || (isWorking && (!start || !end))} className="min-h-13 w-full rounded-[14px] bg-black px-3 py-3 text-xl font-semibold text-white disabled:cursor-not-allowed disabled:bg-neutral-300">{saving ? "Збереження…" : "Зберегти"}</button>
          {(dirty || weekday !== "") && <button type="button" onClick={clearForm} className="w-full text-sm text-neutral-500">Скасувати зміни</button>}
        </fieldset>
      </form>
    </div>
  );
}

// Спільний вигляд списків: світло-сіре виділення, галочка та закруглене меню.
function ScheduleSelect({ label, value, options, onChange, disabled = false, placeholder = "Оберіть" }: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const selected = options.find((option) => option.value === value);
  const expanded = open && !disabled;

  return (
    <div className={`relative min-w-0 ${expanded ? "z-40" : ""}`} onKeyDown={(event) => {
      if (event.key === "Escape") { event.preventDefault(); setOpen(false); triggerRef.current?.focus(); }
    }}>
      <span id={id + "-label"} className="mb-1 block text-base text-neutral-600">{label}</span>
      {expanded && <button type="button" tabIndex={-1} aria-label={`Закрити список: ${label}`} onClick={() => setOpen(false)} className="fixed inset-0 z-10 cursor-default" />}
      <button ref={triggerRef} type="button" disabled={disabled} aria-labelledby={id + "-label " + id + "-value"} aria-expanded={expanded} aria-controls={expanded ? id + "-options" : undefined}
        onClick={() => setOpen((previous) => !previous)}
        className="relative z-20 flex h-10 w-full items-center justify-between gap-1 rounded-xl border border-neutral-300 bg-transparent px-3 py-1 text-left outline-none transition-colors hover:border-neutral-400 focus-visible:ring-2 focus-visible:ring-neutral-300 disabled:cursor-not-allowed disabled:opacity-50">
        <span id={id + "-value"} title={selected?.label} className={selected ? "min-w-0 truncate text-sm text-neutral-600" : "min-w-0 truncate text-sm text-neutral-400"}>{selected?.label ?? placeholder}</span>
        <ChevronDown size={17} strokeWidth={1.5} aria-hidden="true" className={`shrink-0 text-neutral-400 transition-transform ${expanded ? "rotate-180" : ""}`} />
      </button>
      {expanded && <div id={id + "-options"} role="group" aria-labelledby={id + "-label"} className="absolute inset-x-0 top-full z-30 mt-2 max-h-56 space-y-1 overflow-y-auto overscroll-contain rounded-2xl border border-neutral-200 bg-white p-1.5 shadow-lg">
        {options.map((option) => <button key={option.value} type="button" aria-pressed={value === option.value} onClick={() => { onChange(option.value); setOpen(false); triggerRef.current?.focus(); }}
          className={`flex min-h-10 w-full items-center justify-between gap-1 rounded-xl px-2 py-2 text-left text-sm outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-neutral-300 ${value === option.value ? "bg-neutral-100 font-medium text-neutral-700" : "text-neutral-600 hover:bg-neutral-50"}`}>
          <span>{option.label}</span>{value === option.value && <Check size={15} aria-hidden="true" className="shrink-0" />}
        </button>)}
      </div>}
    </div>
  );
}
