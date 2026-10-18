import { useState, useEffect, useRef, useId } from "react";
import { type DayOff, getOwnDaysOff, createDayOff, updateDayOff, deleteDayOff } from "../../api/daysOff";
import { ApiError } from "../../api/api";
import { CirclePause, SquarePen, Trash2, ChevronDown, X } from "lucide-react";
import { DayPicker } from "@daypicker/react";
import { uk } from "@daypicker/react/locale";
import "@daypicker/react/style.css";
import "./MasterDaysOff.css";

export default function MasterDaysOff() {
  // Дати, які користувач обирає у формі.
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Усі відпустки, вже збережені на бекенді.
  const [daysOff, setDaysOff] = useState<DayOff[]>([]);

  // ID відпустки, яку редагуємо. null — створюємо нову.
  const [editingId, setEditingId] = useState<number | null>(null);

  // Виконання запиту збереження або видалення POST, PUT  DELETE блокуваня кнопок.
  const [saving, setSaving] = useState(false);

  // Помилка дії, окремо від помилки початкового завантаження. На вибрані дати є активні записи.
  const [saveError, setSaveError] = useState("");

  //завантаження відпусток з бекенду GET /DaysOff/me.
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Яке поле зараз обираємо; null — календар закритий.
  const [openedCalendar, setOpenedCalendar] =
    useState<"from" | "to" | null>(null);
  const calendarRef = useRef<HTMLDialogElement>(null);
  const calendarTitleId = useId();

  // Нативний dialog утримує фокус усередині та повертає його після закриття.
  useEffect(() => {
    if (!openedCalendar) return;
    const dialog = calendarRef.current;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    dialog?.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      dialog?.close();
      document.body.style.overflow = previousOverflow;
      if (previousFocus instanceof HTMLElement) previousFocus.focus();
    };
  }, [openedCalendar]);

  useEffect(() => {
    let active = true;

    async function loadDaysOff() {
      setLoading(true);
      setError("");
      try {
        const result = await getOwnDaysOff();
        if (active) {
          setDaysOff(result.daysOff);
        }
      } catch (err) {
        if (!active) return;

        setError(
          err instanceof ApiError
            ? err.message
            : "Не вдалося завантажити відпустки. Спробуйте ще раз."
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadDaysOff();

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return <p role="status" className="py-3 text-sm text-copy-500">Завантаження відпусток…</p>;
  }

  if (error) {
    return <p role="alert" className="py-3 text-sm text-red-600">{error}</p>;
  }

  function handleEdit(period: DayOff) {
    setEditingId(period.id);
    setDateFrom(period.dateFrom);
    setDateTo(period.dateTo);
    setSaveError("");
  }

  function handleSave() {
    // Не запускаємо збереження, поки попередній запит виконується.
    if (saving) return;

    setSaveError("")

    if (!dateFrom || !dateTo) {
      setSaveError("Оберіть початок і кінець відпустки.");
      return;
    }

    if (dateFrom > dateTo) {
      setSaveError("Кінець відпустки не може бути раніше початку.");
      return;
    }

    const data = {
      dateFrom,
      dateTo,
    };

    setSaving(true);

    async function saveDayOff() {
      try {
        if (editingId === null) {
          const created = await createDayOff(data);
          setDaysOff((previous) => [...previous, created]);
        } else {
          await updateDayOff(editingId, data);
          setDaysOff((previous) =>
            previous.map((period) =>
              period.id === editingId
                ? { ...period, ...data }
                : period
            )
          );
        }
        resetForm();
      } catch (err) {
        if (err instanceof ApiError) {
          setSaveError(err.message);
        } else if (err instanceof TypeError) {
          setSaveError("Не вдалося отримати відповідь сервера. Перевірте список відпусток перед повторним збереженням.");
        } else {
          setSaveError("Не вдалося зберегти відпустку.");
        }
      } finally {
        setSaving(false);
      }

    }
    void saveDayOff();
  }

  function handleDelete(id: number) {
    if (saving) return;
    setSaveError("");
    setSaving(true);
    async function delDayOff() {
      try {
        await deleteDayOff(id);
        setDaysOff((previous) => previous.filter((period) => period.id !== id));
        if (editingId === id) {
          resetForm();
        }
      } catch (err) {
        if (err instanceof ApiError) {
          setSaveError(err.message);
        } else if (err instanceof TypeError) {
          setSaveError("Не вдалося отримати відповідь сервера. Перевірте список відпусток перед повторним збереженням.");
        } else {
          setSaveError("Не вдалося видалити відпустку.");
        }
      } finally {
        setSaving(false);
      }
    }
    void delDayOff();
  }

  function resetForm() {
    setEditingId(null);
    setDateFrom("");
    setDateTo("");
    setSaveError("");
  }

  // Рядок із API → дата для календаря. бібліотека приймає Date.
  function toCalendarDate(value: string): Date | undefined {
    if (!value) return undefined;

    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, month - 1, day);
  }

  // Обрана дата → рядок для API. Date -> string for API.
  function toApiDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  return (
    <section className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-4 pb-4 sm:gap-x-8">
      <h2 className="flex min-h-11 items-center gap-2 text-sm font-medium text-copy-600 sm:text-base">
        <CirclePause size={16} strokeWidth={1.5} aria-hidden="true" />
        Відпустка
      </h2>

      <div className="min-w-0 space-y-4">
        {/* Показуємо всі періоди, збережені на бекенді. */}
        {daysOff.map((period) => (
          <div key={period.id} className="border-b border-border pb-2">
            <dl className="text-sm sm:text-base">
              <div className="flex min-h-11 items-center justify-between gap-2">
                <dt className="text-copy-600">Початок:</dt>
                <dd className="font-medium text-text">{period.dateFrom.slice(2).split("-").reverse().join(".")}</dd>
              </div>
              <div className="flex min-h-11 items-center justify-between gap-2">
                <dt className="text-copy-600">Кінець:</dt>
                <dd className="font-medium text-text">{period.dateTo.slice(2).split("-").reverse().join(".")}</dd>
              </div>
            </dl>
            <div className="flex flex-wrap justify-end gap-2">
              <button type="button" disabled={saving} onClick={() => handleEdit(period)}
                className="flex min-h-11 items-center gap-1 rounded-lg px-2 text-xs text-copy-600 hover:bg-panel-100 focus-visible:outline-2 disabled:opacity-40">
                <SquarePen size={14} aria-hidden="true" />Редагувати
              </button>
              <button type="button" disabled={saving} onClick={() => handleDelete(period.id)}
                className="flex min-h-11 items-center gap-1 rounded-lg px-2 text-xs text-copy-600 hover:bg-panel-100 focus-visible:outline-2 disabled:opacity-40">
                <Trash2 size={14} aria-hidden="true" />Видалити
              </button>
            </div>
          </div>
        ))}

        {/* Поля змінюють стан. Запит виконується лише після «Зберегти». */}
        <form onSubmit={(event) => { event.preventDefault(); handleSave(); }}>
          {daysOff.length > 0 && (
            <p className="mb-2 text-sm font-medium text-copy-600">
              {editingId === null ? "Додати відпустку" : "Редагування відпустки"}
            </p>
          )}
          <fieldset disabled={saving} className="m-0 min-w-0 border-0 p-0">
            <button type="button" onClick={() => setOpenedCalendar("from")}
              aria-haspopup="dialog" aria-expanded={openedCalendar === "from"}
              className="flex min-h-11 w-full items-center justify-between gap-2 rounded-lg text-sm focus-visible:outline-2 disabled:opacity-50 sm:text-base">
              <span className="text-copy-600">Початок:</span>
              <span className="flex items-center gap-2">
                <span className={dateFrom ? "text-text" : "text-copy-400"}>{dateFrom ? dateFrom.slice(2).split("-").reverse().join(".") : "Обрати дату"}</span>
                <ChevronDown size={14} className="shrink-0 text-copy-500" aria-hidden="true" />
              </span>
            </button>
            <button type="button" onClick={() => setOpenedCalendar("to")}
              aria-haspopup="dialog" aria-expanded={openedCalendar === "to"}
              className="flex min-h-11 w-full items-center justify-between gap-2 rounded-lg text-sm focus-visible:outline-2 disabled:opacity-50 sm:text-base">
              <span className="text-copy-600">Кінець:</span>
              <span className="flex items-center gap-2">
                <span className={dateTo ? "text-text" : "text-copy-400"}>{dateTo ? dateTo.slice(2).split("-").reverse().join(".") : "Обрати дату"}</span>
                <ChevronDown size={14} className="shrink-0 text-copy-500" aria-hidden="true" />
              </span>
            </button>
            <button type="submit" disabled={!dateFrom || !dateTo}
              className="mt-3 min-h-11 w-full rounded-xl bg-black px-4 py-2 text-sm text-white focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-40">
              {saving ? "Зберігаємо…" : "Зберегти"}
            </button>
            {(dateFrom || dateTo || editingId !== null) && (
              <button type="button" onClick={resetForm}
                className="mt-1 min-h-11 w-full rounded-lg text-sm text-copy-500 hover:bg-panel-100 focus-visible:outline-2 disabled:opacity-40">
                Скасувати зміни
              </button>
            )}
          </fieldset>
          {saveError && <p role="alert" className="mt-3 text-sm text-red-600">{saveError}</p>}
        </form>
      </div>
      {openedCalendar && (
        <dialog ref={calendarRef} aria-labelledby={calendarTitleId}
          onCancel={(event) => { event.preventDefault(); setOpenedCalendar(null); }}
          onClick={(event) => {
            if (event.target !== event.currentTarget) return;
            const rect = event.currentTarget.getBoundingClientRect();
            if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) setOpenedCalendar(null);
          }}
          className="fixed inset-0 m-auto max-h-[calc(100dvh-24px)] w-[calc(100%-24px)] max-w-sm overflow-y-auto overscroll-contain rounded-3xl border-0 bg-surface p-4 text-text shadow-xl backdrop:bg-black/40 sm:p-6">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h3 id={calendarTitleId} className="text-base font-semibold">{openedCalendar === "from" ? "Початок відпустки" : "Кінець відпустки"}</h3>
            <button type="button" onClick={() => setOpenedCalendar(null)} aria-label="Закрити календар"
              className="flex size-11 shrink-0 items-center justify-center rounded-full text-copy-500 hover:bg-panel-100 focus-visible:outline-2">
              <X size={20} aria-hidden="true" />
            </button>
          </div>
          <DayPicker
            className="slotik-vacation-calendar"
            mode="single"
            locale={uk}
            weekStartsOn={1}
            selected={toCalendarDate(openedCalendar === "from" ? dateFrom : dateTo)}
            defaultMonth={toCalendarDate(openedCalendar === "from" ? dateFrom || dateTo : dateTo || dateFrom)}
            disabled={openedCalendar === "to" && dateFrom ? { before: toCalendarDate(dateFrom)! } : undefined}
            onSelect={(date) => {
              if (!date) return;
              const value = toApiDate(date);
              if (openedCalendar === "from") {
                setDateFrom(value);
                // Після зміни початку не залишаємо кінець раніше нього.
                if (dateTo && dateTo < value) setDateTo("");
              } else {
                setDateTo(value);
              }
              setSaveError("");
              setOpenedCalendar(null);
            }}
          />
          <p className="mt-3 text-center text-xs text-copy-500">Оберіть дату в календарі</p>
        </dialog>
      )}
    </section>
  );
}

// {
//   masterId: 123,
//   daysOff: [
//     { id: 1, dateFrom: "2026-12-21", dateTo: "2027-01-05" }
//   ]
// }
