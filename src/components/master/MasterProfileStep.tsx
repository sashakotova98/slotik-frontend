import type { PortfolioPhoto } from "../../api/masters";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { Camera, LoaderCircle, ChevronDown, Check } from "lucide-react";
import { apiUploadPhoto, type UploadedPhoto } from "../../api/photos";
import { type CategoryOption, getCategoryOptions } from "../../api/categories";
import { getCities, type City } from "../../api/cities";

export type ProfileFields = {
  cityId: number | null;
  districtId: number | null;
  address: string;
  about: string;
};

type Props = {
  portfolioPhotos: PortfolioPhoto[];
  portfolioFiles: File[];
  onPortfolioChange: (files: File[]) => void;
  onPortfolioDelete: (id: number) => Promise<void>;
  deletingPhotoId: number | null;
  photo: UploadedPhoto | null;
  onPhotoChange: (photo: UploadedPhoto) => void;
  uploading: boolean;
  onUploadingChange: (uploading: boolean) => void;
  categoryId: number | null;
  onCategoryChange: (categoryId: number | null) => void;
  profile: ProfileFields;
  onProfileChange: (profile: ProfileFields) => void;
};

export default function MasterProfileStep({ photo, onPhotoChange, uploading, onUploadingChange, categoryId, onCategoryChange, profile, onProfileChange, portfolioPhotos, portfolioFiles, onPortfolioChange, onPortfolioDelete, deletingPhotoId }: Props) {
  const [photoError, setPhotoError] = useState("");
  const [portfolioError, setPortfolioError] = useState("");

  const handlePortfolioChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (selectedFiles.length === 0) return;

    setPortfolioError("");
    const files = [...portfolioFiles, ...selectedFiles];

    if (portfolioPhotos.length + files.length > 10) {
      setPortfolioError("У портфоліо може бути не більше 10 фотографій.");
      return;
    }
    if (files.some((file) => !["image/jpeg", "image/png", "image/webp"].includes(file.type))) {
      setPortfolioError("Оберіть фото у форматі JPG, PNG або WebP.");
      return;
    }
    if (files.some((file) => file.size > 5 * 1024 * 1024)) {
      setPortfolioError("Розмір кожного фото має бути до 5 МБ.");
      return;
    }
    onPortfolioChange(files);
  };

  const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState("");

  const [categoryOpen, setCategoryOpen] = useState(false);
  const [cityOpen, setCityOpen] = useState(false);
  const [districtOpen, setDistrictOpen] = useState(false);

  const [cities, setCities] = useState<City[]>([]);
  const [citiesLoading, setCitiesLoading] = useState(true);
  const [citiesError, setCitiesError] = useState("");

  useEffect(() => {
    let active = true;

    getCities()
      .then((data) => {
        if (active) setCities(data);
      })
      .catch(() => {
        if (active) setCitiesError("Не вдалося завантажити міста.");
      })
      .finally(() => {
        if (active) setCitiesLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const selectedCity = cities.find((city) => city.id === profile.cityId);
  const districts = selectedCity?.districts ?? [];

  const selectedDistrict = districts.find((district) => district.id === profile.districtId);

  const handleCitySelect = (cityId: number) => {
    onProfileChange({ ...profile, cityId, districtId: null });
    setCityOpen(false);
    setDistrictOpen(false);
  };

  const handleDistrictSelect = (districtId: number) => {
    onProfileChange({ ...profile, districtId });
    setDistrictOpen(false);
  };


  useEffect(() => {
    let active = true;

    getCategoryOptions()
      .then((categories) => {
        if (active) setCategoryOptions(categories);
      })
      .catch(() => {
        if (active) setCategoriesError("Не вдалося завантажити категорії.");
      })
      .finally(() => {
        if (active) setCategoriesLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const handlePhotoChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";

    if (!file || uploading) return;

    setPhotoError("");

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setPhotoError("Оберіть фото у форматі JPG, PNG або WebP.");
      return;
    }


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

  const selectedCategory = categoryOptions.find((category) => category.id === categoryId);

  const handleCategorySelect = (id: number) => {
    onCategoryChange(id);
    setCategoryOpen(false);
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

      <div className="mt-6">
        <span id="master-category-label" className="mb-1 block text-lg text-neutral-600">
          Категорія *
        </span>

        <div
          className={`relative ${categoryOpen ? "z-40" : ""}`}
          onKeyDown={(e) => {
            if (e.key === "Escape") setCategoryOpen(false);
          }}
        >
          {categoryOpen && (
            <button
              type="button"
              tabIndex={-1}
              aria-label="Закрити список категорій"
              onClick={() => setCategoryOpen(false)}
              className="fixed inset-0 z-10 cursor-default"
            />
          )}

          <button
            type="button"
            disabled={categoriesLoading || Boolean(categoriesError)}
            onClick={() => {
              setCityOpen(false);
              setDistrictOpen(false);
              setCategoryOpen(!categoryOpen);
            }}
            aria-expanded={categoryOpen}
            aria-controls="master-category-options"
            aria-labelledby="master-category-label master-category-value"
            className="relative z-20 flex min-h-12 w-full items-center justify-between gap-3 rounded-xl border border-neutral-400 bg-transparent p-1.5 pr-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-neutral-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span
              id="master-category-value"
              className={
                selectedCategory
                  ? "truncate rounded-full bg-black px-5 py-1.5 text-base text-white"
                  : "truncate px-2 text-sm text-neutral-500"
              }
            >
              {categoriesLoading
                ? "Завантаження..."
                : selectedCategory?.name ?? "Оберіть категорію"}
            </span>

            <ChevronDown
              size={20}
              strokeWidth={1.5}
              aria-hidden="true"
              className={`shrink-0 text-neutral-500 transition-transform ${categoryOpen ? "rotate-180" : ""
                }`}
            />
          </button>

          {categoryOpen && (
            <div
              id="master-category-options"
              role="group"
              aria-labelledby="master-category-label"
              className="absolute inset-x-0 top-full z-30 mt-2 max-h-60 space-y-1 overflow-y-auto rounded-2xl border border-neutral-200 bg-white p-2 shadow-xl"
            >
              {categoryOptions.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  aria-pressed={categoryId === category.id}
                  onClick={() => handleCategorySelect(category.id)}
                  className={`flex min-h-11 w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-inset ${categoryId === category.id
                    ? "bg-black text-white"
                    : "text-neutral-700 hover:bg-neutral-100"
                    }`}
                >
                  <span>{category.name}</span>

                  {categoryId === category.id && (
                    <Check size={17} aria-hidden="true" className="shrink-0" />
                  )}
                </button>
              ))}

              {categoryOptions.length === 0 && (
                <p className="px-3 py-3 text-sm text-neutral-500">
                  Категорій поки немає.
                </p>
              )}
            </div>
          )}
        </div>

        {categoriesError && (
          <p role="alert" className="mt-2 text-sm text-danger">
            {categoriesError}
          </p>
        )}
      </div>

      <div className="mt-4 space-y-4">
        <div>
          <span id="master-city-label" className="mb-1 block text-lg text-neutral-600">
            Місто *
          </span>

          <div className={`relative ${cityOpen ? "z-40" : ""}`} onKeyDown={(e) => {
            if (e.key === "Escape") setCityOpen(false);
          }}>
            {cityOpen && (
              <button type="button" tabIndex={-1} aria-label="Закрити список" onClick={() => setCityOpen(false)} className="fixed inset-0 z-10 cursor-default" />
            )}

            <button
              type="button"
              disabled={citiesLoading || Boolean(citiesError)}
              onClick={() => {
                setCategoryOpen(false);
                setDistrictOpen(false);
                setCityOpen(!cityOpen);
              }}
              aria-expanded={cityOpen}
              aria-controls="master-city-options"
              aria-labelledby="master-city-label master-city-value"
              className="relative z-20 flex min-h-12 w-full items-center justify-between gap-3 rounded-xl border border-neutral-400 bg-transparent p-1.5 pr-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-neutral-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span id="master-city-value" className={selectedCity ? "truncate rounded-full bg-black px-5 py-1.5 text-base text-white" : "truncate px-2 text-sm text-neutral-500"}>
                {citiesLoading ? "Завантаження..." : selectedCity?.name ?? "Оберіть місто"}
              </span>
              <ChevronDown size={20} aria-hidden="true" className={`shrink-0 text-neutral-500 transition-transform ${cityOpen ? "rotate-180" : ""}`} />
            </button>

            {cityOpen && (
              <div id="master-city-options" role="group" aria-labelledby="master-city-label" className="absolute inset-x-0 top-full z-30 mt-2 max-h-60 space-y-1 overflow-y-auto rounded-2xl border border-neutral-200 bg-white p-2 shadow-xl">
                {cities.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    aria-pressed={profile.cityId === item.id}
                    onClick={() => handleCitySelect(item.id)}
                    className={`flex min-h-11 w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-inset ${profile.cityId === item.id ? "bg-black text-white" : "text-neutral-700 hover:bg-neutral-100"}`}
                  >
                    <span>{item.name}</span>
                    {profile.cityId === item.id && <Check size={17} aria-hidden="true" className="shrink-0" />}
                  </button>
                ))}
                {cities.length === 0 && <p className="px-3 py-2 text-sm text-neutral-500">Список порожній.</p>}
              </div>
            )}
          </div>

          {citiesError && (
            <p id="master-city-error" role="alert" className="mt-2 text-sm text-danger">
              {citiesError}
            </p>
          )}

          {!citiesLoading && !citiesError && cities.length === 0 && (
            <p className="mt-2 text-sm text-neutral-500">
              Міст поки немає.
            </p>
          )}
        </div>

        {profile.cityId !== null && (
          <div>
            <span id="master-district-label" className="mb-1 block text-lg text-neutral-600">
              Район *
            </span>

            <div className={`relative ${districtOpen ? "z-40" : ""}`} onKeyDown={(e) => {
              if (e.key === "Escape") setDistrictOpen(false);
            }}>
              {districtOpen && (
                <button type="button" tabIndex={-1} aria-label="Закрити список" onClick={() => setDistrictOpen(false)} className="fixed inset-0 z-10 cursor-default" />
              )}

              <button
                type="button"
                disabled={citiesLoading || Boolean(citiesError) || districts.length === 0}
                onClick={() => {
                  setCategoryOpen(false);
                  setCityOpen(false);
                  setDistrictOpen(!districtOpen);
                }}
                aria-expanded={districtOpen}
                aria-controls="master-district-options"
                aria-labelledby="master-district-label master-district-value"
                className="relative z-20 flex min-h-12 w-full items-center justify-between gap-3 rounded-xl border border-neutral-400 bg-transparent p-1.5 pr-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-neutral-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span id="master-district-value" className={selectedDistrict ? "truncate rounded-full bg-black px-5 py-1.5 text-base text-white" : "truncate px-2 text-sm text-neutral-500"}>
                  {citiesLoading ? "Завантаження..." : selectedDistrict?.name ?? "Оберіть район"}
                </span>
                <ChevronDown size={20} aria-hidden="true" className={`shrink-0 text-neutral-500 transition-transform ${districtOpen ? "rotate-180" : ""}`} />
              </button>

              {districtOpen && (
                <div id="master-district-options" role="group" aria-labelledby="master-district-label" className="absolute inset-x-0 top-full z-30 mt-2 max-h-60 space-y-1 overflow-y-auto rounded-2xl border border-neutral-200 bg-white p-2 shadow-xl">
                  {districts.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      aria-pressed={profile.districtId === item.id}
                      onClick={() => handleDistrictSelect(item.id)}
                      className={`flex min-h-11 w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-inset ${profile.districtId === item.id ? "bg-black text-white" : "text-neutral-700 hover:bg-neutral-100"}`}
                    >
                      <span>{item.name}</span>
                      {profile.districtId === item.id && <Check size={17} aria-hidden="true" className="shrink-0" />}
                    </button>
                  ))}
                  {districts.length === 0 && <p className="px-3 py-2 text-sm text-neutral-500">Список порожній.</p>}
                </div>
              )}
            </div>

            {!citiesLoading && !citiesError && districts.length === 0 && (
              <p className="mt-2 text-sm text-neutral-500">
                Для цього міста ще не додано районів.
              </p>
            )}
          </div>
        )}

        <div>
          <label htmlFor="master-address" className="mb-1 block text-lg text-neutral-600">
            Адреса *
          </label>

          <input
            id="master-address"
            type="text"
            value={profile.address}
            onChange={(e) => onProfileChange({ ...profile, address: e.target.value })}
            placeholder="Вулиця, будинок"
            required
            className="h-12 w-full rounded-xl border border-neutral-400 bg-transparent px-3 text-base outline-none placeholder:text-neutral-400 focus-visible:ring-2 focus-visible:ring-neutral-300"
          />
        </div>

        <div>
          <label htmlFor="master-about" className="mb-1 block text-lg text-neutral-600">
            Про себе *
          </label>

          <textarea
            id="master-about"
            value={profile.about}
            onChange={(e) => onProfileChange({ ...profile, about: e.target.value })}
            rows={4}
            required
            className="min-h-28 w-full resize-y rounded-xl border border-neutral-400 bg-transparent px-3 py-2 text-base outline-none focus-visible:ring-2 focus-visible:ring-neutral-300"
          />
        </div>

        <div>
          <p className="mb-2 text-lg text-neutral-600">Портфоліо</p>

          {portfolioPhotos.length > 0 && (
            <div className="mb-3 grid grid-cols-3 gap-2">
              {portfolioPhotos.map((item, index) => (
                <div key={item.id} className="relative">
                  <img src={item.photoUrl} alt={`Збережена робота майстра ${index + 1}`} className="aspect-square w-full rounded-xl object-cover" />
                  <button
                    type="button"
                    aria-label={`Видалити збережене фото ${index + 1}`}
                    disabled={deletingPhotoId !== null || uploading}
                    onClick={() => {
                      setPortfolioError("");
                      void onPortfolioDelete(item.id);
                    }}
                    className="absolute right-1 top-1 flex size-8 items-center justify-center rounded-full bg-black/70 text-xl text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black disabled:cursor-wait disabled:opacity-50"
                  >
                    {deletingPhotoId === item.id ? <LoaderCircle size={16} className="animate-spin" aria-hidden="true" /> : "×"}
                  </button>
                </div>
              ))}
            </div>
          )}

          {portfolioFiles.length > 0 && (
            <>
              <p className="mb-2 text-sm text-neutral-600">Нові фото — ще не збережені ({portfolioFiles.length}). Усього: {portfolioPhotos.length + portfolioFiles.length}/10:</p>
              <div className="mb-3 grid grid-cols-3 gap-2">
                {portfolioFiles.map((file, index) => (
                  <div key={index} className="relative">
                    <PortfolioPreview file={file} />
                    <button
                      type="button"
                      aria-label={`Прибрати обране фото ${index + 1}`}
                      onClick={() => {
                        onPortfolioChange(portfolioFiles.filter((_, fileIndex) => fileIndex !== index));
                        setPortfolioError("");
                      }}
                      className="absolute right-1 top-1 flex size-8 items-center justify-center rounded-full bg-black/70 text-xl text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}

          <label className="inline-block cursor-pointer rounded-xl border border-neutral-400 px-3 py-1 text-sm text-blue-500 focus-within:ring-2 focus-within:ring-blue-500">
            + Додати фото
            <input type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={handlePortfolioChange} aria-describedby="portfolio-note" className="sr-only" />
          </label>

          <p id="portfolio-note" className="mt-2 text-xs text-neutral-500">
            До 10 фото, JPG, PNG або WebP, до 5 МБ кожне. Збереження після натискання «Далі».
          </p>
          {portfolioPhotos.length > 0 && (
            <p className="mt-2 text-sm text-neutral-600">
              Нові фото додадуться до збережених після натискання «Далі». Видалення збережених фото виконується одразу.
            </p>
          )}
          {portfolioError && <p role="alert" className="mt-2 text-sm text-red-500">{portfolioError}</p>}
        </div>
      </div>
    </div>
  );
}
function PortfolioPreview({ file }: { file: File }) {
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    if (imageRef.current) imageRef.current.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  return <img ref={imageRef} alt={`Обране фото: ${file.name}`} className="aspect-square w-full rounded-xl object-cover" />;
}
