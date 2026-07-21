import { apiClient } from '../../../shared/api/client';
import type {
  AiJobAcceptedResponse,
  AiJobResponse,
  CreateTaskBreakdownRequest
} from '../dto/ai.dto';
import type { VoiceCommandJobResponse } from '../dto/ai.dto';

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

export async function createVoiceCommand(uri: string): Promise<AiJobAcceptedResponse> {
  const form = new FormData();
  form.append('audio', { uri, name: 'voice-command.m4a', type: 'audio/m4a' } as unknown as Blob);
  const { data } = await apiClient.post<AiJobAcceptedResponse>('/ai/voice-commands', form, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return data;
}

export async function getVoiceCommand(jobId: string): Promise<VoiceCommandJobResponse> {
  const { data } = await apiClient.get<VoiceCommandJobResponse>(`/ai/voice-commands/${jobId}`);
  return data;
}
