import type { ColorLabel, RepeatType, TimestampedEntity } from '../../../shared/types/api';

export type { RepeatType } from '../../../shared/types/api';

export type Schedule = TimestampedEntity & {
  id: number;
  title: string;
  description?: string | null;
  startAt: string;
  endAt: string;
  color: string;
  repeatType: RepeatType;
  category?: ColorLabel | null;
  tags: ColorLabel[];
  completed: boolean;
};

export type ScheduleRequest = {
  title: string;
  description?: string;
  startAt: string;
  endAt: string;
  color: string;
  repeatType: RepeatType;
  categoryId?: number | null;
  tagIds?: number[];
};
