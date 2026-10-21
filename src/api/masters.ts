import { api } from "./api";

export type MasterTariff = "none" | "free" | "basic" | "pro";

export type Master = {
  id: number;
  firstName: string;
  lastName: string;
  category: string;
  city: string;
  status: "active" | "blocked";
  subscriptionUntil: string | null;
  tariff: MasterTariff;
  isBlocked: boolean;
  avatarUrl: string | null;
  districtName: string;
  createdAt: string;
};

// export function getMasters(): Promise<Master[]> {
//   return api<Master[]>("/Master");
// }

export function getMasters(): Promise<Master[]> {
  return api<Master[]>("/Master/admin");
}

export type Payment = {
  id: number;
  createdAt: string;
  paidAt: string | null;
  amount: number;
  currency: string;
  status: 0 | 1 | 2;
  providerStatus: string | null;
};

export type MasterDetails = Master & {
  slug: string;
  email: string;
  phone: string;
  tariffPrice: number;
  currency: string;
  billingPeriod: string | null;
  nextPaymentAt: string | null;
  bookingsCount: number;
  payments: Payment[];
};

export function getMasterDetails(id: number): Promise<MasterDetails> {
  return api<MasterDetails>(`/Admin/Master/${id}`);
}

type BlockMasterResponse = {
  message: string;
  isBlocked: boolean;
};

export function toggleMasterBlock(id: number): Promise<BlockMasterResponse> {
  return api<BlockMasterResponse>(`/Master/${id}/block`, {
    method: "PATCH",
  });
}

export function isSubscriptionExpiring(master: Master, now: number): boolean {
  const hasPaidTariff = master.tariff === "basic" || master.tariff === "pro";

  if (master.isBlocked || !hasPaidTariff || !master.subscriptionUntil) {
    return false;
  }

  const expiresAt = new Date(master.subscriptionUntil).getTime();

  return Number.isFinite(expiresAt) && expiresAt > now && expiresAt <= now + 27 * 60 * 60 * 1000;
}

export type SubscriptionPlan = 0 | 1 | 2;

export type SubscriptionUpdate = {
  plan?: SubscriptionPlan;
  days?: number;
};

export async function updateMasterSubscription(masterId: number, data: SubscriptionUpdate): Promise<void> {
  const params = new URLSearchParams();

  if (data.plan !== undefined) {
    params.set("plan", String(data.plan));
  }

  if (data.days !== undefined) {
    params.set("days", String(data.days));
  }

  await api<unknown>(`/Master/${masterId}/subscription?${params.toString()}`, {
    method: "PATCH",
  });
}

//frontend/master-profile GET /api/Master/slug/{slug}
//GET /api/Service?masterId=900001 services.ts id, serviceId, photoUrl, sortOrder
//src/api/servicePhotos.ts

export type PublicMasterProfile = {
  id: number;
  avatarUrl: string | null;
  slug: string;
  about: string | null;
  experienceYears: number;
  slotStepMin: number;
  isBlocked: boolean;
  categoryId: number;
  categoryName: string | null;
  districtId: number;
  districtName: string | null;
  cityName: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;

  firstName: string;
  lastName: string;
};
export function getMasterBySlug(slug: string): Promise<PublicMasterProfile> {
  return api<PublicMasterProfile>(`/Master/slug/${encodeURIComponent(slug)}`);
}

// Тело запроса для POST /api/Master и PUT /api/Master/{id}
export type MasterProfileData = {
  categoryId: number;
  districtId: number;
  slug: string;
  about: string | null;
  experienceYears: number;
  slotStepMin: number;
  isBlocked: boolean;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
};

function createMasterFormData(data: MasterProfileData, files: File[]): FormData {
  const formData = new FormData();

  for (const [key, value] of Object.entries(data)) {
    // Не надсилаємо статус блокування та координати. Текстову адресу зберігаємо.
    if (key === "isBlocked" || key === "latitude" || key === "longitude") {
      continue;
    }

    if (value !== null && value !== undefined) {
      formData.append(key, String(value));
    }
  }

  for (const file of files) {
    formData.append("portfolioPhotos", file);
  }

  return formData;
}

// Создание профиля авторизованного мастера.
export async function createMasterProfile(data: MasterProfileData, files: File[] = []): Promise<{ id: number }> {
  return api<{ id: number }>("/Master", {
    method: "POST",
    body: createMasterFormData(data, files),
  });
}

// Обновление профиля авторизованного мастера.
export async function saveMasterProfile(data: MasterProfileData, files: File[] = []): Promise<void> {
  await api<void>("/Master", {
    method: "PUT",
    body: createMasterFormData(data, files),
  });
}

// кнопка далі бек зберіг потом повернулись getOwnProfile() завантажив збережений файл форма заповнена
// export async function getOwnProfile(): Promise<CurrentUserProfile> {
//   const token = localStorage.getItem("token");

//   if (!token) {
//     throw new Error("Увійдіть у свій акаунт.");
//   }

//   let userId: number;

//   try {
//     const payload = token.split(".")[1];
//     const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
//     const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
//     const decoded = JSON.parse(atob(padded));

//     userId = Number(decoded.userId);

//     if (!Number.isSafeInteger(userId) || userId <= 0) {
//       throw new Error();
//     }
//   } catch {
//     throw new Error("Увійдіть у свій акаунт повторно.");
//   }

//   return api<CurrentUserProfile>(`/User/${userId}`);

// }

// Відповідь GET /api/User/me.
export type UserMe = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  role: string;
  masterId: number | null;
};

type MasterProfileResponse = MasterProfileData & {
  id: number;
  categoryName: string | null;
};

//// Об'єднані дані для MasterOnboardingPage.
type CurrentUserProfile = UserMe & {
  photoId: string | null;
  master: MasterProfileResponse | null;
};

export async function getOwnProfile(): Promise<CurrentUserProfile> {
  // api() додає токен із localStorage.
  const user = await api<UserMe>("/User/me");

  let master: MasterProfileResponse | null = null;

  if (user.masterId !== null) {
    master = await api<MasterProfileResponse>(`/Master/${user.masterId}`);
  }

  return {
    ...user,
    // Новий endpoint не повертає photoId.
    // Залишаємо null для сумісності з поточною формою.
    photoId: null,
    master,
  };
}

export type PortfolioPhoto = {
  id: number;
  photoUrl: string;
  photoId: string;
  masterId: number;
};

export async function getMasterPortfolio(masterId: number): Promise<PortfolioPhoto[]> {
  const master = await api<{ portfolioPhotos: PortfolioPhoto[] }>(`/Master/${masterId}`);

  return master.portfolioPhotos;
}

export async function deletePortfolioPhoto(id: number): Promise<void> {
  await api<{ message: string }>(`/Master/portfolio-photo/${id}`, {
    method: "DELETE",
  });
}

export type MasterLocationData = {
  districtId: number;
  address: string;
  latitude: number | null;
  longitude: number | null;
};

export async function saveMasterLocation(masterId: number, data: MasterLocationData): Promise<void> {
  await api(`/Master/${masterId}/location`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function uploadMasterPortfolio(files: File[]): Promise<PortfolioPhoto[]> {
  const formData = new FormData();

  for (const file of files) {
    formData.append("files", file);
  }

  const response = await api<{ photos: PortfolioPhoto[] }>("/Master/portfolio-photos/add", {
    method: "POST",
    body: formData,
  });

  return response.photos;
}

export function getMasterById(masterId: number): Promise<PublicMasterProfile> {
  return api<PublicMasterProfile>(`/Master/${masterId}`);
}
