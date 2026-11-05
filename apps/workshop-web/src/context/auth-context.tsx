import React, { createContext, useContext, useState, useEffect } from 'react';
import { workshopApi } from '../api/workshop-client';
import { WorkshopStaffRole } from '@miftah/contracts';

interface StaffUser {
  id: string;
  fullName: string;
  email?: string;
  phone?: string;
  role: WorkshopStaffRole;
  workshopId: string;
  workshopNameEn?: string;
  workshopNameAr?: string;
}

interface AuthContextType {
  user: StaffUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isOwner: boolean;
  loginEmail: (email: string, pass: string) => Promise<void>;
  sendPhoneOtp: (phone: string) => Promise<void>;
  verifyPhoneOtp: (phone: string, code: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  isOwner: false,
  loginEmail: async () => {},
  sendPhoneOtp: async () => {},
  verifyPhoneOtp: async () => {},
  logout: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<StaffUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    workshopApi.onUnauthorized(() => {
      setUser(null);
      sessionStorage.removeItem('miftah_workshop_user');
      sessionStorage.removeItem('miftah_workshop_token');
    });

    const saved = sessionStorage.getItem('miftah_workshop_user');
    const token = sessionStorage.getItem('miftah_workshop_token');
    if (saved && token) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.workshopId) {
          setUser(parsed);
          workshopApi.setToken(token);
        } else {
          sessionStorage.removeItem('miftah_workshop_user');
          sessionStorage.removeItem('miftah_workshop_token');
        }
      } catch {
        sessionStorage.removeItem('miftah_workshop_user');
        sessionStorage.removeItem('miftah_workshop_token');
      }
    }
    setIsLoading(false);
  }, []);

  const handleAuthSuccess = (res: any) => {
    if (!res.user?.workshopId) {
      throw new Error(
        'هذا الحساب ليس تابعاً لأي ورشة معتمدة. يرجى تسجيل الدخول بحساب مالك الورشة: owner@workshop.local',
      );
    }
    workshopApi.setToken(res.accessToken);
    setUser(res.user);
    sessionStorage.setItem('miftah_workshop_token', res.accessToken);
    sessionStorage.setItem('miftah_workshop_user', JSON.stringify(res.user));
  };

  const loginEmail = async (email: string, pass: string) => {
    const res = await workshopApi.loginEmail(email, pass);
    handleAuthSuccess(res);
  };

  const sendPhoneOtp = async (phone: string) => {
    await workshopApi.sendOtp(phone);
  };

  const verifyPhoneOtp = async (phone: string, code: string) => {
    const res = await workshopApi.verifyOtp(phone, code);
    handleAuthSuccess(res);
  };

  const logout = () => {
    setUser(null);
    workshopApi.setToken(null);
    sessionStorage.removeItem('miftah_workshop_token');
    sessionStorage.removeItem('miftah_workshop_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        isOwner: user?.role === WorkshopStaffRole.WORKSHOP_OWNER,
        loginEmail,
        sendPhoneOtp,
        verifyPhoneOtp,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
