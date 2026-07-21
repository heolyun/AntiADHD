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
import { useAsyncAction } from '../../../shared/hooks/useAsyncAction';
import { saveTodayWidgetData } from '../../widget/widgetStorage';

type ScheduleRange = 'today' | 'week' | 'month';

export function useSchedules(range: ScheduleRange, anchorDate: Date) {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mutation = useAsyncAction();
  const anchorDateKey = toDateKey(anchorDate);
  const anchorYear = anchorDate.getFullYear();
  const anchorMonth = anchorDate.getMonth() + 1;

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (range === 'today') {
        const items = await getTodaySchedules(anchorDateKey);
        setSchedules(items);
        await saveTodayWidgetData(items);
      }
      if (range === 'week') {
        setSchedules(await getWeekSchedules(anchorDateKey));
      }
      if (range === 'month') {
        setSchedules(await getMonthSchedules(anchorYear, anchorMonth));
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [anchorDateKey, anchorMonth, anchorYear, range]);

  useFocusEffect(useCallback(() => {
    refresh();
  }, [refresh]));

  async function toggleComplete(schedule: Schedule) {
    await mutation.run(async () => {
      await setScheduleCompleted(schedule.id, !schedule.completed);
      await refresh();
    });
  }

  async function remove(id: number) {
    await mutation.run(async () => {
      await deleteSchedule(id);
      await refresh();
    });
  }

  return {
    schedules,
    isLoading: isLoading || mutation.isLoading,
    error: error || mutation.error,
    refresh,
    toggleComplete,
    remove
  };
}
