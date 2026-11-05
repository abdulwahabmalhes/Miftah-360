import React, { useState } from 'react';
import { useI18n } from '../../context/i18n-context';
import { useAuth } from '../../context/auth-context';

export const ProfileScreen: React.FC = () => {
  const { t, language, setLanguage } = useI18n();
  const { user, logout, linkGoogle, linkPhone } = useAuth();

  const [phoneToLink, setPhoneToLink] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [showPhoneLinking, setShowPhoneLinking] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleLinkGoogle = async () => {
    try {
      setLoading(true);
      setMessage(null);
      await linkGoogle('mock_google_id_token_to_link');
      setMessage({ type: 'success', text: t('auth.linkSuccess') });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || t('common.error') });
    } finally {
      setLoading(false);
    }
  };

  const handleLinkPhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setMessage(null);
      await linkPhone(phoneToLink, otpCode);
      setShowPhoneLinking(false);
      setMessage({ type: 'success', text: t('auth.linkSuccess') });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || t('common.error') });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 p-4 flex flex-col space-y-4">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-slate-900">{t('nav.profile')}</h2>
        <p className="text-xs text-slate-500">
          {language === 'ar' ? 'إعدادات الحساب وربط الهوية' : 'Account settings & Identity linking'}
        </p>
      </div>

      {message && (
        <div
          className={`p-3 rounded-xl text-xs font-semibold text-center border ${
            message.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Profile Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-amber-500 text-slate-950 font-bold text-lg flex items-center justify-center">
            {user?.fullName?.charAt(0) || 'U'}
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">{user?.fullName || 'Car Owner'}</h3>
            <p className="text-xs text-slate-400 font-mono">{user?.email || '-'}</p>
            <p className="text-xs text-slate-400 font-mono">{user?.phone || '-'}</p>
          </div>
        </div>
      </div>

      {/* Account Linking Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
          {language === 'ar' ? 'طرق تسجيل الدخول والحسابات المرتبطة' : 'Linked Accounts'}
        </h4>

        <div className="space-y-2">
          {/* Google Linking */}
          <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-red-500 text-sm">G</span>
              <span className="text-xs font-semibold text-slate-700">Google Account</span>
            </div>
            <button
              onClick={handleLinkGoogle}
              disabled={loading}
              className="px-3 py-1 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg text-xs font-semibold text-slate-700 transition"
            >
              {language === 'ar' ? 'ربط الحساب' : 'Link'}
            </button>
          </div>

          {/* Phone Linking */}
          {!showPhoneLinking ? (
            <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm">📱</span>
                <span className="text-xs font-semibold text-slate-700">
                  {language === 'ar' ? 'رقم الهاتف (SMS)' : 'Phone (SMS)'}
                </span>
              </div>
              <button
                onClick={() => setShowPhoneLinking(true)}
                className="px-3 py-1 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg text-xs font-semibold text-slate-700 transition"
              >
                {language === 'ar' ? 'ربط الرقم' : 'Link'}
              </button>
            </div>
          ) : (
            <form
              onSubmit={handleLinkPhoneSubmit}
              className="p-3 bg-slate-50 rounded-xl space-y-2 border border-amber-300"
            >
              <input
                type="tel"
                placeholder="+971501234567"
                required
                value={phoneToLink}
                onChange={(e) => setPhoneToLink(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs font-mono"
              />
              <input
                type="text"
                placeholder="OTP Code"
                maxLength={6}
                required
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs font-mono"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-1.5 bg-amber-500 rounded text-xs font-bold text-slate-950"
                >
                  {language === 'ar' ? 'تأكيد الربط' : 'Confirm'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowPhoneLinking(false)}
                  className="px-2.5 py-1.5 bg-white border border-slate-200 rounded text-xs text-slate-600"
                >
                  {t('common.cancel')}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Language Switcher Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex items-center justify-between">
        <span className="text-xs font-bold text-slate-800">
          {language === 'ar' ? 'لغة التطبيق (Language)' : 'App Language'}
        </span>
        <button
          onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-800 transition"
        >
          {language === 'ar' ? 'English (LTR)' : 'العربية (RTL)'}
        </button>
      </div>

      {/* Logout */}
      <div className="pt-2">
        <button
          onClick={logout}
          className="w-full py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition shadow-sm"
        >
          {t('common.logout')}
        </button>
      </div>
    </div>
  );
};

