import { Bell } from "lucide-react";
import type { ClientBooking } from "../../api/bookings";
import type { PublicMasterProfile } from "../../api/masters";

type Props = {
  booking: ClientBooking;
  master?: PublicMasterProfile;
  title?: string;
};

export default function BookingSummaryCard({ booking, master, title }: Props) {
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

  const confirmed = booking.status === 1;

  return (
    <article className="min-w-0 rounded-3xl border border-border bg-surface p-4 shadow-[0_4px_16px_rgba(0,0,0,0.08)] sm:p-5">
      {title && (
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-normal text-copy-400">{title}</h2>
          <Bell aria-hidden="true" className="size-5 shrink-0 text-copy-400" />
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

        <span
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${confirmed ? "bg-[#ccebc7] text-[#5c8e53]" : "bg-amber-100 text-amber-800"
            }`}
        >
          {confirmed ? "Підтверджено" : "Очікує підтвердження"}
        </span>
      </div>
    </article>
  );
}
