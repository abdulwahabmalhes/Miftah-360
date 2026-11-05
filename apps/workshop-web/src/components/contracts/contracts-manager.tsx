import React, { useState } from 'react';
import { useI18n } from '../../context/i18n-context';

interface FleetContract {
  id: string;
  companyName: string;
  vehiclesCount: number;
  annualValueAed: number;
  contactPerson: string;
  phone: string;
  startDate: string;
  endDate: string;
  slaDiscount: string;
  status: 'ACTIVE' | 'RENEWAL_DUE' | 'EXPIRED';
}

export const ContractsManager: React.FC = () => {
  const { language } = useI18n();

  const [contracts, setContracts] = useState<FleetContract[]>([
    {
      id: 'CNT-2026-08',
      companyName: 'شركة النقل السريع للخدمات اللوجستية (DHL UAE Fleet)',
      vehiclesCount: 24,
      annualValueAed: 185000,
      contactPerson: 'عمر القاسمي',
      phone: '+971 50 112 3344',
      startDate: '2026-01-01',
      endDate: '2026-12-31',
      slaDiscount: 'خصم 18% على قطع الغيار وأولوية صيانة فورية',
      status: 'ACTIVE',
    },
    {
      id: 'CNT-2026-15',
      companyName: 'مؤسسة الرواد لتأجير السيارات الفاخرة (Al Rowad Luxury)',
      vehiclesCount: 16,
      annualValueAed: 120000,
      contactPerson: 'سامر خليل',
      phone: '+971 52 445 6677',
      startDate: '2025-11-15',
      endDate: '2026-11-14',
      slaDiscount: 'صيانة دورية شاملة مع تبديل سيارة بديلة',
      status: 'RENEWAL_DUE',
    },
    {
      id: 'CNT-2026-22',
      companyName: 'مجموعة المها للخدمات الفنية (Al Maha Technical Fleet)',
      vehiclesCount: 8,
      annualValueAed: 64000,
      contactPerson: 'حسين البلوشي',
      phone: '+971 54 889 0011',
      startDate: '2026-03-01',
      endDate: '2027-02-28',
      slaDiscount: 'فحص كمبيوتر مجاني وخصم 15% على العمالة',
      status: 'ACTIVE',
    },
  ]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newCompany, setNewCompany] = useState('');
  const [newVehicles, setNewVehicles] = useState(10);
  const [newValue, setNewValue] = useState(80000);
  const [newContact, setNewContact] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newSla, setNewSla] = useState('خصم 15% على القطع وأولوية في الحارات');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompany) return;
    const newContract: FleetContract = {
      id: `CNT-2026-${Math.floor(30 + Math.random() * 60)}`,
      companyName: newCompany,
      vehiclesCount: Number(newVehicles),
      annualValueAed: Number(newValue),
      contactPerson: newContact,
      phone: newPhone,
      startDate: '2026-04-01',
      endDate: '2027-03-31',
      slaDiscount: newSla,
      status: 'ACTIVE',
    };
    setContracts([newContract, ...contracts]);
    setShowAddModal(false);
    setNewCompany('');
  };

  const totalAnnualValue = contracts.reduce((acc, c) => acc + c.annualValueAed, 0);
  const totalVehicles = contracts.reduce((acc, c) => acc + c.vehiclesCount, 0);

  return (
    <div className="space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-950 to-slate-900 text-white p-6 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="px-2.5 py-1 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-lg text-xs font-mono font-bold">
            CONTRACTS PACK (موديول عقود الشركات والأساطيل)
          </span>
          <h2 className="text-xl font-bold mt-2">إدارة عقود صيانة الشركات والأسطول (B2B Fleet)</h2>
          <p className="text-xs text-slate-300 mt-1">
            إدارة اتفاقيات مستوى الخدمة (SLA)، خصومات الأساطيل، والفوترة الشهرية للشركات
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow transition shrink-0 flex items-center gap-1.5"
        >
          <span>＋</span>
          <span>إبرام عقد أسطول جديد</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-500 font-bold">إجمالي القيمة السنوية للعقود</p>
          <p className="text-2xl font-black text-purple-700 mt-1">AED {totalAnnualValue.toLocaleString()}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">عائدات صيانة B2B مضمونة</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-500 font-bold">إجمالي المركبات المشمولة</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{totalVehicles} مركبة</p>
          <p className="text-[10px] text-slate-400 mt-0.5">مسجلة في بطاقات الصيانة الدورية</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-500 font-bold">العقود النشطة</p>
          <p className="text-2xl font-black text-emerald-600 mt-1">
            {contracts.filter((c) => c.status === 'ACTIVE').length} عقود
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">سارية المفعول حتى 2026/2027</p>
        </div>
      </div>

      {/* Contracts Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">سجل عقود الشركات والاتفاقيات المبرمة ({contracts.length})</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold">
              <tr>
                <th className="p-3">رقم العقد</th>
                <th className="p-3">اسم الشركة / العميل</th>
                <th className="p-3">حجم الأسطول</th>
                <th className="p-3">القيمة السنوية</th>
                <th className="p-3">مسؤول الاتصال</th>
                <th className="p-3">شروط الـ SLA المعتمدة</th>
                <th className="p-3">تاريخ الانتهاء</th>
                <th className="p-3">حالة العقد</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {contracts.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/60 transition">
                  <td className="p-3 font-mono font-bold text-purple-800">{c.id}</td>
                  <td className="p-3 font-bold text-slate-900">{c.companyName}</td>
                  <td className="p-3 font-bold text-slate-700">{c.vehiclesCount} سيارة</td>
                  <td className="p-3 font-mono font-black text-purple-700">AED {c.annualValueAed.toLocaleString()}</td>
                  <td className="p-3 text-slate-700">
                    <div>{c.contactPerson}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{c.phone}</div>
                  </td>
                  <td className="p-3 text-slate-600 text-[11px] max-w-xs">{c.slaDiscount}</td>
                  <td className="p-3 font-mono text-slate-600">{c.endDate}</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        c.status === 'ACTIVE'
                          ? 'bg-emerald-100 text-emerald-800'
                          : c.status === 'RENEWAL_DUE'
                          ? 'bg-amber-100 text-amber-800 animate-pulse'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {c.status === 'ACTIVE' ? '✅ سارٍ ونشط' : c.status === 'RENEWAL_DUE' ? '⚠️ مستحق التجديد' : 'منتهي'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Contract Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900 text-sm">إبرام عقد صيانة أسطول جديد (B2B Fleet)</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">اسم الشركة التجارية / المؤسسة *</label>
                <input
                  type="text"
                  required
                  value={newCompany}
                  onChange={(e) => setNewCompany(e.target.value)}
                  placeholder="مثال: شركة الخليج لتوزيع البضائع ش.ذ.م.م"
                  className="w-full px-3 py-2 border rounded-xl text-xs focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">عدد سيارات الأسطول *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newVehicles}
                    onChange={(e) => setNewVehicles(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-xl text-xs focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">القيمة السنوية التقديرية (AED) *</label>
                  <input
                    type="number"
                    min="1000"
                    step="1000"
                    required
                    value={newValue}
                    onChange={(e) => setNewValue(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-xl text-xs focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">مسؤول الاتصال بالشركة</label>
                  <input
                    type="text"
                    value={newContact}
                    onChange={(e) => setNewContact(e.target.value)}
                    placeholder="الاسم الثلاثي"
                    className="w-full px-3 py-2 border rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">رقم الهاتف للتواصل</label>
                  <input
                    type="text"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="+971 50 000 0000"
                    className="w-full px-3 py-2 border rounded-xl text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">بنود اتفاقية مستوى الخدمة (SLA)</label>
                <textarea
                  rows={2}
                  value={newSla}
                  onChange={(e) => setNewSla(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-xs focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border rounded-xl text-xs font-bold text-slate-700"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow"
                >
                  حفظ واعتماد العقد
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

