import { NavLink } from "react-router-dom";
import { House, Clock3, CalendarDays, UserRound } from "lucide-react";

const items = [
  { to: "/cabinet", label: "Головна", icon: House, end: true },
  { to: "/cabinet/schedule", label: "Робочий графік", icon: Clock3, end: false },
  { to: "/cabinet/calendar", label: "Календар", icon: CalendarDays, end: false },
  { to: "/cabinet/account", label: "Акаунт", icon: UserRound, end: false },
];

export default function MasterBottomNav() {
  return (
    <nav aria-label="Навігація кабінету майстра" className="fixed inset-x-0 bottom-0 z-40 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
      <div className="mx-auto flex max-w-100 rounded-full border border-neutral-100 bg-white p-1 shadow-[0_3px_10px_rgba(0,0,0,0.18)]">
        {items.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} aria-label={label} title={label}
            className={({ isActive }) => `flex min-h-12 flex-1 items-center justify-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ${isActive ? "bg-neutral-100 text-black" : "text-neutral-400 hover:bg-neutral-50 hover:text-black"}`}>
            <Icon size={25} strokeWidth={1.8} aria-hidden="true" />
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
