import { useState, type ChangeEvent } from "react";
import { Camera, LoaderCircle } from "lucide-react";
import { apiUploadPhoto, type UploadedPhoto } from "../../api/photos";

type Props = {
  photo: UploadedPhoto | null;
  onPhotoChange: (photo: UploadedPhoto) => void;
  uploading: boolean;
  onUploadingChange: (uploading: boolean) => void;
};

export default function MasterProfileStep({ photo, onPhotoChange, uploading, onUploadingChange }: Props) {
  const [photoError, setPhotoError] = useState("");

  const handlePhotoChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";

    if (!file || uploading) return;

    setPhotoError("");

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setPhotoError("Оберіть фото у форматі JPG, PNG або WebP.");
      return;
    }

    // Тимчасове обмеження для інтерфейсу: 5 МБ.
    if (file.size > 5 * 1024 * 1024) {
      setPhotoError("Розмір фото має бути до 5 МБ.");
      return;
    }

    onUploadingChange(true);

    try {
      const result = await apiUploadPhoto(file);

      if (!result.url || !result.publicId) {
        throw new Error("Incomplete photo response");
      }

      onPhotoChange(result);
    } catch {
      setPhotoError("Не вдалося завантажити фото. Спробуйте ще раз.");
    } finally {
      onUploadingChange(false);
    }
  };

  return (
    <div>
      <label className={`inline-flex items-center gap-5 ${uploading ? "cursor-wait" : "cursor-pointer"}`}>
        <span className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-full border border-neutral-400">
          {uploading ? (
            <LoaderCircle size={28} className="animate-spin" aria-hidden="true" />
          ) : photo ? (
            <img src={photo.url} alt="Фото профілю майстра" className="size-full object-cover" />
          ) : (
            <Camera size={28} strokeWidth={1.5} aria-hidden="true" />
          )}
        </span>

        <span className="text-sm text-blue-500">
          {uploading ? "Завантаження..." : photo ? "Змінити фото" : "Додати фото"}
        </span>

        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={uploading}
          onChange={handlePhotoChange}
          className="sr-only"
        />
      </label>

      {photoError && (
        <p role="alert" className="mt-3 text-sm text-danger">
          {photoError}
        </p>
      )}
    </div>
  );
}