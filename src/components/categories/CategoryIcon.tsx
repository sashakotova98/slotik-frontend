import browsLashes from "../../assets/categories/brows-lashes.svg";
import cosmetology from "../../assets/categories/cosmetology.svg";
import depilation from "../../assets/categories/depilation.svg";
import hairColoring from "../../assets/categories/hair-coloring.svg";
import haircutStyling from "../../assets/categories/haircut-styling.svg";
import makeup from "../../assets/categories/makeup.svg";
import manicurePedicure from "../../assets/categories/manicure-pedicure.svg";
import massage from "../../assets/categories/massage.svg";
import { Shapes } from "lucide-react";

const icons: Record<string, string> = {
  "brows-lashes": browsLashes,
  "cosmetology": cosmetology,
  "depilation": depilation,
  "hair-coloring": hairColoring,
  "haircut-styling": haircutStyling,
  "makeup": makeup,
  "manicure-pedicure": manicurePedicure,
  "massage": massage
};

type Props = {
  name: string;
  className?: string;
};

export function CategoryIcon({ name, className = "h-9 w-9" }: Props) {
  const src = icons[name];

  if (!src) {
    return (
      <Shapes
        aria-hidden="true"
        className={className}
        strokeWidth={1.25}
      />
    );
  }

  return <img src={src} alt="" className={className} />;

}
