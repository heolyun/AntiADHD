import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { login as loginRequest, refreshSession, revokeSession, signup as signupRequest } from '../api/authApi';
import { setAccessToken, setAuthFailureHandler, setTokenRefreshHandler } from '../../../shared/api/client';
import type { AuthResponse, LoginRequest, SignupRequest, UserSummary } from '../dto/auth.dto';

type AuthContextValue = {
  token: string | null;
  user: UserSummary | null;
  isBootstrapping: boolean;
  login: (payload: LoginRequest) => Promise<void>;
  signup: (payload: SignupRequest) => Promise<void>;
  logout: () => Promise<void>;
};

const STORAGE_KEY = 'antiadhd.session';
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserSummary | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const sessionRef = useRef<AuthResponse | null>(null);

  const clearSession = useCallback(async () => {
    setToken(null);
    setUser(null);
    setAccessToken(null);
    sessionRef.current = null;
    await Promise.all([
      SecureStore.deleteItemAsync(STORAGE_KEY),
      AsyncStorage.removeItem(STORAGE_KEY)
    ]);
  }, []);

  useEffect(() => {
    async function bootstrap() {
      try {
        let raw = await SecureStore.getItemAsync(STORAGE_KEY);
        if (!raw) {
          raw = await AsyncStorage.getItem(STORAGE_KEY);
          if (raw) {
            await SecureStore.setItemAsync(STORAGE_KEY, raw);
            await AsyncStorage.removeItem(STORAGE_KEY);
          }
        }
        if (raw) {
          const session = parseSession(raw);
          if (session) {
            setToken(session.token);
            setUser(session.user);
            setAccessToken(session.token);
            sessionRef.current = session;
          } else {
            await clearSession();
          }
        }
      } finally {
        setIsBootstrapping(false);
      }
    }

    bootstrap();
  }, [clearSession]);

  useEffect(() => {
    setAuthFailureHandler(() => {
      clearSession();
    });

    return () => setAuthFailureHandler(null);
  }, [clearSession]);

  const persist = useCallback(async (session: AuthResponse) => {
    setToken(session.token);
    setUser(session.user);
    setAccessToken(session.token);
    sessionRef.current = session;
    await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(session));
  }, []);

  useEffect(() => {
    setTokenRefreshHandler(async () => {
      const refreshToken = sessionRef.current?.refreshToken;
      if (!refreshToken) return null;
      try {
        const session = await refreshSession(refreshToken);
        await persist(session);
        return session.token;
      } catch {
        await clearSession();
        return null;
      }
    });
    return () => setTokenRefreshHandler(null);
  }, [clearSession, persist]);

  const logout = useCallback(async () => {
    const refreshToken = sessionRef.current?.refreshToken;
    if (refreshToken) {
      try {
        await revokeSession(refreshToken);
      } catch {
        // Local logout must still succeed if the server is unavailable.
      }
    }
    await clearSession();
  }, [clearSession]);

  const value = useMemo<AuthContextValue>(() => ({
    token,
    user,
    isBootstrapping,
    login: async (payload) => persist(await loginRequest(payload)),
    signup: async (payload) => persist(await signupRequest(payload)),
    logout
  }), [token, user, isBootstrapping, logout, persist]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function parseSession(raw: string): AuthResponse | null {
  try {
    const session = JSON.parse(raw) as Partial<AuthResponse>;
    if (!session.token || !session.user?.email) return null;
    return session as AuthResponse;
  } catch {
    return null;
  }
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used inside AuthProvider.');
  }
  return context;
}
