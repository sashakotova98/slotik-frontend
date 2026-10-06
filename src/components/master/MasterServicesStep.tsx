import { ImageIcon, LoaderCircle, Plus, SquarePen } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { createService, getServicesByMasterId, type Service } from "../../api/services";
import { deleteServicePhoto, getServicePhotosByMasterId, type ServicePhoto } from "../../api/servicePhotos";

type Props = {
  masterId: number;
  onFormStateChange: (hasChanges: boolean, saving: boolean) => void;
};

export default function MasterServicesStep({ masterId, onFormStateChange }: Props) {
  const [services, setServices] = useState<Service[]>([]);
  const [photos, setPhotos] = useState<ServicePhoto[]>([]);

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [duration, setDuration] = useState("");
  const [files, setFiles] = useState<File[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const savingRef = useRef(false);
  const deletingRef = useRef(false);
  const [deletingPhotoId, setDeletingPhotoId] = useState<number | null>(null);
  const [photoDeleteError, setPhotoDeleteError] = useState("");
  const busy = saving || deletingPhotoId !== null;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasChanges = name !== "" || price !== "" || duration !== "" || files.length > 0;

  useEffect(() => {
    onFormStateChange(hasChanges, busy);
  }, [hasChanges, busy, onFormStateChange]);

  useEffect(() => {
    let active = true;

    async function loadServices() {
      try {
        const [savedServices, savedPhotos] = await Promise.all([getServicesByMasterId(masterId), getServicePhotosByMasterId(masterId)]);

        if (!active) return;

        setServices(savedServices);
        setPhotos(savedPhotos);
      } catch {
        if (active) {
          setLoadError("Не вдалося завантажити послуги. Оновіть сторінку.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadServices();

    return () => {
      active = false;
    };
  }, [masterId]);

  const handleDeletePhoto = async (photoId: number) => {
    if (savingRef.current || deletingRef.current) return;
    deletingRef.current = true;
    setDeletingPhotoId(photoId);
    setPhotoDeleteError("");
    onFormStateChange(hasChanges, true);

    try {
      await deleteServicePhoto(photoId);
      setPhotos((previous) => previous.filter((photo) => photo.id !== photoId));
    } catch (error) {
      setPhotoDeleteError(error instanceof Error ? error.message : "Не вдалося видалити фото. Спробуйте ще раз.");
    } finally {
      deletingRef.current = false;
      setDeletingPhotoId(null);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (savingRef.current || deletingRef.current) return;

    setSaveError("");

    const servicePrice = Number(price);
    const serviceDuration = Number(duration);

    if (!name.trim()) {
      setSaveError("Вкажіть назву послуги.");
      return;
    }

    if (!price.trim() || !Number.isFinite(servicePrice) || servicePrice < 0) {
      setSaveError("Вкажіть коректну ціну.");
      return;
    }

    if (!Number.isSafeInteger(serviceDuration) || serviceDuration <= 0) {
      setSaveError("Вкажіть тривалість у цілих хвилинах.");
      return;
    }

    if (files.length === 0 || files.length > 3) {
      setSaveError("Поки що потрібно обрати від 1 до 3 фото.");
      return;
    }

    if (files.some((file) => !["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024)) {
      setSaveError("Оберіть JPG, PNG або WebP до 5 МБ кожне.");
      return;
    }

    savingRef.current = true;
    setSaving(true);

    try {
      const created = await createService(
        {
          masterId,
          name: name.trim(),
          price: servicePrice,
          durationMin: serviceDuration,
        },
        files,
      );

      if (!Number.isSafeInteger(created.id) || created.id <= 0) {
        throw new Error("API не повернув коректний ID послуги. Потрібна перевірка бекенда.");
      }

      setServices((previous) => [...previous, created]);

      setName("");
      setPrice("");
      setDuration("");
      setFiles([]);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      // Створення вже успішне; помилка GET не повинна виглядати
      // як помилка створення і провокувати повторний POST.
      try {
        const savedPhotos = await getServicePhotosByMasterId(masterId);
        setPhotos(savedPhotos);
      } catch {
        setSaveError("Послугу додано, але фото не вдалося оновити. Оновіть сторінку.");
      }
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Не вдалося додати послугу.");
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  if (loading) {
    return <p role="status">Завантаження послуг…</p>;
  }

  if (loadError) {
    return (
      <p role="alert" className="text-sm text-red-500">
        {loadError}
      </p>
    );
  }

  const canSubmit = Boolean(name.trim()) && price.trim() !== "" && Number.isFinite(Number(price)) && Number(price) >= 0 && Number.isSafeInteger(Number(duration)) && Number(duration) > 0 && files.length > 0 && files.length <= 3;
  const inputClass = "block h-12 w-full min-w-0 rounded-[14px] border border-neutral-400 bg-transparent px-4 text-lg text-neutral-600 outline-none placeholder:text-neutral-400 focus-visible:ring-2 focus-visible:ring-neutral-300";

  return (
    <div className="space-y-5">
      {photoDeleteError && <p role="alert" className="text-sm text-red-500">{photoDeleteError}</p>}
      {services.map((service) => {
        const servicePhotos = photos.filter((photo) => photo.serviceId === service.id);
        return (
          <div key={service.id} className="rounded-[14px] border border-neutral-400 px-4 py-3">
            <div className="flex min-h-18 items-center gap-3">
            {servicePhotos[0] ? (
              <img src={servicePhotos[0].photoUrl} alt={service.name} className="size-14 shrink-0 rounded-xl object-cover" />
            ) : (
              <span className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-neutral-400"><ImageIcon size={24} aria-hidden="true" /></span>
            )}
            <div className="min-w-0 flex-1">
              <p className="wrap-break-word text-lg font-semibold leading-snug">{service.name}</p>
              <p className="mt-1 text-base leading-snug text-neutral-400">{service.price} ₴ • {service.durationMin} хв • {servicePhotos.length} фото</p>
            </div>
            <button type="button" disabled aria-label="Редагування послуги поки недоступне" title="Редагування буде доступне після підключення API" className="flex size-9 shrink-0 cursor-not-allowed items-center justify-center text-neutral-400">
              <SquarePen size={22} strokeWidth={1.5} aria-hidden="true" />
            </button>
            </div>
            {servicePhotos.length > 0 && (
              <details className="mt-2 border-t border-neutral-200 pt-2">
                <summary className="cursor-pointer text-sm text-neutral-500 focus-visible:outline-2 focus-visible:outline-offset-2">Фотографії послуги ({servicePhotos.length})</summary>
                <p className="mt-2 text-xs text-neutral-500">Збережене фото видаляється одразу.</p>
                <div className="mt-3 flex flex-wrap gap-3">
                  {servicePhotos.map((photo, index) => (
                    <div key={photo.id} className="relative size-19 shrink-0">
                      <img src={photo.photoUrl} alt={`${service.name} — фото ${index + 1}`} className="size-full rounded-xl object-cover" />
                      <button
                        type="button"
                        disabled={busy}
                        aria-label={`Видалити фото ${index + 1} послуги «${service.name}»`}
                        onClick={() => void handleDeletePhoto(photo.id)}
                        className="absolute -right-1 -top-1 flex size-7 items-center justify-center rounded-full bg-black/70 text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black disabled:cursor-wait disabled:opacity-50"
                      >
                        {deletingPhotoId === photo.id ? <LoaderCircle size={16} className="animate-spin" aria-hidden="true" /> : "×"}
                      </button>
                    </div>
                  ))}
                </div>
                {deletingPhotoId !== null && servicePhotos.some((photo) => photo.id === deletingPhotoId) && (
                  <p role="status" className="mt-2 text-xs text-neutral-500">Видалення фото…</p>
                )}
              </details>
            )}
          </div>
        );
      })}

      <form onSubmit={handleSubmit}>
        <fieldset disabled={busy} aria-labelledby="new-service-title" className="m-0 min-w-0 space-y-5 rounded-2xl border border-dashed border-neutral-400 p-4 sm:p-5">
          <h3 id="new-service-title" className="text-xl font-semibold">+ Нова послуга</h3>
          <label className="block text-lg text-neutral-600">
            Назва
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Назва послуги" required className={inputClass + " mt-1.5"} />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block min-w-0 text-lg text-neutral-600">
              Ціна
              <span className="relative mt-1.5 block">
                <input type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} required placeholder="0" className={inputClass + " pr-10 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"} />
                <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-neutral-500">₴</span>
              </span>
            </label>
            <label className="block min-w-0 text-lg text-neutral-600">
              Тривалість
              <span className="relative mt-1.5 block">
                <input type="number" min="1" step="1" value={duration} onChange={(e) => setDuration(e.target.value)} required placeholder="0" className={inputClass + " pr-12 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"} />
                <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-base text-neutral-500">хв</span>
              </span>
            </label>
          </div>

          <div>
            <p id="service-photos-label" className="mb-2 text-lg text-neutral-600">Фото робіт <span className="text-sm text-neutral-400">(від 1 до 3 фото)</span></p>
            <div className="flex flex-wrap gap-3">
              {files.map((file, index) => (
                <div key={index} className="relative size-19 shrink-0">
                  <ServicePhotoPreview file={file} />
                  <button type="button" aria-label={`Прибрати фото ${index + 1}`} onClick={() => {
                    setFiles((previous) => previous.filter((_, itemIndex) => itemIndex !== index));
                    setSaveError("");
                  }} className="absolute -right-1 -top-1 flex size-6 items-center justify-center rounded-full bg-black/70 text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black">×</button>
                </div>
              ))}
              {files.length < 3 && (
                <label className="flex size-19 shrink-0 cursor-pointer items-center justify-center rounded-2xl border border-dashed border-neutral-400 text-neutral-500 transition hover:bg-neutral-100 focus-within:ring-2 focus-within:ring-neutral-400">
                  <Plus size={30} strokeWidth={1.5} aria-hidden="true" />
                  <input ref={fileInputRef} type="file" multiple accept="image/jpeg,image/png,image/webp" aria-label="Додати фото роботи" onChange={(e) => {
                    const selected = Array.from(e.target.files ?? []);
                    e.target.value = "";
                    if (selected.length === 0) return;
                    const nextFiles = [...files, ...selected];
                    if (nextFiles.length > 3) { setSaveError("Можна обрати не більше 3 фото."); return; }
                    if (selected.some((file) => !["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024)) {
                      setSaveError("Оберіть JPG, PNG або WebP до 5 МБ кожне."); return;
                    }
                    setFiles(nextFiles);
                    setSaveError("");
                  }} className="sr-only" />
                </label>
              )}
            </div>
          </div>

          {saveError && <p role="alert" className="text-sm text-red-500">{saveError}</p>}
          <button type="submit" disabled={busy || !canSubmit} className="min-h-16 w-full rounded-2xl bg-black px-3 py-3 text-xl font-semibold text-white transition hover:bg-neutral-800 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black disabled:cursor-not-allowed disabled:bg-neutral-300 sm:text-2xl">
            {saving ? "Збереження…" : "Додати послугу"}
          </button>
          {hasChanges && (
            <button type="button" disabled={busy} onClick={() => {
              setName("");
              setPrice("");
              setDuration("");
              setFiles([]);
              setSaveError("");
              if (fileInputRef.current) fileInputRef.current.value = "";
            }} className="w-full py-2 text-sm text-neutral-500 hover:text-black disabled:cursor-not-allowed">
              Очистити форму
            </button>
          )}
        </fieldset>
      </form>
    </div>
  );
}

function ServicePhotoPreview({ file }: { file: File }) {
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const url = URL.createObjectURL(file);

    if (imageRef.current) imageRef.current.src = url;

    return () => URL.revokeObjectURL(url);
  }, [file]);

  return <img ref={imageRef} alt={`Обране фото: ${file.name}`} className="aspect-square w-full rounded-xl object-cover" />;
}
