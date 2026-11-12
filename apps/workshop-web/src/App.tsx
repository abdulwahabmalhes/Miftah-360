import React, { useState } from 'react';
import { I18nProvider, useI18n } from './context/i18n-context';
import { AuthProvider, useAuth } from './context/auth-context';
import { WorkshopLayout, WorkshopView } from './components/layout/workshop-layout';
import { WorkshopHomeDashboard } from './components/dashboard/workshop-home';
import { ProfileEditor } from './components/profile/profile-editor';
import { HoursEditor } from './components/hours/hours-editor';
import { BrandsSelector } from './components/brands/brands-selector';
import { ServicesCatalog } from './components/services/services-catalog';
import { StaffManager } from './components/staff/staff-manager';
import { CustomersList } from './components/customers/customers-list';
import { InventoryManager } from './components/inventory/inventory-manager';
import { ServiceRequestsManager } from './components/service-requests/service-requests-manager';
import { BookingsManager } from './components/bookings/bookings-manager';
import { WarrantyManager } from './components/warranty/warranty-manager';
import { SuppliersManager } from './components/suppliers/suppliers-manager';
import { PosCheckout } from './components/pos/pos-checkout';
import { CrmManager } from './components/crm/crm-manager';
import { TasksManager } from './components/tasks/tasks-manager';
import { ContractsManager } from './components/contracts/contracts-manager';
import { HrManager } from './components/hr/hr-manager';
import { ReportsManager } from './components/reports/reports-manager';
import { ErrorBoundary } from './components/common/error-boundary';
import { BrandIntro } from './components/common/brand-intro';

const LoginView: React.FC = () => {
  const { t, language } = useI18n();
  const { loginEmail, sendPhoneOtp, verifyPhoneOtp } = useAuth();
  const [authMode, setAuthMode] = useState<'email' | 'phone'>('email');

  // Email form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Phone form
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fillDemoOwner = () => {
    setEmail('owner@workshop.local');
    setPassword('ReviewPass123!');
    setError(null);
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      await loginEmail(email, password);
    } catch (err: any) {
      setError(err.message || 'فشل تسجيل الدخول لنظام الورش');
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
      setError(err.message || 'فشل إرسال رمز التحقق');
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
      setError(err.message || 'رمز التحقق غير صحيح');
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
          <h2 className="text-xl font-black text-slate-900 tracking-tight">نظام تشغيل الورش (Workshop OS)</h2>
          <p className="text-xs text-[#0E7C86] font-bold mt-1">YOUR CAR. A SMARTER WAY. | سيارتك . بطريقة أذكى</p>
          <p className="text-[11px] text-slate-400 mt-0.5">بوابة الدخول لأصحاب الورش ومستشاري الخدمة والفنيين</p>
        </div>

        {/* Demo Fast Login Shortcut */}
        <div className="mb-5 p-3.5 bg-[#F2F5F7] border border-[#0E7C86]/30 rounded-2xl text-center space-y-2">
          <p className="text-[11px] text-slate-800 font-bold">تسجيل الدخول السريع للمراجعة والتجربة:</p>
          <button
            type="button"
            onClick={fillDemoOwner}
            className="w-full py-2.5 px-3 bg-gradient-to-r from-[#0E7C86] to-[#0A4D56] hover:from-[#0A4D56] hover:to-[#061E23] text-white font-black rounded-xl text-xs transition shadow-md"
          >
            ⚡ تعبئة حساب مالك الورشة (راشد النعيمي - كراج مفتاح الإمارات)
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-2xl font-bold leading-relaxed">
            {error}
          </div>
        )}

        {/* Tab switcher: Email vs Phone */}
        <div className="flex border-b border-slate-200 mb-5">
          <button
            type="button"
            onClick={() => {
              setAuthMode('email');
              setError(null);
            }}
            className={`flex-1 py-2.5 text-xs font-bold text-center border-b-2 transition ${
              authMode === 'email'
                ? 'border-[#0E7C86] text-[#0E7C86]'
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            البريد الإلكتروني المهني
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMode('phone');
              setError(null);
            }}
            className={`flex-1 py-2.5 text-xs font-bold text-center border-b-2 transition ${
              authMode === 'phone'
                ? 'border-[#0E7C86] text-[#0E7C86]'
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            رمز التحقق (SMS / OTP)
          </button>
        </div>

        {authMode === 'email' ? (
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                البريد الإلكتروني للورشة (Work Email)
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="owner@workshop.local"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0E7C86]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                كلمة المرور (Password)
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
              className="w-full py-3 bg-gradient-to-r from-[#0E7C86] to-[#0A4D56] hover:from-[#0A4D56] hover:to-[#061E23] text-white font-bold rounded-xl text-sm shadow-md transition disabled:opacity-50"
            >
              {loading ? 'جاري التحقق...' : 'تسجيل الدخول إلى الورشة ←'}
            </button>
          </form>
        ) : !otpSent ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                رقم هاتف الورشة المسجل
              </label>
              <input
                type="tel"
                required
                dir="ltr"
                placeholder="+971501112233"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 font-mono text-center"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm shadow-md transition disabled:opacity-50"
            >
              {loading ? 'جاري الإرسال...' : 'إرسال رمز التحقق (OTP) ←'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="p-3 bg-[#F2F5F7] border border-[#0E7C86]/30 rounded-xl text-slate-800 text-xs">
              تم إرسال رمز التحقق إلى الرقم <strong className="font-mono text-[#0E7C86]">{phone}</strong>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                أدخل رمز الـ 6 أرقام (الرمز التجريبي 123456):
              </label>
              <input
                type="text"
                required
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                placeholder="123456"
                className="w-full text-center tracking-widest text-xl font-mono py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0E7C86]"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setOtpSent(false)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100"
              >
                رجوع
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2.5 bg-gradient-to-r from-[#0E7C86] to-[#0A4D56] hover:from-[#0A4D56] hover:to-[#061E23] text-white font-bold rounded-xl text-sm shadow-md transition disabled:opacity-50"
              >
                {loading ? 'جاري التحقق...' : 'تأكيد ودخول ←'}
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
  const [currentView, setCurrentView] = useState<WorkshopView>('dashboard');
  const [showIntro, setShowIntro] = useState<boolean>(() => {
    return sessionStorage.getItem('miftah_workshop_intro_seen') !== 'true';
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
        onFinish={() => {
          sessionStorage.setItem('miftah_workshop_intro_seen', 'true');
          setShowIntro(false);
        }}
        onComplete={() => {
          sessionStorage.setItem('miftah_workshop_intro_seen', 'true');
          setShowIntro(false);
        }}
      />
    );
  }

  if (!isAuthenticated) {
    return <LoginView />;
  }

  return (
    <WorkshopLayout
      currentView={currentView}
      onViewChange={setCurrentView}
      onReplayIntro={() => setShowIntro(true)}
    >
      {currentView === 'dashboard' && <WorkshopHomeDashboard onNavigate={setCurrentView} />}
      {currentView === 'requests' && (
        <ServiceRequestsManager
          onNavigateToBooking={() => setCurrentView('bookings')}
        />
      )}
      {currentView === 'bookings' && <BookingsManager />}
      {currentView === 'profile' && <ProfileEditor initialTab="info" />}
      {currentView === 'hours' && <ProfileEditor initialTab="hours" />}
      {currentView === 'brands' && <ProfileEditor initialTab="brands" />}
      {currentView === 'services' && <ProfileEditor initialTab="services" />}
      {currentView === 'staff' && <StaffManager />}
      {currentView === 'customers' && <CustomersList />}
      {currentView === 'inventory' && <InventoryManager />}
      {currentView === 'warranty' && <WarrantyManager />}
      {currentView === 'suppliers' && <SuppliersManager />}
      {currentView === 'pos' && <PosCheckout />}
      {currentView === 'crm' && <CrmManager />}
      {currentView === 'tasks' && <TasksManager />}
      {currentView === 'contracts' && <ContractsManager />}
      {currentView === 'hr' && <HrManager />}
      {currentView === 'reports' && <ReportsManager />}
    </WorkshopLayout>
  );
};

export const App: React.FC = () => {
  return (
    <ErrorBoundary fallbackTitle="حدث تنبيه في نظام تشغيل الورش">
      <I18nProvider>
        <AuthProvider>
          <DashboardContent />
        </AuthProvider>
      </I18nProvider>
    </ErrorBoundary>
  );
};

export default App;
