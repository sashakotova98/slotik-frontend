import { Link } from "react-router-dom";
import { CategoryIcon } from "../categories/CategoryIcon";
import type { HomeCategory } from "../../api/homeCategories";

type Props = {
  categories: HomeCategory[];
  cityId?: number | null;
  districtId?: number | null;
};

export default function CategoryGrid({ categories, cityId, districtId }: Props) {
  return (
    <ul className="grid grid-cols-4 gap-x-2 gap-y-5 lg:gap-6">
      {categories.map((category) => (
        <li key={category.id} className="min-w-0">
          <Link
            to={`/catalog?categoryId=${category.id}${cityId != null ? `&cityId=${cityId}` : ""}${cityId != null && districtId != null ? `&districtId=${districtId}` : ""}`}
            className="group flex h-full flex-col items-center gap-2 rounded-xl text-black focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black"
          >
            <span className="flex h-14.5 w-14.5 items-center justify-center rounded-[17px] border border-border/11 bg-[#f5f5f5] transition-colors group-hover:bg-white lg:h-20 lg:w-20">
              <CategoryIcon name={category.icon} className="h-9 w-9 object-contain lg:h-12 lg:w-12" />
            </span>

            <span className="w-full wrap-anywhere text-center text-xs leading-snug lg:text-sm">
              {category.name}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}


