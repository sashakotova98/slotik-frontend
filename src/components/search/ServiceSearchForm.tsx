import type { FormEvent } from "react";
import { Search } from "lucide-react";

type Props = {
  defaultValue?: string;
  onSearch: (query: string) => void;
  onClear?: () => void;
  className?: string;
  onOpenCategories?: () => void;
  categoriesOpen?: boolean;
  categoriesId?: string;
  autoComplete?: "on" | "off";
};

export default function ServiceSearchForm({ defaultValue = "", onSearch, onClear, className = "", onOpenCategories, categoriesOpen, categoriesId, autoComplete }: Props) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    onSearch(String(data.get("search") ?? "").trim());
  }

  return (
    <form autoComplete={autoComplete} onSubmit={handleSubmit} role="search" className={`relative min-w-0 w-full ${className}`}>
      <button
        type="submit"
        aria-label="Знайти послугу, категорію або майстра"
        className="absolute left-1 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full text-text focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        <Search aria-hidden="true" className="size-5" />
      </button>
      <input
        key={defaultValue}
        name="search"
        autoComplete={autoComplete}
        type="search"
        onFocus={onOpenCategories}
        onClick={onOpenCategories}
        aria-expanded={categoriesOpen}
        aria-controls={categoriesId}
        defaultValue={defaultValue}
        onChange={(event) => {
          if (event.target.value === "") {
            onClear?.();
          }
        }}
        aria-label="Пошук послуги, категорії або майстра"
        placeholder="Послуга, категорія або майстер..."
        className="block h-14 min-w-0 w-full rounded-full bg-surface pl-12 pr-5 text-sm text-text placeholder:text-copy-500 shadow-[0_5px_8px_rgba(0,0,0,0.2)] outline-none focus-visible:ring-2 focus-visible:ring-text lg:h-16 lg:text-base"
      />
    </form>
  );
}
