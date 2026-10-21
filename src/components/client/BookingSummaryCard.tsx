import { MoreVertical } from "lucide-react";
import type { ClientBooking } from "../../api/bookings";
import type { PublicMasterProfile } from "../../api/masters";

type Props = {
  booking: ClientBooking;
  master?: PublicMasterProfile;
  title?: string;
  onDetails?: () => void;
  onReview?: () => void;
};

export default function BookingSummaryCard({ booking, master, title, onDetails, onReview }: Props) {
  const date = new Date(booking.startsAt).toLocaleDateString("uk-UA", {
    timeZone: "Europe/Kyiv",
    weekday: "short",
    day: "numeric",
    month: "long",
  });

  const time = new Date(booking.startsAt).toLocaleTimeString("uk-UA", {
    timeZone: "Europe/Kyiv",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });

  const masterName = master ? [master.firstName, master.lastName].filter(Boolean).join(" ") : "Майстер";

  const status = [
    { label: "Очікує підтвердження", color: "bg-amber-100 text-amber-800" },
    { label: "Підтверджено", color: "bg-[#ccebc7] text-green-800" },
    { label: "Завершено", color: "bg-orange-200 text-orange-900" },
    { label: "Скасовано", color: "bg-red-100 text-red-800" },
  ][booking.status];

  return (
    <article className="min-w-0 rounded-3xl border border-border bg-surface p-4 shadow-[0_4px_16px_rgba(0,0,0,0.08)] sm:p-5">
      {(title || onDetails) && (
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-normal text-copy-400">{title}</h2>
          {onDetails && (
            <button type="button" onClick={onDetails} aria-label="Деталі запису" className="-my-2 -mr-2 flex size-11 items-center justify-center rounded-full text-muted hover:bg-panel-100 focus-visible:outline-2">
              <MoreVertical aria-hidden="true" size={20} />
            </button>
          )}
        </div>
      )}

      <p className={`${title ? "mt-2" : ""} text-lg font-semibold`}>
        {date} • {time}
      </p>

      <div className="mt-2 flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="min-w-0 flex-1 wrap-anywhere text-sm leading-relaxed text-copy-600">
          {masterName} • {booking.serviceName}
          {booking.price != null && (
            <>
              {" • "}
              <span className="whitespace-nowrap">{booking.price.toLocaleString("uk-UA")} ₴</span>
            </>
          )}
        </p>

        {booking.status === 2 && booking.review ? (
          <span className="shrink-0 rounded-full bg-orange-200 px-3 py-1 text-xs text-orange-900">
            Відгук залишено · {booking.review.rating}/5
          </span>
        ) : booking.status === 2 && onReview ? (
          <button type="button" onClick={onReview} className="min-h-11 shrink-0 rounded-full bg-orange-200 px-3 text-xs font-medium text-orange-900 focus-visible:outline-2">
            Залишити відгук
          </button>
        ) : (
          <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${status.color}`}>
            {status.label}
          </span>
        )}
      </div>
    </article>
  );
}
