import type { AvailableSlot } from "../../api/bookings";

type Props = {
  slots: AvailableSlot[];
  selectedSlot: AvailableSlot | null;
  onSelect: (slot: AvailableSlot) => void;
};

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString("uk-UA", {
    timeZone: "Europe/Kyiv",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
}

function getHour(value: string) {
  return Number(
    new Intl.DateTimeFormat("uk-UA", {
      timeZone: "Europe/Kyiv",
      hour: "2-digit",
      hourCycle: "h23",
    }).format(new Date(value)),
  );
}

export default function BookingTimeSlots({ slots, selectedSlot, onSelect }: Props) {
  const sortedSlots = [...slots].sort((first, second) => new Date(first.startsAt).getTime() - new Date(second.startsAt).getTime());

  const groups = [
    {
      title: "Ранок",
      slots: sortedSlots.filter((slot) => getHour(slot.startsAt) < 12),
    },
    {
      title: "День",
      slots: sortedSlots.filter((slot) => {
        const hour = getHour(slot.startsAt);
        return hour >= 12 && hour < 16;
      }),
    },
    {
      title: "Вечір",
      slots: sortedSlots.filter((slot) => getHour(slot.startsAt) >= 16),
    },
  ];

  if (slots.length === 0) {
    return <p className="mt-6 text-sm text-neutral-500">На цей день немає вільного часу.</p>;
  }

  return (
    <div className="mt-8 space-y-7">
      {groups.map((group) => {
        if (group.slots.length === 0) return null;

        return (
          <section key={group.title} aria-label={group.title}>
            <h3 className="text-base text-neutral-400">{group.title}</h3>

            <div className="mt-3 grid grid-cols-3 gap-3">
              {group.slots.map((slot) => {
                const isSelected = selectedSlot?.startsAt === slot.startsAt;

                return (
                  <button
                    key={slot.startsAt}
                    type="button"
                    onClick={() => onSelect(slot)}
                    aria-pressed={isSelected}
                    className={`min-h-12 min-w-0 rounded-2xl border px-2 py-3 text-base transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ${isSelected ? "border-black bg-black text-white" : "border-neutral-300 bg-white text-black hover:bg-neutral-100"
                      }`}
                  >
                    {formatTime(slot.startsAt)}
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
