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
  monthlyIncome: number;
  monthlyIncomeChange: number;
  newMasters: number; 
  newMastersChange: number;
  newClients: number; 
  newClientsChange: number;
  paidSubscriptions: number;
  dailyRevenue: { day: number; amount: number }[]; 
};

// GET /api/Admin/finance
export function getFinanceStats(): Promise<FinanceStats> {
  return api<FinanceStats>("/Admin/finance");
}
