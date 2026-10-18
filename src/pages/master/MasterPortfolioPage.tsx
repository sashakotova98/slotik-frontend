import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { getOwnProfile, getMasterPortfolio, deletePortfolioPhoto, uploadMasterPortfolio, type PortfolioPhoto } from "../../api/masters";

export default function MasterPortfolioPage() {
  const [photos, setPhotos] = useState<PortfolioPhoto[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [masterId, setMasterId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [revision, setRevision] = useState(0);
  const busyRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Завантажуємо фотографії поточного майстра.
  useEffect(() => {
    let active = true;
    async function loadPortfolio() {
      try {
        const profile = await getOwnProfile();
        if (!profile.master) {
          throw new Error("Профіль майстра не знайдено.");
        }
        const savedPhotos = await getMasterPortfolio(profile.master.id);
        if (active) {
          setMasterId(profile.master.id);
          setPhotos(savedPhotos);
          setError("");
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "Не вдалося завантажити портфоліо.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }
    void loadPortfolio();
    return () => {
      active = false;
    };
  }, [revision]);

  function refresh() {
    setLoading(true);
    setRevision((current) => {
      return current + 1;
    });
  }

  function chooseFiles(event: ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files ?? []);
    setError("");
    setMessage("");
    setFiles([]);
    if (photos.length + selected.length > 10) {
      setError("У портфоліо можна мати до 10 фотографій.");
      event.target.value = "";
      return;
    }
    for (const file of selected) {
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024) {
        setError("Оберіть JPG, PNG або WebP розміром до 5 МБ кожне.");
        event.target.value = "";
        return;
      }
    }
    setFiles(selected);
  }

  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busyRef.current || files.length === 0 || masterId === null) {
      return;
    }
    busyRef.current = true;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const savedPhotos = await uploadMasterPortfolio(files);
      setPhotos(savedPhotos);
      // Очищаємо вже збережені файли, щоб не надіслати їх повторно.
      setFiles([]);
      // Очищаємо поле вибору файлів (input)
      if (inputRef.current) {
        inputRef.current.value = "";
      }
      setMessage("Фотографії додано до портфоліо.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не вдалося завантажити фото.");
    } finally {
      busyRef.current = false;
      setSaving(false);
    }
  }

  async function removePhoto(photo: PortfolioPhoto) {
    if (busyRef.current) {
      return;
    }
    if (!window.confirm("Видалити це фото з портфоліо?")) {
      return;
    }
    busyRef.current = true;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      await deletePortfolioPhoto(photo.id);
      setPhotos((current) => {
        return current.filter((item) => {
          return item.id !== photo.id;
        });
      });
      setMessage("Фото видалено.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не вдалося видалити фото.");
    } finally {
      busyRef.current = false;
      setSaving(false);
    }
  }

  const totalPhotos = photos.length + files.length;
  const cannotChooseFiles = saving || masterId === null || photos.length >= 10;
  const cannotUpload = saving || masterId === null || files.length === 0 || totalPhotos > 10;
  const selectedFileNames = files.map((file) => {
    return file.name;
  }).join(", ");
  return (
    <div className="mx-auto w-full max-w-xl space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Портфоліо</h1>
        <Link
          to="/cabinet/account"
          onClick={(event) => {
            if (saving) {
              event.preventDefault();
            }
          }}
          className="inline-flex min-h-11 items-center rounded-xl px-3 text-sm hover:bg-panel-100"
        >
          Назад
        </Link>
      </div>

      <p className="text-sm text-copy-500">
        До 10 фотографій ваших робіт. JPG, PNG або WebP — до 5 МБ кожне.
      </p>

      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Фотографій: {totalPhotos} / 10</p>
        <button
          type="button"
          disabled={saving || loading}
          onClick={refresh}
          className="min-h-11 px-3 text-sm text-blue-600 disabled:opacity-50"
        >
          Оновити
        </button>
      </div>

      {error && (
        <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="text-sm text-green-700">{message}</p>
      )}
      {loading && <p role="status">Завантаження…</p>}

      {!loading && (
        <>
          {photos.length === 0 && (
            <p className="rounded-2xl bg-panel-50 p-5 text-sm text-copy-500">
              У портфоліо поки немає фотографій.
            </p>
          )}

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {photos.map((photo, index) => {
              return (
                <div key={photo.id} className="overflow-hidden rounded-2xl border border-border">
                  <img
                    src={photo.photoUrl}
                    alt={`Робота майстра ${index + 1}`}
                    className="aspect-square w-full object-cover"
                  />
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => {
                      void removePhoto(photo);
                    }}
                    aria-label={`Видалити фото ${index + 1}`}
                    className="min-h-11 w-full text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    Видалити
                  </button>
                </div>
              );
            })}
          </div>

          <form onSubmit={upload} className="space-y-3 rounded-2xl border border-border p-4">
            <label htmlFor="portfolio-files" className="block text-sm font-medium">
              Додати фотографії
            </label>
            <input
              ref={inputRef}
              id="portfolio-files"
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp"
              onChange={chooseFiles}
              disabled={cannotChooseFiles}
              className="block w-full min-w-0 text-sm file:mr-3 file:rounded-xl file:border-0 file:bg-panel-100 file:px-3 file:py-3 disabled:opacity-50"
            />
            {files.length > 0 && (
              <p className="wrap-break-word text-xs text-copy-500">
                Обрано: {selectedFileNames}
              </p>
            )}
            <button
              type="submit"
              disabled={cannotUpload}
              className="min-h-11 w-full rounded-xl bg-black px-4 text-sm text-white disabled:opacity-40"
            >
              {saving ? "Збереження…" : "Завантажити фото"}
            </button>
          </form>
        </>
      )}
    </div>
  );
}


