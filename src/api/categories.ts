// getCategories, createCategory, updateCategory, deleteCategory
import { api } from "./api";

export type Category = {
  id: number;
  name: string;
  icon: string;
  mastersCount: number;
};

export function getCategories(): Promise<Category[]> {
  return api<Category[]>("/Category");
}

export function createCategory(name: string, icon: string): Promise<Category> {
  return api<Category>("/Category", {
    method: "POST",
    body: JSON.stringify({ name, icon }),
  });
}

export function updateCategory(id: number, name: string, icon: string): Promise<Category> {
  return api<Category>(`/Category/${id}`, {
    method: "PUT",
    body: JSON.stringify({ name, icon }),
  });
}

export function deleteCategory(id: number): Promise<void> {
  return api<void>(`/Category/${id}`, { method: "DELETE" });
}
