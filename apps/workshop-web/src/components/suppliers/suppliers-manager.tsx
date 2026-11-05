import React, { useState } from 'react';
import { useI18n } from '../../context/i18n-context';

interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  emirate: string;
  category: string;
  paymentTerms: string;
  outstandingBalance: number;
}

const INITIAL_SUPPLIERS: Supplier[] = [
  {
    id: 'sup-1',
    name: 'مجموعة الفطيم لقطع الغيار الأصلية',
    contactPerson: 'محمد خان',
    phone: '+97142065555',
    emirate: 'دبي (Al Futtaim Motors)',
    category: 'قطع غيار تويوتا ولكزس أصلية OEM',
    paymentTerms: 'آجل 30 يوم',
    outstandingBalance: 12450,
  },
  {
    id: 'sup-2',
    name: 'الشركة العربية لتجارة وتوزيع الزيوت',
    contactPerson: 'عصام سالم',
    phone: '+97143389922',
    emirate: 'الشارقة (منطقة الصجعة الصناعية)',
    category: 'زيوت كاسترول، شل، ومواد تشحيم',
    paymentTerms: 'نقدي عند الاستلام مع خصم 5%',
    outstandingBalance: 0,
  },
  {
    id: 'sup-3',
    name: 'الرستماني لقطع غيار نيسان وإنفينيتي',
    contactPerson: 'راجيش كومار',
    phone: '+97143981144',
    emirate: 'دبي (القوز 1)',
    category: 'قطع غيار نيسان باترول الأصلية',
    paymentTerms: 'آجل 45 يوم',
    outstandingBalance: 8600,
  },
];

export const SuppliersManager: React.FC = () => {
  const { language } = useI18n();
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    const saved = localStorage.getItem('miftah_workshop_suppliers');
    return saved ? JSON.parse(saved) : INITIAL_SUPPLIERS;
  });

  const [search, setSearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [newSupplier, setNewSupplier] = useState({
    name: '',
    contactPerson: '',
    phone: '',
    emirate: 'دبي',
    category: 'قطع غيار عامة',
    paymentTerms: 'آجل 30 يوم',
  });

  const saveSuppliers = (list: Supplier[]) => {
    setSuppliers(list);
    localStorage.setItem('miftah_workshop_suppliers', JSON.stringify(list));
  };

  const handleAddSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupplier.name || !newSupplier.phone) {
      alert('يرجى إدخال اسم المورد ورقم الهاتف');
      return;
    }
    const created: Supplier = {
      id: `sup-${Date.now()}`,
      name: newSupplier.name,
      contactPerson: newSupplier.contactPerson || 'مسؤول المبيعات',
      phone: newSupplier.phone,
      emirate: newSupplier.emirate,
      category: newSupplier.category,
      paymentTerms: newSupplier.paymentTerms,
      outstandingBalance: 0,
    };
    saveSuppliers([created, ...suppliers]);
    setIsAddModalOpen(false);
    setNewSupplier({
      name: '',
      contactPerson: '',
      phone: '',
      emirate: 'دبي',
      category: 'قطع غيار عامة',
      paymentTerms: 'آجل 30 يوم',
    });
  };

  const totalOutstanding = suppliers.reduce((acc, s) => acc + s.outstandingBalance, 0);

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white p-6 rounded-3xl shadow-xl border border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full text-xs font-bold mb-2">
            🤝 موديول إدارة الموردين وفواتير الشراء (Suppliers Pack)
          </div>
          <h2 className="text-2xl font-black">دليل موردي قطع الغيار وحسابات الشراء</h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            إدارة شبكة الموردين المعتمدين، شروط الدفع، فواتير الشراء، ومتابعة الأرصدة الآجلة.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="px-5 py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black rounded-2xl text-xs transition shadow-lg shrink-0 flex items-center gap-2"
        >
          <span>➕</span>
          <span>إضافة مورد جديد</span>
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-bold text-slate-400">إجمالي الموردين المعتمدين</span>
          <div className="text-2xl font-black text-slate-900">{suppliers.length} موردين</div>
          <p className="text-[11px] text-slate-500">وكالات وموزعين معتمدين بالدولة</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-bold text-slate-400">إجمالي الأرصدة الآجلة للموردين</span>
          <div className="text-2xl font-black text-rose-600 font-mono">{totalOutstanding.toLocaleString()} AED</div>
          <p className="text-[11px] text-slate-500">مستحقة خلال فترات الائتمان المتفق عليها</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-bold text-slate-400">حالة التوريد والائتمان</span>
          <div className="text-2xl font-black text-emerald-700">ممتازة (Good)</div>
          <p className="text-[11px] text-slate-500">لا توجد دفعات متأخرة أو حظر توريد</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-black">
              <tr>
                <th className="px-5 py-4">اسم المورد والتخصص</th>
                <th className="px-5 py-4">مسؤول الاتصال والهاتف</th>
                <th className="px-5 py-4">الإمارة</th>
                <th className="px-5 py-4">شروط الدفع</th>
                <th className="px-5 py-4 text-center">الرصيد الآجل المستحق</th>
                <th className="px-5 py-4 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {suppliers.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50 transition">
                  <td className="px-5 py-4">
                    <div className="font-bold text-slate-900 text-sm">{s.name}</div>
                    <div className="text-[11px] text-indigo-700 font-bold mt-0.5">
                      {typeof s.category === 'object' && s.category
                        ? (s.category as any).nameAr || (s.category as any).nameEn || (s.category as any).code
                        : s.category}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="font-bold text-slate-800">{s.contactPerson}</div>
                    <div className="text-[11px] text-slate-500 font-mono">{s.phone}</div>
                  </td>
                  <td className="px-5 py-4 text-slate-600">{s.emirate}</td>
                  <td className="px-5 py-4">
                    <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-[10px] font-bold">
                      {s.paymentTerms}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-center font-mono font-bold text-slate-800">
                    {s.outstandingBalance > 0 ? (
                      <span className="text-rose-600 font-black">{s.outstandingBalance.toLocaleString()} AED</span>
                    ) : (
                      <span className="text-emerald-700">0 AED (مسدد)</span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-center">
                    <button
                      type="button"
                      onClick={() => alert(`طلب توريد جديد من: ${s.name}`)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition"
                    >
                      طلب توريد 📝
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Supplier Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900">إضافة مورد جديد</h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddSupplier} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">اسم شركة التوريد *</label>
                <input
                  type="text"
                  required
                  placeholder="مؤسسة النجم لقطع الغيار"
                  value={newSupplier.name}
                  onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">مسؤول المبيعات</label>
                <input
                  type="text"
                  placeholder="خالد العمري"
                  value={newSupplier.contactPerson}
                  onChange={(e) => setNewSupplier({ ...newSupplier, contactPerson: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">رقم الهاتف *</label>
                <input
                  type="tel"
                  required
                  dir="ltr"
                  placeholder="+971501234567"
                  value={newSupplier.phone}
                  onChange={(e) => setNewSupplier({ ...newSupplier, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">نوع القطع والتخصص</label>
                <input
                  type="text"
                  placeholder="قطع غيار ألمانية، أو بطاريات وزيوت"
                  value={newSupplier.category}
                  onChange={(e) => setNewSupplier({ ...newSupplier, category: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                />
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-700 font-bold rounded-xl text-xs"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md"
                >
                  حفظ المورد
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

