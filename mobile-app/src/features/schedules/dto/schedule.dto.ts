export type RepeatType = 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY';

export type Schedule = {
  id: number;
  title: string;
  description?: string | null;
  startAt: string;
  endAt: string;
  color: string;
  repeatType: RepeatType;
  category?: CategorySummary | null;
  tags: TagSummary[];
  completed: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CategorySummary = {
  id: number;
  name: string;
  color: string;
};

export type TagSummary = CategorySummary;

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
