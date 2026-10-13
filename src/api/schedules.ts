import { api } from "./api";

export type Weekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;

// Робочий інтервал. Час передаємо у форматі HH:mm:ss, наприклад "10:00:00".
// Перерва — це проміжок між двома робочими інтервалами.
export type ScheduleInterval = {
  startTime: string;
  endTime: string;
};

// Збережений інтервал має ID запису в базі.
export type SavedScheduleInterval = ScheduleInterval & {
  id: number;
};

// Один день у відповіді GET /api/Schedule/me.
export type ScheduleDay = {
  weekday: Weekday;
  isWorking: boolean;
  intervals: SavedScheduleInterval[];
};

// Розклад авторизованого майстра за весь тиждень.
export type WeeklySchedule = {
  masterId: number;
  slotStepMin: number;
  days: ScheduleDay[];
};

// Тіло PUT для одного дня. Для вихідного: isWorking: false, intervals: [].
// Для робочого дня потрібен хоча б один інтервал без перетинів з іншими.
export type UpdateScheduleDayData = {
  isWorking: boolean;
  intervals: ScheduleInterval[];
};

// PUT повертає збережений день та ID запису розкладу.
export type SavedScheduleDay = ScheduleDay & {
  id: number;
};

// Крок між можливими початками запису: від 5 до 240 хвилин, кратний 5.
// Це не тривалість послуги та не тривалість перерви.
export type UpdateSlotStepData = {
  slotStepMin: number;
};

export type UpdatedSlotStep = {
  id: number; // ID профілю майстра.
  slotStepMin: number;
};

// GET /api/Schedule/me — отримати тижневий графік.
// Бекенд визначає майстра за токеном, тому masterId передавати не потрібно.
export async function getOwnSchedule(): Promise<WeeklySchedule> {
  return api<WeeklySchedule>("/Schedule/me");
}

// PUT /api/Schedule/me/day/{weekday} — створити або оновити графік одного дня.
// Усі попередні інтервали цього дня замінюються переданими.
export async function saveScheduleDay(weekday: Weekday, data: UpdateScheduleDayData): Promise<SavedScheduleDay> {
  return api<SavedScheduleDay>(`/Schedule/me/day/${weekday}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

// PUT /api/Schedule/me/slot-step — змінити крок запису майстра.
export async function saveScheduleSlotStep(data: UpdateSlotStepData): Promise<UpdatedSlotStep> {
  return api<UpdatedSlotStep>("/Schedule/me/slot-step", {
    method: "PUT",
    body: JSON.stringify(data),
  });
}
