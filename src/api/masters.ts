import { api } from "./api";

export type Master = {
  id: number;
  firstName: string;
  lastName: string;
  category: string;
  city: string;
  status: "active" | "blocked";
  subscriptionUntil: string | null;
  tariff: "free" | "basic" | "pro";
  isBlocked: boolean;
  avatarUrl: string | null;
  districtName: string;
  createdAt: string;
};

export function getMasters(): Promise<Master[]> {
  return api<Master[]>("/Master");
}

export type Payment = {
  id: number;
  paidAt: string;
  amount: number;
  status: 0 | 1 | 2;
};

export type MasterDetails = Master & {
  slug: string;
  email: string;
  phone: string;
  tariffPrice: number | null;
  currency: string;
  billingPeriod: string | null;
  nextPaymentAt: string | null;
  bookingsCount: number | null;
  payments: Payment[] | null;
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
  if (master.isBlocked || master.tariff === "free" || !master.subscriptionUntil)
    return false;
  const expiresAt = new Date(master.subscriptionUntil).getTime();
  return expiresAt > now && expiresAt <= now + 27 * 60 * 60 * 1000;
}

export type SubscriptionPlan = 0 | 1 | 2;

export type SubscriptionUpdate = {
  plan?: SubscriptionPlan;
  days?: number;
};

export async function updateMasterSubscription(
  masterId: number,
  data: SubscriptionUpdate,
): Promise<void> {
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

  user: {
    firstName: string;
    lastName: string;
    createdAt?: string | null;
  };
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
    // Статус блокировки не меняется через форму мастера.
    if (key === "isBlocked") continue;

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

type CurrentUserProfile = {
  avatarUrl: string | null;
  photoId: string | null;
  master: (MasterProfileData & { id: number }) | null;
};

export async function getOwnProfile(): Promise<CurrentUserProfile> {
  const token = localStorage.getItem("token");

  if (!token) {
    throw new Error("Увійдіть у свій акаунт.");
  }

  let userId: number;

  try {
    const payload = token.split(".")[1];
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const decoded = JSON.parse(atob(padded));

    userId = Number(decoded.userId);

    if (!Number.isSafeInteger(userId) || userId <= 0) {
      throw new Error();
    }
  } catch {
    throw new Error("Увійдіть у свій акаунт повторно.");
  }

  return api<CurrentUserProfile>(`/User/${userId}`);

  
}

export type PortfolioPhoto = {
  id: number;
  photoUrl: string;
  photoId: string;
  masterId: number;
};

export async function getMasterPortfolio(masterId: number): Promise<PortfolioPhoto[]> {
  const master = await api<{ portfolioPhotos: PortfolioPhoto[] }>(
    `/Master/${masterId}`
  );

  return master.portfolioPhotos;
}