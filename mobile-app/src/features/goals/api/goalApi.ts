import { apiClient } from '../../../shared/api/client';
import type { Goal, GoalRequest } from '../dto/goal.dto';

export async function getGoals(): Promise<Goal[]> {
  const { data } = await apiClient.get<Goal[]>('/goals');
  return data;
}

export async function createGoal(payload: GoalRequest): Promise<Goal> {
  const { data } = await apiClient.post<Goal>('/goals', payload);
  return data;
}

export async function updateGoal(id: number, payload: GoalRequest): Promise<Goal> {
  const { data } = await apiClient.put<Goal>(`/goals/${id}`, payload);
  return data;
}

export async function deleteGoal(id: number): Promise<void> {
  await apiClient.delete(`/goals/${id}`);
}

