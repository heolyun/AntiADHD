import axios from 'axios';

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 401) {
      return '로그인이 만료되었거나 인증 정보가 없습니다. 다시 로그인해주세요.';
    }
    if (error.response?.status === 403) {
      return '접근 권한이 없습니다. 다시 로그인한 뒤 시도해주세요.';
    }

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
