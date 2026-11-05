import React, { useState } from 'react';
import { useI18n } from '../../context/i18n-context';

interface CrmCustomer {
  id: string;
  name: string;
  phone: string;
  vehicle: string;
  plate: string;
  visitsCount: number;
  totalSpend: number;
  loyaltyPoints: number;
  lastVisit: string;
  nextServiceDue: string;
  recommendedService: string;
}

const INITIAL_CRM_CUSTOMERS: CrmCustomer[] = [
  {
    id: 'crm-1',
    name: 'منصور المنصوري',
    phone: '+971501112233',
    vehicle: 'تويوتا لاندكروزر 2023',
    plate: 'دبي A 12345',
    visitsCount: 4,
    totalSpend: 3850,
    loyaltyPoints: 385,
    lastVisit: '2026-04-10',
    nextServiceDue: '2026-10-10',
    recommendedService: 'صيانة دورية 40,000 كم وتبديل زيت وفلتر',
  },
  {
    id: 'crm-2',
    name: 'سلطان القاسمي',
    phone: '+971505556677',
    vehicle: 'نيسان باترول 2022',
    plate: 'الشارقة B 9988',
    visitsCount: 2,
    totalSpend: 1650,
    loyaltyPoints: 165,
    lastVisit: '2026-03-01',
    nextServiceDue: '2026-09-01',
    recommendedService: 'فحص سفايف الفرامل وميزانية العجلات',
  },
  {
    id: 'crm-3',
    name: 'أحمد الظاهري',
    phone: '+971509998811',
    vehicle: 'بورش كايين 2024',
    plate: 'أبوظبي 5 44332',
    visitsCount: 3,
    totalSpend: 5400,
    loyaltyPoints: 540,
    lastVisit: '2026-05-02',
    nextServiceDue: '2026-11-02',
    recommendedService: 'صيانة دورة التكييف وتبديل فلتر المقصورة',
  },
];

export const CrmManager: React.FC = () => {
  const { language } = useI18n();
  const [customers, setCustomers] = useState<CrmCustomer[]>(INITIAL_CRM_CUSTOMERS);
  const [search, setSearch] = useState('');

  const handleSendReminder = (c: CrmCustomer) => {
    alert(
      `تم إرسال تذكير بالصيانة التلقائي للعميل:\n${c.name} (${c.phone})\nالمحتوى: موعد صيانتك القادم مستحق لمركبتك ${c.vehicle} (${c.recommendedService}) 📱`,
    );
  };

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      c.vehicle.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white p-6 rounded-3xl shadow-xl border border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-full text-xs font-bold mb-2">
            ❤️ موديول علاقات العملاء وبرامج الولاء (Advanced CRM)
          </div>
          <h2 className="text-2xl font-black">إدارة ولاء العملاء والتذكير بالصيانة الدورية</h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            متابعة دورة حياة العميل، تواريخ الصيانة القادمة المستحقة، نقاط المكافآت، وإرسال تنبيهات واتساب المباشرة.
          </p>
        </div>

        <button
          type="button"
          onClick={() => alert('تم جدولة إرسال التذكيرات التلقائية لكافة العملاء المستحقة صيانة مركباتهم هذا الشهر ✅')}
          className="px-5 py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black rounded-2xl text-xs transition shadow-lg shrink-0 flex items-center gap-2"
        >
          <span>📲</span>
          <span>إرسال تذكيرات الصيانة للجميع</span>
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-bold text-slate-400">إجمالي العملاء في برنامج الولاء</span>
          <div className="text-2xl font-black text-slate-900">{customers.length} عملاء</div>
          <p className="text-[11px] text-slate-500">عملاء دائمين مع سجل مركبات موثق</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-bold text-slate-400">نقاط الولاء النشطة الممنوحة</span>
          <div className="text-2xl font-black text-amber-600 font-mono">1,090 نقطة</div>
          <p className="text-[11px] text-slate-500">تعادل خصومات 5% إلى 10% على شغل اليد</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-bold text-slate-400">معدل العودة وتكرار الزيارات</span>
          <div className="text-2xl font-black text-emerald-700">82%</div>
          <p className="text-[11px] text-slate-500">نسبة عودة العميل لإجراء الصيانة بالورشة</p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="w-full md:w-96 relative">
          <input
            type="text"
            placeholder="بحث باسم العميل، رقم الهاتف، أو المركبة..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-3 pr-10 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-slate-900"
          />
          <span className="absolute right-3.5 top-2.5 text-slate-400 text-xs">🔍</span>
        </div>
        <span className="text-xs text-slate-400 font-bold">العملاء: {filtered.length}</span>
      </div>

      {/* Customer CRM Cards Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-black">
              <tr>
                <th className="px-5 py-4">العميل والمركبة</th>
                <th className="px-5 py-4 text-center">الزيارات والإنفاق</th>
                <th className="px-5 py-4 text-center">نقاط الولاء</th>
                <th className="px-5 py-4">آخر زيارة والموعد القادم</th>
                <th className="px-5 py-4">الخدمة الموصى بها</th>
                <th className="px-5 py-4 text-center">الإجراء المباشر</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50 transition">
                  <td className="px-5 py-4">
                    <div className="font-bold text-slate-900 text-sm">{c.name}</div>
                    <div className="text-[11px] text-slate-500 font-mono">{c.phone}</div>
                    <div className="text-[10px] text-slate-600 font-bold bg-slate-100 px-2 py-0.5 rounded mt-1 inline-block">
                      🚗 {c.vehicle} ({c.plate})
                    </div>
                  </td>

                  <td className="px-5 py-4 text-center">
                    <span className="font-bold text-slate-900 block">{c.visitsCount} زيارات</span>
                    <span className="font-mono text-emerald-700 font-bold text-[11px]">{c.totalSpend.toLocaleString()} AED</span>
                  </td>

                  <td className="px-5 py-4 text-center">
                    <span className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl text-xs font-black inline-flex items-center gap-1">
                      <span>⭐</span>
                      <span>{c.loyaltyPoints} نقطة</span>
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    <div className="text-[11px] text-slate-500">آخر زيارة: <span className="font-mono text-slate-700">{c.lastVisit}</span></div>
                    <div className="text-[11px] text-indigo-700 font-bold mt-0.5">
                      القادم: <span className="font-mono">{c.nextServiceDue}</span>
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <span className="text-[11px] text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg font-bold block max-w-xs">
                      {c.recommendedService}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-center">
                    <button
                      type="button"
                      onClick={() => handleSendReminder(c)}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm inline-flex items-center gap-1.5"
                    >
                      <span>💬</span>
                      <span>تذكير (WhatsApp)</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

