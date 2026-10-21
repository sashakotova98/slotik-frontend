import { startTransition, useEffect, useRef, useState, type ChangeEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CalendarDays, Camera, ChevronRight, HelpCircle, LoaderCircle, LogOut, Send, UserRound, Users } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { getOwnProfile, type UserProfile } from "../../api/users";
import { apiDeletePhoto, apiUploadPhoto } from "../../api/photos";

const menuItems = [
  { to: "/client/account/bookings", label: "Ваші записи", icon: CalendarDays },
  { to: "/support", label: "Підтримка", icon: Users },
  { to: "/faq", label: "Часті запитання", icon: HelpCircle },
];

export default function ClientAccountPage() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [failedAvatar, setFailedAvatar] = useState<string | null>(null);
  const photoInput = useRef<HTMLInputElement>(null);
  const uploadInProgress = useRef(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [photoError, setPhotoError] = useState("");
  const [photoMessage, setPhotoMessage] = useState("");

  async function handleDeletePhoto() {
    if (!profile?.avatarUrl || uploadInProgress.current) return;
    uploadInProgress.current = true;
    setDeleting(true);
    setPhotoError("");
    setPhotoMessage("");
    try {
      await apiDeletePhoto();
      setProfile((current) => current ? { ...current, avatarUrl: null } : current);
      setFailedAvatar(null);
      setPhotoMessage("Фото видалено.");
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : "Не вдалося видалити фото. Спробуйте ще раз.");
    } finally {
      uploadInProgress.current = false;
      setDeleting(false);
    }
  }

  async function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file || !profile || uploadInProgress.current) return;
    setPhotoError("");
    setPhotoMessage("");
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setPhotoError("Оберіть фото у форматі JPG, PNG або WebP.");
      return;
    }
    if (file.size === 0 || file.size > 5 * 1024 * 1024) {
      setPhotoError("Фото має бути непорожнім і не перевищувати 5 МБ.");
      return;
    }
    uploadInProgress.current = true;
    setUploading(true);
    try {
      const photo = await apiUploadPhoto(file);
      setProfile((current) => current ? { ...current, avatarUrl: photo.url } : current);
      setFailedAvatar(null);
      setPhotoMessage("Фото збережено.");
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : "Не вдалося завантажити фото. Спробуйте ще раз.");
    } finally {
      uploadInProgress.current = false;
      setUploading(false);
    }
  }

  useEffect(() => {
    let active = true;
    async function loadProfile() {
      setLoading(true);
      setError("");
      setProfile(null);
      try {
        if (!token) throw new Error("Увійдіть у свій акаунт повторно.");
        const data = await getOwnProfile(token);
        if (active) setProfile(data);
      } catch {
        if (active) setError("Не вдалося завантажити профіль.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void loadProfile();
    return () => {
      active = false;
    };
  }, [token, retry]);

  function handleLogout() {
    startTransition(() => {
      logout();
      navigate("/home", { replace: true });
    });
  }

  const name = [profile?.firstName, profile?.lastName].filter(Boolean).join(" ") || "Ваш профіль";
  const avatar = profile?.avatarUrl?.trim();
  const initials = [profile?.firstName, profile?.lastName]
    .filter(Boolean)
    .map((part) => part?.trim().charAt(0))
    .join("");

  return (
    <section
      aria-labelledby="client-account-title"
      className="mx-auto w-full max-w-md rounded-4xl border border-border/40 bg-surface px-4 py-3 text-text shadow-[0_4px_12px_rgba(0,0,0,0.16)] sm:px-6"
    >
      <h1 id="client-account-title" className="sr-only">
        Налаштування акаунта
      </h1>
      <div className="flex min-h-24 items-center gap-3 py-4">
        <div className="relative shrink-0">
        <input ref={photoInput} type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
          aria-label="Оберіть фото профілю" onChange={(event) => void handlePhotoChange(event)} disabled={uploading || deleting || !profile} />
        <button type="button" onClick={() => photoInput.current?.click()} disabled={uploading || deleting || !profile}
          aria-label={uploading ? "Завантаження фото" : "Змінити фото профілю"}
          title="Змінити фото — JPG, PNG або WebP до 5 МБ"
          className="relative block rounded-full focus-visible:outline-2 focus-visible:outline-offset-4 disabled:cursor-not-allowed">
        <span className="flex size-14 items-center justify-center overflow-hidden rounded-full bg-panel-200 text-lg font-semibold text-copy-700">
          {avatar && failedAvatar !== avatar ? (
            <img src={avatar} alt="" onError={() => setFailedAvatar(avatar)} className="size-full object-cover" />
          ) : initials ? (
            initials
          ) : (
            <UserRound aria-hidden="true" size={26} />
          )}
        </span>
        <span className="absolute -right-1 -bottom-1 flex size-7 items-center justify-center rounded-full border-2 border-surface bg-accent text-on-accent">
          {uploading ? <LoaderCircle aria-hidden="true" size={15} className="animate-spin motion-reduce:animate-none" /> : <Camera aria-hidden="true" size={15} />}
        </span>
        </button>
        </div>
        <div className="min-w-0 flex-1">
          {loading ? (
            <p role="status" className="text-sm text-muted">
              Завантаження профілю…
            </p>
          ) : error ? (
            <>
              <p role="alert" className="text-sm text-danger">
                {error}
              </p>
              <button
                type="button"
                onClick={() => setRetry((value) => value + 1)}
                className="min-h-11 text-sm underline focus-visible:outline-2"
              >
                Спробувати ще раз
              </button>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold wrap-anywhere">{name}</p>
              <p className="mt-1 text-xs text-copy-500 wrap-anywhere">{profile?.phone || "Телефон не вказано"}</p>
              {avatar && (
                <button type="button" onClick={() => void handleDeletePhoto()} disabled={uploading || deleting}
                  className="min-h-11 rounded text-xs text-danger underline focus-visible:outline-2 disabled:cursor-not-allowed disabled:opacity-50">
                  {deleting ? "Видалення…" : "Видалити фото"}
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {photoError && <p role="alert" className="mb-3 text-sm text-danger">{photoError}</p>}
      <p role="status" className="text-xs text-copy-500">
        {uploading ? "Завантаження фото…" : deleting ? "Видалення фото…" : photoMessage}
      </p>
      <div className="divide-y divide-border border-t border-border">
        <button type="button" disabled className="flex min-h-16 w-full cursor-not-allowed items-center gap-3 py-3 text-left text-muted">
          <Send aria-hidden="true" size={19} className="shrink-0" />
          <span className="flex-1 text-sm">Нагадування в Telegram</span>
          <span className="rounded-full bg-panel-100 px-2 py-1 text-[10px]">Незабаром</span>
        </button>
        {menuItems.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className="flex min-h-16 items-center gap-3 rounded-lg py-3 text-sm transition-colors hover:bg-panel-50 focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            <Icon aria-hidden="true" size={19} className="shrink-0" />
            <span className="flex-1">{label}</span>
            <ChevronRight aria-hidden="true" size={19} className="text-muted" />
          </Link>
        ))}
        <button
          type="button"
          onClick={handleLogout}
          className="flex min-h-16 w-full items-center gap-3 rounded-lg py-3 text-left text-sm text-danger hover:bg-panel-50 focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          <LogOut size={19} aria-hidden="true" />
          Вийти з акаунту
        </button>
      </div>
    </section>
  );
}
