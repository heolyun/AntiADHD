import { apiClient } from '../../../shared/api/client';
import type { InboxItem, InboxItemRequest } from '../dto/inbox.dto';

export async function getInboxItems(): Promise<InboxItem[]> {
  const { data } = await apiClient.get<InboxItem[]>('/inbox-items');
  return data;
}

export async function createInboxItem(payload: InboxItemRequest): Promise<InboxItem> {
  const { data } = await apiClient.post<InboxItem>('/inbox-items', payload);
  return data;
}

export async function updateInboxItem(id: number, payload: InboxItemRequest): Promise<InboxItem> {
  const { data } = await apiClient.put<InboxItem>(`/inbox-items/${id}`, payload);
  return data;
}

export async function deleteInboxItem(id: number): Promise<void> {
  await apiClient.delete(`/inbox-items/${id}`);
}
