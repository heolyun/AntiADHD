import type { RepeatType, TimestampedEntity } from '../../../shared/types/api';

export type Routine = TimestampedEntity & {
  id: number;
  title: string;
  description?: string | null;
  repeatType: RepeatType;
  targetTime?: string | null;
  durationMinutes: number;
  active: boolean;
};

export type RoutineRequest = {
  title: string;
  description?: string;
  repeatType: RepeatType;
  targetTime?: string | null;
  durationMinutes: number;
  active: boolean;
};
