import axios from 'axios';

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    if (typeof data === 'string') return data;
    if (typeof data?.message === 'string') return data.message;
    if (error.message) return error.message;
  }

  if (error instanceof Error) return error.message;
  return 'Request failed.';
}
