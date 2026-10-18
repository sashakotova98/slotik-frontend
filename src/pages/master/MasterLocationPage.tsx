import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { ApiError } from "../../api/api";
import { getOwnProfile, saveMasterLocation } from "../../api/masters";
import MasterLocationPicker from "../../components/master/MasterLocationPicker";

export default function MasterLocationPage() {
  const [masterId, setMasterId] = useState<number | null>(null);
  const [districtId, setDistrictId] = useState<number | null>(null);

  const [address, setAddress] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [retry, setRetry] = useState(0);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    let active = true;

    async function loadLocation() {
      try {
        // Саме getOwnProfile з api/masters: він повертає повний профіль.
        const result = await getOwnProfile();

        if (!active) {
          return;
        }

        if (!result.master) {
          setLoadError("Профіль майстра не знайдено.");
          return;
        }

        const master = result.master;

        setMasterId(master.id);
        setDistrictId(master.districtId);
        setAddress(master.address ?? "");
        setLatitude(master.latitude ?? null);
        setLongitude(master.longitude ?? null);
        setLoadError("");
      } catch (err) {
        if (active) {
          setLoadError(err instanceof ApiError ? err.message : "Не вдалося завантажити місце прийому.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadLocation();

    return () => {
      active = false;
    };
  }, [retry]);

  function retryLoading() {
    setLoading(true);
    setLoadError("");

    setRetry((previous) => {
      return previous + 1;
    });
  }

  function clearMessages() {
    setSaveError("");
    setSuccessMessage("");
  }

  async function handleSave() {
    if (saving || masterId === null || districtId === null) {
      return;
    }

    clearMessages();

    if (!address.trim()) {
      setSaveError("Вкажіть адресу прийому.");
      return;
    }

    // Позначка необов'язкова, але координати мають бути парою.
    if ((latitude === null) !== (longitude === null)) {
      setSaveError("Оберіть місце на карті повторно.");
      return;
    }

    setSaving(true);

    try {
      await saveMasterLocation(masterId, {
        districtId,
        address: address.trim(),
        latitude,
        longitude,
      });

      setAddress(address.trim());
      setSuccessMessage("Місце прийому збережено.");
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : "Не вдалося зберегти місце прийому. Спробуйте ще раз.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-6">
      <header className="flex items-center gap-3">
        <Link
          to="/cabinet/account"
          aria-label="Повернутися до акаунта"
          className="flex size-11 shrink-0 items-center justify-center rounded-full hover:bg-panel-100"
        >
          <ChevronLeft size={22} aria-hidden="true" />
        </Link>

        <h1 className="text-xl font-semibold">Адреса та місце прийому</h1>
      </header>

      {loading && (
        <p role="status" className="text-sm text-copy-500">
          Завантажуємо місце прийому…
        </p>
      )}

      {!loading && loadError && (
        <div className="rounded-2xl border border-border p-5">
          <p role="alert" className="text-sm text-red-600">
            {loadError}
          </p>

          <button type="button" onClick={retryLoading} className="mt-3 min-h-11 text-sm text-blue-600">
            Спробувати ще раз
          </button>
        </div>
      )}

      {!loading && !loadError && (
        <form
          className="space-y-5"
          onSubmit={(event) => {
            event.preventDefault();
            void handleSave();
          }}
        >
          <div>
            <label htmlFor="location-address" className="mb-2 block text-sm text-copy-600">
              Адреса *
            </label>

            <input
              id="location-address"
              type="text"
              required
              disabled={saving}
              value={address}
              onChange={(event) => {
                setAddress(event.target.value);
                clearMessages();
              }}
              placeholder="Вулиця, будинок, кабінет"
              className="min-h-12 w-full rounded-xl border border-border px-4 py-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-border disabled:opacity-50"
            />
          </div>

          <MasterLocationPicker
            latitude={latitude}
            longitude={longitude}
            disabled={saving}
            onChange={(nextLatitude, nextLongitude) => {
              setLatitude(nextLatitude);
              setLongitude(nextLongitude);
              clearMessages();
            }}
          />

          {saveError && (
            <p role="alert" className="text-sm text-red-600">
              {saveError}
            </p>
          )}

          {successMessage && (
            <p role="status" className="text-sm text-green-700">
              {successMessage}
            </p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="min-h-12 w-full rounded-xl bg-black px-5 py-3 font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
          >
            {saving ? "Зберігаємо…" : "Зберегти"}
          </button>
        </form>
      )}
    </div>
  );
}
