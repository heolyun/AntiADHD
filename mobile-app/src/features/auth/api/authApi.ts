import { apiClient } from '../../../shared/api/client';
import type { AuthResponse, LoginRequest, SignupRequest, UserSummary } from '../dto/auth.dto';

export async function login(payload: LoginRequest): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>('/auth/login', payload);
  return data;
}

export async function signup(payload: SignupRequest): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>('/auth/signup', payload);
  return data;
}

export async function refreshSession(refreshToken: string): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>('/auth/refresh', { refreshToken });
  return data;
}

export async function revokeSession(refreshToken: string): Promise<void> {
  await apiClient.post('/auth/logout', { refreshToken });
}

export async function getMe(): Promise<UserSummary> {
  const { data } = await apiClient.get<UserSummary>('/users/me');
  return data;
}
