import { SquarePen, EyeOff, Trash2 } from "lucide-react";

type Props = {
  onRename: () => void;
  onHide?: () => void; //undefined
  onDelete: () => void;
  disabled?: boolean; //отключить кнопки на время удаления. 
  deleteDisabled?: boolean; //олько удаление, например если у категории есть мастера.
};

export function CategoryActions({ onRename, onHide, onDelete, disabled = false, deleteDisabled = false, }: Props) {
  const buttonClasses =
    "flex min-h-14 w-full items-center gap-4 px-5 py-3 text-left text-sm transition-colors hover:bg-selected disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <div className="mt-3 border-t border-border">
      <button
        type="button"
        onClick={onRename}
        disabled={disabled}
        className={`${buttonClasses} text-text`}
      >
        <SquarePen size={20} strokeWidth={1.5} aria-hidden="true" />
        Перейменувати
      </button>

      <button
        type="button"
        onClick={onHide}
        disabled={disabled || !onHide}
        className={`${buttonClasses} border-t border-border text-text`}
      >
        <EyeOff size={20} strokeWidth={1.5} aria-hidden="true" />
        Приховати з каталогу
      </button>

      <button
        type="button"
        onClick={onDelete}
        disabled={disabled || deleteDisabled}
        className={`${buttonClasses} border-t border-border text-danger`}
      >
        <Trash2 size={20} strokeWidth={1.5} aria-hidden="true" />
        Видалити
      </button>
    </div>
  );
}