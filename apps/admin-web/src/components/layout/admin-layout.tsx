import React, { useState } from 'react';
import { useI18n } from '../../context/i18n-context';
import { useAuth } from '../../context/auth-context';

export type AdminView = 'dashboard' | 'queue' | 'workshops' | 'modules' | 'taxonomy' | 'brands';

interface AdminLayoutProps {
  currentView: AdminView;
  onViewChange: (view: AdminView) => void;
  onReplayIntro?: () => void;
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  currentView,
  onViewChange,
  onReplayIntro,
  children,
}) => {
  const { t, language, setLanguage, direction } = useI18n();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: { id: AdminView; labelKey: string; icon: string }[] = [
    { id: 'dashboard', labelKey: 'nav.dashboard', icon: '📊' },
    { id: 'queue', labelKey: 'nav.verificationQueue', icon: '📋' },
    { id: 'workshops', labelKey: 'nav.allWorkshops', icon: '🏢' },
    { id: 'modules', labelKey: 'nav.modules', icon: '🧩' },
    { id: 'taxonomy', labelKey: 'nav.taxonomy', icon: '🔧' },
    { id: 'brands', labelKey: 'nav.brands', icon: '🚗' },
  ];

  return (
    <div className={`min-h-screen bg-slate-100 flex flex-col ${direction === 'rtl' ? 'rtl' : 'ltr'}`}>
      {/* Top Navbar */}
      <header className="bg-[#061E23] text-white px-4 py-3 flex items-center justify-between shadow-lg border-b border-[#0A4D56]">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-2xl px-2 py-1 bg-[#0A4D56] rounded-xl focus:outline-none"
          >
            ☰
          </button>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white p-0.5 shadow-md border border-[#0E7C86]/40 flex items-center justify-center overflow-hidden shrink-0">
              <img src="/brand/logo.jpg" alt="Miftah 360" className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold tracking-tight text-white">{t('app.title')}</h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#0A4D56] text-[#4DD0E1] border border-[#0E7C86]">
                  الإدارة المركزية (Super Admin)
                </span>
              </div>
              <p className="text-xs text-[#C9CDD3] hidden sm:block">
                {language === 'ar' ? 'سيارتك . بطريقة أذكى' : 'YOUR CAR. A SMARTER WAY.'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Replay Intro Button */}
          {onReplayIntro && (
            <button
              onClick={onReplayIntro}
              title="عرض مقدمة البراند"
              className="px-2.5 py-1.5 text-xs font-bold rounded-xl bg-[#0A4D56]/70 hover:bg-[#0E7C86] text-[#4DD0E1] border border-[#0E7C86]/50 transition flex items-center gap-1.5"
            >
              <span>🎬</span>
              <span className="hidden sm:inline">{language === 'ar' ? 'المقدمة' : 'Intro'}</span>
            </button>
          )}

          {/* Language Switcher */}
          <button
            onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
            className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-[#0A4D56] hover:bg-[#0E7C86] border border-[#0E7C86]/50 transition text-white"
          >
            {language === 'ar' ? 'English (LTR)' : 'العربية (RTL)'}
          </button>

          {/* Admin User Badge */}
          {user && (
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium">{user.fullName}</p>
                <p className="text-xs text-[#4DD0E1] font-mono">{user.role}</p>
              </div>
              <button
                onClick={logout}
                className="px-3 py-1.5 text-xs bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition"
              >
                {t('nav.logout')}
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Body */}
      <div className="flex flex-1">
        {/* Sidebar */}
        <aside
          className={`bg-white border-slate-200 shadow-sm w-64 p-4 shrink-0 flex flex-col justify-between ${
            direction === 'rtl' ? 'border-l' : 'border-r'
          } ${mobileMenuOpen ? 'block fixed inset-y-0 z-50 shadow-2xl' : 'hidden md:block'}`}
        >
          <div>
            <div className="md:hidden flex justify-end mb-3">
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="text-slate-500 hover:text-slate-800 font-bold text-xl"
              >
                ✕
              </button>
            </div>
            <nav className="space-y-1.5">
              {navItems.map((item) => {
                const active = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onViewChange(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition text-right ${
                      active
                        ? 'bg-[#0E7C86] text-white shadow-sm'
                        : 'text-slate-700 hover:bg-[#F2F5F7]'
                    }`}
                  >
                    <span className="text-lg">{item.icon}</span>
                    <span>{t(item.labelKey)}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-3 bg-[#F2F5F7] rounded-2xl border border-slate-200 text-center mt-6">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <img src="/brand/logo.jpg" alt="360" className="w-4 h-4 object-contain" />
              <p className="text-[10px] text-slate-800 font-black">منظومة مفتاح 360 الإمارات</p>
            </div>
            <p className="text-[9px] text-[#0E7C86] font-bold">YOUR CAR. A SMARTER WAY.</p>
            <p className="text-[8px] text-slate-400 font-mono mt-0.5">HQ Admin Console v1.2</p>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
};

