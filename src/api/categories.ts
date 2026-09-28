import { api } from "./api";

export type Category = {
  id: number;
  name: string;
  icon: string;
  mastersCount: number;
  isHiddenFromCatalog: boolean;
};

export function getAdminCategories(): Promise<Category[]> {
  return api<Category[]>("/Admin");
}

export type CategoryVisibility = {
  id: number;
  isHiddenFromCatalog: boolean;
};

export function setCategoryVisibility(id: number, isHiddenFromCatalog: boolean): Promise<CategoryVisibility> {
  return api<CategoryVisibility>(`/Admin/${id}/visibility`, {
    method: "PATCH",
    body: JSON.stringify({ isHiddenFromCatalog }),
  });
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
