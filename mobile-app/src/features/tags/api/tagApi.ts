import { apiClient } from '../../../shared/api/client';
import type { Tag, TagRequest } from '../dto/tag.dto';

export async function getTags(): Promise<Tag[]> {
  const { data } = await apiClient.get<Tag[]>('/tags');
  return data;
}

export async function createTag(payload: TagRequest): Promise<Tag> {
  const { data } = await apiClient.post<Tag>('/tags', payload);
  return data;
}

export async function updateTag(id: number, payload: TagRequest): Promise<Tag> {
  const { data } = await apiClient.put<Tag>(`/tags/${id}`, payload);
  return data;
}

export async function deleteTag(id: number): Promise<void> {
  await apiClient.delete(`/tags/${id}`);
}

