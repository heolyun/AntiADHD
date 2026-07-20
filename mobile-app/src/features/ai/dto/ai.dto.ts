export type AiJobStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export type TaskBreakdownStep = {
  order: number;
  title: string;
  description: string;
  estimatedMinutes: number;
  energyLevel: 'LOW' | 'MEDIUM' | 'HIGH';
};

export type TaskBreakdownResult = {
  summary: string;
  totalEstimatedMinutes: number;
  steps: TaskBreakdownStep[];
};

export type CreateTaskBreakdownRequest = {
  goal: string;
  deadline?: string;
  availableMinutes?: number;
};

export type AiJobAcceptedResponse = {
  jobId: string;
  status: AiJobStatus;
};

export type AiJobResponse = {
  jobId: string;
  jobType: 'TASK_BREAKDOWN';
  status: AiJobStatus;
  goal: string;
  deadline: string | null;
  availableMinutes: number | null;
  result: TaskBreakdownResult | null;
  failureCode: string | null;
  failureMessage: string | null;
  attemptCount: number;
  createdAt: string;
  completedAt: string | null;
};
