export type RepeatType = 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY';

export type Schedule = {
  id: number;
  title: string;
  description?: string | null;
  startAt: string;
  endAt: string;
  color: string;
  repeatType: RepeatType;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ScheduleRequest = {
  title: string;
  description?: string;
  startAt: string;
  endAt: string;
  color: string;
  repeatType: RepeatType;
};

