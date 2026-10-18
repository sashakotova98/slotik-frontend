import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { getClientBookings } from "../../api/bookings";
import { getMasterById, type PublicMasterProfile } from "../../api/masters";

type ClientMaster = {
  profile: PublicMasterProfile;
  visits: number;
};

function visitLabel(count: number) {
  const form = new Intl.PluralRules("uk-UA").select(count);

  return form === "one"
    ? "візит"
    : form === "few"
      ? "візити"
      : "візитів";
}

export default function ClientMasters() {
  const [masters, setMasters] = useState<ClientMaster[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadMasters() {
      try {
        const bookings = await getClientBookings();
        if (!active) return;

        // Підрахунок кількості візитів для кожного майстра. map - ключ майстра, значення - кількість візитів.
        const visitsByMaster = new Map<number, number>(); // ID мастера → кількість візитів
        for (const booking of bookings) {
          if (booking.status !== 1 && booking.status !== 2) continue;
          const masterId = booking.masterId;
          const savedVisits = visitsByMaster.get(masterId);
          const visits = savedVisits ?? 0;
          visitsByMaster.set(booking.masterId, visits + (booking.status === 2 ? 1 : 0));
        }

        const requests = [...visitsByMaster].map(async ([masterId, visits]) => {  //map перетворює   Map в масив пар [ключ, значення]
          const profile = await getMasterById(masterId);

          return {
            profile: profile,
            visits: visits,
          };
        });

        const results = await Promise.allSettled(requests);
        if (!active) return;

        const loaded: ClientMaster[] = [];

        for (const result of results) {
          if (result.status === "fulfilled" && !result.value.profile.isBlocked) {
            loaded.push(result.value);
          }
        }
        setMasters(loaded);
        if (results.some((result) => result.status === "rejected")) {
          setError("Не вдалося завантажити частину майстрів. Спробуйте оновити сторінку.");
        }
      } catch {
        if (active) setError("Не вдалося завантажити ваших майстрів.");
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadMasters();
    return () => { active = false; };
  }, []);

  return (
    <section aria-labelledby="client-masters-title" className="mt-7 min-w-0">
      <h2 id="client-masters-title" className="text-xl font-semibold">Мої майстри</h2>
      {loading ? (
        <p role="status" className="mt-3 text-sm text-muted">Завантаження майстрів…</p>
      ) : (
        <>
          {error && <p role="alert" className="mt-3 text-sm text-muted">{error}</p>}
          {!error && masters.length === 0 && (
            <p className="mt-3 text-sm text-muted">
              Тут з’являться майстри, у яких ви маєте підтверджені або завершені записи.
            </p>
          )}
          <ul className="mt-3 space-y-4">
            {masters.map(({ profile, visits }) => {
              const name = [profile.firstName, profile.lastName].filter(Boolean).join(" ");
              return (
                <li key={profile.id} className="flex min-w-0 items-center gap-3">
                  {profile.avatarUrl ? (
                    <img src={profile.avatarUrl} alt="" className="size-14 shrink-0 rounded-full object-cover" />
                  ) : (
                    <span aria-hidden="true" className="flex size-14 shrink-0 items-center justify-center rounded-full bg-panel-100 text-lg text-copy-600">
                      {profile.firstName?.[0]}{profile.lastName?.[0]}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="wrap-anywhere text-sm font-medium">{name || "Майстер"}</p>
                    <p className="mt-1 wrap-anywhere text-xs leading-relaxed text-muted sm:text-sm">
                      {profile.categoryName && <>{profile.categoryName} • </>}
                      {visits} {visitLabel(visits)}
                    </p>
                  </div>
                  <Link
                    to={`/m/${encodeURIComponent(profile.slug)}`}
                    aria-label={`Запис до майстра: ${name}`}
                    className="flex min-h-11 shrink-0 items-center gap-1 rounded-lg px-1 text-sm font-medium text-blue-500 hover:text-blue-700 focus-visible:outline-2 focus-visible:outline-blue-500"
                  >
                    Запис
                    <ChevronRight aria-hidden="true" className="size-5" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </section>
  );
}