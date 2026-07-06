export type FocusSession = {
  id: number;
  title: string;
  startedAt?: string | null;
  endedAt?: string | null;
  plannedMinutes?: number | null;
  completed: boolean;
  note?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type FocusSessionRequest = {
  title: string;
  startedAt?: string | null;
  endedAt?: string | null;
  plannedMinutes?: number | null;
  completed: boolean;
  note?: string;
};

export type FocusCompleteRequest = {
  endedAt?: string | null;
  note?: string;
};

