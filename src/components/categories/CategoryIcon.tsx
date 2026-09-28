import browsLashes from "../../assets/categories/brows-lashes.svg";
import cosmetology from "../../assets/categories/cosmetology.svg";
import depilation from "../../assets/categories/depilation.svg";
import hairColoring from "../../assets/categories/hair-coloring.svg";
import haircutStyling from "../../assets/categories/haircut-styling.svg";
import makeup from "../../assets/categories/makeup.svg";
import manicurePedicure from "../../assets/categories/manicure-pedicure.svg";
import massage from "../../assets/categories/massage.svg";
import { Brush, Paintbrush, Droplets, Flower2, Leaf, Gem, Sun, Smile, Shapes } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const icons: Record<string, string> = {
  // Ідентифікатори адміністратора - SVG з макета
  "scissors": haircutStyling,
  "sparkles": makeup,
  "eye": browsLashes,
  "hand-finger": manicurePedicure,
  "palette": hairColoring,
  "heart": massage,

  // для головної
  "brows-lashes": browsLashes,
  "cosmetology": cosmetology,
  "depilation": depilation,
  "hair-coloring": hairColoring,
  "haircut-styling": haircutStyling,
  "makeup": makeup,
  "manicure-pedicure": manicurePedicure,
  "massage": massage
};

const fallbackIcons: Record<string, LucideIcon> = {
  brush: Brush,
  paintbrush: Paintbrush,
  droplets: Droplets,
  flower: Flower2,
  leaf: Leaf,
  gem: Gem,
  sun: Sun,
  smile: Smile,
  shapes: Shapes,
};

type Props = {
  name: string;
  className?: string;
};

export function CategoryIcon({ name, className = "h-9 w-9" }: Props) {
  const src = icons[name];

  if (src) {
    return <img src={src} alt="" className={className} />;
  }

  const Icon = fallbackIcons[name] ?? Shapes;

  return <Icon aria-hidden="true" className={className} strokeWidth={1.25} />;
}
