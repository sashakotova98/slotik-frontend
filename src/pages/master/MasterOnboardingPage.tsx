import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { createMasterProfile, saveMasterProfile, getOwnProfile, type MasterProfileData } from "../../api/masters";
import { ChevronLeft, ChevronRight } from "lucide-react";
import MasterServicesStep from "../../components/master/MasterServicesStep";
import MasterScheduleStep from "../../components/master/MasterScheduleStep";
import StepProgress from "../../components/master/StepProgress";
import type { UploadedPhoto } from "../../api/photos";
import Header from "../../components/Header";
import MasterProfileStep, { type ProfileFields } from "../../components/master/MasterProfileStep";
import { getCities } from "../../api/cities";
import { deletePortfolioPhoto, getMasterPortfolio, type PortfolioPhoto } from "../../api/masters";

export default function MasterOnboardingPage() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [step, setStep] = useState(1);
  const [serviceHasChanges, setServiceHasChanges] = useState(false);
  const [serviceSaving, setServiceSaving] = useState(false);
  const [stepError, setStepError] = useState("");
  const [scheduleHasChanges, setScheduleHasChanges] = useState(false);
  const [scheduleBusy, setScheduleBusy] = useState(true);
  const [hasWorkingDays, setHasWorkingDays] = useState(false);

  // Не дозволяємо залишити графік із незбереженими змінами.
  const handleScheduleFormStateChange = useCallback((hasChanges: boolean, busy: boolean, hasDays: boolean) => {
    setScheduleHasChanges(hasChanges);
    setScheduleBusy(busy);
    setHasWorkingDays(hasDays);
    setStepError("");
  }, []);

  const handleServiceFormStateChange = useCallback((hasChanges: boolean, saving: boolean) => {
    setServiceHasChanges(hasChanges);
    setServiceSaving(saving);
    setStepError("");
  }, []);

  const [photo, setPhoto] = useState<UploadedPhoto | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);

  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [profile, setProfile] = useState<ProfileFields>({
    cityId: null,
    districtId: null,
    address: "",
    about: "",
  });

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [masterId, setMasterId] = useState<number | null>(null);
  const savingRef = useRef(false);

  const [slug, setSlug] = useState(() => `master-${crypto.randomUUID()}`);

  const [profileLoading, setProfileLoading] = useState(true);
  const [profileLoadError, setProfileLoadError] = useState("");

  const [savedMaster, setSavedMaster] = useState<MasterProfileData | null>(null);

  const [portfolioPhotos, setPortfolioPhotos] = useState<PortfolioPhoto[]>([]);
  const [portfolioFiles, setPortfolioFiles] = useState<File[]>([]);
  const [portfolioError, setPortfolioError] = useState("");
  const [deletingPhotoId, setDeletingPhotoId] = useState<number | null>(null);
  const deletingPhotoRef = useRef(false);

  const handlePortfolioDelete = async (id: number) => {
    if (savingRef.current || deletingPhotoRef.current || photoUploading) return;

    deletingPhotoRef.current = true;
    setDeletingPhotoId(id);
    setPortfolioError("");

    try {
      await deletePortfolioPhoto(id);
      setPortfolioPhotos((photos) => photos.filter((photo) => photo.id !== id));
    } catch (error) {
      setPortfolioError(error instanceof Error ? error.message : "Не вдалося видалити фото. Спробуйте ще раз.");
    } finally {
      deletingPhotoRef.current = false;
      setDeletingPhotoId(null);
    }
  };

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      try {
        const [user, cities] = await Promise.all([getOwnProfile(), getCities()]);

        if (!active) return;

        setPhoto(
          user.avatarUrl
            ? {
              url: user.avatarUrl,
              publicId: user.photoId ?? "",
            }
            : null,
        );

        const master = user.master;

        // Профиля ещё нет — оставляем пустую форму для создания через POST.
        if (!master) return;

        const savedPhotos = await getMasterPortfolio(master.id);

        if (!active) return;

        setPortfolioPhotos(savedPhotos);

        const city = cities.find((item) => item.districts.some((district) => district.id === master.districtId));

        setMasterId(master.id);
        setSlug(master.slug);
        setSavedMaster(master);
        setCategoryId(master.categoryId);

        setProfile({
          cityId: city?.id ?? null,
          districtId: city ? master.districtId : null,
          address: master.address ?? "",
          about: master.about ?? "",
        });
      } catch (error) {
        if (!active) return;

        setProfileLoadError(error instanceof Error ? error.message : "Не вдалося завантажити профіль.");
      } finally {
        if (active) setProfileLoading(false);
      }
    }

    loadProfile();

    return () => {
      active = false;
    };
  }, []);

  const handleStepChange = (nextStep: number) => {
    if (savingRef.current || deletingPhotoRef.current || photoUploading || serviceSaving || (step === 3 && scheduleBusy)) return;
    if (step === 2 && serviceHasChanges) {
      setStepError("Спочатку додайте послугу або очистіть форму.");
      return;
    }
    setStepError("");
    setSaveError("");
    if (step === 3 && scheduleHasChanges) {
      setStepError("Спочатку збережіть графік або скасуйте зміни.");
      return;
    }
    if (nextStep === 3) setScheduleBusy(true);
    setStep(nextStep);
  };

  // Фінальна стрілка відкриває кабінет, але не змінює статус підписки.
  const handleFinish = () => {
    if (scheduleBusy) return;
    if (scheduleHasChanges) {
      setStepError("Спочатку збережіть графік або скасуйте зміни.");
      return;
    }
    if (!hasWorkingDays) {
      setStepError("Додайте хоча б один робочий день.");
      return;
    }
    navigate("/cabinet");
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (savingRef.current || deletingPhotoRef.current || photoUploading || profileLoading || profileLoadError) {
      return;
    }

    setSaveError("");

    if (categoryId === null || profile.cityId === null || profile.districtId === null) {
      setSaveError("Оберіть категорію, місто та район.");
      return;
    }

    if (!profile.address.trim() || !profile.about.trim()) {
      setSaveError("Заповніть адресу та інформацію про себе.");
      return;
    }

    if (portfolioFiles.length > 0 && portfolioPhotos.length + portfolioFiles.length > 10) {
      setSaveError("У портфоліо може бути не більше 10 фотографій.");
      return;
    }

    const data: MasterProfileData = {
      categoryId: categoryId,
      districtId: profile.districtId,
      slug: slug,
      about: profile.about.trim(),
      address: profile.address.trim(),

      // Начальные значения нового профиля.
      experienceYears: savedMaster?.experienceYears ?? 0,
      slotStepMin: savedMaster?.slotStepMin ?? 30,
      isBlocked: savedMaster?.isBlocked ?? false,
      latitude: savedMaster?.latitude ?? null,
      longitude: savedMaster?.longitude ?? null,
    };

    setSaving(true);
    savingRef.current = true;

    try {
      let savedId = masterId;

      if (savedId === null) {
        const createdMaster = await createMasterProfile(data, portfolioFiles);
        savedId = createdMaster.id;
        setMasterId(savedId);
      } else {
        await saveMasterProfile(data, portfolioFiles);
      }

      setSavedMaster(data);
      // Сохранение уже успешно: не отправляем эти файлы повторно.
      setPortfolioFiles([]);
      setPortfolioError("");

      try {
        const savedPhotos = await getMasterPortfolio(savedId);
        setPortfolioPhotos(savedPhotos);
      } catch {
        setPortfolioError("Профіль збережено, але не вдалося оновити фото портфоліо. Оновіть сторінку.");
      }

      setStep(2);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Не вдалося зберегти профіль.");
    } finally {
      setSaving(false);
      savingRef.current = false;
    }
  };

  if (profileLoading || profileLoadError) {
    return (
      <>
        <Header />

        <div className="px-4 py-12 text-center">
          {profileLoading ? (
            <p role="status">Завантаження профілю…</p>
          ) : (
            <>
              <p role="alert" className="text-red-500">
                {profileLoadError}
              </p>

              <button
                type="button"
                onClick={() => {
                  logout();
                  navigate("/login", { replace: true });
                }}
                className="mt-4 rounded-xl bg-black px-5 py-2 text-white"
              >
                Увійти
              </button>
            </>
          )}
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-neutral-100 flex items-center justify-center px-4 py-12">
        <div className="relative w-full max-w-md rounded-3xl bg-white px-6 pt-6 pb-12 text-black shadow">
          <StepProgress step={step} />
          {portfolioError && (
            <p role="alert" className="mb-4 text-sm text-red-500">
              {portfolioError}
            </p>
          )}

          {step === 1 && (
            <form id="master-profile-form" onSubmit={handleSubmit} aria-busy={saving}>
              <fieldset disabled={saving || deletingPhotoId !== null} className="m-0 min-w-0 border-0 p-0">
                <MasterProfileStep
                  photo={photo}
                  onPhotoChange={setPhoto}
                  uploading={photoUploading}
                  onUploadingChange={setPhotoUploading}
                  categoryId={categoryId}
                  onCategoryChange={setCategoryId}
                  profile={profile}
                  onProfileChange={setProfile}
                  portfolioPhotos={portfolioPhotos}
                  portfolioFiles={portfolioFiles}
                  onPortfolioChange={setPortfolioFiles}
                  onPortfolioDelete={handlePortfolioDelete}
                  deletingPhotoId={deletingPhotoId}
                />
              </fieldset>
              {saveError && (
                <p role="alert" className="mt-3 text-sm text-red-500">
                  {saveError}
                </p>
              )}
              {saving && (
                <p role="status" className="mt-3 text-sm text-neutral-500">
                  Збереження…
                </p>
              )}
            </form>
          )}

          {step === 2 && masterId !== null && <MasterServicesStep masterId={masterId} onFormStateChange={handleServiceFormStateChange} />}

          {step > 1 && stepError && (
            <p role="alert" className="mt-3 text-sm text-red-500">{stepError}</p>
          )}
          {step === 3 && <MasterScheduleStep onFormStateChange={handleScheduleFormStateChange} />}

          {step > 1 && (
            <button
              type="button"
              aria-label="Попередній крок"
              disabled={saving || photoUploading || deletingPhotoId !== null || serviceSaving || (step === 3 && scheduleBusy)}
              onClick={() => handleStepChange(Math.max(step - 1, 1))}
              className="absolute bottom-0 left-6 flex size-16 translate-y-1/2 items-center justify-center rounded-full bg-neutral-500/80 text-white transition hover:bg-neutral-600 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black"
            >
              <ChevronLeft size={36} strokeWidth={2} aria-hidden="true" />
            </button>
          )}

          <button
            type={step === 1 ? "submit" : "button"}
            form={step === 1 ? "master-profile-form" : undefined}
            aria-label={saving ? "Збереження профілю" : step === 3 ? "Перейти до кабінету" : "Наступний крок"}
            disabled={photoUploading || saving || deletingPhotoId !== null || serviceSaving || (step === 3 && scheduleBusy)}
            onClick={step === 2 ? () => handleStepChange(3) : step === 3 ? handleFinish : undefined}
            className="absolute bottom-0 right-6 flex size-16 translate-y-1/2 items-center justify-center rounded-full bg-neutral-500/80 text-white transition hover:bg-neutral-600 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-neutral-500/80"
          >
            <ChevronRight size={36} strokeWidth={2} aria-hidden="true" />
          </button>
        </div>
      </div>
    </>
  );
}
