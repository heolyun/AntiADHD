import { apiClient } from '../../../shared/api/client';
import type {
  AiJobAcceptedResponse,
  AiJobResponse,
  CreateTaskBreakdownRequest
} from '../dto/ai.dto';

export async function createTaskBreakdown(
  request: CreateTaskBreakdownRequest
): Promise<AiJobAcceptedResponse> {
  const { data } = await apiClient.post<AiJobAcceptedResponse>('/ai/task-breakdowns', request);
  return data;
}

export async function getAiJob(jobId: string): Promise<AiJobResponse> {
  const { data } = await apiClient.get<AiJobResponse>(`/ai/jobs/${jobId}`);
  return data;
}
