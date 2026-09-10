import {
  Scissors,
  Sparkles,
  Eye,
  Hand,
  Brush,
  Paintbrush,
  Palette,
  Droplets,
  Flower2,
  Leaf,
  Heart,
  Gem,
  Sun,
  Smile,
  Shapes,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type CategoryIconOption = {
  value: string;
  label: string;
  Icon: LucideIcon;
};

export const categoryIconOptions: CategoryIconOption[] = [
  { value: "scissors", label: "Зачіски та стрижки", Icon: Scissors },
  { value: "sparkles", label: "Візаж", Icon: Sparkles },
  { value: "eye", label: "Брови та вії", Icon: Eye },
  { value: "hand-finger", label: "Манікюр та догляд за руками", Icon: Hand },

  { value: "brush", label: "Укладання волосся", Icon: Brush },
  { value: "paintbrush", label: "Дизайн нігтів", Icon: Paintbrush },
  { value: "palette", label: "Фарбування та колористика", Icon: Palette },
  { value: "droplets", label: "Догляд за шкірою", Icon: Droplets },
  { value: "flower", label: "Спа та релакс", Icon: Flower2 },
  { value: "leaf", label: "Натуральний догляд", Icon: Leaf },
  { value: "heart", label: "Масаж та догляд за тілом", Icon: Heart },
  { value: "gem", label: "Прикраси та пірсинг", Icon: Gem },
  { value: "sun", label: "Засмага", Icon: Sun },
  { value: "smile", label: "Догляд за обличчям", Icon: Smile },
  { value: "shapes", label: "Інше", Icon: Shapes },
];

export const categoryIcons: Record<string, LucideIcon> =
  Object.fromEntries(
    categoryIconOptions.map(({ value, Icon }) => [value, Icon])
  );