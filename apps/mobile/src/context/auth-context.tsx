import React, { createContext, useContext, useState, useEffect } from 'react';
import { mobileApi } from '../api/mobile-client';

interface CarOwnerUser {
  id: string;
  fullName: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
}

interface AuthContextType {
  user: CarOwnerUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginEmail: (email: string, pass: string) => Promise<void>;
  registerEmail: (fullName: string, email: string, pass: string, phone?: string) => Promise<void>;
  sendPhoneOtp: (phone: string) => Promise<void>;
  verifyPhoneOtp: (phone: string, code: string) => Promise<void>;
  signInGoogle: (idToken: string) => Promise<void>;
  linkGoogle: (idToken: string) => Promise<void>;
  linkPhone: (phone: string, code: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  loginEmail: async () => {},
  registerEmail: async () => {},
  sendPhoneOtp: async () => {},
  verifyPhoneOtp: async () => {},
  signInGoogle: async () => {},
  linkGoogle: async () => {},
  linkPhone: async () => {},
  logout: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<CarOwnerUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    mobileApi.onUnauthorized(() => {
      setUser(null);
      localStorage.removeItem('miftah_mobile_user');
      localStorage.removeItem('miftah_mobile_token');
    });

    const saved = localStorage.getItem('miftah_mobile_user');
    const token = localStorage.getItem('miftah_mobile_token');
    if (saved && token) {
      try {
        setUser(JSON.parse(saved));
        mobileApi.setToken(token);
      } catch {
        localStorage.removeItem('miftah_mobile_user');
        localStorage.removeItem('miftah_mobile_token');
      }
    }
    setIsLoading(false);
  }, []);

  const handleAuthSuccess = (res: any) => {
    mobileApi.setToken(res.accessToken);
    setUser(res.user);
    localStorage.setItem('miftah_mobile_token', res.accessToken);
    localStorage.setItem('miftah_mobile_user', JSON.stringify(res.user));
  };

  const loginEmail = async (email: string, pass: string) => {
    const res = await mobileApi.loginEmail({ email, password: pass });
    handleAuthSuccess(res);
  };

  const registerEmail = async (fullName: string, email: string, pass: string) => {
    const res = await mobileApi.registerEmail({ fullName, email, password: pass, preferredLanguage: 'ar' });
    handleAuthSuccess(res);
  };

  const sendPhoneOtp = async (phone: string) => {
    await mobileApi.sendPhoneOtp({ phone });
  };

  const verifyPhoneOtp = async (phone: string, code: string) => {
    const res = await mobileApi.verifyPhoneOtp({ phone, code });
    handleAuthSuccess(res);
  };

  const signInGoogle = async (idToken: string) => {
    const res = await mobileApi.googleSignIn({ idToken });
    handleAuthSuccess(res);
  };

  const linkGoogle = async (idToken: string) => {
    await mobileApi.linkGoogle({ idToken });
    const profile = await mobileApi.getMyProfile();
    setUser(profile);
  };

  const linkPhone = async (phone: string, code: string) => {
    await mobileApi.linkPhone({ phone, code });
    const profile = await mobileApi.getMyProfile();
    setUser(profile);
  };

  const logout = () => {
    setUser(null);
    mobileApi.setToken(null);
    localStorage.removeItem('miftah_mobile_token');
    localStorage.removeItem('miftah_mobile_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        loginEmail,
        registerEmail,
        sendPhoneOtp,
        verifyPhoneOtp,
        signInGoogle,
        linkGoogle,
        linkPhone,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
