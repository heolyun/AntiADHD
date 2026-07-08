export type TimestampedEntity = {
  createdAt: string;
  updatedAt: string;
};

export type ColorLabel = {
  id: number;
  name: string;
  color: string;
};

export type RepeatType = 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY';
