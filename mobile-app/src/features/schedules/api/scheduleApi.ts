import { apiClient } from '../../../shared/api/client';
import type { Schedule, ScheduleRequest } from '../dto/schedule.dto';
import type { Holiday } from '../dto/holiday.dto';
import { cancelScheduleReminder, syncScheduleReminder } from '../../../shared/notifications/scheduleNotifications';
import { canAttemptServerRequest } from '../../../shared/api/client';
import {
  cacheServerSchedule,
  cacheServerSchedules,
  completeLocalSchedule,
  createLocalSchedule,
  deleteLocalSchedule,
  getCachedSchedule,
  getCachedOverdueSchedules,
  getCachedSchedulesBetween,
  isOfflineRetryable,
  syncPendingScheduleMutations,
  updateLocalSchedule,
} from '../offline/scheduleOfflineStore';

function nextDate(date: string, days: number) {
  const value = new Date(`${date}T12:00:00`);
  value.setDate(value.getDate() + days);
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
}

async function fetchWithOfflineFallback(
  request: () => Promise<Schedule[]>,
  from: string,
  to: string,
) {
  await syncPendingScheduleMutations();
  if (!canAttemptServerRequest()) return getCachedSchedulesBetween(from, to);
  try {
    const schedules = await request();
    await cacheServerSchedules(schedules);
    return schedules;
  } catch (error) {
    if (!isOfflineRetryable(error)) throw error;
    return getCachedSchedulesBetween(from, to);
  }
}

export async function getTodaySchedules(date: string): Promise<Schedule[]> {
  return fetchWithOfflineFallback(async () => {
    const { data } = await apiClient.get<Schedule[]>('/schedules/today', { params: { date } });
    return data;
  }, `${date}T00:00:00`, `${nextDate(date, 1)}T00:00:00`);
}

export async function getWeekSchedules(date: string): Promise<Schedule[]> {
  const value = new Date(`${date}T12:00:00`);
  const day = value.getDay() || 7;
  value.setDate(value.getDate() - day + 1);
  const monday = `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
  return fetchWithOfflineFallback(async () => {
    const { data } = await apiClient.get<Schedule[]>('/schedules/week', { params: { date } });
    return data;
  }, `${monday}T00:00:00`, `${nextDate(monday, 7)}T00:00:00`);
}

export async function getMonthSchedules(year: number, month: number): Promise<Schedule[]> {
  const from = `${year}-${String(month).padStart(2, '0')}-01`;
  const nextMonth = month === 12 ? `${year + 1}-01-01` : `${year}-${String(month + 1).padStart(2, '0')}-01`;
  return fetchWithOfflineFallback(async () => {
    const { data } = await apiClient.get<Schedule[]>('/schedules/month', { params: { year, month } });
    return data;
  }, `${from}T00:00:00`, `${nextMonth}T00:00:00`);
}

export async function getSchedule(id: number): Promise<Schedule> {
  if (id < 0) {
    const local = await getCachedSchedule(id);
    if (local) return local;
  }
  await syncPendingScheduleMutations();
  if (!canAttemptServerRequest()) {
    const local = await getCachedSchedule(id);
    if (local) return local;
  }
  try {
    const { data } = await apiClient.get<Schedule>(`/schedules/${id}`);
    await cacheServerSchedule(data);
    return data;
  } catch (error) {
    if (!isOfflineRetryable(error)) throw error;
    const local = await getCachedSchedule(id);
    if (!local) throw error;
    return local;
  }
}

export async function createSchedule(payload: ScheduleRequest): Promise<Schedule> {
  if (!canAttemptServerRequest()) {
    const local = await createLocalSchedule(payload);
    await syncScheduleReminder(local);
    return local;
  }
  try {
    const { data } = await apiClient.post<Schedule>('/schedules', payload);
    await cacheServerSchedule(data);
    await syncScheduleReminder(data);
    return data;
  } catch (error) {
    if (!isOfflineRetryable(error)) throw error;
    const local = await createLocalSchedule(payload);
    await syncScheduleReminder(local);
    return local;
  }
}

export async function getKoreanHolidays(year: number): Promise<Holiday[]> {
  const { data } = await apiClient.get<Holiday[]>('/calendar/holidays', { params: { year } });
  return data;
}

export async function getSchedulesBetween(from: string, to: string): Promise<Schedule[]> {
  return fetchWithOfflineFallback(async () => {
    const { data } = await apiClient.get<Schedule[]>('/schedules', { params: { from, to } });
    return data;
  }, from, to);
}

export async function getOverdueSchedules(before: string): Promise<Schedule[]> {
  if (!canAttemptServerRequest()) return getCachedOverdueSchedules(before);
  try {
    const { data } = await apiClient.get<Schedule[]>('/schedules/overdue', { params: { before } });
    await cacheServerSchedules(data);
    return data;
  } catch (error) {
    if (!isOfflineRetryable(error)) throw error;
    return getCachedOverdueSchedules(before);
  }
}

export async function createSchedules(payloads: ScheduleRequest[]): Promise<Schedule[]> {
  if (!canAttemptServerRequest()) {
    const local: Schedule[] = [];
    for (const payload of payloads) local.push(await createLocalSchedule(payload));
    await Promise.all(local.map(syncScheduleReminder));
    return local;
  }
  try {
    const { data } = await apiClient.post<Schedule[]>('/schedules/batch', { schedules: payloads });
    await cacheServerSchedules(data);
    await Promise.all(data.map(syncScheduleReminder));
    return data;
  } catch (error) {
    if (!isOfflineRetryable(error)) throw error;
    const local: Schedule[] = [];
    for (const payload of payloads) {
      local.push(await createLocalSchedule(payload));
    }
    await Promise.all(local.map(syncScheduleReminder));
    return local;
  }
}

export async function updateSchedule(id: number, payload: ScheduleRequest): Promise<Schedule> {
  if (id < 0) {
    const local = await updateLocalSchedule(id, payload);
    await syncScheduleReminder(local);
    return local;
  }
  if (!canAttemptServerRequest()) {
    const local = await updateLocalSchedule(id, payload);
    await syncScheduleReminder(local);
    return local;
  }
  try {
    const { data } = await apiClient.put<Schedule>(`/schedules/${id}`, payload);
    await cacheServerSchedule(data);
    await syncScheduleReminder(data);
    return data;
  } catch (error) {
    if (!isOfflineRetryable(error)) throw error;
    const local = await updateLocalSchedule(id, payload);
    await syncScheduleReminder(local);
    return local;
  }
}

export async function setScheduleCompleted(id: number, completed: boolean): Promise<Schedule> {
  if (id < 0) {
    const local = await completeLocalSchedule(id, completed);
    await syncScheduleReminder(local);
    return local;
  }
  if (!canAttemptServerRequest()) {
    const local = await completeLocalSchedule(id, completed);
    await syncScheduleReminder(local);
    return local;
  }
  try {
    const { data } = await apiClient.patch<Schedule>(`/schedules/${id}/complete`, { completed });
    await cacheServerSchedule(data);
    await syncScheduleReminder(data);
    return data;
  } catch (error) {
    if (!isOfflineRetryable(error)) throw error;
    const local = await completeLocalSchedule(id, completed);
    await syncScheduleReminder(local);
    return local;
  }
}

export async function deleteSchedule(id: number): Promise<void> {
  if (id < 0) {
    await deleteLocalSchedule(id);
  } else if (!canAttemptServerRequest()) {
    await deleteLocalSchedule(id);
  } else {
    try {
      await apiClient.delete(`/schedules/${id}`);
      await deleteLocalSchedule(id);
    } catch (error) {
      if (!isOfflineRetryable(error)) throw error;
      await deleteLocalSchedule(id);
    }
  }
  await cancelScheduleReminder(id);
}

