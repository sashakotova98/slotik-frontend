import { api } from "./api";

export type TelegramBindResponse = {
  url: string;
};

export function getTelegramBindUrl(): Promise<TelegramBindResponse> {
  return api<TelegramBindResponse>("/Auth/telegramBind");
}