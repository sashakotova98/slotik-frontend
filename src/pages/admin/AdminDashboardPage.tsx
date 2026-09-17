import { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useNavigate, Link } from "react-router-dom";
import AdminLayout from "../../components/admin/AdminLayout";
import { getAdminStats } from "../../api/stats";
import type { AdminStats } from "../../api/stats";
import type { Master } from "../../api/masters";
import { MasterCard } from "../../components/admin/MasterCard";
import { getMasters } from "../../api/masters";
import { LayoutGrid, ChevronRight } from "lucide-react";
import { getAdminCategories } from "../../api/categories";
import { MasterDetailsModal } from "../../components/admin/MasterDetailsModal";


export default function AdminDashboardPage() {

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [masters, setMasters] = useState<Master[]>([]);
  const [mastersLoading, setMastersLoading] = useState(true);
  const [mastersError, setMastersError] = useState("");

  const [categoriesCount, setCategoriesCount] = useState<number | null>(null);

  const [selectedMaster, setSelectedMaster] = useState<Master | null>(null);

  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getAdminStats();
        setStats(data);
      } catch (err) {
        console.error(err);
        setError("Помилка при завантаженні статистики");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  useEffect(() => {
    const fetchMasters = async () => {
      try {
        const data = await getMasters();
        setMasters(data);
      } catch (err) {
        console.error(err);
        setMastersError("Помилка при завантаженні списку майстрів");
      } finally {
        setMastersLoading(false);
      }
    };
    fetchMasters();
  }, []);

  useEffect(() => {
    const fetchCategoriesCount = async () => {
      try {
        const data = await getAdminCategories();
        setCategoriesCount(data.length);
      } catch (err) {
        console.error(err);
        setCategoriesCount(null);
      }
    };

    fetchCategoriesCount();
  }, []);

  function handleMasterBlockChange(id: number, isBlocked: boolean) {
    setMasters((previous) =>
      previous.map((item) => item.id === id ? { ...item, isBlocked } : item)
    );
    setSelectedMaster((previous) =>
      previous?.id === id ? { ...previous, isBlocked } : previous
    );
  }

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };


  const now = Date.now();
  const day = 1000 * 60 * 60 * 24; //24 години 60 хвилин 60 секунд 1000 мілісекунд

  // «Нові» тільки перші 7 днів після реєстрації

  const newMasters = masters.filter((master) => {
    const createdAt = new Date(master.createdAt).getTime();
    return createdAt <= now && createdAt >= now - 7 * day;
  })
    .sort((a, b) => {
      return (
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    });

  // ПІДПИСКА ЗАВЕРШУЄТЬСЯ коли до поточного терміну залишається 48 годин.

  const expiringMasters = masters.filter((master) => {
    if (
      master.isBlocked ||
      master.tariff === "free" ||
      !master.subscriptionUntil
    ) {
      return false;
    }

    const expiresAt = new Date(master.subscriptionUntil).getTime();
    return expiresAt > now && expiresAt <= now + 2 * day;
  }).sort(
    (a, b) =>
      new Date(a.subscriptionUntil!).getTime() - new Date(b.subscriptionUntil!).getTime()
  );


  return (
    <AdminLayout
      title="Дашборд"
      action={
        <button type="button" aria-label="Вийти" title="Вийти" onClick={handleLogout}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-field hover:bg-selected transition-colors">
          <img
            src="/icons/logout.svg"
            alt=""
            className="h-5.25 w-5.25"
          />
        </button>
      }
    >
      <div className="w-full pb-12">
        {loading && (
          <p className="py-8 text-muted" role="status">
            Завантаження статистики…
          </p>
        )}

        {error && (
          <p className="py-8 text-danger" role="alert">
            {error}
          </p>
        )}
        {stats && (
          <div className="grid grid-cols-2 gap-x-6 gap-y-6 pt-4 pb-12 text-left lg:gap-8 lg:pt-8">
            <div>
              <p className="text-4xl font-semibold text-text">
                {stats.mastersTotal}
              </p>
              <p className="mt-1 text-sm text-text">Майстрів усього</p>
            </div>

            <div>
              <p className="text-4xl font-semibold text-text">
                {stats.activeSubscriptions}
              </p>
              <p className="mt-1 text-sm text-text">Активних підписок</p>
            </div>

            <div>
              <p className="text-4xl font-semibold text-text">
                {stats.revenueTotal} ₴
              </p>
              <p className="mt-1 text-sm text-text">Дохід/міс</p>
            </div>

            <div>
              <p className="text-4xl font-semibold text-text">
                {stats.bookingsTotal}
              </p>
              <p className="mt-1 text-sm text-text">Записів</p>
            </div>
          </div>
        )}
        <section className="pb-6" aria-labelledby="events-title">
          <h2
            id="events-title"
            className="text-xl font-medium uppercase text-text md:text-2xl"
          >
            Останні події
          </h2>

          {mastersLoading && (
            <p className="py-6 text-sm text-muted" role="status">
              Завантаження майстрів…
            </p>
          )}

          {mastersError && (
            <p className="py-6 text-sm text-danger" role="alert">
              {mastersError}
            </p>
          )}

          {!mastersLoading && !mastersError && (
            <>
              <h3 className="mt-3 inline-block rounded-full bg-selected px-3 py-0.5 text-xs font-normal uppercase text-text lg:mt-4 lg:px-4 lg:py-1 lg:text-base">
                Нові
              </h3>

              {newMasters.length > 0 ? (
                <ul className="mt-7 space-y-9">
                  {newMasters.map((master) => (
                    <li key={master.id}>
                      <MasterCard
                        master={master}
                        showCreatedAt
                        onOpen={() => setSelectedMaster(master)}
                      />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="py-6 text-sm text-muted">
                  Нових майстрів за останні 7 днів немає.
                </p>
              )}

              <h3 className="mt-8 inline-block rounded-full bg-selected px-3 py-0.5 text-xs font-normal uppercase text-text lg:mt-10 lg:px-4 lg:py-1 lg:text-base">
                Підписка завершується
              </h3>

              {expiringMasters.length > 0 ? (
                <ul className="mt-7 space-y-9">
                  {expiringMasters.map((master) => (
                    <li key={master.id}>
                      <MasterCard
                        master={master}
                        showRemainingTime
                        onOpen={() => setSelectedMaster(master)}
                      />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="py-6 text-sm text-muted">
                  Немає підписок, які завершуються протягом 48 годин.
                </p>
              )}
            </>
          )}
        </section>
        <div className="mt-8 border-t border-border pt-6 pb-12">
          <Link
            to="/admin/categories"
            className="flex min-h-20 w-full items-center gap-4 rounded-2xl bg-selected/50 px-4 py-4 transition-colors hover:bg-selected"
          >
            <LayoutGrid
              size={38}
              strokeWidth={1.7}
              className="shrink-0 text-muted"
              aria-hidden="true"
            />

            <span className="min-w-0 flex-1">
              <span className="block text-xl font-medium uppercase text-text md:text-2xl">
                Категорії
              </span>

              {categoriesCount !== null && stats && (
                <span className="block text-xs text-muted md:text-sm">
                  Категорій: {categoriesCount} • Майстрів: {stats.mastersTotal}
                </span>
              )}
            </span>

            <ChevronRight
              size={26}
              strokeWidth={1.5}
              className="shrink-0 text-muted"
              aria-hidden="true"
            />
          </Link>
          {selectedMaster && (
            <MasterDetailsModal
              master={selectedMaster}
              onBlockChange={handleMasterBlockChange}
              onClose={() => setSelectedMaster(null)}
            />
          )}
        </div>
      </div>
    </AdminLayout>
  );
}