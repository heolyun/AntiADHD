import axios from 'axios';
import Constants from 'expo-constants';

const configuredUrl =
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  Constants.expoConfig?.extra?.apiBaseUrl ||
  'http://localhost:8080/api';

export const apiClient = axios.create({
  baseURL: configuredUrl,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

let authFailureHandler: (() => void) | null = null;

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401 || error?.response?.status === 403) {
      authFailureHandler?.();
    }
    return Promise.reject(error);
  }
);

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
