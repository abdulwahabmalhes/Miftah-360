import React, { useState } from 'react';
import { useI18n } from '../../context/i18n-context';
import { useAuth } from '../../context/auth-context';

export type AdminView = 'dashboard' | 'queue' | 'workshops' | 'modules' | 'taxonomy' | 'brands';

interface AdminLayoutProps {
  currentView: AdminView;
  onViewChange: (view: AdminView) => void;
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  currentView,
  onViewChange,
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
      <header className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-2xl px-2 py-1 bg-slate-800 rounded focus:outline-none"
          >
            ☰
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center font-bold text-slate-900">
              360
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">{t('app.title')}</h1>
              <p className="text-xs text-slate-400 hidden sm:block">{t('app.subtitle')}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Language Switcher */}
          <button
            onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
            className="px-3 py-1.5 text-xs font-semibold rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 transition"
          >
            {language === 'ar' ? 'English (LTR)' : 'العربية (RTL)'}
          </button>

          {/* Admin User Badge */}
          {user && (
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium">{user.fullName}</p>
                <p className="text-xs text-amber-400 font-mono">{user.role}</p>
              </div>
              <button
                onClick={logout}
                className="px-3 py-1.5 text-xs bg-red-600 hover:bg-red-700 text-white rounded font-medium transition"
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
          className={`bg-white border-slate-200 shadow-sm w-64 p-4 shrink-0 ${
            direction === 'rtl' ? 'border-l' : 'border-r'
          } ${mobileMenuOpen ? 'block fixed inset-y-0 z-50 shadow-2xl' : 'hidden md:block'}`}
        >
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
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition text-left ${
                    active
                      ? 'bg-blue-900 text-white shadow-sm'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span>{t(item.labelKey)}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Content Area */}
        <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
};

