import { useEffect, useState, useRef, startTransition, type ChangeEvent } from "react";
// import { flushSync } from "react-dom";
import { Link, useNavigate } from "react-router-dom";
import { ChevronRight, CreditCard, CalendarDays, HelpCircle, LogOut, Users, MapPin, Images, Scissors } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { ApiError } from "../../api/api";
import { getOwnProfile, type UserProfile } from "../../api/users";
import ProfileShareCard from "../../components/master/ProfileShareCard";
import { apiDeletePhoto, apiUploadPhoto } from "../../api/photos";
import TelegramBinding from "../../components/TelegramBinding";

const menuItems = [
  {
    to: "/cabinet/account/tariff",
    label: "Тариф",
    icon: CreditCard,
  },
  {
    to: "/cabinet/account/bookings",
    label: "Ваші записи",
    icon: CalendarDays,
  },
  {
    to: "/cabinet/account/services",
    label: "Мої послуги",
    icon: Scissors,
  },
  {
    to: "/cabinet/account/portfolio",
    label: "Портфоліо",
    icon: Images,
  },
  {
    to: "/support",
    label: "Підтримка",
    icon: Users,
  },
  {
    to: "/faq",
    label: "Часті запитання",
    icon: HelpCircle,
  },
  {
    to: "/cabinet/account/location",
    label: "Адреса та місце прийому",
    icon: MapPin,
  },
];

export default function MasterAccountPage() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [failedAvatar, setFailedAvatar] = useState<string | null>(null);
  const photoInput = useRef<HTMLInputElement>(null);
  const photoInFlight = useRef(false);
  const [photoAction, setPhotoAction] = useState<"upload" | "delete" | null>(null);
  const [photoError, setPhotoError] = useState("");
  const [photoMessage, setPhotoMessage] = useState("");

  async function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file || !profile || photoInFlight.current) return;
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
    photoInFlight.current = true;
    setPhotoAction("upload");
    try {
      const result = await apiUploadPhoto(file);
      setProfile((current) => current ? { ...current, avatarUrl: result.url } : current);
      setFailedAvatar(null);
      setPhotoMessage("Фото збережено.");
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : "Не вдалося завантажити фото.");
    } finally {
      photoInFlight.current = false;
      setPhotoAction(null);
    }
  }

  async function handleDeletePhoto() {
    if (!profile?.avatarUrl || photoInFlight.current) return;
    photoInFlight.current = true;
    setPhotoAction("delete");
    setPhotoError("");
    setPhotoMessage("");
    try {
      await apiDeletePhoto();
      setProfile((current) => current ? { ...current, avatarUrl: null } : current);
      setFailedAvatar(null);
      setPhotoMessage("Фото видалено.");
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : "Не вдалося видалити фото.");
    } finally {
      photoInFlight.current = false;
      setPhotoAction(null);
    }
  }

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      if (!token) {
        if (active) {
          setError("Увійдіть у свій акаунт.");
          setLoading(false);
        }
        return;
      }

      try {
        const result = await getOwnProfile(token);

        if (active) {
          setProfile(result);
          setError("");
        }
      } catch (error) {
        if (active) {
          setError(error instanceof ApiError ? error.message : "Не вдалося завантажити профіль.");
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
  }, [token, retry]);

  function handleLogout() {
    if (photoInFlight.current) return;
    startTransition(() => {
      logout();
      navigate("/home", { replace: true });
    });
  }

  const fullName = profile ? [profile.firstName, profile.lastName].filter(Boolean).join(" ") : "";

  const initials = profile ? `${profile.firstName?.[0] ?? ""}${profile.lastName?.[0] ?? ""}`.toLocaleUpperCase("uk-UA") : "";

  const avatarUrl = profile?.avatarUrl?.trim() || null;

  const slug = profile?.master?.slug;

  const profileUrl = slug ? `${window.location.origin}/m/${encodeURIComponent(slug)}` : "";

  return (
    <div className="mx-auto w-full max-w-md">
      <h1 className="sr-only">Мій акаунт</h1>

      <section className="rounded-[36px] bg-surface px-5 py-6 shadow-lg">
        {loading ? (
          <p role="status" className="py-6 text-center text-copy-500">
            Завантажуємо профіль…
          </p>
        ) : error ? (
          <div role="alert" className="rounded-xl bg-red-50 p-4">
            <p className="text-sm text-red-600">{error}</p>

            <button
              type="button"
              onClick={() => {
                setLoading(true);
                setError("");
                setRetry((value) => value + 1);
              }}
              className="mt-2 min-h-10 text-sm font-medium text-red-700"
            >
              Спробувати ще раз
            </button>
          </div>
        ) : profile ? (
          <>
            <header className="mb-5 flex items-center gap-3">
              <input ref={photoInput} type="file" accept="image/jpeg,image/png,image/webp"
                aria-label="Оберіть фото профілю" className="hidden" disabled={photoAction !== null}
                onChange={(event) => void handlePhotoChange(event)} />
              <button type="button" aria-label={avatarUrl ? "Змінити фото профілю" : "Додати фото профілю"}
                disabled={photoAction !== null} onClick={() => photoInput.current?.click()}
                className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-panel-100 focus-visible:outline-2 focus-visible:outline-offset-4 disabled:opacity-50">
                {avatarUrl && failedAvatar !== avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={fullName || "Фото майстра"}
                    onError={() => setFailedAvatar(avatarUrl)}
                    className="size-full object-cover"
                  />
                ) : (
                  <span className="text-lg font-semibold text-copy-500">{initials || "М"}</span>
                )}
              </button>

              <div className="min-w-0 flex-1">
                <h2 className="wrap-break-word font-semibold">{fullName || "Ім’я не вказано"}</h2>

                {profile.phone ? (
                  <a href={`tel:${profile.phone}`} className="mt-1 block text-sm text-copy-500">
                    {profile.phone}
                  </a>
                ) : (
                  <p className="mt-1 text-sm text-copy-400">Телефон не вказано</p>
                )}
                <div className="mt-1 flex flex-wrap gap-x-4">
                  <button type="button" disabled={photoAction !== null} onClick={() => photoInput.current?.click()}
                    className="min-h-11 text-sm text-blue-600 underline disabled:opacity-50">
                    {avatarUrl ? "Змінити фото" : "Додати фото"}
                  </button>
                  {avatarUrl && (
                    <button type="button" disabled={photoAction !== null} onClick={() => void handleDeletePhoto()}
                      className="min-h-11 text-sm text-danger underline disabled:opacity-50">Видалити фото</button>
                  )}
                </div>
              </div>
            </header>

            {photoError && <p role="alert" className="mb-3 text-sm text-danger">{photoError}</p>}
            <p role="status" className="mb-3 text-sm text-copy-500">
              {photoAction === "upload" ? "Завантаження фото…" : photoAction === "delete" ? "Видалення фото…" : photoMessage}
            </p>

            {profileUrl ? (
              <div className="mb-5">
                <ProfileShareCard profileUrl={profileUrl} />
              </div>
            ) : (
              <p className="mb-5 rounded-xl bg-panel-50 p-4 text-sm text-copy-500">Посилання на профіль ще не створено.</p>
            )}
          </>
        ) : null}

        <nav aria-label="Налаштування акаунта" className="divide-y divide-border border-t border-border">
          <TelegramBinding
            key={token}
            description="Підключіть Telegram, щоб отримувати повідомлення про нові записи клієнтів."
          />
          {menuItems.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to} className="flex min-h-14 items-center gap-3 py-3 hover:text-blue-600">
              <Icon size={20} aria-hidden="true" />

              <span className="flex-1">{label}</span>

              <ChevronRight size={20} aria-hidden="true" className="text-copy-400" />
            </Link>
          ))}
        </nav>

        <button
          type="button"
          onClick={handleLogout}
          className="flex min-h-12 w-full items-center gap-3 border-t border-border pt-3 text-red-600"
        >
          <LogOut size={20} aria-hidden="true" />
          Вийти з акаунту
        </button>
      </section>
    </div>
  );
}


