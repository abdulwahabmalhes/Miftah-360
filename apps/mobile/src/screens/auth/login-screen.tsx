import React, { useState } from 'react';
import { useI18n } from '../../context/i18n-context';
import { useAuth } from '../../context/auth-context';

export const LoginScreen: React.FC = () => {
  const { t, language } = useI18n();
  const { loginEmail, registerEmail, sendPhoneOtp, verifyPhoneOtp, signInGoogle } = useAuth();

  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email');

  // Form fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      if (tab === 'login') {
        await loginEmail(email, password);
      } else {
        await registerEmail(fullName, email, password);
      }
    } catch (err: any) {
      setError(err.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      await sendPhoneOtp(phone);
      setOtpSent(true);
    } catch (err: any) {
      setError(err.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      await verifyPhoneOtp(phone, otpCode);
    } catch (err: any) {
      setError(err.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleClick = async () => {
    try {
      setLoading(true);
      setError(null);
      // In mobile app context, Google Sign-In SDK produces an idToken
      await signInGoogle('mock_google_id_token_car_owner');
    } catch (err: any) {
      setError(err.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 p-6 flex flex-col justify-center">
      {/* Brand Hero */}
      <div className="text-center mb-6">
        <div className="w-14 h-14 bg-gradient-to-tr from-amber-500 to-amber-400 rounded-2xl mx-auto flex items-center justify-center font-black text-slate-900 text-2xl shadow-lg mb-3">
          360
        </div>
        <h2 className="text-xl font-bold text-slate-900">{t('auth.welcome')}</h2>
        <p className="text-xs text-slate-500 mt-1 max-w-[280px] mx-auto">
          {t('auth.welcomeSubtitle')}
        </p>
      </div>

      {/* Demo Fast Login Shortcut */}
      <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-2xl text-center space-y-1.5">
        <p className="text-[11px] text-amber-950 font-bold">تجربة الدخول السريع كمالك سيارة:</p>
        <button
          type="button"
          onClick={() => {
            setEmail('user@carowner.local');
            setPassword('ReviewPass123!');
            setTab('login');
            setAuthMethod('email');
            setError(null);
          }}
          className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs transition shadow-sm"
        >
          ⚡ تعبئة حساب منصور المنصوري (3 مركبات)
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl text-center">
          {error}
        </div>
      )}

      {/* Auth Method: Email vs Phone */}
      {authMethod === 'email' ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          {/* Sign In vs Register Tabs */}
          <div className="flex border-b border-slate-100 pb-2">
            <button
              type="button"
              onClick={() => {
                setTab('login');
                setError(null);
              }}
              className={`flex-1 py-1 text-xs font-bold text-center border-b-2 transition ${
                tab === 'login'
                  ? 'border-amber-500 text-amber-600'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              {t('auth.loginTab')}
            </button>
            <button
              type="button"
              onClick={() => {
                setTab('register');
                setError(null);
              }}
              className={`flex-1 py-1 text-xs font-bold text-center border-b-2 transition ${
                tab === 'register'
                  ? 'border-amber-500 text-amber-600'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              {t('auth.registerTab')}
            </button>
          </div>

          <form onSubmit={handleEmailSubmit} className="space-y-3">
            {tab === 'register' && (
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  {t('auth.fullName')} *
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="محمد الشامسي"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                {t('auth.email')} *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                {t('auth.password')} *
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {tab === 'register' && (
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  {t('auth.phone')} (اختياري)
                </label>
                <input
                  type="tel"
                  dir="ltr"
                  placeholder="+971501234567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs transition shadow-sm disabled:opacity-50"
            >
              {loading
                ? t('common.loading')
                : tab === 'login'
                ? t('auth.loginTab')
                : t('auth.registerTab')}
            </button>
          </form>

          {/* Alternate Providers */}
          <div className="pt-2">
            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink mx-2 text-[10px] text-slate-400 font-medium">
                {t('auth.or')}
              </span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>

            <div className="space-y-2 mt-2">
              <button
                type="button"
                onClick={() => {
                  setAuthMethod('phone');
                  setError(null);
                }}
                className="w-full py-2 px-3 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition"
              >
                <span>📱</span>
                <span>{t('auth.phoneOtpBtn')}</span>
              </button>

              <button
                type="button"
                onClick={handleGoogleClick}
                disabled={loading}
                className="w-full py-2 px-3 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition"
              >
                <span className="font-bold text-red-500">G</span>
                <span>{t('auth.googleBtn')}</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Phone + OTP Screen */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-xs font-bold text-slate-900">{t('auth.phoneOtpBtn')}</h3>
            <button
              type="button"
              onClick={() => {
                setAuthMethod('email');
                setOtpSent(false);
                setError(null);
              }}
              className="text-xs text-amber-600 font-semibold"
            >
              {t('auth.back')}
            </button>
          </div>

          {!otpSent ? (
            <form onSubmit={handleSendOtp} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  {t('auth.phone')} *
                </label>
                <input
                  type="tel"
                  required
                  dir="ltr"
                  placeholder="+971501234567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs transition shadow-sm disabled:opacity-50"
              >
                {loading ? t('common.loading') : t('auth.sendOtp')}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  {t('auth.enterOtp')}
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="123456"
                  className="w-full text-center tracking-widest text-lg font-mono px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs transition shadow-sm disabled:opacity-50"
              >
                {loading ? t('common.loading') : t('auth.verifyOtp')}
              </button>

              <button
                type="button"
                onClick={() => setOtpSent(false)}
                className="w-full text-center text-xs text-slate-500 font-medium hover:underline pt-1"
              >
                {language === 'ar' ? 'تعديل رقم الهاتف' : 'Change Phone Number'}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
};
