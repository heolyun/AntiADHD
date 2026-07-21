import { apiClient } from '../../../shared/api/client';
import type { Schedule, ScheduleRequest } from '../dto/schedule.dto';
import type { Holiday } from '../dto/holiday.dto';
import { cancelScheduleReminder, syncScheduleReminder } from '../../../shared/notifications/scheduleNotifications';

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
  await syncScheduleReminder(data);
  return data;
}

export async function getKoreanHolidays(year: number): Promise<Holiday[]> {
  const { data } = await apiClient.get<Holiday[]>('/calendar/holidays', { params: { year } });
  return data;
}

export async function getSchedulesBetween(from: string, to: string): Promise<Schedule[]> {
  const { data } = await apiClient.get<Schedule[]>('/schedules', { params: { from, to } });
  return data;
}

export async function getOverdueSchedules(before: string): Promise<Schedule[]> {
  const { data } = await apiClient.get<Schedule[]>('/schedules/overdue', { params: { before } });
  return data;
}

export async function createSchedules(payloads: ScheduleRequest[]): Promise<Schedule[]> {
  const { data } = await apiClient.post<Schedule[]>('/schedules/batch', { schedules: payloads });
  await Promise.all(data.map(syncScheduleReminder));
  return data;
}

export async function updateSchedule(id: number, payload: ScheduleRequest): Promise<Schedule> {
  const { data } = await apiClient.put<Schedule>(`/schedules/${id}`, payload);
  await syncScheduleReminder(data);
  return data;
}

export async function setScheduleCompleted(id: number, completed: boolean): Promise<Schedule> {
  const { data } = await apiClient.patch<Schedule>(`/schedules/${id}/complete`, { completed });
  await syncScheduleReminder(data);
  return data;
}

export async function deleteSchedule(id: number): Promise<void> {
  await apiClient.delete(`/schedules/${id}`);
  await cancelScheduleReminder(id);
}

