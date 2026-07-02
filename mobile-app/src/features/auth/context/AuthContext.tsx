import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { login as loginRequest, signup as signupRequest } from '../api/authApi';
import { setAccessToken } from '../../../shared/api/client';
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

  useEffect(() => {
    async function bootstrap() {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const session = JSON.parse(raw) as AuthResponse;
        setToken(session.token);
        setUser(session.user);
        setAccessToken(session.token);
      }
      setIsBootstrapping(false);
    }

    bootstrap();
  }, []);

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
    logout: async () => {
      setToken(null);
      setUser(null);
      setAccessToken(null);
      await AsyncStorage.removeItem(STORAGE_KEY);
    }
  }), [token, user, isBootstrapping]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used inside AuthProvider.');
  }
  return context;
}

