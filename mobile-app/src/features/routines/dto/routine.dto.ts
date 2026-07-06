import type { RepeatType } from '../../schedules/dto/schedule.dto';

export type Routine = {
  id: number;
  title: string;
  description?: string | null;
  repeatType: RepeatType;
  targetTime?: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type RoutineRequest = {
  title: string;
  description?: string;
  repeatType: RepeatType;
  targetTime?: string | null;
  active: boolean;
};

