import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import type { District } from "../../api/cities";

type Props = {
  districts: District[];
  districtId: number | null;
  disabled?: boolean;
  onChange: (districtId: number | null) => void;
};

export default function DistrictPicker({ districts, districtId, disabled = false, onChange }: Props) {
  const listId = useId();
  const [districtOpen, setDistrictOpen] = useState(false);
  const districtPickerRef = useRef<HTMLDivElement>(null);
  const districtButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!districtOpen) return;
    function closeOutside(event: PointerEvent) {
      if (event.target instanceof Node && !districtPickerRef.current?.contains(event.target)) {
        setDistrictOpen(false);
      }
    }
    document.addEventListener("pointerdown", closeOutside);
    return () => document.removeEventListener("pointerdown", closeOutside);
  }, [districtOpen]);

  return (
    <div
      ref={districtPickerRef}
      className="relative min-w-0 max-w-full"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setDistrictOpen(false);
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          setDistrictOpen(false);
          districtButtonRef.current?.focus();
        }
      }}
    >
      <button
        ref={districtButtonRef}
        type="button"
        aria-label="Оберіть район"
        aria-expanded={districtOpen}
        aria-controls={listId}
        disabled={disabled || districts.length === 0}
        onClick={() => { setDistrictOpen((open) => !open); }}
        className="flex min-h-11 max-w-full items-center gap-3 rounded-full border border-neutral-200 bg-neutral-50 px-4 py-2 text-sm text-neutral-700 outline-none transition-colors hover:bg-neutral-100 focus-visible:ring-2 focus-visible:ring-blue-400 disabled:opacity-50 sm:text-base"
      >
        <span className="truncate">{disabled ? "Спочатку оберіть місто" : districtId !== null ? districts.find((district) => district.id === districtId)?.name ?? "Район недоступний" : districts.length === 0 ? "Районів немає" : "Усі райони"}</span>
        <ChevronDown aria-hidden="true" className={`size-4 shrink-0 text-neutral-500 transition-transform duration-200 motion-reduce:transition-none ${districtOpen ? "rotate-180" : ""}`} />
      </button>
      <div
        id={listId}
        aria-hidden={!districtOpen}
        inert={!districtOpen}
        className={`absolute right-0 top-full z-40 mt-2 w-56 max-w-[calc(100vw-32px)] sm:left-0 sm:right-auto origin-top rounded-2xl border border-neutral-100 bg-white p-2 shadow-xl transition-[opacity,transform,visibility] duration-200 ease-out motion-reduce:transition-none ${districtOpen ? "visible translate-y-0 scale-100 opacity-100" : "invisible -translate-y-1 scale-95 opacity-0"}`}
      >
        <p className="px-3 pb-2 pt-1 text-xs font-medium text-neutral-500">Оберіть район</p>
        <ul aria-label="Райони" className="max-h-60 space-y-1 overflow-x-hidden overflow-y-auto overscroll-contain">
          {[{ id: "", name: "Усі райони" }, ...districts.map((district) => ({ id: String(district.id), name: district.name }))].map((district) => (
            <li key={district.id}>
              <button
                type="button"
                aria-pressed={district.id === (districtId === null ? "" : String(districtId))}
                onClick={() => {
                  onChange(district.id === "" ? null : Number(district.id));
                  setDistrictOpen(false);
                  districtButtonRef.current?.focus();
                }}
                className={`flex min-h-11 w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-400 ${district.id === (districtId === null ? "" : String(districtId)) ? "bg-blue-50 font-semibold text-blue-700" : "text-neutral-700 hover:bg-neutral-100"}`}
              >
                <span className="min-w-0 flex-1 wrap-anywhere leading-snug">{district.name}</span>
                {district.id === (districtId === null ? "" : String(districtId)) && <Check aria-hidden="true" className="size-4 shrink-0" />}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

