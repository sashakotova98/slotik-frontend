//GET /api/Booking/master/me

import { api } from "./api";

export type BookingStatus =
  | 0 // Очікує підтвердження — Pending
  | 1 // Підтверджено — Confirmed
  | 2 // Завершено — Completed
  | 3; // Скасовано — Cancelled

export type MasterBooking = {
  id: number;
  startsAt: string;
  endsAt: string;
  status: BookingStatus;
  // Строк підтвердження Pending. Для старих записів може бути null.
  pendingExpiresAt: string | null;
  serviceId: number;
  serviceName: string;
  durationMin: number;
  price: number;
  clientFirstName: string;
  clientLastName: string;
  clientPhone: string | null;
  clientEmail: string | null;
};

export function getMasterBookings() {
  return api<MasterBooking[]>("/Booking/master/me");
}

export function changeBookingStatus(id: number, status: BookingStatus) {
  return api<{ id: number; status: BookingStatus }>(`/Booking/master/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export type ClientBookingReview = {
  id: number;
  rating: number;
  text: string;
};

export type ClientBooking = {
  id: number;
  startsAt: string;
  endsAt: string;
  status: BookingStatus;
  comment: string | null;
  reminderSent: boolean;
  pendingExpiresAt: string | null;
  serviceId: number;
  serviceName: string;
  durationMin: number;
  price: number;
  masterId: number;
  review: ClientBookingReview | null;
};

export function getClientBookings() {
  return api<ClientBooking[]>("/Booking/me");
}

// Один доступный промежуток времени.
export type AvailableSlot = {
  startsAt: string;
  endsAt: string;
};

// Полный ответ сервера.
export type AvailableSlotsResponse = {
  masterId: number;
  serviceId: number;
  date: string;
  durationMin: number;
  slotStepMin: number;
  slots: AvailableSlot[];
};

export function getAvailableSlots(masterId: number, serviceId: number, date: string): Promise<AvailableSlotsResponse> {
  const params = new URLSearchParams({
    masterId: String(masterId),
    serviceId: String(serviceId),
    date,
  });

  //getAvailableSlots(900032, 920034, "2026-10-15"); збирає данні
  return api<AvailableSlotsResponse>(`/Booking/available-slots?${params.toString()}`);
}

type CreateBookingData = {
  serviceId: number;
  startsAt: string;
  comment?: string;
};

type CreateBookingResponse = {
  id: number;
};

export function createBooking(data: CreateBookingData) {
  return api<CreateBookingResponse>("/Booking", {
    method: "POST",
    body: JSON.stringify(data),
  });
}
// Скасування власного запису клієнтом.
export function cancelClientBooking(id: number) {
  return api<{ id: number; status: BookingStatus }>(`/Booking/me/${id}/cancel`, {
    method: "PATCH",
  });
}
