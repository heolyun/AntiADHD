export type GoalStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';

export type Goal = {
  id: number;
  title: string;
  description?: string | null;
  targetDate?: string | null;
  progress: number;
  status: GoalStatus;
  createdAt: string;
  updatedAt: string;
};

export type GoalRequest = {
  title: string;
  description?: string;
  targetDate?: string | null;
  progress: number;
  status: GoalStatus;
};

