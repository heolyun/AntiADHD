import axios from 'axios';

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (error.code === 'ECONNABORTED' || error.message.toLowerCase().includes('timeout')) {
      return '서버 응답이 늦어지고 있습니다. 잠시 후 다시 시도해주세요.';
    }
    if (error.code === 'ERR_NETWORK' || !error.response) {
      return '서버에 연결할 수 없습니다. Wi-Fi와 서버 연결 상태를 확인해주세요.';
    }
    if (error.response?.status === 401) {
      return '로그인이 만료되었거나 인증 정보가 없습니다. 다시 로그인해주세요.';
    }
    if (error.response?.status === 403) {
      return '접근 권한이 없습니다. 다시 로그인한 뒤 시도해주세요.';
    }
    if (error.response?.status === 429) {
      return '요청이 너무 많습니다. 잠시 기다린 뒤 다시 시도해주세요.';
    }
    if ((error.response?.status ?? 0) >= 500) {
      return '서버에서 문제가 발생했습니다. 입력 내용은 유지한 채 잠시 후 다시 시도해주세요.';
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
