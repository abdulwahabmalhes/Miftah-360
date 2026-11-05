import React, { useState, useEffect } from 'react';
import { useI18n } from '../../context/i18n-context';
import { adminApi } from '../../api/admin-client';
import { ModuleEntitlementState } from '@miftah/contracts';

interface CanonicalModuleInfo {
  code: string;
  layer: 'CORE' | 'MARKETPLACE_PACK' | 'OPTIONAL';
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  icon: string;
}

const CANONICAL_MODULES: CanonicalModuleInfo[] = [
  // Layer 1: Core OS
  {
    code: 'CORE',
    layer: 'CORE',
    nameAr: 'نظام تشغيل الورشة الأساسي (Core OS)',
    nameEn: 'Workshop Core OS',
    descriptionAr: 'الملف التعريفي، ساعات العمل، الماركات، الخدمات، الموظفين، والعملاء. مفعل دائماً ولا يمكن تعطيله.',
    icon: '🏢',
  },
  // Layer 2: Marketplace Pack
  {
    code: 'MARKETPLACE_PACK',
    layer: 'MARKETPLACE_PACK',
    nameAr: 'حزمة سوق مفتاح والمطابقة (Marketplace Pack)',
    nameEn: 'Miftah Marketplace Pack',
    descriptionAr: 'استقبال طلبات الصيانة من أصحاب السيارات، عروض الأسعار، الحجوزات، بطاقات العمل، الفواتير، والتقييمات.',
    icon: '🛒',
  },
  // Layer 3: Optional Modules Catalog
  {
    code: 'INVENTORY',
    layer: 'OPTIONAL',
    nameAr: 'المخزون وقطع الغيار',
    nameEn: 'Inventory & Parts',
    descriptionAr: 'تتبع كميات قطع الغيار، أرقام OEM، تنبيهات حد الطلب، وإدارة المستودعات.',
    icon: '📦',
  },
  {
    code: 'WARRANTY',
    layer: 'OPTIONAL',
    nameAr: 'الضمانات وشهادات الصيانة',
    nameEn: 'Warranty Management',
    descriptionAr: 'إصدار وتتبع شهادات الضمان الرقمية للقطع وشغل اليد مع التنبيهات التلقائية.',
    icon: '🛡️',
  },
  {
    code: 'SUPPLIERS',
    layer: 'OPTIONAL',
    nameAr: 'الموردين وفواتير الشراء',
    nameEn: 'Suppliers & Purchasing',
    descriptionAr: 'دليل موردي قطع الغيار، أوامر الشراء، وحسابات الموردين والدفعات الآجلة.',
    icon: '🤝',
  },
  {
    code: 'POS',
    layer: 'OPTIONAL',
    nameAr: 'نقطة البيع والدفع السريع',
    nameEn: 'Point of Sale (POS)',
    descriptionAr: 'إصدار الفواتير الفورية عند الاستقبال ودعم الدفع السريع والشبكة والبطاقات.',
    icon: '💳',
  },
  {
    code: 'ADVANCED_CRM',
    layer: 'OPTIONAL',
    nameAr: 'إدارة علاقات العملاء والولاء',
    nameEn: 'Advanced CRM & Loyalty',
    descriptionAr: 'سجلات تواصل العملاء، برامج نقاط الولاء، والتذكير التلقائي بمواعيد الصيانة.',
    icon: '❤️',
  },
  {
    code: 'TASKS',
    layer: 'OPTIONAL',
    nameAr: 'المهام وجدولة الفنيين',
    nameEn: 'Technician Scheduling',
    descriptionAr: 'توزيع المهام اليومية على الفنيين، قياس كفاءة وساعات العمل، وتتبع الإنجاز.',
    icon: '⏱️',
  },
  {
    code: 'CONTRACTS',
    layer: 'OPTIONAL',
    nameAr: 'عقود صيانة الشركات والأساطيل',
    nameEn: 'Fleet Contracts',
    descriptionAr: 'إدارة اتفاقيات الصيانة المجمعة لشركات تأجير السيارات والأساطيل التجارية.',
    icon: '📑',
  },
  {
    code: 'HR',
    layer: 'OPTIONAL',
    nameAr: 'شؤون الموظفين والورديات',
    nameEn: 'Staff HR & Shifts',
    descriptionAr: 'جدولة الورديات، تسجيل الحضور والانصراف، وإدارة الإجازات للفريق الفني.',
    icon: '👥',
  },
  {
    code: 'ADVANCED_REPORTS',
    layer: 'OPTIONAL',
    nameAr: 'التقارير التحليلية والمالية',
    nameEn: 'Advanced Analytics',
    descriptionAr: 'تحليلات الأرباح والخسائر، أكثر الخدمات طلباً، والتقارير التنفيذية.',
    icon: '📊',
  },
];

export const ModuleEntitlementsView: React.FC = () => {
  const { language } = useI18n();
  const [workshops, setWorkshops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [emirateFilter, setEmirateFilter] = useState<string>('ALL');

  // Workshop Customizer Modal state
  const [selectedWorkshop, setSelectedWorkshop] = useState<any | null>(null);

  // Reason Modal for enabling/disabling module
  const [reasonModal, setReasonModal] = useState<{
    workshopId: string;
    workshopName: string;
    moduleCode: string;
    moduleName: string;
    action: 'enable' | 'disable';
  } | null>(null);
  const [reason, setReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminApi.getWorkshops();
      setWorkshops(data || []);
      // Refresh selected workshop if open
      if (selectedWorkshop) {
        const updated = (data || []).find((w: any) => w.id === selectedWorkshop.id);
        if (updated) setSelectedWorkshop(updated);
      }
    } catch (err: any) {
      setError(err.message || 'فشل في تحميل بيانات الورش والموديولات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getEntitlementState = (workshop: any, moduleCode: string): 'ENABLED' | 'DISABLED' | 'NOT_CONFIGURED' => {
    const list = workshop.entitlements || workshop.moduleEntitlements || [];
    const ent = list.find((e: any) => (e.module?.code || e.moduleCode) === moduleCode);
    if (!ent) return 'NOT_CONFIGURED';
    return (ent.state || ent.status) === 'ENABLED' ? 'ENABLED' : 'DISABLED';
  };

  const openToggleConfirm = (
    workshopId: string,
    workshopName: string,
    moduleCode: string,
    moduleName: string,
    currentlyEnabled: boolean,
  ) => {
    if (moduleCode === 'CORE') {
      alert('النظام الأساسي (CORE) إلزامي ومفعل دائماً لجميع الورش ولا يمكن تعطيله.');
      return;
    }
    setReason('');
    setReasonModal({
      workshopId,
      workshopName,
      moduleCode,
      moduleName,
      action: currentlyEnabled ? 'disable' : 'enable',
    });
  };

  const executeToggle = async () => {
    if (!reasonModal) return;
    try {
      setActionLoading(true);
      if (reasonModal.action === 'enable') {
        await adminApi.enableModule(
          reasonModal.workshopId,
          reasonModal.moduleCode,
          reason.trim() || 'ADMIN_ENABLED_FROM_MODULES_VIEW',
        );
      } else {
        if (!reason.trim()) {
          alert('يرجى تحديد سبب تعطيل الموديول لأغراض التدقيق وسجلات الحوكمة.');
          setActionLoading(false);
          return;
        }
        await adminApi.disableModule(
          reasonModal.workshopId,
          reasonModal.moduleCode,
          reason.trim(),
        );
      }
      setReasonModal(null);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'فشلت العملية');
    } finally {
      setActionLoading(false);
    }
  };

  // Filtered workshops
  const filteredWorkshops = workshops.filter((w) => {
    const matchSearch =
      (w.displayNameAr || '').toLowerCase().includes(search.toLowerCase()) ||
      (w.displayNameEn || '').toLowerCase().includes(search.toLowerCase()) ||
      (w.legalName || '').toLowerCase().includes(search.toLowerCase());
    const matchEmirate = emirateFilter === 'ALL' || w.emirate === emirateFilter;
    return matchSearch && matchEmirate;
  });

  return (
    <div className="space-y-6" dir="rtl">
      {/* Top Header & Overview */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white p-6 rounded-3xl shadow-xl border border-slate-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full text-xs font-bold mb-2">
              ⚙️ حوكمة الموديولات وباقات الورش (ADR OS 001)
            </div>
            <h2 className="text-2xl font-black tracking-tight">إدارة مصفوفة باقات وموديولات الورش</h2>
            <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">
              تحكم كامل في موديولات منصة مفتاح 360 عبر الطبقات الثلاث: النظام الأساسي (Core OS إلزامي)، حزمة سوق مفتاح (Marketplace Pack للطلبات والمطابقة)، والكتالوج الاختياري (المخزون، الضمانات، الموردين، POS، CRM، الفنيين، التقارير).
            </p>
          </div>
          <button
            onClick={loadData}
            disabled={loading}
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black rounded-xl shadow-md transition disabled:opacity-50 shrink-0 flex items-center gap-2"
          >
            <span>🔄</span>
            <span>تحديث المصفوفة</span>
          </button>
        </div>

        {/* 3 Architecture Layers Explanation Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-6 pt-5 border-t border-slate-800">
          <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700/60">
            <div className="flex items-center gap-2 font-bold text-xs text-emerald-400 mb-1">
              <span>🏢</span>
              <span>الطبقة 1: Workshop Core OS</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-snug">
              الهوية، ساعات العمل، الماركات، الخدمات، الفنيين، والعملاء. مفعل دائماً ولا يمكن تعطيله.
            </p>
          </div>
          <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700/60">
            <div className="flex items-center gap-2 font-bold text-xs text-amber-400 mb-1">
              <span>🛒</span>
              <span>الطبقة 2: Miftah Marketplace Pack</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-snug">
              استقبال طلبات الصيانة، عروض الأسعار، الحجوزات، بطاقات العمل، والفواتير والتقييمات. إشراف الإدارة حصراً.
            </p>
          </div>
          <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700/60">
            <div className="flex items-center gap-2 font-bold text-xs text-indigo-400 mb-1">
              <span>📦</span>
              <span>الطبقة 3: الكتالوج الاختياري (9 موديولات)</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-snug">
              المخزون، الضمانات، الموردين، POS، CRM، الفنيين، العقود، شؤون الموظفين، والتقارير المتقدمة. تفعيل مخصص لكل ورشة.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs font-bold leading-relaxed">
          {error}
        </div>
      )}

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="w-full md:w-96 relative">
          <input
            type="text"
            placeholder="بحث باسم الورشة، الاسم التجاري، أو الإمارة..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-3 pr-10 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
          <span className="absolute right-3.5 top-2.5 text-slate-400 text-xs">🔍</span>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs font-bold text-slate-500 whitespace-nowrap">الإمارة:</span>
          <select
            value={emirateFilter}
            onChange={(e) => setEmirateFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900"
          >
            <option value="ALL">جميع الإمارات</option>
            <option value="DUBAI">دبي (Dubai)</option>
            <option value="SHARJAH">الشارقة (Sharjah)</option>
            <option value="ABU_DHABI">أبوظبي (Abu Dhabi)</option>
          </select>
          <span className="text-xs bg-slate-100 text-slate-600 px-3 py-2 rounded-xl font-mono font-bold">
            العدد: {filteredWorkshops.length}
          </span>
        </div>
      </div>

      {/* Workshops Matrix Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-slate-500">
            <div className="animate-spin inline-block w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full mb-3"></div>
            <p className="text-xs font-bold">جارٍ تحميل مصفوفة الموديولات والورش...</p>
          </div>
        ) : filteredWorkshops.length === 0 ? (
          <div className="p-16 text-center text-slate-400">
            <span className="text-4xl block mb-2">🏢</span>
            <p className="text-sm font-bold text-slate-700">لا توجد ورش مطابقة للبحث</p>
            <p className="text-xs text-slate-400 mt-1">تأكد من شروط البحث أو قم بإلغاء الفلتر</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-black">
                <tr>
                  <th className="px-5 py-4">الورشة والإمارة</th>
                  <th className="px-5 py-4 text-center">حالة الورشة</th>
                  <th className="px-5 py-4 text-center">الأساسي (Core)</th>
                  <th className="px-5 py-4 text-center">سوق مفتاح (Marketplace)</th>
                  <th className="px-5 py-4 text-center">الموديولات الاختيارية المفعلة</th>
                  <th className="px-5 py-4 text-center">إجراءات الحوكمة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredWorkshops.map((w) => {
                  const coreState = getEntitlementState(w, 'CORE');
                  const marketState = getEntitlementState(w, 'MARKETPLACE_PACK');
                  const isMarketActive = marketState === 'ENABLED';

                  // Calculate optional modules enabled
                  const optionalEnabled = CANONICAL_MODULES.filter(
                    (m) => m.layer === 'OPTIONAL' && getEntitlementState(w, m.code) === 'ENABLED',
                  );

                  return (
                    <tr key={w.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-900 text-sm">
                          {w.displayNameAr || w.displayNameEn}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          {w.displayNameEn || w.legalName} • {w.emirate}
                        </div>
                      </td>

                      <td className="px-5 py-4 text-center">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            w.status === 'ACTIVE'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : w.status === 'SUSPENDED'
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : 'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {w.status}
                        </span>
                      </td>

                      {/* Core OS (Always Enabled & Locked) */}
                      <td className="px-5 py-4 text-center">
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-[11px] font-bold">
                          <span>🔒</span>
                          <span>مفعل دائماً</span>
                        </span>
                      </td>

                      {/* Marketplace Pack Toggle */}
                      <td className="px-5 py-4 text-center">
                        <div className="inline-flex items-center gap-2">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                              isMarketActive
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {isMarketActive ? '✅ مفعل' : '⚪ معطل'}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              openToggleConfirm(
                                w.id,
                                w.displayNameAr || w.displayNameEn,
                                'MARKETPLACE_PACK',
                                'حزمة سوق مفتاح (Marketplace Pack)',
                                isMarketActive,
                              )
                            }
                            className={`px-3 py-1 rounded-xl text-xs font-bold transition shadow-sm ${
                              isMarketActive
                                ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            }`}
                          >
                            {isMarketActive ? 'تعطيل' : 'تفعيل'}
                          </button>
                        </div>
                      </td>

                      {/* Optional Modules Badges */}
                      <td className="px-5 py-4 text-center">
                        <div className="flex flex-wrap gap-1 justify-center max-w-xs mx-auto">
                          {optionalEnabled.length === 0 ? (
                            <span className="text-[11px] text-slate-400 italic">لا توجد موديولات إضافية</span>
                          ) : (
                            optionalEnabled.map((m) => (
                              <span
                                key={m.code}
                                className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg text-[10px] font-bold flex items-center gap-1"
                                title={m.nameAr}
                              >
                                <span>{m.icon}</span>
                                <span>{m.code}</span>
                              </span>
                            ))
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-center">
                        <button
                          type="button"
                          onClick={() => setSelectedWorkshop(w)}
                          className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs shadow-sm transition inline-flex items-center gap-1.5"
                        >
                          <span>⚙️</span>
                          <span>تخصيص الموديولات ({optionalEnabled.length + 2}/11)</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* WORKSHOP DETAILED MODULES MODAL / DRAWER */}
      {selectedWorkshop && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto" dir="rtl">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-100 animate-fadeIn">
            {/* Modal Header */}
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500 text-slate-950">
                    {selectedWorkshop.emirate}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                    {selectedWorkshop.status}
                  </span>
                </div>
                <h3 className="text-xl font-black">
                  بطاقة تخصيص الموديولات: {selectedWorkshop.displayNameAr || selectedWorkshop.displayNameEn}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5 font-mono">{selectedWorkshop.legalName}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedWorkshop(null)}
                className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 text-lg font-bold transition"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6 bg-slate-50">
              {/* Notice */}
              <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-2xl text-xs text-indigo-950 leading-relaxed space-y-1">
                <p className="font-bold flex items-center gap-1.5 text-sm">
                  <span>📌</span>
                  <span>حوكمة باقات مفتاح 360 (PO Rules & ADR OS 001)</span>
                </p>
                <p className="text-[11px] text-indigo-800">
                  إدارة منصة مفتاح وحدها المخولة بتفعيل أو تعطيل الباقات والموديولات للورش. يتم تسجيل كل عملية تفعيل أو تعطيل باسم المشرف والوقت والسبب في سجل التدقيق غير القابل للتعديل.
                </p>
              </div>

              {/* SECTION 1: Core OS */}
              <div className="space-y-3">
                <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
                  <span>🏢</span>
                  <span>الطبقة الأولى: نظام تشغيل الورشة الأساسي (Workshop Core OS)</span>
                </h4>
                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🏢</span>
                      <h5 className="font-black text-slate-900 text-sm">CORE — نظام الورشة الأساسي</h5>
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-md">
                        مفعل دائماً
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 max-w-xl">
                      يشمل هوية الورشة، الملف التعريفي، ساعات العمل، الماركات، الخدمات، إدارة الفنيين، والعملاء والمركبات. غير قابل للتعطيل إطلاقاً.
                    </p>
                  </div>
                  <span className="px-3.5 py-1.5 bg-slate-100 text-slate-500 rounded-xl text-xs font-bold border border-slate-200 shrink-0">
                    🔒 مقفل بالنظام
                  </span>
                </div>
              </div>

              {/* SECTION 2: Marketplace Pack */}
              <div className="space-y-3">
                <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
                  <span>🛒</span>
                  <span>الطبقة الثانية: حزمة سوق مفتاح (Miftah Marketplace Pack)</span>
                </h4>
                {(() => {
                  const state = getEntitlementState(selectedWorkshop, 'MARKETPLACE_PACK');
                  const isEnabled = state === 'ENABLED';
                  return (
                    <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">🛒</span>
                          <h5 className="font-black text-slate-900 text-sm">MARKETPLACE_PACK — حزمة سوق مفتاح</h5>
                          <span
                            className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${
                              isEnabled ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {isEnabled ? 'مفعل للورشة' : 'معطل'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1 max-w-xl leading-relaxed">
                          تمكّن الورشة من استقبال طلبات الصيانة والمطابقة الذكية، تقديم عروض الأسعار، إدارة الحجوزات والتقويم، بطاقات العمل، والفواتير والتقييمات وسجل الصيانة.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          openToggleConfirm(
                            selectedWorkshop.id,
                            selectedWorkshop.displayNameAr || selectedWorkshop.displayNameEn,
                            'MARKETPLACE_PACK',
                            'حزمة سوق مفتاح (Marketplace Pack)',
                            isEnabled,
                          )
                        }
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm shrink-0 ${
                          isEnabled
                            ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        }`}
                      >
                        {isEnabled ? 'تعطيل باقة السوق ⚠️' : 'تفعيل باقة السوق ✅'}
                      </button>
                    </div>
                  );
                })()}
              </div>

              {/* SECTION 3: Optional Modules Catalog (9 Modules) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
                    <span>📦</span>
                    <span>الطبقة الثالثة: الكتالوج الاختياري للموديولات (9 موديولات)</span>
                  </h4>
                  <span className="text-[11px] font-bold text-slate-500">
                    يمكن تفعيل كل موديول بشكل مستقل وفق باقة الورشة واحتياجها
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {CANONICAL_MODULES.filter((m) => m.layer === 'OPTIONAL').map((mod) => {
                    const state = getEntitlementState(selectedWorkshop, mod.code);
                    const isEnabled = state === 'ENABLED';
                    return (
                      <div
                        key={mod.code}
                        className={`p-4 rounded-2xl border transition shadow-sm flex flex-col justify-between ${
                          isEnabled
                            ? 'bg-white border-emerald-300 ring-1 ring-emerald-200'
                            : 'bg-white/80 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <div className="flex items-center gap-2">
                              <span className="text-xl">{mod.icon}</span>
                              <div>
                                <h5 className="font-bold text-slate-900 text-xs">{mod.nameAr}</h5>
                                <p className="text-[10px] text-slate-400 font-mono">{mod.nameEn}</p>
                              </div>
                            </div>
                            <span
                              className={`px-2 py-0.5 text-[10px] font-bold rounded-md shrink-0 ${
                                isEnabled
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                  : 'bg-slate-100 text-slate-500'
                              }`}
                            >
                              {isEnabled ? '✅ مفعل' : '⚪ غير مفعل'}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 leading-snug line-clamp-2 mb-3">
                            {mod.descriptionAr}
                          </p>
                        </div>

                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-[10px] text-slate-400 font-mono">CODE: {mod.code}</span>
                          <button
                            type="button"
                            onClick={() =>
                              openToggleConfirm(
                                selectedWorkshop.id,
                                selectedWorkshop.displayNameAr || selectedWorkshop.displayNameEn,
                                mod.code,
                                mod.nameAr,
                                isEnabled,
                              )
                            }
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-sm ${
                              isEnabled
                                ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                                : 'bg-slate-900 hover:bg-slate-800 text-white'
                            }`}
                          >
                            {isEnabled ? 'تعطيل الموديول' : 'تفعيل الموديول'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-white border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedWorkshop(null)}
                className="px-5 py-2 bg-slate-900 text-white font-bold rounded-xl text-xs transition"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION & AUDIT REASON DIALOG */}
      {reasonModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4" dir="rtl">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-slate-100 animate-scaleIn">
            <div className="flex items-center gap-3">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shrink-0 ${
                  reasonModal.action === 'enable'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-rose-100 text-rose-800'
                }`}
              >
                {reasonModal.action === 'enable' ? '✅' : '⚠️'}
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  {reasonModal.action === 'enable' ? 'تأكيد تفعيل الموديول' : 'تأكيد تعطيل الموديول'}
                </h3>
                <p className="text-xs text-slate-500 font-bold">{reasonModal.moduleName}</p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-700">
              <p>
                <strong>الورشة:</strong> {reasonModal.workshopName}
              </p>
              <p>
                <strong>رمز الموديول:</strong> <span className="font-mono">{reasonModal.moduleCode}</span>
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                سبب العملية (Audit Trail Reason) {reasonModal.action === 'disable' && <span className="text-rose-600">*</span>}:
              </label>
              <textarea
                rows={3}
                required={reasonModal.action === 'disable'}
                placeholder={
                  reasonModal.action === 'enable'
                    ? 'اكتب سبب التفعيل (مثال: ترقية اشتراك الورشة، أو تجربة مجانية)...'
                    : 'اكتب سبب التعطيل الإلزامي (مثال: انتهاء فترة التجربة، أو طلب الورشة)...'
                }
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full p-3 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            {/* Quick Reason Chips */}
            <div className="space-y-1">
              <p className="text-[10px] text-slate-400 font-bold">أسباب سريعة شائعة:</p>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'ترقية باقة الورشة',
                  'فترة تجربة مجانية 30 يوم',
                  'طلب مباشر من إدارة الورشة',
                  'عدم استيفاء معايير الجودة',
                  'إيقاف مؤقت للاشتراك',
                ].map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => setReason(chip)}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold rounded-lg transition"
                  >
                    + {chip}
                  </button>
                ))}
              </div>
            </div>

            {/* Modal Buttons */}
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setReasonModal(null)}
                disabled={actionLoading}
                className="flex-1 py-2.5 border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs transition"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={executeToggle}
                disabled={actionLoading}
                className={`flex-1 py-2.5 text-white font-bold rounded-xl text-xs transition shadow-md disabled:opacity-50 ${
                  reasonModal.action === 'enable'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {actionLoading ? 'جارٍ التنفيذ...' : reasonModal.action === 'enable' ? 'تأكيد التفعيل' : 'تأكيد التعطيل'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
