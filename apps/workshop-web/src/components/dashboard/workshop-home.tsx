import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/auth-context';
import { workshopApi } from '../../api/workshop-client';
import { WorkshopView } from '../layout/workshop-layout';

interface WorkshopHomeProps {
  onNavigate: (view: WorkshopView) => void;
}

const CANONICAL_MODULES_META: Record<string, { nameAr: string; nameEn: string; icon: string; layer: string }> = {
  CORE: { nameAr: 'نظام تشغيل الورشة الأساسي (Core OS)', nameEn: 'Core Workshop OS', icon: '🏢', layer: 'الطبقة الأساسية' },
  MARKETPLACE_PACK: { nameAr: 'حزمة سوق مفتاح والمطابقة (Marketplace Pack)', nameEn: 'Marketplace Pack', icon: '🛒', layer: 'حزمة السوق' },
  INVENTORY: { nameAr: 'إدارة المخزون وقطع الغيار', nameEn: 'Inventory & Parts', icon: '📦', layer: 'موديول اختياري' },
  WARRANTY: { nameAr: 'الضمانات وشهادات الصيانة الرقمية', nameEn: 'Warranty & Guarantees', icon: '🛡️', layer: 'موديول اختياري' },
  SUPPLIERS: { nameAr: 'إدارة الموردين وفواتير الشراء', nameEn: 'Suppliers & Purchasing', icon: '🤝', layer: 'موديول اختياري' },
  POS: { nameAr: 'نقطة البيع والدفع السريع', nameEn: 'Point of Sale (POS)', icon: '💳', layer: 'موديول اختياري' },
  ADVANCED_CRM: { nameAr: 'إدارة علاقات العملاء ونقاط الولاء', nameEn: 'Advanced CRM & Loyalty', icon: '❤️', layer: 'موديول اختياري' },
  TASKS: { nameAr: 'المهام وجدولة الفنيين', nameEn: 'Technician Scheduling', icon: '⏱️', layer: 'موديول اختياري' },
  CONTRACTS: { nameAr: 'عقود صيانة الشركات والأساطيل', nameEn: 'Fleet Contracts', icon: '📑', layer: 'موديول اختياري' },
  HR: { nameAr: 'شؤون الموظفين والورديات', nameEn: 'Staff HR & Shifts', icon: '👥', layer: 'موديول اختياري' },
  ADVANCED_REPORTS: { nameAr: 'التقارير التحليلية والمالية المتقدمة', nameEn: 'Advanced Analytics', icon: '📊', layer: 'موديول اختياري' },
};

export const WorkshopHomeDashboard: React.FC<WorkshopHomeProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [servicesCount, setServicesCount] = useState<number>(0);
  const [brandsCount, setBrandsCount] = useState<number>(0);
  const [allBrands, setAllBrands] = useState<boolean>(false);
  const [staffCount, setStaffCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOverview = async () => {
      try {
        setLoading(true);
        const [prof, servs, brnds, stff] = await Promise.all([
          workshopApi.getProfile().catch(() => null),
          workshopApi.getServices().catch(() => []),
          workshopApi.getBrands().catch(() => []),
          workshopApi.getStaff().catch(() => []),
        ]);

        if (prof) setProfile(prof);
        if (servs && Array.isArray(servs)) {
          const enabledList = servs.filter((s: any) => s.enabled);
          setServices(enabledList);
          setServicesCount(enabledList.length);
        }
        if (brnds) {
          if (Array.isArray(brnds)) {
            const isAll = brnds.some((b: any) => b.allBrands);
            setAllBrands(isAll);
            setBrandsCount(brnds.length);
          } else {
            setAllBrands(Boolean(brnds.allBrands));
            setBrandsCount(Array.isArray(brnds.supportedBrands) ? brnds.supportedBrands.length : 0);
          }
        }
        if (stff && Array.isArray(stff)) {
          setStaffCount(stff.length);
        }
      } catch (err) {
        console.error('Failed to load workshop overview:', err);
      } finally {
        setLoading(false);
      }
    };

    loadOverview();
  }, []);

  // Compute Active Modules
  const entitlements = profile?.entitlements || [];
  const activeModules = entitlements.filter((e: any) => (e.state || e.status) === 'ENABLED');

  return (
    <div className="space-y-6" dir="rtl">
      {/* Top Welcome & Verification Hero Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white p-6 rounded-3xl shadow-xl border border-slate-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>نظام تشغيل الورش المستقلة (Workshop OS V1)</span>
              </span>
              <span className="px-2.5 py-1 bg-slate-800 text-slate-300 rounded-full text-xs font-mono font-bold">
                {profile?.emirate === 'DUBAI' ? '🇦🇪 دبي' : '🇦🇪 الشارقة'}
              </span>
            </div>
            <h2 className="text-2xl font-black tracking-tight">
              {profile?.displayNameAr || profile?.legalName || 'كراج مفتاح الإمارات لصيانة السيارات'}
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              مركز إدارة المنشأة المعتمد، ضبط أسعار الخدمات التأشيرية، ساعات العمل، ومتابعة طاقم الفنيين واستقبال طلبات الصيانة المعتمدة.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={() => onNavigate('profile')}
              className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl text-xs transition shadow-md"
            >
              ⚙️ إعداد وتجهيز ملف الورشة الشامل
            </button>
            <button
              onClick={() => onNavigate('hours')}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition border border-slate-600"
            >
              ⏰ مواعيد الدوام
            </button>
          </div>
        </div>
      </div>

      {/* Verification & Marketplace Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Verification Status Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">حالة اعتماد الورشة</span>
            <span className="text-xl">🛡️</span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-black ${
                profile?.status === 'ACTIVE'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : profile?.status === 'SUSPENDED'
                  ? 'bg-rose-100 text-rose-800 border border-rose-300'
                  : 'bg-amber-100 text-amber-800 border border-amber-300'
              }`}
            >
              {profile?.status === 'ACTIVE' ? 'نشطة ومعتمدة كلياً (ACTIVE)' : profile?.status || 'قيد التحقق'}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 pt-1 leading-relaxed">
            {profile?.status === 'ACTIVE'
              ? 'الورشة مستوفية لكافة الشروط البلدية والتراخيص التجارية ومعتمدة في شبكة مفتاح 360.'
              : 'جاري فحص المستندات الرسمية والموقع الجغرافي من قبل إدارة منصة مفتاح 360.'}
          </p>
        </div>

        {/* Marketplace Matching Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">المشاركة بسوق مفتاح (Marketplace)</span>
            <span className="text-xl">🌐</span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-black ${
                profile?.marketplaceParticipation
                  ? 'bg-indigo-100 text-indigo-800 border border-indigo-300'
                  : 'bg-slate-100 text-slate-600 border border-slate-300'
              }`}
            >
              {profile?.marketplaceParticipation ? 'مشاركة ومؤهلة للمطابقة ✅' : 'غير مشاركة حالياً'}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 pt-1 leading-relaxed">
            {profile?.marketplaceParticipation
              ? 'الورشة مؤهلة لاستقبال طلبات صيانة السيارات ومطابقة العملاء وفق التصنيف والماركات.'
              : 'تفعيل حزمة السوق يخضع لموافقة إدارة المنصة بعد استيفاء شروط الجودة.'}
          </p>
        </div>

        {/* Operating Hours Status */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">ساعات العمل والتشغيل اليوم</span>
            <span className="text-xl">⏰</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-xs font-black flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>مفتوح ويستقبل العملاء</span>
            </span>
          </div>
          <p className="text-[11px] text-slate-500 pt-1 leading-relaxed">
            مواعيد الدوام: من 08:00 صباحاً حتى 07:00 مساءً (الجمعة مغلق للصيانة والراحة).
          </p>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {/* Enabled Services */}
        <div
          onClick={() => onNavigate('services')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-emerald-500 cursor-pointer transition space-y-2"
        >
          <div className="flex justify-between items-center text-slate-500 text-xs font-bold">
            <span>الخدمات المفعلة للورشة</span>
            <span className="text-base">🔧</span>
          </div>
          <div className="text-3xl font-black text-slate-900">{servicesCount}</div>
          <p className="text-[11px] text-slate-400">من أصل 25 خدمة معتمدة في المنصة (اضغط للضبط)</p>
        </div>

        {/* Supported Brands */}
        <div
          onClick={() => onNavigate('brands')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-emerald-500 cursor-pointer transition space-y-2"
        >
          <div className="flex justify-between items-center text-slate-500 text-xs font-bold">
            <span>الماركات المدعومة</span>
            <span className="text-base">🚗</span>
          </div>
          <div className="text-3xl font-black text-slate-900">
            {allBrands ? 'كافة الماركات (All)' : brandsCount}
          </div>
          <p className="text-[11px] text-slate-400">
            {allBrands ? 'الورشة معتمدة لصيانة جميع الماركات' : 'ماركات محددة'}
          </p>
        </div>

        {/* Staff Members */}
        <div
          onClick={() => onNavigate('staff')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-emerald-500 cursor-pointer transition space-y-2"
        >
          <div className="flex justify-between items-center text-slate-500 text-xs font-bold">
            <span>طاقم العمل المسجل</span>
            <span className="text-base">👥</span>
          </div>
          <div className="text-3xl font-black text-slate-900">{staffCount}</div>
          <p className="text-[11px] text-slate-400">مستشارو خدمة، استقبال، وفنيون</p>
        </div>
      </div>

      {/* NEW SECTION 1: WORKSHOP ACTIVE MODULES & PACKS */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <span>📦</span>
              <span>باقات وموديولات الورشة المفعلة (Active Platform Modules)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              الموديولات الممنوحة للورشة مركزياً من إدارة مفتاح 360 وفق عقد الاشتراك ومعايير التأهيل.
            </p>
          </div>
          <span className="px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold self-start">
            الموديولات المفعلة: {activeModules.length} من أصل 11
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {/* Always Show Core */}
          <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-emerald-200 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">🏢</span>
              <div>
                <h5 className="font-bold text-slate-900 text-xs">النظام الأساسي (Core OS)</h5>
                <p className="text-[10px] text-slate-400 font-mono">CORE</p>
              </div>
            </div>
            <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-lg border border-emerald-200">
              🔒 مفعل دائماً
            </span>
          </div>

          {/* Marketplace Pack */}
          <div
            className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${
              profile?.marketplaceParticipation || activeModules.some((e: any) => e.module?.code === 'MARKETPLACE_PACK')
                ? 'bg-amber-50/50 border-amber-300'
                : 'bg-slate-50 border-slate-200 opacity-60'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">🛒</span>
              <div>
                <h5 className="font-bold text-slate-900 text-xs">سوق مفتاح (Marketplace Pack)</h5>
                <p className="text-[10px] text-slate-400 font-mono">MARKETPLACE_PACK</p>
              </div>
            </div>
            <span
              className={`px-2.5 py-1 text-[10px] font-bold rounded-lg ${
                profile?.marketplaceParticipation || activeModules.some((e: any) => e.module?.code === 'MARKETPLACE_PACK')
                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                  : 'bg-slate-200 text-slate-600'
              }`}
            >
              {profile?.marketplaceParticipation ? '✅ مفعل ومؤهل' : 'غير مفعل'}
            </span>
          </div>

          {/* Optional Modules that are active */}
          {activeModules
            .filter((e: any) => !['CORE', 'MARKETPLACE_PACK'].includes(e.module?.code))
            .map((e: any) => {
              const code = e.module?.code;
              const meta = CANONICAL_MODULES_META[code] || {
                nameAr: e.module?.nameAr || code,
                nameEn: e.module?.nameEn || '',
                icon: '📦',
                layer: 'موديول اختياري',
              };

              const viewMap: Record<string, WorkshopView> = {
                INVENTORY: 'inventory',
                WARRANTY: 'warranty',
                SUPPLIERS: 'suppliers',
                POS: 'pos',
                ADVANCED_CRM: 'crm',
                TASKS: 'tasks',
                CONTRACTS: 'contracts',
                HR: 'hr',
                ADVANCED_REPORTS: 'reports',
              };
              const targetView = viewMap[code];

              return (
                <div
                  key={e.id || code}
                  onClick={() => targetView && onNavigate(targetView)}
                  className={`p-3.5 bg-indigo-50/40 hover:bg-indigo-50 rounded-2xl border border-indigo-200 flex items-center justify-between gap-3 transition shadow-sm ${
                    targetView ? 'cursor-pointer hover:border-indigo-400 group' : ''
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">{meta.icon}</span>
                    <div>
                      <h5 className="font-bold text-slate-900 text-xs group-hover:text-indigo-800">{meta.nameAr}</h5>
                      <p className="text-[10px] text-slate-400 font-mono">{code}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 text-[10px] font-bold rounded-lg border border-indigo-200">
                      تشغيل ↗
                    </span>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* NEW SECTION 2: WORKSHOP ACTIVE SERVICES & STARTING PRICES */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <span>🛠️</span>
              <span>الخدمات المعتمدة وأسعار البداية (Starting From)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              الخدمات التي تقدمها الورشة حالياً لعملاء المنصة مع الأسعار الاسترشادية للبدء.
            </p>
          </div>
          <button
            onClick={() => onNavigate('services')}
            className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-sm self-start flex items-center gap-1.5"
          >
            <span>⚙️</span>
            <span>تعديل قائمة الخدمات والأسعار</span>
          </button>
        </div>

        {services.length === 0 ? (
          <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-2xl">
            <span className="text-3xl block mb-2">🔧</span>
            <p className="text-xs font-bold text-slate-600">لم تقم بتفعيل أي خدمات حتى الآن</p>
            <p className="text-[11px] text-slate-400 mt-1">اضغط على زر ضبط الخدمات لتحديد ما تقدمه ورشتك وأسعار البداية</p>
            <button
              onClick={() => onNavigate('services')}
              className="mt-3 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition"
            >
              تفعيل الخدمات الآن
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {services.map((item: any) => {
              const srv = item.service || item;
              return (
                <div
                  key={srv.id || srv.code}
                  className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 hover:border-emerald-400 transition space-y-2 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-start gap-1">
                      <h5 className="font-bold text-slate-900 text-xs">{srv.nameAr || srv.nameEn}</h5>
                      <span className="text-[9px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-mono font-bold">
                        {srv.category?.code || 'MAINT'}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">{srv.nameEn}</p>
                  </div>
                  <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">يبدأ من:</span>
                    <span className="text-xs font-black text-emerald-700 font-mono">
                      {item.startingPriceAmount ? `${item.startingPriceAmount} AED` : 'غير محدد'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Rules Notice */}
      <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-2 text-xs">
        <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
          <span>📌</span>
          <span>إرشادات تشغيل الورشة في المرحلة الأولى (Phase 1 Governance)</span>
        </h4>
        <ul className="text-slate-600 space-y-1 text-[11px] leading-relaxed">
          <li>• الأسعار المحددة في كتالوج الخدمات هي أسعار استرشادية (تبدأ من) ولا تلزم الورشة قبل فحص السيارة وإصدار عرض السعر النهائي المعتمد.</li>
          <li>• الموديولات والباقات الإضافية تدار وتمنح حصرياً من قبل إدارة منصة مفتاح 360 وفق باقة اشتراك الورشة.</li>
          <li>• الأدوار الوظيفية لطاقم الورشة محددة وفق 4 صلاحيات معتمدة: مالك الورشة، مستشار الخدمة، موظف الاستقبال، وفني الصيانة.</li>
          <li>• نظام تشغيل الورشة مصمم للفرع الرئيسي حالياً (Single-branch model) ولا يدعم الفروع المتعددة في المرحلة الأولى.</li>
        </ul>
      </div>
    </div>
  );
};
