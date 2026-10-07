//GET /api/Booking/master/me

import { api } from "./api";

export type BookingStatus = 0 | 1 | 2 | 3;

export type MasterBooking = {
  id: number;
  startsAt: string;
  endsAt: string;
  status: BookingStatus;
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

export function changeBookingStatus(
  id: number,
  status: BookingStatus,
) {
  return api<{ id: number; status: BookingStatus }>(
    `/Booking/master/${id}/status`,
    {
      method: "PATCH",
      body: JSON.stringify({ status }),
    },
  );
}

// 0 — ожидает подтверждения;
// 1 — подтверждена;
// 2 — завершена;
// 3 — отменена.