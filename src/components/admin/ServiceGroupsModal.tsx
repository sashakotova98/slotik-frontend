import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { ApiError } from "../../api/api";
import type { Category } from "../../api/categories";
import { createServiceGroup, getServiceGroups, type ServiceGroup } from "../../api/serviceGroups";

type Props = {
  category: Category;
  onClose: () => void;
};

function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.message === "Group already exists in this category") {
      return "Група з такою назвою вже існує в цій категорії.";
    }

    if (error.message === "Group name is required") {
      return "Введіть назву групи.";
    }

    if (error.status === 404) {
      return "Категорію не знайдено. Закрийте вікно й оновіть сторінку.";
    }

    if (error.status === 401 || error.status === 403) {
      return "Недостатньо прав. Увійдіть в акаунт адміністратора.";
    }
  }

  return "Не вдалося виконати запит. Спробуйте ще раз.";
}

export function ServiceGroupsModal({ category, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const savingRef = useRef(false);

  const [groups, setGroups] = useState<ServiceGroup[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [success, setSuccess] = useState("");
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();

    return () => {
      dialog?.close();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadGroups() {
      setLoading(true);
      setLoadError("");

      try {
        const data = await getServiceGroups(category.id);

        if (!cancelled) {
          setGroups(data);
        }
      } catch (error) {
        if (!cancelled) {
          setLoadError(getErrorMessage(error));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadGroups();

    return () => {
      cancelled = true;
    };
  }, [category.id, revision]);

  function handleClose() {
    if (savingRef.current) return;
    onClose();
  }

  async function handleCreate() {
    if (savingRef.current || loading || loadError) return;

    const value = name.trim();
    setSaveError("");
    setSuccess("");

    if (!value) {
      setSaveError("Введіть назву групи.");
      return;
    }

    const alreadyExists = groups.some((group) => group.name.trim().toLowerCase() === value.toLowerCase());

    if (alreadyExists) {
      setSaveError("Група з такою назвою вже існує в цій категорії.");
      return;
    }

    savingRef.current = true;
    setSaving(true);

    try {
      const created = await createServiceGroup(category.id, value);

      // Сразу показываем сохранённую группу из ответа POST.
      setGroups((previous) => [...previous.filter((group) => group.id !== created.id), created]);
      setName("");
      setSuccess("Групу додано.");

      // Повторно загружаем актуальный список с сервера.
      setRevision((previous) => previous + 1);
    } catch (error) {
      setSaveError(getErrorMessage(error));
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  return (
    <dialog
      ref={dialogRef}
      onCancel={(event) => {
        event.preventDefault();
        handleClose();
      }}
      aria-labelledby="service-groups-title"
      aria-busy={loading || saving}
      className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-4xl border-0 bg-surface p-6 text-text shadow-xl backdrop:bg-black/40"
    >
      <div className="flex items-start justify-between gap-3">
        <h2 id="service-groups-title" className="text-lg font-medium">
          Групи послуг — {category.name}
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

      <p className="mt-2 text-sm text-muted">Майстри цієї категорії зможуть обирати ці групи для своїх послуг.</p>

      {loading && (
        <p className="mt-4 text-sm text-muted" role="status">
          Завантаження груп…
        </p>
      )}

      {loadError && (
        <div className="mt-4">
          <p className="text-sm text-danger" role="alert">
            {loadError}
          </p>
          <button
            type="button"
            onClick={() => setRevision((previous) => previous + 1)}
            disabled={loading || saving}
            className="mt-2 min-h-11 rounded-field border border-border px-4 text-sm disabled:opacity-50"
          >
            Оновити список
          </button>
        </div>
      )}

      {groups.length > 0 && (
        <ul className="mt-4 divide-y divide-border rounded-field border border-border">
          {groups.map((group) => (
            <li key={group.id} className="wrap-break-word px-4 py-3 text-sm">
              {group.name}
            </li>
          ))}
        </ul>
      )}

      {!loading && !loadError && groups.length === 0 && <p className="mt-4 text-sm text-muted">У цій категорії ще немає груп послуг.</p>}

      <form
        className="mt-6 border-t border-border pt-4"
        onSubmit={(event) => {
          event.preventDefault();
          void handleCreate();
        }}
      >
        <label htmlFor="service-group-name" className="mb-2 block text-sm text-muted">
          Назва групи
        </label>

        <input
          id="service-group-name"
          name="serviceGroupName"
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            setSaveError("");
            setSuccess("");
          }}
          required
          disabled={saving || loading || Boolean(loadError)}
          aria-invalid={Boolean(saveError)}
          aria-describedby={saveError ? "service-group-error" : undefined}
          className="min-h-11 w-full rounded-field border border-border bg-bg px-3 py-2 text-sm text-text disabled:opacity-50"
        />

        {saveError && (
          <p id="service-group-error" className="mt-3 text-sm text-danger" role="alert">
            {saveError}
          </p>
        )}

        {success && (
          <p className="mt-3 text-sm text-text" role="status">
            {success}
          </p>
        )}

        <button
          type="submit"
          disabled={saving || loading || Boolean(loadError) || !name.trim()}
          className="mt-4 min-h-11 w-full rounded-field bg-accent px-4 py-2 text-sm text-on-accent disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Додавання…" : "Додати групу"}
        </button>
      </form>
    </dialog>
  );
}
