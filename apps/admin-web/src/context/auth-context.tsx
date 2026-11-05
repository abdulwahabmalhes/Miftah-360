import React, { createContext, useContext, useState, useEffect } from 'react';
import { adminApi } from '../api/admin-client';

interface AdminUser {
  id: string;
  fullName: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: AdminUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  mfaChallengeToken: string | null;
  login: (email: string, pass: string) => Promise<{ mfaRequired: boolean }>;
  verifyMfa: (code: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  mfaChallengeToken: null,
  login: async () => ({ mfaRequired: false }),
  verifyMfa: async () => {},
  logout: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mfaChallengeToken, setMfaChallengeToken] = useState<string | null>(null);

  useEffect(() => {
    adminApi.onUnauthorized(() => {
      setUser(null);
      sessionStorage.removeItem('miftah_admin_user');
      sessionStorage.removeItem('miftah_admin_token');
    });

    // Check local session
    const saved = sessionStorage.getItem('miftah_admin_user');
    const token = sessionStorage.getItem('miftah_admin_token');
    if (saved && token) {
      try {
        const parsed = JSON.parse(saved);
        if (
          parsed.role === 'SUPER_ADMIN' ||
          parsed.role === 'OPERATIONS_ADMIN' ||
          parsed.role === 'PLATFORM_ADMIN'
        ) {
          setUser(parsed);
          adminApi.setToken(token);
        } else {
          sessionStorage.removeItem('miftah_admin_user');
          sessionStorage.removeItem('miftah_admin_token');
        }
      } catch {
        sessionStorage.removeItem('miftah_admin_user');
        sessionStorage.removeItem('miftah_admin_token');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, pass: string) => {
    const res = await adminApi.login(email, pass);
    if (res.mfaRequired) {
      setMfaChallengeToken(res.challengeToken);
      return { mfaRequired: true };
    } else {
      throw new Error(
        'هذا الحساب ليس لديه صلاحيات الإدارة (Admin). يرجى تسجيل الدخول بحساب المشرف: admin@miftah.local',
      );
    }
  };

  const verifyMfa = async (code: string) => {
    if (!mfaChallengeToken) throw new Error('No active MFA challenge token');
    const res = await adminApi.verifyMfa(mfaChallengeToken, code);
    adminApi.setToken(res.accessToken);
    setUser(res.user);
    sessionStorage.setItem('miftah_admin_token', res.accessToken);
    sessionStorage.setItem('miftah_admin_user', JSON.stringify(res.user));
    setMfaChallengeToken(null);
  };

  const logout = () => {
    setUser(null);
    setMfaChallengeToken(null);
    adminApi.setToken(null);
    sessionStorage.removeItem('miftah_admin_token');
    sessionStorage.removeItem('miftah_admin_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        mfaChallengeToken,
        login,
        verifyMfa,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

