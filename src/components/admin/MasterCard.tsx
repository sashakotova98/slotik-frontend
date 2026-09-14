import { ChevronRight } from "lucide-react";
import type { Master } from "../../api/masters";

type Props = {
  master: Master;
  onOpen?: () => void;
};

const tariffLabels: Record<Master["tariff"], string> = {
  free: "БЕЗК",
  basic: "БАЗ",
  pro: "ПРО",
};

const tariffStyles: Record<Master["tariff"], string> = {
  free: "bg-[#e8e8e8] text-[#666666]",
  basic: "bg-[#e0ecff] text-[#355b91]",
  pro: "bg-[#fffbd0] text-[#998a19]",
};

export function MasterCard({ master, onOpen }: Props) {
  const initials =
    `${master.firstName.charAt(0)}${master.lastName.charAt(0)}`.toUpperCase();

  const expiresAt = master.subscriptionUntil
    ? new Date(master.subscriptionUntil)
    : null;

  const hasValidDate =
    expiresAt !== null && !Number.isNaN(expiresAt.getTime());

  const expirationDate = hasValidDate
    ? expiresAt.toLocaleDateString("uk-UA", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    })
    : null;

  const expiredDays =
    master.status === "expired" &&
      hasValidDate &&
      expiresAt.getTime() < Date.now()
      ? Math.max(
        1,
        Math.ceil(
          (Date.now() - expiresAt.getTime()) / (1000 * 60 * 60 * 24)
        )
      )
      : null;

  return (
    <article className="relative min-h-28 rounded-2xl bg-surface px-3 py-4 text-left shadow-[0_5px_14px_rgba(0,0,0,0.20)]">
      <span
        className={`absolute -top-2 right-0 rounded-full px-3 py-1 text-sm ${master.status === "expired"
          ? "bg-[#ffd5dd] text-[#a71930]"
          : tariffStyles[master.tariff]
          }`}
      >
        {master.status === "expired"
          ? expiredDays !== null
            ? `${expiredDays} Д`
            : "Прострочено"
          : tariffLabels[master.tariff]}
      </span>

      <div className="flex items-center gap-3">
        <div
          aria-hidden="true"
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-selected text-xl font-medium text-muted"
        >
          {initials}
        </div>

        <div className="min-w-0 flex-1 pt-2">
          <h3 className="wrap-break-word text-xs font-semibold text-text">
            {master.firstName} {master.lastName}
          </h3>

          <p className="mt-1 inline-block max-w-full rounded-full bg-selected px-2 py-0.5 text-[11px] leading-tight text-text">
            {master.category}
          </p>

          <p className="mt-1 text-[11px] text-muted">
            м. {master.city}
          </p>
        </div>
      </div>

      {expirationDate && master.status === "active" && (
        <span
          className={`absolute -bottom-2 rounded-full bg-surface px-3 py-0.5 text-[11px] text-muted shadow-[0_3px_8px_rgba(0,0,0,0.20)] ${onOpen ? "right-12" : "right-3"
            }`}
        >
          до {expirationDate}
        </span>
      )}

      {onOpen && (
        <button
          type="button"
          onClick={onOpen}
          aria-label={`Відкрити подробиці: ${master.firstName} ${master.lastName}`}
          className="absolute -bottom-3 right-0 flex h-10 w-10 items-center justify-center rounded-full bg-[#999999] text-white shadow-md transition-colors hover:bg-[#777777] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text"
        >
          <ChevronRight size={25} strokeWidth={1.5} aria-hidden="true" />
        </button>
      )}
    </article>
  );
}