import { apiClient } from '../../../shared/api/client';
import type { DailyReview, DailyReviewRequest } from '../dto/dailyReview.dto';

export async function getDailyReviews(): Promise<DailyReview[]> {
  const { data } = await apiClient.get<DailyReview[]>('/daily-reviews');
  return data;
}

export async function getDailyReviewByDate(date: string): Promise<DailyReview> {
  const { data } = await apiClient.get<DailyReview>('/daily-reviews/by-date', { params: { date } });
  return data;
}

export async function createDailyReview(payload: DailyReviewRequest): Promise<DailyReview> {
  const { data } = await apiClient.post<DailyReview>('/daily-reviews', payload);
  return data;
}

export async function updateDailyReview(id: number, payload: DailyReviewRequest): Promise<DailyReview> {
  const { data } = await apiClient.put<DailyReview>(`/daily-reviews/${id}`, payload);
  return data;
}

export async function deleteDailyReview(id: number): Promise<void> {
  await apiClient.delete(`/daily-reviews/${id}`);
}

