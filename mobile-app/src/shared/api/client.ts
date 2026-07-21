import axios from 'axios';
import Constants from 'expo-constants';

const configuredUrl =
  Constants.expoConfig?.extra?.apiBaseUrl ||
  'http://localhost:8080/api';

export const apiClient = axios.create({
  baseURL: configuredUrl,
  timeout: 10000
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
