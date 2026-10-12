import { api } from "./api";

// Окремий вихідний або період відпустки.
export type DayOff = {
  id: number;
  dateFrom: string;
  dateTo: string;
};

// Вихідні авторизованого майстра.
export type OwnDaysOffResponse = {
  masterId: number;
  daysOff: DayOff[];
};

// GET /api/DaysOff/me — отримати власні вихідні та відпустки.
export function getOwnDaysOff(): Promise<OwnDaysOffResponse> {
  return api<OwnDaysOffResponse>("/DaysOff/me");
}

// Дані для створення або редагування відпустки.
export type SaveDayOffRequest = {
  dateFrom: string;
  dateTo: string;
};

// POST повертає створений період і masterId.
export function createDayOff(data: SaveDayOffRequest): Promise<DayOff & { masterId: number }> {
  return api("/DaysOff/me", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// PUT повертає 204 — без тіла відповіді.
export function updateDayOff(id: number, data: SaveDayOffRequest): Promise<void> {
  return api(`/DaysOff/me/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

// DELETE також повертає 204.
export function deleteDayOff(id: number): Promise<void> {
  return api(`/DaysOff/me/${id}`, {
    method: "DELETE",
  });
}
