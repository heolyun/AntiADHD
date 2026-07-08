import { useEffect, useState } from 'react';
import { createSchedule, getSchedule, updateSchedule } from '../api/scheduleApi';
import { scheduleColors } from '../../../shared/constants/theme';
import type { RepeatType } from '../../../shared/types/api';
import type { ScheduleRequest } from '../dto/schedule.dto';
import { toLocalDateTimeValue } from '../../../shared/utils/date';
import { getErrorMessage } from '../../../shared/utils/error';

type FormState = {
  title: string;
  description: string;
  startAt: string;
  endAt: string;
  color: string;
  repeatType: RepeatType;
  categoryId: number | null;
  tagIds: number[];
};

function initialForm(selectedDate?: string): FormState {
  const start = selectedDate ? new Date(`${selectedDate}T09:00:00`) : new Date();
  if (!selectedDate) {
    start.setHours(start.getHours() + 1, 0, 0, 0);
  }
  const end = new Date(start);
  end.setHours(end.getHours() + 1);
  return {
    title: '',
    description: '',
    startAt: toLocalDateTimeValue(start),
    endAt: toLocalDateTimeValue(end),
    color: scheduleColors[0],
    repeatType: 'NONE',
    categoryId: null,
    tagIds: []
  };
}

export function useScheduleEditor(scheduleId?: number, selectedDate?: string) {
  const [form, setForm] = useState<FormState>(() => initialForm(selectedDate));
  const [isLoading, setIsLoading] = useState(Boolean(scheduleId));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (scheduleId || !selectedDate) return;
    setForm(initialForm(selectedDate));
  }, [scheduleId, selectedDate]);

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
          repeatType: schedule.repeatType,
          categoryId: schedule.category?.id ?? null,
          tagIds: schedule.tags.map((tag) => tag.id)
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
        repeatType: form.repeatType,
        categoryId: form.categoryId,
        tagIds: form.tagIds
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
