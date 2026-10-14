import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown, MapPin } from "lucide-react";
import type { City } from "../../api/cities";

type Props = {
  cities: City[];
  cityId: number | null;
  loading?: boolean;
  error?: string;
  onChange: (cityId: number) => void;
};

export default function CityPicker({ cities, cityId, loading = false, error = "", onChange }: Props) {
  const [cityOpen, setCityOpen] = useState(false);
  const cityPickerRef = useRef<HTMLDivElement>(null); // Дозволяє перевірити, що користувач натиснув всередині списку або зовні.
  const cityButtonRef = useRef<HTMLButtonElement>(null);
  const listId = useId();
  const selectedCity = cities.find((city) => city.id === cityId);

  useEffect(() => {
    if (!cityOpen || loading || error || cities.length === 0) return;
    function closeOutside(event: PointerEvent) {
      if (event.target instanceof Node && !cityPickerRef.current?.contains(event.target)) {
        setCityOpen(false);
      }
    }
    document.addEventListener("pointerdown", closeOutside);
    return () => document.removeEventListener("pointerdown", closeOutside);
  }, [cityOpen, loading, error, cities.length]);

  if (loading) {
    return <p role="status" className="py-2 text-sm text-muted">Завантаження міст…</p>;
  }

  if (error) {
    return <p role="alert" className="py-2 text-sm text-danger">{error}</p>;
  }

  if (cities.length === 0) {
    return <p className="py-2 text-sm text-muted">Міст поки немає.</p>;
  }

  return (
    <div className="flex min-w-0 items-center gap-2">
      <MapPin aria-hidden="true" className="size-7 shrink-0 fill-red-400 stroke-black" />
      <div
        ref={cityPickerRef}
        className="relative min-w-0"
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setCityOpen(false);
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setCityOpen(false);
            cityButtonRef.current?.focus();
          }
        }}
      >
        <button
          ref={cityButtonRef}
          type="button"
          aria-label={`Оберіть місто: ${selectedCity?.name ?? "не обрано"}`}
          aria-expanded={cityOpen}
          aria-controls={listId}
          disabled={cities.length === 0}
          onClick={() => {
            setCityOpen((open) => !open);
          }}
          className="flex min-h-11 max-w-60 items-center gap-3 rounded-xl border-0 bg-transparent px-2 py-1 text-2xl outline-none transition-colors hover:bg-neutral-100 focus-visible:ring-2 focus-visible:ring-blue-400 disabled:opacity-50 sm:text-3xl"
        >
          <span className="truncate">
            {selectedCity?.name ?? "Оберіть місто"}
          </span>
          <ChevronDown
            aria-hidden="true"
            className={`size-4 shrink-0 text-neutral-500 transition-transform ${cityOpen ? "rotate-180" : ""}`}
          />
        </button>
        {cityOpen && (
          <div
            id={listId}
            className="absolute left-0 top-full z-40 mt-2 w-56 max-w-[calc(100vw-80px)] rounded-2xl border border-neutral-100 bg-white p-2 shadow-xl"
          >
            <p className="px-3 pb-2 pt-1 text-xs font-medium text-neutral-500">Оберіть місто</p>
            <ul aria-label="Міста" className="max-h-60 space-y-1 overflow-x-hidden overflow-y-auto overscroll-contain">
              {cities.map((city) => (
                <li key={city.id}>
                  <button
                    type="button"
                    aria-pressed={city.id === cityId}
                    onClick={() => {
                      onChange(city.id);
                      setCityOpen(false);
                      cityButtonRef.current?.focus();
                    }}
                    className={`flex min-h-11 w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-400 ${city.id === cityId ? "bg-blue-50 font-semibold text-blue-700" : "text-neutral-700 hover:bg-neutral-100"}`}
                  >
                    <span className="min-w-0 flex-1 wrap-anywhere leading-snug">{city.name}</span>
                    {city.id === cityId && <Check aria-hidden="true" className="size-4 shrink-0" />}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}


