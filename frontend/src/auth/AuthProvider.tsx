import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { api } from '../api/client';
import type { components } from '../api/schema.d.ts';

type AuthUser = components['schemas']['User'];
type AuthStatus = 'loading' | 'authenticated' | 'anonymous';

type LoginInput = {
  email: string;
  password: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  status: AuthStatus;
  login: (input: LoginInput) => Promise<AuthUser>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');

  const refreshMe = async () => {
    setStatus('loading');

    const { data, error } = await api.GET('/users/me');

    if (error) {
      setUser(null);
      setStatus('anonymous');
      return;
    }

    setUser(data);
    setStatus('authenticated');
  };

  const login = async ({ email, password }: LoginInput) => {
    const { data, error } = await api.POST('/auth/login', {
      body: { email, password },
    });

    console.log('AUTH_LOGIN_RESULT', { data, error });

    if (error || !data) {
      throw new Error('INVALID_CREDENTIALS');
    }

    setUser(data);
    setStatus('authenticated');
    return data;
  };

  const logout = async () => {
    await api.POST('/auth/logout');
    setUser(null);
    setStatus('anonymous');
  };

  useEffect(() => {
    void refreshMe();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        status,
        login,
        logout,
        refreshMe,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
