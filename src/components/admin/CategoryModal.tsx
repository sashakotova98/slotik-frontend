import { useEffect, useRef, useState, type SyntheticEvent } from "react";
import { X } from "lucide-react";
import { createCategory, updateCategory, } from "../../api/categories";
import type { Category } from "../../api/categories";
import { CategoryIconPicker } from "./CategoryIconPicker";

type Props = {
  category?: Category,
  onClose: () => void;
  onSaved: () => Promise<void>;
}


export function CategoryModal({ category, onClose, onSaved, }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  const [name, setName] = useState(category?.name ?? "");
  const [icon, setIcon] = useState(category?.icon ?? "scissors");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  function handleClose() {
    dialogRef.current?.close();
    onClose();
  }

  function handleCancel(event: SyntheticEvent<HTMLDialogElement>) {
    event.preventDefault();
    if (!saving) {
      handleClose();
    }
  }

  async function handleSave() {
    if (saving) return;

    const value = name.trim();

    if (!value) {
      setError("Назва категорії не може бути порожньою");
      return;
    }

    setSaving(true);
    setError("");

    try {
      if (category) {
        await updateCategory(category.id, value, icon);
      } else {
        await createCategory(value, icon);
      }

      await onSaved();
      handleClose();
    } catch (err) {
      console.error(err);
      setError("Помилка при збереженні категорії");
    } finally {
      setSaving(false);
    }
  }


  return (
    <dialog
      ref={dialogRef}
      onCancel={handleCancel}
      aria-labelledby="category-modal-title"
      aria-busy={saving}
      className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-sm overflow-y-auto rounded-4xl border-0 bg-surface p-6 text-text shadow-xl backdrop:bg-black/40"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 id="category-modal-title" className="text-lg font-medium">
          {category ? "Редагувати категорію" : "Нова категорія"}
        </h2>

        <button
          type="button"
          onClick={handleClose}
          disabled={saving}
          aria-label="Закрити"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted hover:bg-selected disabled:opacity-50"
        >
          <X size={20} aria-hidden="true" />
        </button>
      </div>

      <form
        className="mt-3"
        onSubmit={(event) => {
          event.preventDefault();
          void handleSave();
        }}
      >
        <label
          htmlFor="category-name"
          className="mb-1 block text-sm text-muted"
        >
          Назва
        </label>

        <input
          id="category-name"
          name="categoryName"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Ламінування вій"
          autoFocus
          required
          disabled={saving}
          className="w-full rounded-field border border-border bg-bg px-3 py-2 text-sm text-text placeholder:text-muted disabled:opacity-50"
        />

        <div className="mt-4">
          <CategoryIconPicker
            value={icon}
            onChange={setIcon}
            disabled={saving}
          />
        </div>

        {error && (
          <p className="mt-3 text-sm text-danger" role="alert">
            {error}
          </p>
        )}

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={handleClose}
            disabled={saving}
            className="min-h-11 rounded-field border border-border px-3 py-2 text-sm text-muted hover:bg-selected disabled:opacity-50"
          >
            Скасувати
          </button>

          <button
            type="submit"
            disabled={saving || !name.trim()}
            className="min-h-11 rounded-field bg-accent px-3 py-2 text-sm text-on-accent disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Збереження…" : "Зберегти"}
          </button>
        </div>
      </form>
    </dialog>
  );
}