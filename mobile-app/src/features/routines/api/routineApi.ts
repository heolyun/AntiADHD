import { apiClient } from '../../../shared/api/client';
import type { Routine, RoutineRequest } from '../dto/routine.dto';

export async function getRoutines(): Promise<Routine[]> {
  const { data } = await apiClient.get<Routine[]>('/routines');
  return data;
}

export async function createRoutine(payload: RoutineRequest): Promise<Routine> {
  const { data } = await apiClient.post<Routine>('/routines', payload);
  return data;
}

export async function updateRoutine(id: number, payload: RoutineRequest): Promise<Routine> {
  const { data } = await apiClient.put<Routine>(`/routines/${id}`, payload);
  return data;
}

export async function deleteRoutine(id: number): Promise<void> {
  await apiClient.delete(`/routines/${id}`);
}

