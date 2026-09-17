import { useNavigate } from "react-router-dom";
import AdminLayout from "../../components/admin/AdminLayout";
import { useAuth } from "../../hooks/useAuth";
import { useEffect, useState } from "react";
import { getMasters, type Master } from "../../api/masters";
import { MasterCard } from "../../components/admin/MasterCard";
import { MasterDetailsModal } from "../../components/admin/MasterDetailsModal";

type MasterFilter = "all" | "active" | "expired" | "blocked";

type FilterButton = {
  value: MasterFilter;
  label: string;
  count: number;
};
// - открытие существующего MasterDetailsModal по стрелке.

export default function AdminMastersPage() {

  const [search, setSearch] = useState("");

  const [masters, setMasters] = useState<Master[]>([]);
  const [mastersLoading, setMastersLoading] = useState(true);
  const [mastersError, setMastersError] = useState("");
  const [activeBtn, setActiveBtn] = useState<MasterFilter>("all");

  const [selectedMaster, setSelectedMaster] = useState<Master | null>(null);

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


  const { logout } = useAuth();
  const navigate = useNavigate();

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

  const query = search.trim().toLocaleLowerCase("uk-UA");

  const filteredMasters = masters.filter((master) => {
    const searchableText =
      `${master.firstName} ${master.lastName} ${master.category}`
        .toLocaleLowerCase("uk-UA");

    const matchesSearch = searchableText.includes(query);

    if (!matchesSearch) {
      return false;
    }

    switch (activeBtn) {
      case "all":
        return true;
      case "active":
        return !master.isBlocked && master.status === "active";
      case "expired":
        return !master.isBlocked && master.status === "expired";
      case "blocked":
        return master.isBlocked;
      default:
        return false;
    }
  });

  //describe 4 buttons with counts of masters in each category: all, active, expired, blocked

  const filters: FilterButton[] = [
    { value: "all", label: "Всі", count: masters.length },
    { value: "active", label: "Активні", count: masters.filter((m) => !m.isBlocked && m.status === "active").length },
    { value: "expired", label: "Прострочені", count: masters.filter((m) => !m.isBlocked && m.status === "expired").length },
    { value: "blocked", label: "Заблоковані", count: masters.filter((m) => m.isBlocked).length },
  ];



  return (
    <AdminLayout title="Майстри"
      action={
        <button type="button" aria-label="Вийти" title="Вийти" onClick={handleLogout}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-field hover:bg-selected transition-colors">
          <img
            src="/icons/logout.svg"
            alt=""
            className="h-5.25 w-5.25"
          />
        </button>
      }>
      <input
        type="text"
        placeholder="Ім’я, прізвище або категорія..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-6 min-h-14 w-full rounded-full bg-surface px-5 py-3 text-sm text-text shadow-md outline-none placeholder:text-muted focus:ring-2 focus:ring-border"
      />
      {mastersLoading && (
        <p className="py-6 text-muted" role="status">
          Завантаження майстрів…
        </p>
      )}

      {mastersError && (
        <p className="py-6 text-danger" role="alert">
          {mastersError}
        </p>
      )}

      <div
        role="group"
        aria-label="Фільтр майстрів за статусом"
        className="mb-8 flex flex-wrap gap-2"
      >
        {filters.map((filter) => (
          <button
            key={filter.value}
            type="button"
            onClick={() => setActiveBtn(filter.value)}
            aria-pressed={activeBtn === filter.value}
            className={`rounded-full border px-3 py-1 text-xs transition-colors ${activeBtn === filter.value
              ? "border-accent bg-accent text-on-accent"
              : "border-border bg-surface text-text hover:bg-selected"
              }`}
          >
            {filter.label}
            {filter.value !== "all" && ` • ${filter.count}`}
          </button>
        ))}
      </div>

      {!mastersLoading && !mastersError && (
        filteredMasters.length > 0 ? (
          <ul className="space-y-9">
            {filteredMasters.map((master) => (
              <li key={master.id}>
                <MasterCard
                  master={master}
                  showExpirationDate
                  onOpen={() => setSelectedMaster(master)} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="py-6 text-muted">
            {masters.length === 0
              ? "Майстрів поки немає."
              : "За вашим запитом майстрів не знайдено."}
          </p>
        )
      )}
      {selectedMaster && (
        <MasterDetailsModal
          master={selectedMaster}
          onBlockChange={handleMasterBlockChange}
          onClose={() => setSelectedMaster(null)}
        />
      )}
    </AdminLayout>
  );
}