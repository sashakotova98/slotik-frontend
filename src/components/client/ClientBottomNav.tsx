import { NavLink } from "react-router-dom";
import { House, Search, CalendarDays, UserRound } from "lucide-react";

const items = [
  {
    to: "/client",
    label: "Головна",
    icon: House,
    end: true,
  },
  {
    to: "/client/search",
    label: "Пошук",
    icon: Search,
    end: false,
  },
  {
    to: "/client/bookings",
    label: "Мої записи",
    icon: CalendarDays,
    end: false,
  },
  {
    to: "/client/account",
    label: "Профіль",
    icon: UserRound,
    end: false,
  },
];

export default function ClientBottomNav() {
  return (
    <nav
      aria-label="Навігація клієнта"
      className="fixed inset-x-0 bottom-0 z-40 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))]"
    >
      <div className="mx-auto grid w-full max-w-md grid-cols-4 gap-1 rounded-full border border-border bg-surface p-1.5 shadow-[0_4px_16px_rgba(0,0,0,0.14)]">
        {items.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              aria-label={item.label}
              title={item.label}
              className={({ isActive }) => {
                return [
                  "flex min-h-12 min-w-0 items-center justify-center rounded-full",
                  "transition-colors focus-visible:outline-2",
                  "focus-visible:outline-offset-2 focus-visible:outline-text",
                  isActive
                    ? "bg-panel-100 text-text"
                    : "text-muted hover:bg-panel-50 hover:text-text",
                ].join(" ");
              }}
            >
              <Icon size={24} strokeWidth={1.75} aria-hidden="true" />
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}