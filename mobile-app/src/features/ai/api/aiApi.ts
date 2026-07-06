import { apiClient } from '../../../shared/api/client';
import type { AiSuggestionResponse } from '../dto/ai.dto';

export async function getAiSuggestions(): Promise<AiSuggestionResponse> {
  const { data } = await apiClient.get<AiSuggestionResponse>('/ai/suggestions');
  return data;
}

