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