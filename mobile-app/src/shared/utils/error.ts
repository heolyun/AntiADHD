import axios from 'axios';

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    if (typeof data === 'string') return data;
    if (Array.isArray(data?.details) && data.details.length > 0) return data.details.join('\n');
    if (typeof data?.message === 'string') return data.message;
    if (typeof data?.error === 'string') return data.error;
    if (error.message) return error.message;
  }

  if (error instanceof Error) return error.message;
  return '요청을 처리하지 못했습니다.';
}
