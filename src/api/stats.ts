import { api } from "./api";

export type AdminStats = {
  mastersTotal: number;
  activeSubscriptions: number;
  revenueTotal: number;
  bookingsTotal: number;
};

// GET /api/Admin/stats
export function getAdminStats(): Promise<AdminStats> {
  return api<AdminStats>("/Admin/stats");
}


export type FinanceStats = {
  monthlyIncome: number; // дохід за місяць
  monthlyIncomeChange: number; // % зміни до минулого місяця
  newMasters: number; // нових майстрів за місяць
  newMastersChange: number; // %
  newClients: number; // нових клієнтів за місяць
  newClientsChange: number;
  paidSubscriptions: number; // перейшли на платний тариф
  dailyRevenue: { day: number; amount: number }[]; // графік по днях
};

// GET /api/Admin/finance
export function getFinanceStats(): Promise<FinanceStats> {
  return api<FinanceStats>("/Admin/finance");
}
