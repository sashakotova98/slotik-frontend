import { useEffect, useId, useRef, useState } from "react";
import { CirclePause, ChevronDown, Check } from "lucide-react";
import { ApiError } from "../../api/api";
import { saveScheduleSlotStep } from "../../api/schedules";

//Крок запису
type Props = {
  value: number;
  onSaved: (value: number) => void;
};

export default function MasterSlotStep({ value, onSaved }: Props) {
  // Нове збережене значення створює форму з актуальним початковим станом.
  return <SlotStepForm key={value} value={value} onSaved={onSaved} />;
}

function SlotStepForm({ value, onSaved }: Props) {
  const [currentValue, setCurrentValue] = useState(String(value));
  // Поточний стан збереження блокуівння кнопки збереження
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  // Якщо запит уже виконується — повторний не запускаємо. захист від дублювання запитів.
  const savingRef = useRef(false);
  const hasChanges = Number(currentValue) !== value;
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const pickerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    // Показуємо поточне значення у прокручуваному списку.
    const selected = pickerRef.current?.querySelector<HTMLButtonElement>('[aria-selected="true"]');
    selected?.focus({ preventScroll: true });
    selected?.scrollIntoView({ block: "nearest" });

    function handleOutsideClick(event: PointerEvent) {
      if (event.target instanceof Node && !pickerRef.current?.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", handleOutsideClick);
    return () => document.removeEventListener("pointerdown", handleOutsideClick);
  }, [open]);

  async function handleSave() {
    if (savingRef.current) return;

    setError("");

    const slotStepMin = Number(currentValue);

    // Бек дозволяє від 5 до 240 хвилин, кратних 5.
    if (
      !Number.isInteger(slotStepMin) ||
      slotStepMin < 5 ||
      slotStepMin > 240 ||
      slotStepMin % 5 !== 0
    ) {
      setError("Вкажіть від 5 до 240 хвилин із кроком 5.");
      return;
    }

    savingRef.current = true;
    setSaving(true);

    try {
      const saved = await saveScheduleSlotStep({ slotStepMin });

      setCurrentValue(String(saved.slotStepMin));

      // Повідомляємо сторінці про значення, збережене бекендом.
      onSaved(saved.slotStepMin);
    } catch (error) {
      setError(
        error instanceof ApiError
          ? error.message
          : "Не вдалося зберегти крок запису."
      );
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }


  return (
    <section className="border-b border-border pb-3">
      <div className="flex min-h-12 items-center justify-between gap-4">
        <span className="flex items-center gap-2 text-sm text-copy-600">
          <CirclePause size={16} strokeWidth={1.5} aria-hidden="true" />
          Крок запису
        </span>

        <div
          ref={pickerRef}
          className="relative shrink-0"
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.preventDefault();
              setOpen(false);
              triggerRef.current?.focus();
            }
          }}
        >
          <button
            ref={triggerRef}
            type="button"
            aria-label={`Крок запису: ${currentValue} хв`}
            aria-haspopup="listbox"
            aria-expanded={open}
            aria-controls={open ? menuId : undefined}
            disabled={saving}
            onClick={() => setOpen((previous) => !previous)}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                event.preventDefault();
                setOpen(true);
              }
            }}
            className="flex min-h-11 items-center gap-3 rounded-lg px-2 text-sm font-semibold text-copy-900 focus-visible:outline-2 focus-visible:outline-text disabled:opacity-50"
          >
            {currentValue} хв
            <ChevronDown size={14} aria-hidden="true" className={`text-copy-400 transition-transform ${open ? "rotate-180" : ""}`} />
          </button>

          {open && (
            <div
              id={menuId}
              role="listbox"
              aria-label="Крок запису у хвилинах"
              className="absolute right-0 top-full z-30 mt-1 max-h-56 w-40 overflow-y-auto rounded-2xl bg-surface p-1 shadow-lg scrollbar-thin [scrollbar-color:#999_transparent]"
              onKeyDown={(event) => {
                const options = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="option"]'));
                const index = options.findIndex((option) => option === document.activeElement);
                let next: number;
                if (event.key === "ArrowDown") next = Math.min(index + 1, options.length - 1);
                else if (event.key === "ArrowUp") next = Math.max(index - 1, 0);
                else if (event.key === "Home") next = 0;
                else if (event.key === "End") next = options.length - 1;
                else return;
                event.preventDefault();
                options[next]?.focus({ preventScroll: true });
                options[next]?.scrollIntoView({ block: "nearest" });
              }}
            >
              {Array.from({ length: 48 }, (_, index) => (index + 1) * 5).map((minutes) => {
                const selected = Number(currentValue) === minutes;
                return (
                  <button
                    key={minutes}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    tabIndex={selected ? 0 : -1}
                    onClick={() => {
                      setCurrentValue(String(minutes));
                      setError("");
                      setOpen(false);
                      triggerRef.current?.focus();
                    }}
                    className={`flex min-h-11 w-full items-center justify-between rounded-xl px-3 text-left text-sm focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-border ${selected ? "bg-panel-100 text-text" : "text-copy-600 hover:bg-panel-50"}`}
                  >
                    {minutes} хв
                    {selected && <Check size={16} strokeWidth={1.5} aria-hidden="true" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {error && (
        <p role="alert" className="mt-2 text-sm text-red-600">
          {error}
        </p>
      )}

      {/* Кнопка потрібна лише тоді, коли вибране значення ще не збережене. */}
      {(hasChanges || saving) && <button
        type="button"
        disabled={saving}
        onClick={handleSave}
        className="mt-3 w-full rounded-xl bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
      >
        {saving ? "Зберігаємо…" : "Зберегти"}
      </button>}
    </section>
  );
}
