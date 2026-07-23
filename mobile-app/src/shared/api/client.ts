import axios from 'axios';
import Constants from 'expo-constants';

const configuredUrl =
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  Constants.expoConfig?.extra?.apiBaseUrl ||
  'http://localhost:8080/api';

export const apiClient = axios.create({
  baseURL: configuredUrl,
  timeout: 4000
});

let authFailureHandler: (() => void) | null = null;
let tokenRefreshHandler: (() => Promise<string | null>) | null = null;
let refreshInFlight: Promise<string | null> | null = null;
let serverUnavailableUntil = 0;

apiClient.interceptors.response.use(
  (response) => {
    serverUnavailableUntil = 0;
    return response;
  },
  async (error) => {
    if (!error?.response) {
      serverUnavailableUntil = Date.now() + 30_000;
    }
    const request = error?.config as (typeof error.config & { _authRetry?: boolean }) | undefined;
    const isAuthEndpoint = typeof request?.url === 'string' && request.url.startsWith('/auth/');
    if (error?.response?.status === 401 && request && !request._authRetry && !isAuthEndpoint && tokenRefreshHandler) {
      request._authRetry = true;
      refreshInFlight ??= tokenRefreshHandler().finally(() => {
        refreshInFlight = null;
      });
      const refreshedToken = await refreshInFlight;
      if (refreshedToken) {
        request.headers.Authorization = `Bearer ${refreshedToken}`;
        return apiClient(request);
      }
    }
    if (error?.response?.status === 401 && !isAuthEndpoint) {
      authFailureHandler?.();
    }
    return Promise.reject(error);
  }
);

export function canAttemptServerRequest() {
  return Date.now() >= serverUnavailableUntil;
}

export function markServerRetryRequested() {
  serverUnavailableUntil = 0;
}

export function setAccessToken(token: string | null) {
  if (token) {
    apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;
    return;
  }

  delete apiClient.defaults.headers.common.Authorization;
}

export function setAuthFailureHandler(handler: (() => void) | null) {
  authFailureHandler = handler;
}

export function setTokenRefreshHandler(handler: (() => Promise<string | null>) | null) {
  tokenRefreshHandler = handler;
}
