import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Shapes, EllipsisVertical, Plus, } from "lucide-react";

import AdminLayout from "../../components/admin/AdminLayout";
import { CategoryModal } from "../../components/admin/CategoryModal";
import { categoryIcons } from "../../components/admin/categoryIcons";
import { useAuth } from "../../hooks/useAuth";

import type { Category } from "../../api/categories";
import { getCategories, deleteCategory } from "../../api/categories";
import { CategoryActions } from "../../components/admin/CategoryActions";

export default function AdminCategoriesPage() {

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [openedCategoryId, setOpenedCategoryId] = useState<number | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [actionError, setActionError] = useState("");


  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getCategories();
        setCategories(data);
      } catch (err) {
        console.error(err);
        setError("Помилка при завантаженні категорій");
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  function handleRename(category: Category) {
    setEditingCategory(category);
    setIsCreateOpen(false);
    setOpenedCategoryId(null);
  }


  async function handleDelete(category: Category) {
    if (deleting) return;

    if (category.mastersCount > 0) {
      setActionError(
        "Не можна видалити категорію, до якої прив’язані майстри."
      );
      return;
    }

    const confirmed = window.confirm(
      `Видалити категорію «${category.name}»?`
    );

    if (!confirmed) return;

    setDeleting(true);
    setActionError("");

    try {
      await deleteCategory(category.id);

      setCategories((previous) =>
        previous.filter((item) => item.id !== category.id)
      );

      setOpenedCategoryId(null);
    } catch (err) {
      console.error(err);
      setActionError("Не вдалося видалити категорію.");
    } finally {
      setDeleting(false);
    }
  }

  async function refreshCategoriesAfterSave() {
    setActionError("");

    try {
      const data = await getCategories();
      setCategories(data);
    } catch (err) {
      console.error(err);
      setActionError(
        "Категорію збережено, але не вдалося оновити список. Оновіть сторінку."
      );
    }
  }

  return (
    <AdminLayout title="Категорії"
      action={
        <button type="button" aria-label="Вийти" title="Вийти" onClick={handleLogout}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-field hover:bg-selected transition-colors">
          <img
            src="/icons/logout.svg"
            alt=""
            className="h-5.25 w-5.25"
          />
        </button>
      }>
      {loading && (
        <p className="py-8 text-muted" role="status">
          Завантаження категорій…
        </p>
      )}

      {error && (
        <p className="py-8 text-danger" role="alert">
          {error}
        </p>
      )}

      {actionError && (
        <p className="py-3 text-sm text-danger" role="alert">
          {actionError}
        </p>
      )}

      {!loading && !error && (
        <ul className="space-y-3">
          {categories.map((category) => {
            const Icon = categoryIcons[category.icon] ?? Shapes;
            const isOpen = openedCategoryId === category.id;

            return (
              <li
                key={category.id}
                className={`rounded-2xl p-2 ${isOpen
                  ? "bg-surface shadow-[0_4px_12px_rgba(0,0,0,0.18)]"
                  : ""
                  }`}
              >
                {/* Верхняя строка категории */}
                <button
                  type="button"
                  onClick={() => {
                    setOpenedCategoryId((previous) =>
                      previous === category.id ? null : category.id
                    );
                  }}
                  aria-expanded={isOpen}
                  aria-controls={`category-actions-${category.id}`}
                  className="flex w-full items-center gap-3 rounded-xl text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text"
                >
                  <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-border bg-selected">
                    <Icon
                      size={32}
                      strokeWidth={1.25}
                      className="text-text"
                      aria-hidden="true"
                    />
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-text sm:text-base">
                      {category.name}
                    </span>

                    <span className="mt-1 block text-xs text-muted sm:text-sm">
                      Майстрів: {category.mastersCount}
                    </span>
                  </span>

                  <span className="flex h-11 w-11 shrink-0 items-center justify-center text-text">
                    <EllipsisVertical size={20} aria-hidden="true" />
                  </span>
                </button>

                {/* Меню под категорией */}
                <div
                  id={`category-actions-${category.id}`}
                  hidden={!isOpen}
                >
                  <CategoryActions
                    disabled={deleting}
                    deleteDisabled={category.mastersCount > 0}
                    onRename={() => handleRename(category)}
                    onDelete={() => handleDelete(category)}
                  />
                </div>
              </li>
            );
          })}

          {categories.length === 0 && (
            <li className="py-8 text-sm text-muted">
              Категорій поки немає.
            </li>
          )}
        </ul>
      )}
      <button
        type="button"
        onClick={() => setIsCreateOpen(true)}
        className="mt-5 flex min-h-14 w-full items-center justify-center gap-2 rounded-xl bg-surface px-4 py-3 text-muted shadow-md hover:text-text transition-colors"
      >
        <Plus size={20} aria-hidden="true" />
        Додати категорію
      </button>

      {(isCreateOpen || editingCategory !== null) && (
        <CategoryModal
          key={editingCategory?.id ?? "new"}
          category={editingCategory ?? undefined}
          onClose={() => {
            setIsCreateOpen(false);
            setEditingCategory(null);
          }}
          onSaved={refreshCategoriesAfterSave}
        />
      )}
    </AdminLayout>
  );
}