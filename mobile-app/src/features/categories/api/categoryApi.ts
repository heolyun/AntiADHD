import { apiClient } from '../../../shared/api/client';
import type { Category, CategoryRequest } from '../dto/category.dto';

export async function getCategories(): Promise<Category[]> {
  const { data } = await apiClient.get<Category[]>('/categories');
  return data;
}

export async function createCategory(payload: CategoryRequest): Promise<Category> {
  const { data } = await apiClient.post<Category>('/categories', payload);
  return data;
}

export async function updateCategory(id: number, payload: CategoryRequest): Promise<Category> {
  const { data } = await apiClient.put<Category>(`/categories/${id}`, payload);
  return data;
}

export async function deleteCategory(id: number): Promise<void> {
  await apiClient.delete(`/categories/${id}`);
}

