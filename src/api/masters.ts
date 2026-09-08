// // getMasters, getMasterBySlug, blockMaster, extendSubscription

// import { api } from "./api";

// export type MasterStatus = "active" | "expired" | "blocked";

// export type Master = {
//   id: number;
//   firstName: string;
//   lastName: string;
//   slug: string;
//   categoryName: string;
//   cityName: string;
//   status: MasterStatus;
//   tariff: "free" | "base" | "pro";
//   subscriptionUntil: string;
//   clientsCount: number;
//   rating: number;
// };