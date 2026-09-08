import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../components/admin/AdminLayout";
import { useAuth } from "../../hooks/useAuth";
import type { FinanceStats } from "../../api/stats";
import { getFinanceStats } from "../../api/stats";
import RevenueChart from "../../components/admin/RevenueChart";

export default function AdminFinancePage() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [financeStats, setFinanceStats] = useState<FinanceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchFinanceStats = async () => {
      try {
        const data = await getFinanceStats();
        setFinanceStats(data);
      } catch (err) {
        console.error(err);
        setError("Помилка при завантаженні фінансової статистики");
      } finally {
        setLoading(false);
      }
    };
    fetchFinanceStats();
  }, []);


  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const formatChange = (value: number) => {
    return `${value > 0 ? "+" : ""}${value}%`;
  };

  const changeClasses = (value: number) => {
    if (value > 0) {
      return "bg-[#D3EDCE] text-[#477B3C]";
    }

    if (value < 0) {
      return "bg-[#FFD6DE] text-[#D90000]";
    }

    return "bg-selected text-muted";
  };

  const currentMonth = new Date()
    .toLocaleDateString("uk-UA", {
      month: "long",
      year: "numeric",
    })
    .replace(/\s*р\.$/, "")
    .toUpperCase();

  return (
    <AdminLayout title="Доходи"
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
      {financeStats && (
        <section className="py-6">
          <h2 className="text-lg font-medium text-text sm:text-xl">
            ОГЛЯД ПОТОЧНОГО МІСЯЦЯ
          </h2>

          <p className="mt-1 text-sm text-muted sm:text-base">
            {currentMonth}
          </p>

          <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-7 sm:gap-x-8">
            {/* Доход */}
            <div className="relative flex min-h-28 flex-col justify-center rounded-2xl bg-surface p-4 shadow-[0_8px_24px_rgba(0,0,0,0.18)] sm:p-5">
              <span
                className={`absolute -top-3 right-0 rounded-full px-2 py-1 text-sm ${changeClasses(
                  financeStats.monthlyIncomeChange
                )}`}
              >
                {formatChange(financeStats.monthlyIncomeChange)}
              </span>

              <p className="wrap-break-word text-3xl font-semibold leading-tight text-text sm:text-4xl">
                {financeStats.monthlyIncome.toLocaleString("uk-UA")} ₴
              </p>

              <p className="mt-1 text-sm text-text sm:text-base">
                Дохід/міс
              </p>
            </div>

            {/* Новые мастера */}
            <div className="relative flex min-h-28 flex-col justify-center rounded-2xl bg-surface p-4 shadow-[0_8px_24px_rgba(0,0,0,0.18)] sm:p-5">
              <span
                className={`absolute -top-3 right-0 rounded-full px-2 py-1 text-sm ${changeClasses(
                  financeStats.newMastersChange
                )}`}
              >
                {formatChange(financeStats.newMastersChange)}
              </span>

              <p className="text-3xl font-semibold leading-tight text-text sm:text-4xl">
                {financeStats.newMasters > 0 ? "+" : ""}
                {financeStats.newMasters}
              </p>

              <p className="mt-1 text-sm text-text sm:text-base">
                Майстрів/міс
              </p>
            </div>

            {/* Переходы на платный тариф */}
            <div className="relative flex min-h-28 flex-col justify-center rounded-2xl bg-surface p-4 shadow-[0_8px_24px_rgba(0,0,0,0.18)] sm:p-5">
              <p className="text-3xl font-semibold leading-tight text-text sm:text-4xl">
                {financeStats.paidSubscriptions > 0 ? "+" : ""}
                {financeStats.paidSubscriptions}
              </p>

              <p className="mt-1 text-sm text-text sm:text-base">
                Платний тариф/
                <br />
                міс
              </p>
            </div>

            {/* Новые клиенты */}
            <div className="relative flex min-h-28 flex-col justify-center rounded-2xl bg-surface p-4 shadow-[0_8px_24px_rgba(0,0,0,0.18)] sm:p-5">
              <span
                className={`absolute -top-3 right-0 rounded-full px-2 py-1 text-sm ${changeClasses(
                  financeStats.newClientsChange
                )}`}
              >
                {formatChange(financeStats.newClientsChange)}
              </span>

              <p className="text-3xl font-semibold leading-tight text-text sm:text-4xl">
                {financeStats.newClients > 0 ? "+" : ""}
                {financeStats.newClients}
              </p>

              <p className="mt-1 text-sm text-text sm:text-base">
                Клієнтів
              </p>
            </div>
          </div>
          <div className="mt-12 pb-12">
            <h3 className="mb-5 text-sm font-medium text-muted">
              ГРАФІК ПОСТУПЛЕНЬ
            </h3>

            <RevenueChart dailyRevenue={financeStats.dailyRevenue} />
          </div>
        </section>
      )}
    </AdminLayout>
  );
}

