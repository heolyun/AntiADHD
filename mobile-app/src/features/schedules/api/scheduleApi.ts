import { apiClient } from '../../../shared/api/client';
import type { Schedule, ScheduleRequest } from '../dto/schedule.dto';

export async function getTodaySchedules(date: string): Promise<Schedule[]> {
  const { data } = await apiClient.get<Schedule[]>('/schedules/today', { params: { date } });
  return data;
}

export async function getWeekSchedules(date: string): Promise<Schedule[]> {
  const { data } = await apiClient.get<Schedule[]>('/schedules/week', { params: { date } });
  return data;
}

export async function getMonthSchedules(year: number, month: number): Promise<Schedule[]> {
  const { data } = await apiClient.get<Schedule[]>('/schedules/month', { params: { year, month } });
  return data;
}

export async function getSchedule(id: number): Promise<Schedule> {
  const { data } = await apiClient.get<Schedule>(`/schedules/${id}`);
  return data;
}

export async function createSchedule(payload: ScheduleRequest): Promise<Schedule> {
  const { data } = await apiClient.post<Schedule>('/schedules', payload);
  return data;
}

export async function updateSchedule(id: number, payload: ScheduleRequest): Promise<Schedule> {
  const { data } = await apiClient.put<Schedule>(`/schedules/${id}`, payload);
  return data;
}

export async function setScheduleCompleted(id: number, completed: boolean): Promise<Schedule> {
  const { data } = await apiClient.patch<Schedule>(`/schedules/${id}/complete`, { completed });
  return data;
}

export async function deleteSchedule(id: number): Promise<void> {
  await apiClient.delete(`/schedules/${id}`);
}

