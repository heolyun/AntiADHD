import { apiClient } from '../../../shared/api/client';
import type { FocusCompleteRequest, FocusSession, FocusSessionRequest } from '../dto/focus.dto';

export async function getFocusSessions(): Promise<FocusSession[]> {
  const { data } = await apiClient.get<FocusSession[]>('/focus-sessions');
  return data;
}

export async function createFocusSession(payload: FocusSessionRequest): Promise<FocusSession> {
  const { data } = await apiClient.post<FocusSession>('/focus-sessions', payload);
  return data;
}

export async function updateFocusSession(id: number, payload: FocusSessionRequest): Promise<FocusSession> {
  const { data } = await apiClient.put<FocusSession>(`/focus-sessions/${id}`, payload);
  return data;
}

export async function completeFocusSession(id: number, payload: FocusCompleteRequest): Promise<FocusSession> {
  const { data } = await apiClient.patch<FocusSession>(`/focus-sessions/${id}/complete`, payload);
  return data;
}

export async function deleteFocusSession(id: number): Promise<void> {
  await apiClient.delete(`/focus-sessions/${id}`);
}

