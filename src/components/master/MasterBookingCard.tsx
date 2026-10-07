import type {
  BookingStatus,
  MasterBooking,
} from "../../api/bookings";

type Props = {
  booking: MasterBooking;
  onChangeStatus: (
    id: number,
    status: BookingStatus,
  ) => Promise<void>;
};

const statusLabels: Record<BookingStatus, string> = {
  0: "Очікує підтвердження",
  1: "Підтверджено",
  2: "Завершено",
  3: "Скасовано",
};

const statusStyles: Record<BookingStatus, string> = {
  0: "bg-amber-100 text-amber-800",
  1: "bg-green-100 text-green-800",
  2: "bg-blue-100 text-blue-800",
  3: "bg-red-100 text-red-600",
};

import { useState } from "react";

export default function MasterBookingCard({
  booking,
  onChangeStatus,
}: Props) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const clientName =
    [booking.clientFirstName, booking.clientLastName]
      .filter(Boolean)
      .join(" ") || "Клієнт";

  const startsAt = new Date(booking.startsAt);
  const validDate = !Number.isNaN(startsAt.getTime());

  const dateLabel = validDate
    ? startsAt.toLocaleDateString("uk-UA", {
      weekday: "short",
      day: "numeric",
      month: "long",
      timeZone: "Europe/Kyiv",
    })
    : "Дата не вказана";

  const timeLabel = validDate
    ? startsAt.toLocaleTimeString("uk-UA", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Europe/Kyiv",
    })
    : "";

  const priceLabel = new Intl.NumberFormat("uk-UA", {
    style: "currency",
    currency: "UAH",
    maximumFractionDigits: 2,
  }).format(booking.price);

  async function handleStatusChange(status: BookingStatus) {
    if (saving) return;

    setSaving(true);
    setError("");

    try {
      await onChangeStatus(booking.id, status);
    } catch {
      setError("Не вдалося змінити статус. Спробуйте ще раз.");
    } finally {
      setSaving(false);
    }
  }

  const canCancel = booking.status === 0 || booking.status === 1;

  return (
    <article
      aria-busy={saving}
      className="rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-semibold">
          {dateLabel}
          {timeLabel && ` • ${timeLabel}`}
        </h3>

        <span
          className={`rounded-full px-3 py-1 text-xs ${statusStyles[booking.status]
            }`}
        >
          {statusLabels[booking.status]}
        </span>
      </div>

      <p className="mt-3 text-sm text-neutral-700">
        {clientName}
      </p>

      <p className="mt-1 text-sm text-neutral-500">
        {booking.serviceName} • {priceLabel} • {booking.durationMin} хв
      </p>

      {booking.clientPhone && (
        <a
          href={`tel:${booking.clientPhone}`}
          className="mt-2 inline-block text-sm text-blue-600"
        >
          {booking.clientPhone}
        </a>
      )}

      {(canCancel || booking.status === 1) && (
        <div className="mt-4 flex flex-wrap justify-end gap-2">
          {canCancel && (
            <button
              type="button"
              disabled={saving}
              onClick={() => void handleStatusChange(3)}
              className="min-h-10 rounded-full border border-red-400 px-4 text-sm text-red-500 disabled:opacity-50"
            >
              Скасувати
            </button>
          )}

          {booking.status === 0 && (
            <button
              type="button"
              disabled={saving}
              onClick={() => void handleStatusChange(1)}
              className="min-h-10 rounded-full bg-[#c9eac3] px-4 text-sm text-green-900 disabled:opacity-50"
            >
              Підтвердити
            </button>
          )}

          {booking.status === 1 && (
            <button
              type="button"
              disabled={saving}
              onClick={() => void handleStatusChange(2)}
              className="min-h-10 rounded-full bg-neutral-100 px-4 text-sm disabled:opacity-50"
            >
              Завершити
            </button>
          )}
        </div>
      )}

      {saving && (
        <p role="status" className="mt-2 text-sm text-neutral-500">
          Зберігаємо…
        </p>
      )}

      {error && (
        <p role="alert" className="mt-2 text-sm text-red-600">
          {error}
        </p>
      )}
    </article>
  );
}