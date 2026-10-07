import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ChevronRight,
  CreditCard,
  CalendarDays,
  HelpCircle,
  LogOut,
  Users,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import {
  getOwnProfile,
  type UserProfile,
} from "../../api/users";
import ProfileShareCard from "../../components/master/ProfileShareCard";

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
    to: "/support",
    label: "Підтримка",
    icon: Users,
  },
  {
    to: "/faq",
    label: "Часті запитання",
    icon: HelpCircle,
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
  }, [token, retry]);

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  const fullName = profile
    ? [profile.firstName, profile.lastName].filter(Boolean).join(" ")
    : "";

  const initials = profile
    ? `${profile.firstName?.[0] ?? ""}${profile.lastName?.[0] ?? ""}`
      .toLocaleUpperCase("uk-UA")
    : "";

  const avatarUrl = profile?.avatarUrl?.trim() || null;

  const slug = profile?.master?.slug;

  const profileUrl = slug
    ? `${window.location.origin}/m/${encodeURIComponent(slug)}`
    : "";

  return (
    <div className="mx-auto w-full max-w-md">
      <h1 className="sr-only">Мій акаунт</h1>

      <section className="rounded-[36px] bg-white px-5 py-6 shadow-lg">
        {loading ? (
          <p role="status" className="py-6 text-center text-neutral-500">
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
              <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-neutral-100">
                {avatarUrl && failedAvatar !== avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={fullName || "Фото майстра"}
                    onError={() => setFailedAvatar(avatarUrl)}
                    className="size-full object-cover"
                  />
                ) : (
                  <span className="text-lg font-semibold text-neutral-500">
                    {initials || "М"}
                  </span>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <h2 className="wrap-break-word font-semibold">
                  {fullName || "Ім’я не вказано"}
                </h2>

                {profile.phone ? (
                  <a
                    href={`tel:${profile.phone}`}
                    className="mt-1 block text-sm text-neutral-500"
                  >
                    {profile.phone}
                  </a>
                ) : (
                  <p className="mt-1 text-sm text-neutral-400">
                    Телефон не вказано
                  </p>
                )}
              </div>
            </header>

            {profileUrl ? (
              <div className="mb-5">
                <ProfileShareCard profileUrl={profileUrl} />
              </div>
            ) : (
              <p className="mb-5 rounded-xl bg-neutral-50 p-4 text-sm text-neutral-500">
                Посилання на профіль ще не створено.
              </p>
            )}
          </>
        ) : null}

        <nav
          aria-label="Налаштування акаунта"
          className="divide-y divide-neutral-200 border-t border-neutral-200"
        >
          {menuItems.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className="flex min-h-14 items-center gap-3 py-3 hover:text-blue-600"
            >
              <Icon size={20} aria-hidden="true" />

              <span className="flex-1">{label}</span>

              <ChevronRight
                size={20}
                aria-hidden="true"
                className="text-neutral-400"
              />
            </Link>
          ))}
        </nav>

        <button
          type="button"
          onClick={handleLogout}
          className="flex min-h-12 w-full items-center gap-3 border-t border-neutral-200 pt-3 text-red-600"
        >
          <LogOut size={20} aria-hidden="true" />
          Вийти з акаунту
        </button>
      </section>
    </div>
  );
}