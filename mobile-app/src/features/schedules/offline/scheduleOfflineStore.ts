import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { apiClient, canAttemptServerRequest, markServerRetryRequested } from '../../../shared/api/client';
import type { Schedule, ScheduleRequest } from '../dto/schedule.dto';
import { cancelScheduleReminder, syncScheduleReminder } from '../../../shared/notifications/scheduleNotifications';
import { shouldServerVersionWin } from './conflictPolicy';

type CreateMutation = {
  type: 'CREATE';
  tempId: number;
  payload: ScheduleRequest;
  queuedAt: string;
};

type UpdateMutation = {
  type: 'UPDATE';
  id: number;
  payload: ScheduleRequest;
  queuedAt: string;
};

type CompleteMutation = {
  type: 'COMPLETE';
  id: number;
  completed: boolean;
  queuedAt: string;
};

type DeleteMutation = {
  type: 'DELETE';
  id: number;
  queuedAt: string;
};

export type ScheduleMutation =
  | CreateMutation
  | UpdateMutation
  | CompleteMutation
  | DeleteMutation;

type OfflineState = {
  schedules: Schedule[];
  queue: ScheduleMutation[];
  lastSyncedAt: string | null;
};

export type ScheduleSyncStatus = {
  pendingCount: number;
  isSyncing: boolean;
  lastSyncedAt: string | null;
  lastError: string | null;
};

const EMPTY_STATE: OfflineState = {
  schedules: [],
  queue: [],
  lastSyncedAt: null,
};

let owner: string | null = null;
let syncingPromise: Promise<ScheduleSyncStatus> | null = null;
let status: ScheduleSyncStatus = {
  pendingCount: 0,
  isSyncing: false,
  lastSyncedAt: null,
  lastError: null,
};
const listeners = new Set<(next: ScheduleSyncStatus) => void>();

function storageKey() {
  if (!owner) throw new Error('Offline schedule storage owner is not configured.');
  return `antiadhd.schedules.v1.${encodeURIComponent(owner.toLowerCase())}`;
}

function emit(next: Partial<ScheduleSyncStatus>) {
  status = { ...status, ...next };
  listeners.forEach((listener) => listener(status));
}

async function loadState(): Promise<OfflineState> {
  if (!owner) return EMPTY_STATE;
  const raw = await AsyncStorage.getItem(storageKey());
  if (!raw) return EMPTY_STATE;
  try {
    const parsed = JSON.parse(raw) as Partial<OfflineState>;
    return {
      schedules: Array.isArray(parsed.schedules) ? parsed.schedules : [],
      queue: Array.isArray(parsed.queue) ? parsed.queue : [],
      lastSyncedAt: typeof parsed.lastSyncedAt === 'string' ? parsed.lastSyncedAt : null,
    };
  } catch {
    return EMPTY_STATE;
  }
}

async function saveState(next: OfflineState) {
  if (!owner) return;
  await AsyncStorage.setItem(storageKey(), JSON.stringify(next));
  emit({ pendingCount: next.queue.length, lastSyncedAt: next.lastSyncedAt });
}

export async function setScheduleStorageOwner(nextOwner: string | null) {
  owner = nextOwner;
  if (!owner) {
    emit({ pendingCount: 0, lastSyncedAt: null, lastError: null, isSyncing: false });
    return;
  }
  const state = await loadState();
  emit({ pendingCount: state.queue.length, lastSyncedAt: state.lastSyncedAt, lastError: null });
}

export function subscribeScheduleSyncStatus(listener: (next: ScheduleSyncStatus) => void) {
  listeners.add(listener);
  listener(status);
  return () => {
    listeners.delete(listener);
  };
}

export function getScheduleSyncStatus() {
  return status;
}

export function isOfflineRetryable(error: unknown) {
  return axios.isAxiosError(error) && !error.response;
}

function byStartAt(a: Schedule, b: Schedule) {
  return a.startAt.localeCompare(b.startAt);
}

function mergeSchedules(current: Schedule[], incoming: Schedule[]) {
  const merged = new Map(current.map((item) => [item.id, item]));
  incoming.forEach((item) => merged.set(item.id, item));
  return [...merged.values()].sort(byStartAt);
}

export async function cacheServerSchedules(schedules: Schedule[]) {
  const state = await loadState();
  const pendingDeletedIds = new Set(
    state.queue.filter((item): item is DeleteMutation => item.type === 'DELETE').map((item) => item.id),
  );
  const safeIncoming = schedules.filter((item) => !pendingDeletedIds.has(item.id));
  await saveState({ ...state, schedules: mergeSchedules(state.schedules, safeIncoming) });
}

export async function cacheServerSchedule(schedule: Schedule) {
  await cacheServerSchedules([schedule]);
}

export async function getCachedSchedule(id: number) {
  return (await loadState()).schedules.find((item) => item.id === id) ?? null;
}

export async function getCachedSchedulesBetween(from: string, to: string) {
  const state = await loadState();
  return state.schedules
    .filter((item) => item.startAt < to && item.endAt >= from)
    .sort(byStartAt);
}

export async function getCachedOverdueSchedules(before: string) {
  const state = await loadState();
  return state.schedules
    .filter((item) => !item.completed && item.endAt < before)
    .sort(byStartAt);
}

function requestToLocalSchedule(
  id: number,
  payload: ScheduleRequest,
  existing?: Schedule,
): Schedule {
  const now = new Date().toISOString();
  return {
    id,
    title: payload.title,
    description: payload.description ?? null,
    startAt: payload.startAt,
    endAt: payload.endAt,
    color: payload.color,
    repeatType: payload.repeatType,
    category: existing?.category ?? null,
    tags: existing?.tags ?? [],
    completed: existing?.completed ?? false,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
}

export async function createLocalSchedule(payload: ScheduleRequest) {
  const state = await loadState();
  const tempId = -Date.now();
  const schedule = requestToLocalSchedule(tempId, payload);
  await saveState({
    ...state,
    schedules: mergeSchedules(state.schedules, [schedule]),
    queue: [...state.queue, { type: 'CREATE', tempId, payload, queuedAt: schedule.updatedAt }],
  });
  return schedule;
}

export async function updateLocalSchedule(id: number, payload: ScheduleRequest) {
  const state = await loadState();
  const existing = state.schedules.find((item) => item.id === id);
  if (!existing) throw new Error('저장된 일정을 찾을 수 없습니다.');
  const schedule = requestToLocalSchedule(id, payload, existing);
  let queue = state.queue;
  const createIndex = queue.findIndex((item) => item.type === 'CREATE' && item.tempId === id);
  if (createIndex >= 0) {
    queue = queue.map((item, index) =>
      index === createIndex && item.type === 'CREATE' ? { ...item, payload, queuedAt: schedule.updatedAt } : item,
    );
  } else {
    queue = [
      ...queue.filter((item) => !(item.type === 'UPDATE' && item.id === id)),
      { type: 'UPDATE', id, payload, queuedAt: schedule.updatedAt },
    ];
  }
  await saveState({
    ...state,
    schedules: state.schedules.map((item) => (item.id === id ? schedule : item)),
    queue,
  });
  return schedule;
}

export async function completeLocalSchedule(id: number, completed: boolean) {
  const state = await loadState();
  const existing = state.schedules.find((item) => item.id === id);
  if (!existing) throw new Error('저장된 일정을 찾을 수 없습니다.');
  const schedule = { ...existing, completed, updatedAt: new Date().toISOString() };
  const queue = [
    ...state.queue.filter((item) => !(item.type === 'COMPLETE' && item.id === id)),
    { type: 'COMPLETE' as const, id, completed, queuedAt: schedule.updatedAt },
  ];
  await saveState({
    ...state,
    schedules: state.schedules.map((item) => (item.id === id ? schedule : item)),
    queue,
  });
  return schedule;
}

export async function deleteLocalSchedule(id: number) {
  const state = await loadState();
  const wasLocalOnly = id < 0;
  const queue = wasLocalOnly
    ? state.queue.filter(
        (item) =>
          !(
            (item.type === 'CREATE' && item.tempId === id) ||
            ('id' in item && item.id === id)
          ),
      )
    : [
        ...state.queue.filter((item) => !('id' in item && item.id === id)),
        { type: 'DELETE' as const, id, queuedAt: new Date().toISOString() },
      ];
  await saveState({
    ...state,
    schedules: state.schedules.filter((item) => item.id !== id),
    queue,
  });
}

async function applyMutation(mutation: ScheduleMutation) {
  if (mutation.type === 'CREATE') {
    const { data } = await apiClient.post<Schedule>('/schedules', mutation.payload);
    return { created: data, tempId: mutation.tempId };
  }

  try {
    const { data: serverSchedule } = await apiClient.get<Schedule>(`/schedules/${mutation.id}`);
    if (shouldServerVersionWin(serverSchedule.updatedAt, mutation.queuedAt)) {
      return { updated: serverSchedule };
    }
  } catch (error) {
    const missing = axios.isAxiosError(error) && error.response?.status === 404;
    if (!missing) throw error;
    if (mutation.type === 'DELETE') return {};
  }

  if (mutation.type === 'UPDATE') {
    const { data } = await apiClient.put<Schedule>(`/schedules/${mutation.id}`, mutation.payload);
    return { updated: data };
  }
  if (mutation.type === 'COMPLETE') {
    const { data } = await apiClient.patch<Schedule>(`/schedules/${mutation.id}/complete`, {
      completed: mutation.completed,
    });
    return { updated: data };
  }
  try {
    await apiClient.delete(`/schedules/${mutation.id}`);
  } catch (error) {
    if (!(axios.isAxiosError(error) && error.response?.status === 404)) throw error;
  }
  return {};
}

export async function syncPendingScheduleMutations(force = false): Promise<ScheduleSyncStatus> {
  if (!owner) return status;
  if (syncingPromise) return syncingPromise;
  if (!force && !canAttemptServerRequest()) return status;
  if (force) markServerRetryRequested();

  syncingPromise = (async () => {
    emit({ isSyncing: true, lastError: null });
    let state = await loadState();

    try {
      while (state.queue.length > 0) {
        const mutation = state.queue[0];
        const result = await applyMutation(mutation);
        let schedules = state.schedules;
        let remaining = state.queue.slice(1);

        if (result.created && result.tempId !== undefined) {
          await cancelScheduleReminder(result.tempId);
          await syncScheduleReminder(result.created);
          schedules = schedules.map((item) => (item.id === result.tempId ? result.created! : item));
          remaining = remaining.map((item) => {
            if ('id' in item && item.id === result.tempId) {
              return { ...item, id: result.created!.id, queuedAt: new Date().toISOString() };
            }
            return item;
          });
        }
        if (result.updated) {
          await syncScheduleReminder(result.updated);
          schedules = schedules.map((item) => (item.id === result.updated!.id ? result.updated! : item));
          remaining = remaining.map((item) =>
            'id' in item && item.id === result.updated!.id
              ? { ...item, queuedAt: new Date().toISOString() }
              : item,
          );
        }

        state = { ...state, schedules, queue: remaining };
        await saveState(state);
      }

      const syncedAt = new Date().toISOString();
      state = { ...state, lastSyncedAt: syncedAt };
      await saveState(state);
      emit({ isSyncing: false, lastError: null, lastSyncedAt: syncedAt });
    } catch (error) {
      emit({
        isSyncing: false,
        lastError: isOfflineRetryable(error) ? '서버에 연결되면 자동으로 동기화합니다.' : '일정 동기화에 실패했습니다.',
      });
    } finally {
      syncingPromise = null;
    }
    return status;
  })();

  return syncingPromise;
}
