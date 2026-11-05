import React, { useState, useEffect } from 'react';
import { useI18n } from '../../context/i18n-context';
import { adminApi } from '../../api/admin-client';

interface WorkshopDetailModalProps {
  workshop: any;
  onClose: () => void;
  onRefresh: () => void;
}

export const WorkshopDetailModal: React.FC<WorkshopDetailModalProps> = ({
  workshop: initialWorkshop,
  onClose,
  onRefresh,
}) => {
  const { t, language } = useI18n();
  const [workshop, setWorkshop] = useState<any>(initialWorkshop);
  const [activeTab, setActiveTab] = useState<'legal' | 'hours' | 'services' | 'staff' | 'modules' | 'actions'>('legal');
  const [loading, setLoading] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(true);
  const [actionReason, setActionReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Load complete relational details
  const fetchFullDetails = async () => {
    try {
      setLoadingDetails(true);
      const full = await adminApi.getWorkshopDetails(initialWorkshop.id);
      if (full) setWorkshop(full);
    } catch (e: any) {
      console.warn('Could not fetch full details, using initial data:', e);
    } finally {
      setLoadingDetails(false);
    }
  };

  useEffect(() => {
    fetchFullDetails();
  }, [initialWorkshop.id]);

  const executeAction = async (actionFn: () => Promise<any>, successText: string) => {
    try {
      setLoading(true);
      setError(null);
      setSuccessMsg(null);
      await actionFn();
      setSuccessMsg(successText);
      setActionReason('');
      await fetchFullDetails();
      onRefresh();
    } catch (err: any) {
      setError(err.message || 'فشلت معالجة الإجراء الرقابي');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = () => {
    executeAction(() => adminApi.approveWorkshop(workshop.id), 'تم اعتماد وتفعيل الورشة بنجاح!');
  };

  const handleReject = () => {
    if (!actionReason.trim()) {
      setError('يجب إدخال سبب الرفض القانوني لحفظه في سجل التدقيق الرقابي');
      return;
    }
    executeAction(() => adminApi.rejectWorkshop(workshop.id, actionReason), 'تم رفض طلب الورشة وتسجيل السبب');
  };

  const handleSuspend = () => {
    if (!actionReason.trim()) {
      setError('يجب إدخال سبب التعليق المؤقت (مثال: انتهاء صلاحية الرخصة أو مخالفة بلدية)');
      return;
    }
    executeAction(() => adminApi.suspendWorkshop(workshop.id, actionReason), 'تم تعليق الورشة مؤقتاً بنجاح');
  };

  const handleReactivate = () => {
    executeAction(() => adminApi.reactivateWorkshop(workshop.id), 'تمت إعادة تنشيط الورشة بنجاح!');
  };

  const handleDeactivate = () => {
    if (!actionReason.trim()) {
      setError('يجب إدخال سبب الإيقاف النهائي للورشة');
      return;
    }
    executeAction(() => adminApi.deactivateWorkshop(workshop.id, actionReason), 'تم إيقاف الورشة نهائياً');
  };

  const handleToggleMarketplace = (enabled: boolean) => {
    executeAction(
      () =>
        adminApi.updateMarketplaceParticipation(workshop.id, {
          marketplaceParticipation: enabled,
          reason: actionReason || (enabled ? 'ADMIN_MARKETPLACE_ENABLE' : 'ADMIN_MARKETPLACE_DISABLE'),
        }),
      enabled ? 'تم تفعيل مشاركة الورشة في سوق مفتاح' : 'تم تعطيل مشاركة الورشة في سوق مفتاح',
    );
  };

  const [togglingModuleCode, setTogglingModuleCode] = useState<string | null>(null);

  const handleToggleModule = async (moduleCode: string, enable: boolean) => {
    try {
      setTogglingModuleCode(moduleCode);
      setError(null);
      setSuccessMsg(null);
      if (enable) {
        await adminApi.enableModule(workshop.id, moduleCode, 'ADMIN_ENABLE_MODULE');
        setSuccessMsg(`تم تفعيل موديول (${moduleCode}) للورشة بنجاح ✅`);
      } else {
        await adminApi.disableModule(workshop.id, moduleCode, actionReason.trim() || 'ADMIN_DISABLE_MODULE');
        setSuccessMsg(`تم تعطيل موديول (${moduleCode}) للورشة 🛑`);
      }
      const fresh = await adminApi.getWorkshop(workshop.id);
      if (fresh) {
        setWorkshop(fresh);
      }
      onRefresh();
    } catch (err: any) {
      setError(err.message || `فشل تعديل حالة الموديول ${moduleCode}`);
    } finally {
      setTogglingModuleCode(null);
    }
  };

  const weekdaysMap = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

  const hasMarketplacePack = workshop.entitlements?.some(
    (e: any) => e.module?.code === 'MARKETPLACE_PACK' && e.state === 'ENABLED',
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto" dir="rtl">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-100">
        {/* Modal Header */}
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500 text-slate-950">
                {workshop.emirate === 'DUBAI' ? 'دبي' : 'الشارقة'}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-800 border border-slate-700 text-slate-300">
                الحالة: {workshop.status}
              </span>
            </div>
            <h2 className="text-xl font-black">{workshop.displayNameAr || workshop.legalName}</h2>
            <p className="text-xs text-slate-400 font-mono mt-0.5">{workshop.legalName}</p>
          </div>

          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center text-lg font-bold transition"
          >
            ✕
          </button>
        </div>

        {/* Feedback Banners */}
        {error && (
          <div className="mx-6 mt-4 p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-2xl">
            {error}
          </div>
        )}
        {successMsg && (
          <div className="mx-6 mt-4 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-2xl">
            {successMsg}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 gap-2 overflow-x-auto text-xs font-bold">
          <button
            onClick={() => setActiveTab('legal')}
            className={`py-3 px-3.5 border-b-2 transition whitespace-nowrap ${
              activeTab === 'legal'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            📋 البيانات القانونية والترخيص
          </button>
          <button
            onClick={() => setActiveTab('hours')}
            className={`py-3 px-3.5 border-b-2 transition whitespace-nowrap ${
              activeTab === 'hours'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            ⏰ الموقع وساعات العمل ({workshop.hours?.length || 7})
          </button>
          <button
            onClick={() => setActiveTab('services')}
            className={`py-3 px-3.5 border-b-2 transition whitespace-nowrap ${
              activeTab === 'services'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            🔧 الخدمات والماركات ({workshop.services?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('staff')}
            className={`py-3 px-3.5 border-b-2 transition whitespace-nowrap ${
              activeTab === 'staff'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            👥 طاقم العمل ({workshop.staff?.length || 1})
          </button>
          <button
            onClick={() => setActiveTab('modules')}
            className={`py-3 px-3.5 border-b-2 transition whitespace-nowrap ${
              activeTab === 'modules'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            🧩 حوكمة الباقات وسوق مفتاح
          </button>
          <button
            onClick={() => setActiveTab('actions')}
            className={`py-3 px-3.5 border-b-2 transition whitespace-nowrap ${
              activeTab === 'actions'
                ? 'border-rose-600 text-rose-600'
                : 'border-transparent text-slate-500 hover:text-rose-600'
            }`}
          >
            ⚡ القرارات الرقابية
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* TAB 1: Legal */}
          {activeTab === 'legal' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <h4 className="font-bold text-slate-900 text-sm border-b pb-1">الهوية القانونية والترخيص</h4>
                  <p><span className="text-slate-400">الاسم القانوني:</span> <strong className="text-slate-800 font-mono">{workshop.legalName}</strong></p>
                  <p><span className="text-slate-400">الاسم التجاري (عربي):</span> <strong className="text-slate-800">{workshop.displayNameAr || '—'}</strong></p>
                  <p><span className="text-slate-400">الاسم التجاري (إنجليزي):</span> <strong className="text-slate-800">{workshop.displayNameEn || '—'}</strong></p>
                  <p><span className="text-slate-400">الإمارة:</span> <strong className="text-slate-800">{workshop.emirate === 'DUBAI' ? 'دبي' : 'الشارقة'}</strong></p>
                  <p><span className="text-slate-400">تاريخ التسجيل:</span> <strong className="text-slate-800 font-mono">{new Date(workshop.createdAt).toLocaleString()}</strong></p>
                  <p><span className="text-slate-400">تاريخ الاعتماد:</span> <strong className="text-slate-800 font-mono">{workshop.verifiedAt ? new Date(workshop.verifiedAt).toLocaleString() : 'لم تعتمد بعد'}</strong></p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <h4 className="font-bold text-slate-900 text-sm border-b pb-1">بيانات الاتصال وممثل المنشأة</h4>
                  <p><span className="text-slate-400">الهاتف الأساسي:</span> <strong className="text-slate-800 font-mono">{workshop.primaryPhone}</strong></p>
                  <p><span className="text-slate-400">البريد الإلكتروني:</span> <strong className="text-slate-800 font-mono">{workshop.primaryEmail}</strong></p>
                  <p><span className="text-slate-400">العنوان النصي:</span> <strong className="text-slate-800">{workshop.addressText}</strong></p>
                  <p><span className="text-slate-400">الإحداثيات الجغرافية:</span> <strong className="text-slate-800 font-mono">{Number(workshop.latitude).toFixed(4)}, {Number(workshop.longitude).toFixed(4)}</strong></p>
                  {workshop.owner && (
                    <div className="pt-2 border-t mt-2">
                      <p className="text-[11px] text-slate-400">مالك الحساب الأساسي:</p>
                      <p className="font-bold text-slate-900">{workshop.owner.fullName}</p>
                      <p className="text-slate-500 font-mono text-[11px]">{workshop.owner.email || workshop.owner.phoneE164}</p>
                    </div>
                  )}
                </div>
              </div>

              {workshop.descriptionAr && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <h4 className="font-bold text-slate-900 text-xs">نبذة عن المنشأة والخدمات</h4>
                  <p className="text-slate-600 leading-relaxed">{workshop.descriptionAr}</p>
                  {workshop.descriptionEn && (
                    <p className="text-slate-400 text-[11px] leading-relaxed pt-1" dir="ltr">{workshop.descriptionEn}</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Hours & Location */}
          {activeTab === 'hours' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <h4 className="font-bold text-slate-900 text-sm mb-3">جدول أوقات العمل الأسبوعي (7 أيام)</h4>
                {workshop.hours && workshop.hours.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    {workshop.hours.map((h: any) => (
                      <div key={h.id || h.weekday} className="p-3 bg-white rounded-xl border border-slate-200 text-center">
                        <p className="font-bold text-slate-800 mb-1">{weekdaysMap[h.weekday] || `يوم ${h.weekday}`}</p>
                        {h.isClosed ? (
                          <span className="px-2 py-0.5 bg-rose-50 text-rose-700 font-bold rounded text-[11px]">
                            مغلق طوال اليوم
                          </span>
                        ) : (
                          <p className="font-mono text-emerald-700 font-bold text-xs">
                            {h.openTime} - {h.closeTime}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400">لم يتم إدخال جدول ساعات العمل بعد.</p>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: Services & Brands */}
          {activeTab === 'services' && (
            <div className="space-y-4">
              {/* Brands summary */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <h4 className="font-bold text-slate-900 text-sm">الماركات المدعومة (Supported Brands)</h4>
                {workshop.supportedBrands?.some((b: any) => b.allBrands) ? (
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full font-bold">
                    <span>✅ تدعم كافة الماركات وأنواع السيارات (All Brands Supported)</span>
                  </div>
                ) : workshop.supportedBrands && workshop.supportedBrands.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {workshop.supportedBrands.map((b: any) => (
                      <span key={b.id} className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg font-bold text-slate-700">
                        {b.brand?.name || b.brandId}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400">لم تقم الورشة باختيار ماركات محددة بعد.</p>
                )}
              </div>

              {/* Services List */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <h4 className="font-bold text-slate-900 text-sm">
                  الخدمات المفعلة من التصنيف المعتمد ({workshop.services?.length || 0})
                </h4>
                {workshop.services && workshop.services.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {workshop.services.map((ws: any) => (
                      <div key={ws.id} className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                        <div className="flex justify-between items-start">
                          <span className="font-bold text-slate-900 text-xs">{ws.service?.nameAr || ws.service?.code}</span>
                          <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-mono">
                            {ws.service?.category?.code || 'MAINT'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400">{ws.service?.nameEn}</p>
                        <p className="text-emerald-700 font-black text-xs pt-1">
                          يبدأ من: {ws.startingPriceAmount ? `${ws.startingPriceAmount} AED` : 'غير محدد'}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400">لم تقم الورشة بتفعيل خدمات حتى الآن.</p>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: Staff Members */}
          {activeTab === 'staff' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-900 text-sm">أعضاء طاقم العمل المسجلين بالورشة</h4>
                {workshop.staff && workshop.staff.length > 0 ? (
                  <div className="divide-y divide-slate-200">
                    {workshop.staff.map((st: any) => (
                      <div key={st.id} className="py-2.5 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-slate-900 text-xs">{st.user?.fullName || 'عضو طاقم'}</p>
                          <p className="text-[11px] text-slate-500 font-mono">{st.user?.email || st.user?.phoneE164}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 bg-slate-200 text-slate-800 rounded-full font-bold text-[10px]">
                            {st.role}
                          </span>
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-bold text-[10px]">
                            {st.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400">لا يوجد أعضاء مسجلين سوى المالك.</p>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: Modules Governance */}
          {activeTab === 'modules' && (
            <div className="space-y-4">
              {/* Inline Feedback Banners inside Tab 5 */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-2xl">
                  {error}
                </div>
              )}
              {successMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-2xl">
                  {successMsg}
                </div>
              )}

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                <h4 className="font-bold text-slate-900 text-sm">حوكمة باقات وموديولات الورشة</h4>
                <p className="text-slate-500 leading-relaxed text-[11px]">
                  وفق القواعد الرقابية لمنصة مفتاح 360، تخضع باقة السوق المفتوح (Marketplace Pack) لرقابة وموافقة الإدارة فقط لضمان جودة وتأهيل الورش المشاركة.
                </p>

                {/* Core Module */}
                <div className="p-4 bg-white rounded-2xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <h5 className="font-bold text-slate-900 text-xs">نظام إدارة الورشة الأساسي (Core Workshop OS)</h5>
                    <p className="text-[11px] text-slate-400">إدارة الملف والخدمات وساعات العمل وطاقم الصيانة - غير قابل للتعطيل</p>
                  </div>
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-bold rounded-lg text-xs">
                    مفعل دائماً (LOCKED)
                  </span>
                </div>

                {/* Marketplace Pack */}
                <div className="p-4 bg-white rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h5 className="font-bold text-slate-900 text-xs">حزمة سوق مفتاح والمطابقة (Marketplace Pack)</h5>
                    <p className="text-[11px] text-slate-400">تتيح استقبال طلبات صيانة السيارات ومطابقة المركبات مع الورشة</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {hasMarketplacePack ? (
                      <button
                        onClick={() => handleToggleModule('MARKETPLACE_PACK', false)}
                        disabled={loading}
                        className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition"
                      >
                        تعطيل الحزمة 🛑
                      </button>
                    ) : (
                      <button
                        onClick={() => handleToggleModule('MARKETPLACE_PACK', true)}
                        disabled={loading}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition"
                      >
                        تفعيل الحزمة ✅
                      </button>
                    )}
                  </div>
                </div>

                {/* Marketplace Participation Toggle */}
                <div className="p-4 bg-white rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h5 className="font-bold text-slate-900 text-xs">أهلية المطابقة التلقائية (Matching Engine Eligibility)</h5>
                    <p className="text-[11px] text-slate-400">ظهور الورشة في نتائج محرك المطابقة الموزون للعملاء</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {workshop.marketplaceParticipation ? (
                      <button
                        onClick={() => handleToggleMarketplace(false)}
                        disabled={loading}
                        className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs transition"
                      >
                        إيقاف المشاركة بالسوق
                      </button>
                    ) : (
                      <button
                        onClick={() => handleToggleMarketplace(true)}
                        disabled={loading}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition"
                      >
                        السماح بالمشاركة بالسوق
                      </button>
                    )}
                  </div>
                </div>

                {/* Optional Modules Catalog (9 Modules) */}
                <div className="space-y-3 pt-4 border-t border-slate-200">
                  <div className="flex items-center justify-between">
                    <h5 className="font-black text-slate-900 text-xs flex items-center gap-2">
                      <span>📦</span>
                      <span>الكتالوج الاختياري للموديولات (9 موديولات قابلة للتخصيص)</span>
                    </h5>
                    <span className="text-[10px] text-slate-400">تحكم فردي لكل موديول</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {[
                      { code: 'INVENTORY', name: 'المخزون وقطع الغيار', icon: '📦' },
                      { code: 'WARRANTY', name: 'الضمانات وشهادات الصيانة', icon: '🛡️' },
                      { code: 'SUPPLIERS', name: 'الموردين وفواتير الشراء', icon: '🤝' },
                      { code: 'POS', name: 'نقطة البيع والدفع السريع', icon: '💳' },
                      { code: 'ADVANCED_CRM', name: 'إدارة علاقات العملاء والولاء', icon: '❤️' },
                      { code: 'TASKS', name: 'المهام وجدولة الفنيين', icon: '⏱️' },
                      { code: 'CONTRACTS', name: 'عقود صيانة الشركات والأساطيل', icon: '📑' },
                      { code: 'HR', name: 'شؤون الموظفين والورديات', icon: '👥' },
                      { code: 'ADVANCED_REPORTS', name: 'التقارير التحليلية المتقدمة', icon: '📊' },
                    ].map((mod) => {
                      const isEnabled = workshop.entitlements?.some(
                        (e: any) => (e.module?.code || e.moduleCode) === mod.code && (e.state || e.status) === 'ENABLED',
                      );
                      return (
                        <div
                          key={mod.code}
                          className={`p-3 rounded-xl border flex items-center justify-between gap-2 ${
                            isEnabled ? 'bg-white border-emerald-300 ring-1 ring-emerald-200' : 'bg-white/70 border-slate-200'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-base">{mod.icon}</span>
                            <div>
                              <p className="text-xs font-bold text-slate-900">{mod.name}</p>
                              <p className="text-[10px] text-slate-400 font-mono">{mod.code}</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleToggleModule(mod.code, !isEnabled)}
                            disabled={loading || togglingModuleCode === mod.code}
                            className={`px-3 py-1 rounded-lg text-[11px] font-bold transition shadow-sm ${
                              isEnabled
                                ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                                : 'bg-slate-900 text-white hover:bg-slate-800'
                            }`}
                          >
                            {togglingModuleCode === mod.code
                              ? 'جارٍ التحديث...'
                              : isEnabled
                              ? 'تعطيل'
                              : 'تفعيل'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: Actions */}
          {activeTab === 'actions' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-200 space-y-4">
                <h4 className="font-bold text-rose-950 text-sm">اتخاذ إجراءات اعتماد أو تغيير الحالة الرقابية</h4>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  تنبيه رقابي: أي تغيير في حالة الورشة يتطلب توثيق سبب رسمي للتدقيق (Audit Trail) ولن يتم اعتماد أي إجراء حسّاس دون سبب واضح.
                </p>

                {/* Reason Input */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    سبب الإجراء الرقابي (مطلوب للتعليق والرفض والإلغاء):
                  </label>
                  <textarea
                    rows={2}
                    value={actionReason}
                    onChange={(e) => setActionReason(e.target.value)}
                    placeholder="اكتب سبب الإجراء بدقة (مثال: رخصة منتهية، عدم مطابقة الموقع، شكاوى متكررة...)"
                    className="w-full p-3 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
                  />
                </div>

                {/* Action Buttons Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
                  {/* Approve */}
                  <button
                    onClick={handleApprove}
                    disabled={loading || workshop.status === 'ACTIVE'}
                    className="p-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition shadow-sm disabled:opacity-40"
                  >
                    ✅ اعتماد وتفعيل الورشة (Approve)
                  </button>

                  {/* Suspend */}
                  <button
                    onClick={handleSuspend}
                    disabled={loading || workshop.status === 'SUSPENDED'}
                    className="p-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs transition shadow-sm disabled:opacity-40"
                  >
                    🛑 تعليق مؤقت (Suspend)
                  </button>

                  {/* Reactivate */}
                  <button
                    onClick={handleReactivate}
                    disabled={loading || workshop.status !== 'SUSPENDED'}
                    className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs transition shadow-sm disabled:opacity-40"
                  >
                    🔄 إعادة تنشيط (Reactivate)
                  </button>

                  {/* Reject */}
                  <button
                    onClick={handleReject}
                    disabled={loading || workshop.status === 'REJECTED'}
                    className="p-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs transition shadow-sm disabled:opacity-40"
                  >
                    ❌ رفض الطلب (Reject)
                  </button>

                  {/* Deactivate */}
                  <button
                    onClick={handleDeactivate}
                    disabled={loading || workshop.status === 'DEACTIVATED'}
                    className="p-3 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold text-xs transition shadow-sm disabled:opacity-40"
                  >
                    ⛔ إيقاف كلي دائم (Deactivate)
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl text-xs transition"
          >
            إغلاق النافذة
          </button>
        </div>
      </div>
    </div>
  );
};
