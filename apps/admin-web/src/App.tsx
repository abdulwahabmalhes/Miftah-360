import React, { useState } from 'react';
import { I18nProvider, useI18n } from './context/i18n-context';
import { AuthProvider, useAuth } from './context/auth-context';
import { AdminLayout, AdminView } from './components/layout/admin-layout';
import { OverviewDashboard } from './components/dashboard/overview-dashboard';
import { WorkshopQueue } from './components/workshops/workshop-queue';
import { ModuleEntitlementsView } from './components/modules/module-entitlements';
import { TaxonomyManager } from './components/master-data/taxonomy-manager';
import { BrandsManager } from './components/master-data/brands-manager';
import { ErrorBoundary } from './components/common/error-boundary';
import { BrandIntro } from './components/common/brand-intro';

const LoginView: React.FC = () => {
  const { t, language } = useI18n();
  const { login, verifyMfa, mfaChallengeToken } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fillDemoAdmin = () => {
    setEmail('admin@miftah.local');
    setPassword('ReviewPass123!');
    setError(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'فشل تسجيل الدخول الإداري');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyMfa = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      await verifyMfa(mfaCode);
    } catch (err: any) {
      setError(err.message || 'رمز التحقق الثنائي غير صحيح');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#061E23] flex items-center justify-center p-4 relative overflow-hidden" dir="rtl">
      {/* Background ambient glow */}
      <div className="absolute top-1/4 -right-20 w-96 h-96 bg-[#0E7C86]/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 -left-20 w-96 h-96 bg-[#4DD0E1]/15 rounded-full blur-3xl pointer-events-none"></div>

      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 border border-slate-200/80 relative z-10">
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-[#F2F5F7] rounded-2xl mx-auto flex items-center justify-center p-2 shadow-sm border border-slate-200 mb-3">
            <img src="/brand/logo.jpg" alt="Miftah 360" className="w-full h-full object-contain" />
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">لوحة إدارة منصة مفتاح 360</h2>
          <p className="text-xs text-[#0E7C86] font-bold mt-1">YOUR CAR. A SMARTER WAY. | سيارتك . بطريقة أذكى</p>
          <p className="text-[11px] text-slate-400 mt-0.5">بوابة الحوكمة المركزية للمشرفين المعتمدين فقط</p>
        </div>

        {/* Demo Fast Login Shortcut */}
        {!mfaChallengeToken && (
          <div className="mb-5 p-3.5 bg-[#F2F5F7] border border-[#0E7C86]/30 rounded-2xl text-center space-y-2">
            <p className="text-[11px] text-slate-800 font-bold">تجربة الدخول الإداري السريع للمراجعة:</p>
            <button
              type="button"
              onClick={fillDemoAdmin}
              className="w-full py-2.5 px-3 bg-gradient-to-r from-[#0E7C86] to-[#0A4D56] hover:from-[#0A4D56] hover:to-[#061E23] text-white font-black rounded-xl text-xs transition shadow-md"
            >
              ⚡ تعبئة بيانات المشرف (عبدالله المهيري - Super Admin)
            </button>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium leading-relaxed">
            {error}
          </div>
        )}

        {!mfaChallengeToken ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                البريد الإلكتروني الإداري (Work Email)
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@miftah.local"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0E7C86]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                كلمة المرور السرية (Password)
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0E7C86]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-[#0E7C86] to-[#0A4D56] hover:from-[#0A4D56] hover:to-[#061E23] text-white font-bold rounded-xl text-sm transition shadow-md disabled:opacity-50"
            >
              {loading ? 'جاري التحقق...' : 'متابعة إلى خطوة التحقق الثنائي (MFA) ←'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyMfa} className="space-y-4">
            <div className="p-3 bg-[#F2F5F7] border border-[#0E7C86]/30 rounded-xl text-slate-800 text-xs space-y-1">
              <p className="font-bold flex items-center gap-1.5 text-[#0E7C86]">
                <span>🔐</span>
                <span>التحقق الثنائي للمشرفين (Admin MFA)</span>
              </p>
              <p className="text-[11px] text-slate-600">
                لأغراض المراجعة والتطوير، الرمز التجريبي المعتمد هو: <strong className="font-mono text-sm text-[#0E7C86]">123456</strong>
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                أدخل رمز الـ 6 أرقام:
              </label>
              <input
                type="text"
                required
                maxLength={6}
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value)}
                placeholder="123456"
                className="w-full text-center tracking-widest text-xl font-mono py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0E7C86]"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setMfaCode('123456')}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
              >
                تعبئة الرمز تلقائياً
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2.5 bg-gradient-to-r from-[#0E7C86] to-[#0A4D56] hover:from-[#0A4D56] hover:to-[#061E23] text-white font-black rounded-xl text-sm transition shadow-md disabled:opacity-50"
              >
                {loading ? 'جاري التحقق...' : 'تأكيد ودخول اللوحة ←'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

const DashboardContent: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [currentView, setCurrentView] = useState<AdminView>('dashboard');
  const [showIntro, setShowIntro] = useState<boolean>(() => {
    return sessionStorage.getItem('miftah_admin_intro_seen') !== 'true';
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#061E23] flex items-center justify-center text-white">
        <div className="animate-spin inline-block w-10 h-10 border-4 border-[#0E7C86] border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (showIntro) {
    return (
      <BrandIntro
        onComplete={() => {
          sessionStorage.setItem('miftah_admin_intro_seen', 'true');
          setShowIntro(false);
        }}
      />
    );
  }

  if (!isAuthenticated) {
    return <LoginView />;
  }

  return (
    <AdminLayout
      currentView={currentView}
      onViewChange={setCurrentView}
      onReplayIntro={() => setShowIntro(true)}
    >
      {currentView === 'dashboard' && <OverviewDashboard onNavigate={setCurrentView} />}
      {currentView === 'queue' && <WorkshopQueue />}
      {currentView === 'workshops' && <WorkshopQueue initialFilter="ALL" />}
      {currentView === 'modules' && <ModuleEntitlementsView />}
      {currentView === 'taxonomy' && <TaxonomyManager />}
      {currentView === 'brands' && <BrandsManager />}
    </AdminLayout>
  );
};

export const App: React.FC = () => {
  return (
    <ErrorBoundary fallbackTitle="حدث تنبيه في لوحة الإدارة">
      <I18nProvider>
        <AuthProvider>
          <DashboardContent />
        </AuthProvider>
      </I18nProvider>
    </ErrorBoundary>
  );
};

export default App;
