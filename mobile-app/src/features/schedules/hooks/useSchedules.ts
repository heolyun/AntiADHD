import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import {
  deleteSchedule,
  getMonthSchedules,
  getTodaySchedules,
  getWeekSchedules,
  setScheduleCompleted
} from '../api/scheduleApi';
import type { Schedule } from '../dto/schedule.dto';
import { getErrorMessage } from '../../../shared/utils/error';
import { toDateKey } from '../../../shared/utils/date';

type ScheduleRange = 'today' | 'week' | 'month';

export function useSchedules(range: ScheduleRange, anchorDate: Date) {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (range === 'today') {
        setSchedules(await getTodaySchedules(toDateKey(anchorDate)));
      }
      if (range === 'week') {
        setSchedules(await getWeekSchedules(toDateKey(anchorDate)));
      }
      if (range === 'month') {
        setSchedules(await getMonthSchedules(anchorDate.getFullYear(), anchorDate.getMonth() + 1));
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [anchorDate, range]);

  useFocusEffect(useCallback(() => {
    refresh();
  }, [refresh]));

  async function toggleComplete(schedule: Schedule) {
    await setScheduleCompleted(schedule.id, !schedule.completed);
    await refresh();
  }

  async function remove(id: number) {
    await deleteSchedule(id);
    await refresh();
  }

  return { schedules, isLoading, error, refresh, toggleComplete, remove };
}

