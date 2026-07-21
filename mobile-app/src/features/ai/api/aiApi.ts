import { apiClient } from '../../../shared/api/client';
import { Platform } from 'react-native';
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
  if (Platform.OS === 'web') {
    const blob = await fetch(uri).then((response) => response.blob());
    form.append('audio', blob, 'voice-command.webm');
  } else {
    form.append('audio', { uri, name: 'voice-command.m4a', type: 'audio/m4a' } as unknown as Blob);
  }
  const { data } = await apiClient.post<AiJobAcceptedResponse>('/ai/voice-commands', form);
  return data;
}

export async function getVoiceCommand(jobId: string): Promise<VoiceCommandJobResponse> {
  const { data } = await apiClient.get<VoiceCommandJobResponse>(`/ai/voice-commands/${jobId}`);
  return data;
}
