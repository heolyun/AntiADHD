import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { deleteSchedule, getSchedule, setScheduleCompleted } from '../api/scheduleApi';
import type { Schedule } from '../dto/schedule.dto';
import { getErrorMessage } from '../../../shared/utils/error';

export function useScheduleDetail(scheduleId: number) {
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setSchedule(await getSchedule(scheduleId));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [scheduleId]);

  useFocusEffect(useCallback(() => {
    refresh();
  }, [refresh]));

  async function toggleComplete() {
    if (!schedule) return;
    setSchedule(await setScheduleCompleted(schedule.id, !schedule.completed));
  }

  async function remove() {
    await deleteSchedule(scheduleId);
  }

  return { schedule, isLoading, error, refresh, toggleComplete, remove };
}

