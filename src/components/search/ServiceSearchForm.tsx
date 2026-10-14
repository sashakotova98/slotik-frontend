import type { FormEvent } from "react";
import { Search } from "lucide-react";

type Props = {
  defaultValue?: string;
  onSearch: (query: string) => void;
  onClear?: () => void;
  className?: string;
};

export default function ServiceSearchForm({ defaultValue = "", onSearch, onClear, className = "" }: Props) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    onSearch(String(data.get("search") ?? "").trim());
  }

  return (
    <form onSubmit={handleSubmit} role="search" className={`relative min-w-0 w-full ${className}`}>
      <button
        type="submit"
        aria-label="Знайти послугу, категорію або майстра"
        className="absolute left-1 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full text-black focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        <Search aria-hidden="true" className="size-5" />
      </button>
      <input
        key={defaultValue}
        name="search"
        type="search"
        defaultValue={defaultValue}
        onChange={(event) => {
          if (event.target.value === "") {
            onClear?.();
          }
        }}
        aria-label="Пошук послуги, категорії або майстра"
        placeholder="Послуга, категорія або майстер..."
        className="block h-14 min-w-0 w-full rounded-full bg-white pl-12 pr-5 text-sm text-black placeholder:text-border shadow-[0_5px_8px_rgba(0,0,0,0.2)] outline-none focus-visible:ring-2 focus-visible:ring-black lg:h-16 lg:text-base"
      />
    </form>
  );
}
