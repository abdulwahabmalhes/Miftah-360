import React, { useState, useEffect } from 'react';
import { workshopApi } from '../../api/workshop-client';

interface ServiceRequestItem {
  id: string;
  status: string;
  issueSummary: string;
  preferredDatetime: string;
  emirate: string;
  createdAt: string;
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
  booking?: {
    id: string;
    status: string;
    requestedStartAt: string;
    proposedStartAt?: string;
    confirmedStartAt?: string;
    arrivedAt?: string;
  };
  nextAction: {
    code: string;
    labelAr: string;
    labelEn: string;
    priority: 'HIGH' | 'NORMAL' | 'LOW';
  };
  hasActiveJob: boolean;
  jobId?: string | null;
}

export const ServiceRequestsManager: React.FC<{
  onNavigateToBooking?: (bookingId: string) => void;
  onNavigateToJob?: (jobId: string) => void;
}> = ({ onNavigateToBooking, onNavigateToJob }) => {
  const [requests, setRequests] = useState<ServiceRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Modals state
  const [proposeTimeModalOpen, setProposeTimeModalOpen] = useState(false);
  const [proposedDateTime, setProposedDateTime] = useState('');
  const [proposeTimeNotes, setProposeTimeNotes] = useState('');

  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (filterStatus !== 'ALL') params.status = filterStatus;
      if (search.trim()) params.search = search.trim();
      const res = await workshopApi.getServiceRequests(params);
      setRequests(res || []);
    } catch (err: any) {
      console.error('Failed to load service requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [filterStatus]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchRequests();
  };

  const openDetail = async (reqId: string) => {
    try {
      setActionLoading(true);
      const detail = await workshopApi.getServiceRequestById(reqId);
      setSelectedRequest(detail);
    } catch (err: any) {
      alert(`تعذر جلب تفاصيل الطلب: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAccept = async (requestId: string) => {
    if (!confirm('هل أنت متأكد من قبول طلب الصيانة وتأكيد الحجز؟')) return;
    try {
      setActionLoading(true);
      await workshopApi.acceptServiceRequest(requestId);
      alert('تم قبول طلب الصيانة بنجاح وتحويله إلى موعد مؤكد!');
      if (selectedRequest?.id === requestId) {
        setSelectedRequest(null);
      }
      await fetchRequests();
    } catch (err: any) {
      alert(`خطأ أثناء قبول الطلب: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleProposeTime = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest || !proposedDateTime) return;
    try {
      setActionLoading(true);
      await workshopApi.proposeServiceRequestTime(
        selectedRequest.id,
        new Date(proposedDateTime).toISOString(),
        proposeTimeNotes,
      );
      alert('تم إرسال اقتراح الموعد البديل إلى العميل للموافقة!');
      setProposeTimeModalOpen(false);
      setSelectedRequest(null);
      await fetchRequests();
    } catch (err: any) {
      alert(`تعذر اقتراح الموعد: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest || !rejectReason.trim()) return;
    try {
      setActionLoading(true);
      await workshopApi.rejectServiceRequest(selectedRequest.id, rejectReason.trim());
      alert('تم تسجيل الاعتذار عن قبول الطلب');
      setRejectModalOpen(false);
      setSelectedRequest(null);
      await fetchRequests();
    } catch (err: any) {
      alert(`خطأ أثناء رفض الطلب: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white p-6 rounded-3xl shadow-xl border border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-bold mb-2">
            <span>⚡ المسار الأساسي (Core Service Journey)</span>
          </div>
          <h2 className="text-2xl font-black">طلبات الصيانة والاستقبال المباشر</h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            استقبال طلبات العملاء المباشرة لورشتك، مراجعة المشاكل والتشخيص، قبول الطلبات أو اقتراح مواعيد بديلة.
          </p>
        </div>

        <button
          onClick={fetchRequests}
          disabled={loading}
          className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold border border-slate-600 transition flex items-center gap-2 shrink-0 self-start md:self-auto"
        >
          <span>🔄</span>
          <span>تحديث الطلبات</span>
        </button>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          {[
            { id: 'ALL', label: 'كافة الطلبات' },
            { id: 'SUBMITTED', label: 'طلبات جديدة (واردة)' },
            { id: 'ACCEPTED', label: 'مقبولة ومؤكدة' },
            { id: 'REJECTED', label: 'معتذر عنها' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition ${
                filterStatus === tab.id
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearchSubmit} className="flex gap-2 w-full sm:w-80">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث باسم العميل، اللوحة، الهاتف..."
            className="flex-1 px-3 py-1.5 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500"
          />
          <button
            type="submit"
            className="px-3.5 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800"
          >
            بحث
          </button>
        </form>
      </div>

      {/* Requests List */}
      {loading ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
          <div className="animate-spin inline-block w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full mb-3"></div>
          <p className="text-xs font-bold text-slate-500">جاري تحميل طلبات الصيانة...</p>
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400 space-y-2">
          <span className="text-4xl block">📬</span>
          <p className="text-sm font-bold text-slate-700">لا توجد طلبات صيانة مطابقة حالياً</p>
          <p className="text-xs text-slate-400">
            طلبات الصيانة الجديدة التي يقدمها ملاك السيارات لورشتك ستظهر هنا مباشرة لتأكيدها.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {requests.map((r) => {
            const isNew = r.status === 'SUBMITTED';
            const isAccepted = r.status === 'ACCEPTED';

            return (
              <div
                key={r.id}
                className={`bg-white rounded-2xl p-5 border shadow-sm transition hover:shadow-md flex flex-col justify-between space-y-4 ${
                  isNew
                    ? 'border-emerald-300 bg-emerald-50/20'
                    : isAccepted
                    ? 'border-indigo-200'
                    : 'border-slate-200'
                }`}
              >
                <div>
                  {/* Status & Next Action Badge */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        isNew
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : isAccepted
                          ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {r.status === 'SUBMITTED' ? 'طلب جديد' : r.status === 'ACCEPTED' ? 'مقبول' : r.status}
                    </span>

                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(r.createdAt).toLocaleDateString('ar-AE')}
                    </span>
                  </div>

                  {/* Customer & Vehicle */}
                  <div className="space-y-1">
                    <h4 className="text-sm font-black text-slate-900">{r.customer.name}</h4>
                    <p className="text-xs font-bold text-indigo-700 font-mono">
                      🚗 {r.vehicle.brand} {r.vehicle.model} ({r.vehicle.year}) — لوحة: {r.vehicle.plateNumber}
                    </p>
                    <p className="text-[11px] text-slate-500 font-mono">📞 {r.customer.phone}</p>
                  </div>

                  {/* Service Requested & Issue */}
                  <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                    <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <span>🛠️</span>
                      <span>{r.service.nameAr}</span>
                    </div>
                    {r.issueSummary && (
                      <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                        {r.issueSummary}
                      </p>
                    )}
                  </div>

                  {/* Preferred Appointment Date */}
                  <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-600">
                    <span>الموعد المطلوب:</span>
                    <span className="font-bold text-slate-900 font-mono">
                      {new Date(r.preferredDatetime).toLocaleString('ar-AE', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </span>
                  </div>

                  {/* Next Required Action Box */}
                  <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2">
                    <span className="text-xs">👉</span>
                    <span className="text-[11px] font-black text-amber-900">
                      {r.nextAction.labelAr}
                    </span>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => openDetail(r.id)}
                    className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition text-center"
                  >
                    عرض التفاصيل
                  </button>

                  {isNew && (
                    <>
                      <button
                        onClick={() => handleAccept(r.id)}
                        disabled={actionLoading}
                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition shadow-sm"
                      >
                        قبول
                      </button>
                    </>
                  )}

                  {r.booking && isAccepted && (
                    <button
                      onClick={() => onNavigateToBooking?.(r.booking!.id)}
                      className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition shadow-sm"
                    >
                      إدارة الحجز
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* DETAIL MODAL */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-black text-slate-900">تفاصيل طلب الصيانة</h3>
                <p className="text-xs text-slate-400 font-mono">المرجع: #{selectedRequest.id.slice(0, 8)}</p>
              </div>
              <button
                onClick={() => setSelectedRequest(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            {/* Customer & Vehicle Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                <span className="text-[10px] text-slate-400 font-bold block">بيانات العميل</span>
                <p className="text-sm font-black text-slate-900">{selectedRequest.customer.name}</p>
                <p className="font-mono text-slate-600">{selectedRequest.customer.phone}</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                <span className="text-[10px] text-slate-400 font-bold block">المركبة المسجلة</span>
                <p className="text-sm font-black text-slate-900">
                  {selectedRequest.vehicle.brand} {selectedRequest.vehicle.model} ({selectedRequest.vehicle.year})
                </p>
                <p className="font-mono text-indigo-700 font-bold">لوحة: {selectedRequest.vehicle.plateNumber}</p>
              </div>
            </div>

            {/* Service & Issue Details */}
            <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 space-y-2 text-xs">
              <span className="text-[10px] text-indigo-700 font-bold block">الخدمة المطلوبة وتوصيف العميل</span>
              <p className="text-sm font-black text-indigo-950">{selectedRequest.service.nameAr}</p>
              <p className="text-slate-700 leading-relaxed bg-white p-3 rounded-xl border border-indigo-100/60">
                {selectedRequest.issueSummary || 'لا توجد ملاحظات إضافية'}
              </p>
            </div>

            {/* AI Classification if present */}
            {selectedRequest.aiSummary && (
              <div className="p-3.5 bg-amber-50/80 rounded-2xl border border-amber-200 text-xs space-y-1">
                <span className="text-[10px] text-amber-800 font-bold block">🤖 تحليل الذكاء الاصطناعي الأولي</span>
                <p className="text-slate-800 font-medium">{selectedRequest.aiSummary}</p>
                <span className="inline-block mt-1 px-2 py-0.5 bg-amber-200 text-amber-900 rounded-md text-[10px] font-bold">
                  مستوى الخطورة: {selectedRequest.riskLevel}
                </span>
              </div>
            )}

            {/* Timeline */}
            {selectedRequest.timeline && selectedRequest.timeline.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-900 block">سجل أحداث الطلب (Timeline)</span>
                <div className="space-y-2 border-r-2 border-slate-200 pr-3">
                  {selectedRequest.timeline.map((item: any, i: number) => (
                    <div key={i} className="text-xs relative">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 absolute -right-[17px] top-1"></div>
                      <p className="font-bold text-slate-900">{item.titleAr}</p>
                      {item.detail && <p className="text-[11px] text-slate-500">{item.detail}</p>}
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(item.timestamp).toLocaleString('ar-AE')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="pt-4 border-t border-slate-100 flex flex-wrap gap-2 justify-end">
              {selectedRequest.status === 'SUBMITTED' && (
                <>
                  <button
                    onClick={() => {
                      setRejectReason('');
                      setRejectModalOpen(true);
                    }}
                    className="px-4 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-xl text-xs font-bold"
                  >
                    اعتذار عن الطلب
                  </button>

                  <button
                    onClick={() => {
                      setProposedDateTime('');
                      setProposeTimeNotes('');
                      setProposeTimeModalOpen(true);
                    }}
                    className="px-4 py-2 bg-amber-50 text-amber-800 hover:bg-amber-100 rounded-xl text-xs font-bold"
                  >
                    اقتراح موعد بديل
                  </button>

                  <button
                    onClick={() => handleAccept(selectedRequest.id)}
                    disabled={actionLoading}
                    className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-sm"
                  >
                    تأكيد وقبول الطلب
                  </button>
                </>
              )}

              {selectedRequest.booking && (
                <button
                  onClick={() => {
                    const bId = selectedRequest.booking.id;
                    setSelectedRequest(null);
                    onNavigateToBooking?.(bId);
                  }}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm"
                >
                  الذهاب إلى الحجز ومسار الاستلام
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* PROPOSE TIME MODAL */}
      {proposeTimeModalOpen && selectedRequest && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleProposeTime}
            className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200"
          >
            <h3 className="text-base font-black text-slate-900">اقتراح موعد بديل للعميل</h3>
            <p className="text-xs text-slate-500">
              الموعد المطلوب حالياً: {new Date(selectedRequest.preferredDatetime).toLocaleString('ar-AE')}
            </p>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">الموعد البديل المقترح *</label>
              <input
                type="datetime-local"
                required
                value={proposedDateTime}
                onChange={(e) => setProposedDateTime(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-mono font-bold"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">ملاحظات توضيحية للعميل (اختياري)</label>
              <textarea
                rows={2}
                value={proposeTimeNotes}
                onChange={(e) => setProposeTimeNotes(e.target.value)}
                placeholder="مثال: نعتذر لامتلاء الورشة في الصباح، يسعدنا استقبالكم بعد الظهر..."
                className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-medium"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setProposeTimeModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-sm"
              >
                إرسال الموعد المقترح
              </button>
            </div>
          </form>
        </div>
      )}

      {/* REJECT MODAL */}
      {rejectModalOpen && selectedRequest && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleReject}
            className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200"
          >
            <h3 className="text-base font-black text-rose-900">الاعتذار عن قبول طلب الصيانة</h3>
            <p className="text-xs text-slate-500">
              يرجى إدخال سبب الاعتذار ليتم إشعار العميل بشكل احترافي.
            </p>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">سبب الاعتذار *</label>
              <textarea
                rows={3}
                required
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="مثال: نعتذر لعدم توفر قطع الغيار المتخصصة لهذا الطراز حالياً..."
                className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-medium"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
              >
                تراجع
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-sm"
              >
                تأكيد الاعتذار
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

