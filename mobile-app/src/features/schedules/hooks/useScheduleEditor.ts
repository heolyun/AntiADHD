import { useEffect, useState } from 'react';
import { createSchedule, getSchedule, updateSchedule } from '../api/scheduleApi';
import { scheduleColors } from '../../../shared/constants/theme';
import type { RepeatType, ScheduleRequest } from '../dto/schedule.dto';
import { toLocalDateTimeValue } from '../../../shared/utils/date';
import { getErrorMessage } from '../../../shared/utils/error';

type FormState = {
  title: string;
  description: string;
  startAt: string;
  endAt: string;
  color: string;
  repeatType: RepeatType;
};

function initialForm(): FormState {
  const start = new Date();
  start.setHours(start.getHours() + 1, 0, 0, 0);
  const end = new Date(start);
  end.setHours(end.getHours() + 1);
  return {
    title: '',
    description: '',
    startAt: toLocalDateTimeValue(start),
    endAt: toLocalDateTimeValue(end),
    color: scheduleColors[0],
    repeatType: 'NONE'
  };
}

export function useScheduleEditor(scheduleId?: number) {
  const [form, setForm] = useState<FormState>(initialForm);
  const [isLoading, setIsLoading] = useState(Boolean(scheduleId));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!scheduleId) return;
      setIsLoading(true);
      try {
        const schedule = await getSchedule(scheduleId);
        setForm({
          title: schedule.title,
          description: schedule.description || '',
          startAt: schedule.startAt.slice(0, 19),
          endAt: schedule.endAt.slice(0, 19),
          color: schedule.color,
          repeatType: schedule.repeatType
        });
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
    }

    load();
  }, [scheduleId]);

  async function save() {
    setIsSaving(true);
    setError(null);
    try {
      const payload: ScheduleRequest = {
        title: form.title.trim(),
        description: form.description.trim(),
        startAt: form.startAt,
        endAt: form.endAt,
        color: form.color,
        repeatType: form.repeatType
      };

      if (scheduleId) {
        await updateSchedule(scheduleId, payload);
      } else {
        await createSchedule(payload);
      }
    } catch (err) {
      setError(getErrorMessage(err));
      throw err;
    } finally {
      setIsSaving(false);
    }
  }

  return { form, setForm, isLoading, isSaving, error, save };
}
