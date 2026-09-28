import { useId, useState } from "react";
import { Plus, Minus } from "lucide-react";
import { categoryIconOptions } from "./categoryIcons";

type Props = {
  value: string; //код выбранной иконки, например "scissors"
  onChange: (value: string) => void; //функция для сообщения о новом выборе
  disabled?: boolean; //отключить выбор иконки, например при сохранении категории
};

export function CategoryIconPicker({ value, onChange, disabled = false, }: Props) {
  const groupId = useId(); //создаёт уникальный идентификатор для группы переключателей
  const [expanded, setExpanded] = useState(false); //Раскрыт ли список

  const visibleOptions = expanded
    ? categoryIconOptions
    : categoryIconOptions.filter(
      (option, index) => index < 4 || option.value === value
    );

  return (
    <fieldset disabled={disabled}>
      <legend className="mb-2 text-sm text-muted">
        Іконка
      </legend>

      <div className="flex flex-wrap gap-2">
        {visibleOptions.map(({ value: optionValue, label, Icon }) => (
          <label
            key={optionValue}
            title={label}
            className={disabled ? "cursor-not-allowed" : "cursor-pointer"}
          >
            <input
              type="radio"
              name={groupId}
              value={optionValue}
              checked={value === optionValue}
              onChange={() => onChange(optionValue)}
              className="peer sr-only"
            />

            <span className="flex h-11 w-11 items-center justify-center rounded-field border border-border text-muted transition-colors peer-checked:border-text peer-checked:bg-selected peer-checked:text-text peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-text peer-disabled:opacity-50">
              <Icon
                size={22}
                strokeWidth={1.25}
                aria-hidden="true"
              />

              <span className="sr-only">{label}</span>
            </span>
          </label>
        ))}

        <button
          type="button"
          onClick={() => setExpanded((previous) => !previous)}
          aria-expanded={expanded}
          aria-label={expanded ? "Згорнути іконки" : "Більше іконок"}
          title={expanded ? "Згорнути іконки" : "Більше іконок"}
          className="flex h-11 w-11 items-center justify-center rounded-field border border-border text-muted hover:bg-selected hover:text-text disabled:cursor-not-allowed disabled:opacity-50"
        >
          {expanded ? (
            <Minus size={22} aria-hidden="true" />
          ) : (
            <Plus size={22} aria-hidden="true" />
          )}
        </button>
      </div>
    </fieldset>
  );
}