import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getOwnProfile } from "../../api/masters";
import MasterServicesStep from "../../components/master/MasterServicesStep";

export default function MasterServicesPage() {
  const navigate = useNavigate();

  const [masterId, setMasterId] = useState<number | null>(null);
  const [categoryName, setCategoryName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      try {
        const profile = await getOwnProfile();

        if (!active) {
          return;
        }

        if (!profile.master) {
          setError("Профіль майстра не знайдено.");
          return;
        }

        setMasterId(profile.master.id);
        setCategoryName(profile.master.categoryName?.trim() || null);
      } catch {
        if (active) {
          setError("Не вдалося завантажити профіль.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadProfile();

    return () => {
      active = false;
    };
  }, []);

  // Форма повідомляє сторінці, чи є зміни та чи триває збереження.
  const handleFormStateChange = useCallback(
    (changed: boolean, busy: boolean) => {
      setHasChanges(changed);
      setSaving(busy);
    },
    [],
  );

  function handleBack() {
    if (saving) {
      return;
    }

    if (
      hasChanges &&
      !window.confirm("Вийти без збереження змін?")
    ) {
      return;
    }

    navigate("/cabinet/account");
  }

  return (
    <div className="mx-auto w-full max-w-xl space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold">Мої послуги</h1>
          {categoryName && (
            <p className="mt-1 wrap-break-word text-sm text-copy-500">Категорія: {categoryName}</p>
          )}
        </div>

        <button
          type="button"
          onClick={handleBack}
          disabled={saving}
          className="min-h-11 rounded-xl px-4 text-sm text-copy-600 hover:bg-panel-100 disabled:opacity-50"
        >
          Назад
        </button>
      </div>

      {loading ? (
        <p role="status">Завантаження…</p>
      ) : error ? (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      ) : masterId !== null ? (
        <MasterServicesStep
          masterId={masterId}
          onFormStateChange={handleFormStateChange}
        />
      ) : null}
    </div>
  );
}
