import { AxiosError, AxiosHeaders } from 'axios';
import { describe, expect, it } from 'vitest';
import { getErrorMessage } from './error';

function responseError(status: number, data?: unknown) {
  return new AxiosError('Request failed', undefined, undefined, undefined, {
    status,
    statusText: String(status),
    headers: {},
    config: { headers: new AxiosHeaders() },
    data
  });
}

describe('getErrorMessage', () => {
  it('distinguishes a connection timeout from an authentication failure', () => {
    expect(getErrorMessage(new AxiosError('timeout of 10000ms exceeded', 'ECONNABORTED')))
      .toContain('응답이 늦어지고');
    expect(getErrorMessage(responseError(401))).toContain('로그인이 만료');
  });

  it('explains a network failure without calling it a timeout', () => {
    expect(getErrorMessage(new AxiosError('Network Error', 'ERR_NETWORK')))
      .toContain('서버에 연결할 수 없습니다');
  });

  it('prefers a useful API error message for ordinary client errors', () => {
    expect(getErrorMessage(responseError(400, { message: '일정 시간이 올바르지 않습니다.' })))
      .toBe('일정 시간이 올바르지 않습니다.');
  });

  it('uses safe messages for rate limits and server failures', () => {
    expect(getErrorMessage(responseError(429))).toContain('요청이 너무 많습니다');
    expect(getErrorMessage(responseError(503))).toContain('서버에서 문제가 발생');
  });
});
