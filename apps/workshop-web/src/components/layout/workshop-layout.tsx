import React, { useState, useEffect } from 'react';
import { useI18n } from '../../context/i18n-context';
import { useAuth } from '../../context/auth-context';
import { workshopApi } from '../../api/workshop-client';

export type WorkshopView =
  | 'dashboard'
  | 'requests'
  | 'bookings'
  | 'profile'
  | 'hours'
  | 'brands'
  | 'services'
  | 'staff'
  | 'customers'
  | 'inventory'
  | 'warranty'
  | 'suppliers'
  | 'pos'
  | 'crm'
  | 'tasks'
  | 'contracts'
  | 'hr'
  | 'reports';

interface WorkshopLayoutProps {
  currentView: WorkshopView;
  onViewChange: (view: WorkshopView) => void;
  onReplayIntro?: () => void;
  children: React.ReactNode;
}

export const WorkshopLayout: React.FC<WorkshopLayoutProps> = ({
  currentView,
  onViewChange,
  onReplayIntro,
  children,
}) => {
  const { t, language, setLanguage, direction } = useI18n();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeModules, setActiveModules] = useState<string[]>([]);

  useEffect(() => {
    workshopApi
      .getProfile()
      .then((p) => {
        if (p?.entitlements && p.entitlements.length > 0) {
          const enabledCodes = p.entitlements
            .filter((e: any) => (e.state || e.status) === 'ENABLED')
            .map((e: any) => e.module?.code);
          setActiveModules(enabledCodes);
        } else {
          setActiveModules([
            'INVENTORY',
            'WARRANTY',
            'SUPPLIERS',
            'POS',
            'ADVANCED_CRM',
            'TASKS',
            'CONTRACTS',
            'HR',
            'ADVANCED_REPORTS',
          ]);
        }
      })
      .catch(() => {
        setActiveModules([
          'INVENTORY',
          'WARRANTY',
          'SUPPLIERS',
          'POS',
          'ADVANCED_CRM',
          'TASKS',
          'CONTRACTS',
          'HR',
          'ADVANCED_REPORTS',
        ]);
      });
  }, []);

  const coreNavItems: { id: WorkshopView; labelAr: string; labelEn: string; icon: string }[] = [
    { id: 'dashboard', labelAr: 'لوحة التحكم والعمليات', labelEn: 'Dashboard Overview', icon: '📊' },
    { id: 'requests', labelAr: 'طلبات الصيانة والاستقبال', labelEn: 'Service Requests', icon: '📬' },
    { id: 'bookings', labelAr: 'جدول المواعيد والوصول', labelEn: 'Bookings & Check-In', icon: '📅' },
    { id: 'profile', labelAr: 'إعداد الملف الشخصي والخدمات', labelEn: 'Profile & Services Setup', icon: '⚙️' },
    { id: 'hours', labelAr: 'أوقات العمل الأسبوعية', labelEn: 'Working Hours', icon: '⏰' },
    { id: 'brands', labelAr: 'الماركات المدعومة', labelEn: 'Supported Brands', icon: '🚗' },
    { id: 'services', labelAr: 'الخدمات والأسعار التقديرية', labelEn: 'Services & Pricing', icon: '🛠️' },
    { id: 'staff', labelAr: 'فريق العمل والصلاحيات', labelEn: 'Staff & Roles', icon: '👥' },
    { id: 'customers', labelAr: 'العملاء والمركبات', labelEn: 'Customers & Vehicles', icon: '📋' },
  ];

  const moduleNavItems: { id: WorkshopView; code: string; labelAr: string; labelEn: string; icon: string }[] = [
    { id: 'inventory', code: 'INVENTORY', labelAr: 'المخزون وقطع الغيار', labelEn: 'Inventory & Parts', icon: '📦' },
    { id: 'warranty', code: 'WARRANTY', labelAr: 'الضمانات وشهادات الصيانة', labelEn: 'Warranty & Guarantees', icon: '🛡️' },
    { id: 'suppliers', code: 'SUPPLIERS', labelAr: 'الموردين وفواتير الشراء', labelEn: 'Suppliers & Purchases', icon: '🤝' },
    { id: 'pos', code: 'POS', labelAr: 'نقطة البيع والدفع السريع', labelEn: 'Point of Sale (POS)', icon: '💳' },
    { id: 'crm', code: 'ADVANCED_CRM', labelAr: 'علاقات العملاء والولاء', labelEn: 'Advanced CRM', icon: '❤️' },
    { id: 'tasks', code: 'TASKS', labelAr: 'المهام وجدولة الفنيين', labelEn: 'Tasks & Scheduling', icon: '⏱️' },
    { id: 'contracts', code: 'CONTRACTS', labelAr: 'عقود صيانة الشركات والأسطول', labelEn: 'Fleet Contracts', icon: '📑' },
    { id: 'hr', code: 'HR', labelAr: 'شؤون الموظفين والورديات', labelEn: 'HR & Shifts', icon: '👥' },
    { id: 'reports', code: 'ADVANCED_REPORTS', labelAr: 'التقارير التحليلية والمالية', labelEn: 'Financial Reports', icon: '📊' },
  ];

  // Show modules matching active entitlements (or all if activeModules contains them)
  const availableModuleItems = moduleNavItems.filter((m) =>
    activeModules.length > 0 ? activeModules.includes(m.code) : true,
  );

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
                <h1 className="text-sm font-bold tracking-tight text-white">
                  {user ? (language === 'ar' ? user.workshopNameAr || user.workshopNameEn : user.workshopNameEn || user.workshopNameAr) || t('app.title') : t('app.title')}
                </h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#0A4D56] text-[#4DD0E1] border border-[#0E7C86]">
                  {t('app.primaryBranch')}
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

          {/* User Profile */}
          {user && (
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium">{user.fullName}</p>
                <p className="text-xs text-[#4DD0E1] font-mono">{t(`role.${user.role}`)}</p>
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

      {/* Main Container */}
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

            {/* Core OS Section */}
            <div className="mb-4">
              <span className="text-[10px] font-black uppercase text-slate-400 px-3 block mb-1 tracking-wider">
                {language === 'ar' ? 'نظام الورشة الأساسي (Core OS)' : 'Workshop Core'}
              </span>
              <nav className="space-y-1">
                {coreNavItems.map((item) => {
                  const active = currentView === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onViewChange(item.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition text-right ${
                        active
                          ? 'bg-[#0E7C86] text-white shadow-sm'
                          : 'text-slate-700 hover:bg-[#F2F5F7]'
                      }`}
                    >
                      <span className="text-base">{item.icon}</span>
                      <span>{language === 'ar' ? item.labelAr : item.labelEn}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Active Modules Section */}
            {availableModuleItems.length > 0 && (
              <div className="pt-3 border-t border-slate-100">
                <span className="text-[10px] font-black uppercase text-indigo-700 px-3 block mb-1 tracking-wider flex items-center gap-1">
                  <span>✨</span>
                  <span>{language === 'ar' ? 'الموديولات المفعلة للورشة' : 'Active Modules'}</span>
                </span>
                <nav className="space-y-1">
                  {availableModuleItems.map((item) => {
                    const active = currentView === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          onViewChange(item.id);
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition text-right ${
                          active
                            ? 'bg-[#0A4D56] text-[#4DD0E1] border border-[#0E7C86] shadow-sm'
                            : 'text-slate-700 hover:bg-[#F2F5F7]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-base">{item.icon}</span>
                          <span>{language === 'ar' ? item.labelAr : item.labelEn}</span>
                        </div>
                        <span className="w-1.5 h-1.5 rounded-full bg-[#4DD0E1]"></span>
                      </button>
                    );
                  })}
                </nav>
              </div>
            )}
          </div>

          <div className="p-3 bg-[#F2F5F7] rounded-2xl border border-slate-200 text-center mt-6">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <img src="/brand/logo.jpg" alt="360" className="w-4 h-4 object-contain" />
              <p className="text-[10px] text-slate-800 font-black">منظومة مفتاح 360 الإمارات</p>
            </div>
            <p className="text-[9px] text-[#0E7C86] font-bold">YOUR CAR. A SMARTER WAY.</p>
            <p className="text-[8px] text-slate-400 font-mono mt-0.5">Workshop OS v1.2</p>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 p-4 md:p-8 max-w-6xl mx-auto w-full overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
};
