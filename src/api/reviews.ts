import { api } from "./api";

//GET /api/Review/master/me - для мастера
//GET /api/Review/master/900032 для публічного перегляду відгуків конкретного майстра

// Один відгук у відповіді бека.
export type MasterReview = {
  id: number;
  rating: number;
  text: string | null;
  createdAt: string | null;
  clientFirstName: string | null;
  clientAvatarUrl: string | null;
  serviceName: string;
  durationMin: number | null;
  price: number | null;
  startsAt: string | null;
  endsAt: string | null;
  reply: string | null;
};

// Список відгуків разом із загальною оцінкою.
export type ReviewsResponse = {
  averageRating: number;
  totalCount: number;
  reviews: MasterReview[];
};

// Відгуки авторизованого майстра для його кабінету.
export async function getMasterReviews(): Promise<ReviewsResponse> {
  return api<ReviewsResponse>("/Review/master/me");
}

// Публічні відгуки конкретного майстра. Вхід не потрібен.
export async function getPublicMasterReviews(masterId: number): Promise<ReviewsResponse> {
  return api<ReviewsResponse>(`/Review/master/${masterId}`);
}

// Відповідь бека після збереження відповіді майстра.
export type ReviewReplyResponse = {
  reviewId: number;
  reply: string;
  reviewUpdatedAt: string;
};

// Створити або змінити відповідь на власний відгук.
// Бек очікує JSON-рядок, а не об'єкт { text }.
export async function saveReviewReply(reviewId: number, text: string): Promise<ReviewReplyResponse> {
  return api<ReviewReplyResponse>(`/Review/${reviewId}/reply`, {
    method: "PUT",
    body: JSON.stringify(text),
  });
}

