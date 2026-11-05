import React, { useState, useEffect } from 'react';
import { workshopApi } from '../../api/workshop-client';

interface BookingItem {
  id: string;
  status: string;
  requestedStartAt: string;
  proposedStartAt?: string;
  confirmedStartAt?: string;
  arrivedAt?: string;
  serviceRequestId: string;
  customer: {
    id: string;
    name: string;
    phone: string;
    email?: string;
  };
  vehicle: {
    id: string;
    plateNumber: string;
    brand?: string;
    model?: string;
    year?: number;
    mileage?: number;
  };
  service: {
    id: string;
    code: string;
    nameAr: string;
    nameEn: string;
    category?: string;
  };
  job?: {
    id: string;
    status: string;
  } | null;
  nextAction: {
    code: string;
    labelAr: string;
    labelEn: string;
    priority: 'HIGH' | 'NORMAL' | 'LOW';
  };
}

export const BookingsManager: React.FC<{
  onNavigateToJob?: (jobId: string) => void;
}> = ({ onNavigateToJob }) => {
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'TODAY' | 'WAITING_ARRIVAL' | 'ARRIVED' | 'ALL'>('TODAY');
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Check-In Modal state
  const [checkInBooking, setCheckInBooking] = useState<BookingItem | null>(null);
  const [arrivalMileage, setArrivalMileage] = useState<number | ''>('');
  const [conditionNotes, setConditionNotes] = useState('');
  const [handoverNotes, setHandoverNotes] = useState('');
  const [fuelLevel, setFuelLevel] = useState('1/2');

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (activeTab === 'TODAY') {
        params.date = new Date().toISOString().split('T')[0];
      } else if (activeTab === 'WAITING_ARRIVAL') {
        params.status = 'CONFIRMED';
      } else if (activeTab === 'ARRIVED') {
        params.status = 'VEHICLE_ARRIVED';
      }
      if (search.trim()) params.search = search.trim();

      const res = await workshopApi.getBookings(params);
      setBookings(res || []);
    } catch (err: any) {
      console.error('Failed to load bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [activeTab]);

  const handleConfirm = async (bookingId: string) => {
    try {
      setActionLoading(true);
      await workshopApi.confirmBooking(bookingId);
      alert('تم تأكيد موعد الحجز بنجاح!');
      await fetchBookings();
    } catch (err: any) {
      alert(`تعذر تأكيد الحجز: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkInBooking || arrivalMileage === '' || Number(arrivalMileage) < 0) {
      alert('يرجى إدخال قراءة عداد الكيلومترات بشكل صحيح');
      return;
    }

    try {
      setActionLoading(true);
      const res = await workshopApi.checkInVehicle(checkInBooking.id, {
        arrivalMileage: Number(arrivalMileage),
        conditionNotes: conditionNotes.trim() || undefined,
        handoverNotes: handoverNotes.trim() || undefined,
        fuelLevel,
      });

      alert('تم تسجيل وصول المركبة بنجاح وإنشاء كرت أمر الصيانة المعتمد!');
      setCheckInBooking(null);
      await fetchBookings();

      if (res.job?.id && onNavigateToJob) {
        onNavigateToJob(res.job.id);
      }
    } catch (err: any) {
      alert(`خطأ أثناء تسجيل الوصول: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleNoShow = async (bookingId: string) => {
    if (!confirm('هل أنت متأكد من تسجيل تخلف العميل عن الحضور (No-Show)؟')) return;
    try {
      setActionLoading(true);
      await workshopApi.markBookingNoShow(bookingId);
      alert('تم تسجيل حالة عدم الحضور');
      await fetchBookings();
    } catch (err: any) {
      alert(`خطأ: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white p-6 rounded-3xl shadow-xl border border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-bold mb-2">
            <span>🚗 مسار الاستقبال ووصول المركبة (Check-In & Arrival)</span>
          </div>
          <h2 className="text-2xl font-black">جدول المواعيد ومسار استلام المركبات</h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            متابعة مواعيد اليوم المؤكدة، تسجيل دخول السيارات إلى الورشة، توثيق قراءة العداد وملاحظات الهيكل، وفتح كرت أمر الصيانة.
          </p>
        </div>

        <button
          onClick={fetchBookings}
          disabled={loading}
          className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold border border-slate-600 transition flex items-center gap-2 shrink-0 self-start md:self-auto"
        >
          <span>🔄</span>
          <span>تحديث المواعيد</span>
        </button>
      </div>

      {/* Tabs & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          {[
            { id: 'TODAY', label: 'مواعيد اليوم' },
            { id: 'WAITING_ARRIVAL', label: 'بانتظار الوصول (مؤكد)' },
            { id: 'ARRIVED', label: 'المركبات الواصلة بالورشة' },
            { id: 'ALL', label: 'كافة الحجوزات' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition ${
                activeTab === tab.id
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex gap-2 w-full sm:w-80">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchBookings()}
            placeholder="بحث باللوحة أو اسم العميل..."
            className="flex-1 px-3 py-1.5 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500"
          />
          <button
            onClick={fetchBookings}
            className="px-3.5 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800"
          >
            بحث
          </button>
        </div>
      </div>

      {/* Bookings Table / Cards */}
      {loading ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
          <div className="animate-spin inline-block w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full mb-3"></div>
          <p className="text-xs font-bold text-slate-500">جاري تحميل جدول المواعيد...</p>
        </div>
      ) : bookings.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400 space-y-2">
          <span className="text-4xl block">📅</span>
          <p className="text-sm font-bold text-slate-700">لا توجد مواعيد مطابقة لهذا التبويب</p>
          <p className="text-xs text-slate-400">
            عند قبول طلب صيانة أو تأكيده سيظهر موعد استلام السيارة هنا.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {bookings.map((b) => {
            const isConfirmed = b.status === 'CONFIRMED';
            const isArrived = b.status === 'VEHICLE_ARRIVED';
            const appointmentTime = b.confirmedStartAt || b.requestedStartAt;

            return (
              <div
                key={b.id}
                className={`bg-white rounded-2xl p-5 border shadow-sm transition hover:shadow-md flex flex-col justify-between space-y-4 ${
                  isArrived
                    ? 'border-emerald-300 bg-emerald-50/15'
                    : isConfirmed
                    ? 'border-indigo-200'
                    : 'border-slate-200'
                }`}
              >
                <div>
                  {/* Status & Timing */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        isArrived
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : isConfirmed
                          ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {b.status === 'VEHICLE_ARRIVED'
                        ? 'وصلت المركبة'
                        : b.status === 'CONFIRMED'
                        ? 'موعد مؤكد'
                        : b.status}
                    </span>

                    <span className="text-xs font-black text-indigo-950 font-mono">
                      ⏰ {new Date(appointmentTime).toLocaleTimeString('ar-AE', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {/* Customer & Vehicle */}
                  <div className="space-y-1">
                    <h4 className="text-sm font-black text-slate-900">{b.customer.name}</h4>
                    <p className="text-xs font-black text-indigo-700 font-mono">
                      🚗 {b.vehicle.brand} {b.vehicle.model} ({b.vehicle.year}) — {b.vehicle.plateNumber}
                    </p>
                    <p className="text-[11px] text-slate-500 font-mono">📞 {b.customer.phone}</p>
                  </div>

                  {/* Service */}
                  <div className="mt-3 p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs font-bold text-slate-800">
                    <span className="truncate">🛠️ {b.service.nameAr}</span>
                    <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-mono shrink-0">
                      {b.service.category}
                    </span>
                  </div>

                  {/* Next Required Action Box */}
                  <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2">
                    <span className="text-xs">👉</span>
                    <span className="text-[11px] font-black text-amber-900">
                      {b.nextAction.labelAr}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  {b.status === 'PENDING' && (
                    <button
                      onClick={() => handleConfirm(b.id)}
                      disabled={actionLoading}
                      className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-sm transition"
                    >
                      تأكيد الموعد
                    </button>
                  )}

                  {isConfirmed && (
                    <>
                      <button
                        onClick={() => {
                          setCheckInBooking(b);
                          setArrivalMileage(b.vehicle.mileage || '');
                          setConditionNotes('');
                          setHandoverNotes('');
                          setFuelLevel('1/2');
                        }}
                        className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-sm transition flex items-center justify-center gap-1.5"
                      >
                        <span>📥</span>
                        <span>تسجيل الوصول (Check-in)</span>
                      </button>

                      <button
                        onClick={() => handleNoShow(b.id)}
                        disabled={actionLoading}
                        title="تخلف عن الحضور"
                        className="px-3 py-2 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 rounded-xl text-xs font-bold transition"
                      >
                        تخلف
                      </button>
                    </>
                  )}

                  {isArrived && (
                    <button
                      onClick={() => b.job?.id && onNavigateToJob?.(b.job.id)}
                      className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-sm transition flex items-center justify-center gap-1.5"
                    >
                      <span>📋</span>
                      <span>فتح كرت أمر الصيانة (Job Card)</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CHECK-IN MODAL */}
      {checkInBooking && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCheckInSubmit}
            className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <span>📥</span>
                  <span>تسجيل استلام ووصول المركبة للورشة (Check-In)</span>
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  {checkInBooking.vehicle.brand} {checkInBooking.vehicle.model} — لوحة: {checkInBooking.vehicle.plateNumber}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCheckInBooking(null)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            {/* Odometer Reading */}
            <div className="space-y-1">
              <label className="text-xs font-black text-slate-800 flex items-center justify-between">
                <span>قراءة عداد الكيلومترات عند الاستلام (كم) *</span>
                <span className="text-[10px] text-slate-400 font-mono">
                  المسجل سابقاً: {checkInBooking.vehicle.mileage?.toLocaleString() || 'غير متوفر'} كم
                </span>
              </label>
              <input
                type="number"
                min="0"
                required
                value={arrivalMileage}
                onChange={(e) => setArrivalMileage(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="مثال: 45200"
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-sm font-mono font-black text-slate-900 focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Fuel Level */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">مستوى خزان الوقود عند الاستلام</label>
              <div className="grid grid-cols-4 gap-2">
                {['Empty', '1/4', '1/2', 'Full'].map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setFuelLevel(lvl)}
                    className={`py-1.5 rounded-xl text-xs font-bold border transition ${
                      fuelLevel === lvl
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            {/* Body Condition Notes */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">ملاحظات حالة الهيكل والخدوش (إن وجدت)</label>
              <textarea
                rows={2}
                value={conditionNotes}
                onChange={(e) => setConditionNotes(e.target.value)}
                placeholder="مثال: حكة سطحية في الصدام الأمامي الأيمن، ضربة خفيفة بالباب الخلفي..."
                className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-medium"
              />
            </div>

            {/* Handover & Belongs */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">ملاحظات تسليم المفتاح والأغراض الشخصية</label>
              <input
                type="text"
                value={handoverNotes}
                onChange={(e) => setHandoverNotes(e.target.value)}
                placeholder="مثال: تم استلام المفتاح الأصلي بدون متعلقات شخصية في المقصورة"
                className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-medium"
              />
            </div>

            {/* Notice */}
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-[11px] text-emerald-950 font-medium">
              💡 اعتماد الوصول سيقوم تلقائياً بتحديث عداد المركبة وفتح كرت أمر الصيانة الموحد (Job Card) وتجهيزه للفحص الفني وعرض السعر.
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCheckInBooking(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-sm"
              >
                تأكيد الاستلام وفتح كرت الصيانة
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

