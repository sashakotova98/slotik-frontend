import { Link } from "react-router-dom";
import { CategoryIcon } from "../categories/CategoryIcon";
import type { HomeCategory } from "../../api/homeCategories";

type Props = {
  categories: HomeCategory[];
  cityId?: number | null;
  districtId?: number | null;
  selectedCategoryId?: number | null;
  onSelect?: (categoryId: number) => void;
};

export default function CategoryGrid({ categories, cityId, districtId, selectedCategoryId, onSelect }: Props) {
  return (
    <ul className="grid grid-cols-4 gap-x-2 gap-y-5 lg:gap-6">
      {categories.map((category) => {
        const selected = selectedCategoryId === category.id;
        const className = "group flex h-full w-full flex-col items-center gap-2 rounded-xl text-black focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black";
        const content = <>
          <span className={`flex h-14.5 w-14.5 items-center justify-center rounded-[17px] border border-border/11 transition-colors lg:h-20 lg:w-20 ${selected ? "bg-black" : "bg-[#f5f5f5] group-hover:bg-white"}`}>
            <CategoryIcon name={category.icon} className={`h-9 w-9 object-contain lg:h-12 lg:w-12 ${selected ? "invert" : ""}`} />
          </span>
          <span className="w-full wrap-anywhere text-center text-xs leading-snug lg:text-sm">{category.name}</span>
        </>;
        return (
          <li key={category.id} className="min-w-0">
            {/* У пошуку обираємо фільтр, на головній зберігаємо перехід до каталогу. */}
            {onSelect ? (
              <button type="button" aria-pressed={selected} onClick={() => onSelect(category.id)} className={className}>{content}</button>
            ) : (
              <Link to={`/catalog?categoryId=${category.id}${cityId != null ? `&cityId=${cityId}` : ""}${cityId != null && districtId != null ? `&districtId=${districtId}` : ""}`} className={className}>{content}</Link>
            )}
          </li>
        );
      })}
    </ul>
  );
}