import React, { useState } from 'react';
import { useI18n } from '../../context/i18n-context';

interface WarrantyCertificate {
  id: string;
  certificateNumber: string;
  customerName: string;
  customerPhone: string;
  vehiclePlate: string;
  vehicleModel: string;
  serviceType: string;
  durationMonths: number;
  issueDate: string;
  expiryDate: string;
  status: 'ACTIVE' | 'EXPIRED' | 'VOIDED';
  coverageNotes: string;
}

const INITIAL_WARRANTIES: WarrantyCertificate[] = [
  {
    id: 'war-1',
    certificateNumber: 'WAR-2026-0042',
    customerName: 'منصور المنصوري',
    customerPhone: '+971501112233',
    vehiclePlate: 'دبي - A 12345',
    vehicleModel: 'تويوتا لاندكروزر 2023',
    serviceType: 'ضمان استبدال كمبروسر المكيف مع دورة التبريد',
    durationMonths: 12,
    issueDate: '2026-05-15',
    expiryDate: '2027-05-15',
    status: 'ACTIVE',
    coverageNotes: 'يشمل قطعة الكمبروسر الأصلية وشغل اليد وفحص التسريب المجاني لمدة سنة.',
  },
  {
    id: 'war-2',
    certificateNumber: 'WAR-2026-0038',
    customerName: 'سلطان القاسمي',
    customerPhone: '+971505556677',
    vehiclePlate: 'الشارقة - B 9988',
    vehicleModel: 'نيسان باترول 2022',
    serviceType: 'ضمان نانو سيراميك 9H ثلاث طبقات',
    durationMonths: 24,
    issueDate: '2026-02-10',
    expiryDate: '2028-02-10',
    status: 'ACTIVE',
    coverageNotes: 'يشمل اللمعان وطبقة الحماية وطرد المياه مع صيانة دورية مجانية كل 6 أشهر.',
  },
  {
    id: 'war-3',
    certificateNumber: 'WAR-2025-0104',
    customerName: 'أحمد الظاهري',
    customerPhone: '+971509998811',
    vehiclePlate: 'أبوظبي - 5 44332',
    vehicleModel: 'بورش كايين 2024',
    serviceType: 'ضمان سفايف فرامل أمامية مع درامات',
    durationMonths: 6,
    issueDate: '2025-08-01',
    expiryDate: '2026-02-01',
    status: 'EXPIRED',
    coverageNotes: 'ضمان قطع غيار أصلية لمدة 6 أشهر أو 15,000 كم.',
  },
];

export const WarrantyManager: React.FC = () => {
  const { language } = useI18n();
  const [warranties, setWarranties] = useState<WarrantyCertificate[]>(() => {
    const saved = localStorage.getItem('miftah_workshop_warranties');
    return saved ? JSON.parse(saved) : INITIAL_WARRANTIES;
  });

  const [search, setSearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedWarranty, setSelectedWarranty] = useState<WarrantyCertificate | null>(null);

  // New Certificate Form
  const [newCert, setNewCert] = useState({
    customerName: '',
    customerPhone: '',
    vehiclePlate: '',
    vehicleModel: '',
    serviceType: 'صيانة دورية وضمان قطع غيار',
    durationMonths: 12,
    coverageNotes: '',
  });

  const saveWarranties = (updated: WarrantyCertificate[]) => {
    setWarranties(updated);
    localStorage.setItem('miftah_workshop_warranties', JSON.stringify(updated));
  };

  const handleCreateWarranty = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCert.customerName || !newCert.vehiclePlate) {
      alert('يرجى إدخال اسم العميل ورقم لوحة المركبة');
      return;
    }

    const today = new Date();
    const expiry = new Date(today);
    expiry.setMonth(expiry.getMonth() + Number(newCert.durationMonths));

    const created: WarrantyCertificate = {
      id: `war-${Date.now()}`,
      certificateNumber: `WAR-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      customerName: newCert.customerName,
      customerPhone: newCert.customerPhone || '+971500000000',
      vehiclePlate: newCert.vehiclePlate,
      vehicleModel: newCert.vehicleModel || 'مركبة مسجلة',
      serviceType: newCert.serviceType,
      durationMonths: Number(newCert.durationMonths),
      issueDate: today.toISOString().split('T')[0],
      expiryDate: expiry.toISOString().split('T')[0],
      status: 'ACTIVE',
      coverageNotes: newCert.coverageNotes || 'ضمان معتمد يشمل العيوب المصنعية وشغل اليد وفق الشروط والأحكام.',
    };

    saveWarranties([created, ...warranties]);
    setIsAddModalOpen(false);
    setNewCert({
      customerName: '',
      customerPhone: '',
      vehiclePlate: '',
      vehicleModel: '',
      serviceType: 'صيانة دورية وضمان قطع غيار',
      durationMonths: 12,
      coverageNotes: '',
    });
  };

  const filtered = warranties.filter(
    (w) =>
      w.customerName.toLowerCase().includes(search.toLowerCase()) ||
      w.vehiclePlate.toLowerCase().includes(search.toLowerCase()) ||
      w.certificateNumber.toLowerCase().includes(search.toLowerCase()) ||
      w.serviceType.toLowerCase().includes(search.toLowerCase()),
  );

  const activeCount = warranties.filter((w) => w.status === 'ACTIVE').length;

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white p-6 rounded-3xl shadow-xl border border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-bold mb-2">
            🛡️ موديول إدارة الضمانات الرقمية (Warranty Pack)
          </div>
          <h2 className="text-2xl font-black">شهادات وضمانات الصيانة للعملاء</h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            إصدار شهادات الضمان الرقمية للقطع وشغل اليد، تتبع مدة السريان بالكيلومترات والأشهر، وإرسال إشعارات التجديد.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="px-5 py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black rounded-2xl text-xs transition shadow-lg shrink-0 flex items-center gap-2"
        >
          <span>➕</span>
          <span>إصدار شهادة ضمان جديدة</span>
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-bold text-slate-400">الضمانات السارية (Active)</span>
          <div className="text-2xl font-black text-emerald-700">{activeCount} شهادة</div>
          <p className="text-[11px] text-slate-500">سارية المفعول وتحت التغطية</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-bold text-slate-400">إجمالي الشهادات المصدرة</span>
          <div className="text-2xl font-black text-slate-900">{warranties.length} شهادة</div>
          <p className="text-[11px] text-slate-500">سجل تراكمي للورشة والعملاء</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-bold text-slate-400">متوسط مدة الضمان الممنوح</span>
          <div className="text-2xl font-black text-indigo-700">14 شهر</div>
          <p className="text-[11px] text-slate-500">يشمل قطع الغيار وعوازل النانو</p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="w-full md:w-96 relative">
          <input
            type="text"
            placeholder="بحث برقم الشهادة، اسم العميل، أو لوحة السيارة..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-3 pr-10 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-slate-900"
          />
          <span className="absolute right-3.5 top-2.5 text-slate-400 text-xs">🔍</span>
        </div>
        <span className="text-xs text-slate-400 font-bold">النتائج: {filtered.length}</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-black">
              <tr>
                <th className="px-5 py-4">رقم الشهادة والخدمة</th>
                <th className="px-5 py-4">العميل والمركبة</th>
                <th className="px-5 py-4 text-center">تاريخ الإصدار</th>
                <th className="px-5 py-4 text-center">تاريخ الانتهاء</th>
                <th className="px-5 py-4 text-center">حالة الضمان</th>
                <th className="px-5 py-4 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((w) => (
                <tr key={w.id} className="hover:bg-slate-50 transition">
                  <td className="px-5 py-4">
                    <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded text-[11px]">
                      {w.certificateNumber}
                    </span>
                    <div className="font-bold text-slate-900 text-xs mt-1">{w.serviceType}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">المدة: {w.durationMonths} شهر</div>
                  </td>

                  <td className="px-5 py-4">
                    <div className="font-bold text-slate-900">{w.customerName}</div>
                    <div className="text-[11px] text-slate-500 font-mono">{w.customerPhone}</div>
                    <div className="text-[10px] text-slate-600 font-bold bg-slate-100 px-2 py-0.5 rounded mt-1 inline-block">
                      🚗 {w.vehiclePlate} ({w.vehicleModel})
                    </div>
                  </td>

                  <td className="px-5 py-4 text-center font-mono text-slate-600">{w.issueDate}</td>
                  <td className="px-5 py-4 text-center font-mono font-bold text-slate-800">{w.expiryDate}</td>

                  <td className="px-5 py-4 text-center">
                    <span
                      className={`px-3 py-1 rounded-xl text-[11px] font-black ${
                        w.status === 'ACTIVE'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-rose-100 text-rose-800 border border-rose-200'
                      }`}
                    >
                      {w.status === 'ACTIVE' ? '✅ ساري المفعول' : 'منتهي الصلاحية'}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-center">
                    <button
                      type="button"
                      onClick={() => setSelectedWarranty(w)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition"
                    >
                      عرض الشهادة 📄
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Certificate Viewer Modal */}
      {selectedWarranty && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 space-y-4 border border-slate-100 animate-scaleIn">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900">شهادة ضمان رقمية معتمدة</h3>
              <button
                type="button"
                onClick={() => setSelectedWarranty(null)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 font-bold hover:bg-slate-200"
              >
                ✕
              </button>
            </div>

            <div className="p-6 bg-slate-900 text-white rounded-2xl space-y-3 border border-slate-800 text-center">
              <span className="text-3xl block">🛡️</span>
              <h4 className="text-lg font-black text-amber-400">شهادة ضمان منصة مفتاح 360</h4>
              <p className="font-mono text-xs text-slate-300">{selectedWarranty.certificateNumber}</p>
              <div className="h-px bg-slate-800 my-2"></div>
              <div className="text-xs space-y-1.5 text-right">
                <p>
                  <span className="text-slate-400">العميل:</span> <strong>{selectedWarranty.customerName}</strong>
                </p>
                <p>
                  <span className="text-slate-400">المركبة:</span> <strong>{selectedWarranty.vehiclePlate} ({selectedWarranty.vehicleModel})</strong>
                </p>
                <p>
                  <span className="text-slate-400">الخدمة المغطاة:</span> <strong>{selectedWarranty.serviceType}</strong>
                </p>
                <p>
                  <span className="text-slate-400">تاريخ السريان:</span> من {selectedWarranty.issueDate} إلى{' '}
                  <strong className="text-emerald-400">{selectedWarranty.expiryDate}</strong>
                </p>
                <p className="text-[11px] text-slate-400 pt-2 border-t border-slate-800 leading-relaxed">
                  {selectedWarranty.coverageNotes}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSelectedWarranty(null)}
                className="flex-1 py-2.5 border border-slate-200 text-slate-700 font-bold rounded-xl text-xs"
              >
                إغلاق
              </button>
              <button
                type="button"
                onClick={() => alert('تم إرسال نسخة الشهادة إلى هاتف العميل عبر الرسائل النصية والـ WhatsApp ✅')}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md"
              >
                إرسال للعميل (WhatsApp) 📱
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 space-y-4 border border-slate-100 animate-scaleIn">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900">🛡️ إصدار شهادة ضمان رقمية جديدة</h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 font-bold hover:bg-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateWarranty} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">اسم العميل *</label>
                <input
                  type="text"
                  required
                  placeholder="منصور المنصوري"
                  value={newCert.customerName}
                  onChange={(e) => setNewCert({ ...newCert, customerName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">رقم الهاتف</label>
                  <input
                    type="tel"
                    dir="ltr"
                    placeholder="+971501112233"
                    value={newCert.customerPhone}
                    onChange={(e) => setNewCert({ ...newCert, customerPhone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">رقم اللوحة والإمارة *</label>
                  <input
                    type="text"
                    required
                    placeholder="دبي A 12345"
                    value={newCert.vehiclePlate}
                    onChange={(e) => setNewCert({ ...newCert, vehiclePlate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ماركة وموديل السيارة</label>
                <input
                  type="text"
                  placeholder="تويوتا لاندكروزر 2023"
                  value={newCert.vehicleModel}
                  onChange={(e) => setNewCert({ ...newCert, vehicleModel: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">نوع الضمان / الخدمة المغطاة *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: ضمان جير وماكينة، أو نانو سيراميك"
                  value={newCert.serviceType}
                  onChange={(e) => setNewCert({ ...newCert, serviceType: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">مدة الضمان بالأشهر</label>
                <select
                  value={newCert.durationMonths}
                  onChange={(e) => setNewCert({ ...newCert, durationMonths: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
                >
                  <option value={3}>3 أشهر (90 يوم)</option>
                  <option value={6}>6 أشهر (نصف سنة)</option>
                  <option value={12}>12 شهر (سنة كاملة)</option>
                  <option value={24}>24 شهر (سنتين)</option>
                  <option value={36}>36 شهر (3 سنوات)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">شروط واستثناءات التغطية</label>
                <textarea
                  rows={2}
                  placeholder="اكتب التغطية المحددة للقطع وشغل اليد..."
                  value={newCert.coverageNotes}
                  onChange={(e) => setNewCert({ ...newCert, coverageNotes: e.target.value })}
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
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition shadow-md"
                >
                  إصدار الشهادة الرقمية ✅
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

