export type DailyReview = {
  id: number;
  reviewDate: string;
  mood?: string | null;
  summary?: string | null;
  accomplishment?: string | null;
  improvement?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type DailyReviewRequest = {
  reviewDate: string;
  mood?: string;
  summary?: string;
  accomplishment?: string;
  improvement?: string;
};

