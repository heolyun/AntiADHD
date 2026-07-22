import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { apiClient } from '../api/client';

let reporting = false;

export async function reportClientError(error: unknown, context: string): Promise<void> {
  if (reporting || !apiClient.defaults.headers.common.Authorization) return;
  reporting = true;
  try {
    const rawMessage = error instanceof Error ? error.message : String(error);
    await apiClient.post('/client-errors', {
      context: sanitize(context, 80),
      message: sanitize(rawMessage, 500),
      appVersion: Constants.expoConfig?.version ?? 'unknown',
      platform: Platform.OS
    }, { timeout: 5000 });
  } catch {
    // Error reporting must never trigger another visible application error.
  } finally {
    reporting = false;
  }
}

function sanitize(value: string, maxLength: number) {
  return value
    .replace(/bearer\s+[a-z0-9._-]+/gi, 'Bearer [redacted]')
    .replace(/sk-[a-z0-9_-]+/gi, 'sk-[redacted]')
    .replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, '[redacted-email]')
    .replace(/[\r\n\t]+/g, ' ')
    .trim()
    .slice(0, maxLength) || 'unknown';
}
