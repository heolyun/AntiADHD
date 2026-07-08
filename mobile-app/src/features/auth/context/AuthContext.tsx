import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { login as loginRequest, signup as signupRequest } from '../api/authApi';
import { setAccessToken, setAuthFailureHandler } from '../../../shared/api/client';
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

  const clearSession = useCallback(async () => {
    setToken(null);
    setUser(null);
    setAccessToken(null);
    await AsyncStorage.removeItem(STORAGE_KEY);
  }, []);

  useEffect(() => {
    async function bootstrap() {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const session = parseSession(raw);
          if (session) {
            setToken(session.token);
            setUser(session.user);
            setAccessToken(session.token);
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

  async function persist(session: AuthResponse) {
    setToken(session.token);
    setUser(session.user);
    setAccessToken(session.token);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  }

  const value = useMemo<AuthContextValue>(() => ({
    token,
    user,
    isBootstrapping,
    login: async (payload) => persist(await loginRequest(payload)),
    signup: async (payload) => persist(await signupRequest(payload)),
    logout: clearSession
  }), [token, user, isBootstrapping, clearSession]);

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
