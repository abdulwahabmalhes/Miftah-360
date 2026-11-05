import React, { useState, useEffect } from 'react';
import { useI18n } from '../../context/i18n-context';
import { adminApi } from '../../api/admin-client';
import { WorkshopDetailModal } from './workshop-detail-modal';
import { WorkshopStatus } from '@miftah/contracts';

interface WorkshopQueueProps {
  initialFilter?: string;
}

export const WorkshopQueue: React.FC<WorkshopQueueProps> = ({ initialFilter = 'ALL' }) => {
  const { t, language } = useI18n();
  const [workshops, setWorkshops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>(initialFilter);
  const [emirateFilter, setEmirateFilter] = useState<string>('ALL');
  const [marketplaceOnly, setMarketplaceOnly] = useState<boolean>(false);
  const [search, setSearch] = useState('');
  const [selectedWorkshop, setSelectedWorkshop] = useState<any | null>(null);

  const loadWorkshops = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminApi.getWorkshops(statusFilter !== 'ALL' ? statusFilter : undefined);
      setWorkshops(data || []);
    } catch (err: any) {
      setError(err.message || 'فشل في استرجاع قائمة الورش');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkshops();
  }, [statusFilter]);

  const filteredWorkshops = workshops.filter((w) => {
    const nameMatch =
      (w.displayNameEn && w.displayNameEn.toLowerCase().includes(search.toLowerCase())) ||
      (w.displayNameAr && w.displayNameAr.includes(search)) ||
      (w.legalName && w.legalName.toLowerCase().includes(search.toLowerCase())) ||
      (w.primaryPhone && w.primaryPhone.includes(search));

    const emirateMatch = emirateFilter === 'ALL' || w.emirate === emirateFilter;
    const mpMatch = !marketplaceOnly || w.marketplaceParticipation;

    return nameMatch && emirateMatch && mpMatch;
  });

  const getStatusBadge = (status: string) => {
    const config: Record<string, { bg: string; text: string; label: string }> = {
      SUBMITTED: { bg: 'bg-amber-100 border-amber-300', text: 'text-amber-800', label: 'طلب جديد (SUBMITTED)' },
      UNDER_REVIEW: { bg: 'bg-blue-100 border-blue-300', text: 'text-blue-800', label: 'قيد الفحص (UNDER_REVIEW)' },
      CHANGES_REQUESTED: { bg: 'bg-orange-100 border-orange-300', text: 'text-orange-800', label: 'مطلوب تعديلات (CHANGES_REQ)' },
      APPROVED: { bg: 'bg-indigo-100 border-indigo-300', text: 'text-indigo-800', label: 'معتمد (APPROVED)' },
      ACTIVE: { bg: 'bg-emerald-100 border-emerald-300', text: 'text-emerald-800', label: 'نشط ويعمل (ACTIVE)' },
      SUSPENDED: { bg: 'bg-rose-100 border-rose-300', text: 'text-rose-800', label: 'معلق مؤقتاً (SUSPENDED)' },
      DEACTIVATED: { bg: 'bg-slate-200 border-slate-300', text: 'text-slate-800', label: 'ملغى كلياً (DEACTIVATED)' },
      REJECTED: { bg: 'bg-red-100 border-red-300', text: 'text-red-800', label: 'مرفوض (REJECTED)' },
    };

    const c = config[status] || { bg: 'bg-slate-100 border-slate-300', text: 'text-slate-800', label: status };

    return (
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${c.bg} ${c.text}`}>
        {c.label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Title & Filters */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-slate-900">سجل الورش وقائمة التحقق والاعتماد</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              مراجعة بيانات التراخيص، مواقع الورش، ساعات الدوام، وتعيين الصلاحيات والمشاركة في سوق مفتاح
            </p>
          </div>
          <button
            onClick={loadWorkshops}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 self-start"
          >
            <span>🔄 تحديث البيانات</span>
          </button>
        </div>

        {/* Filter Controls Bar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
          {/* Search */}
          <div className="md:col-span-2">
            <input
              type="text"
              placeholder="بحث بالاسم العربي، الاسم التجاري القانوني، أو الهاتف..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              <option value="ALL">كافة الحالات (All Statuses)</option>
              <option value="SUBMITTED">طلبات جديدة (SUBMITTED)</option>
              <option value="UNDER_REVIEW">قيد المراجعة (UNDER_REVIEW)</option>
              <option value="CHANGES_REQUESTED">مطلوب تعديل (CHANGES_REQ)</option>
              <option value="ACTIVE">نشطة وتعمل (ACTIVE)</option>
              <option value="SUSPENDED">معلقة (SUSPENDED)</option>
              <option value="REJECTED">مرفوضة (REJECTED)</option>
              <option value="DEACTIVATED">ملغاة (DEACTIVATED)</option>
            </select>
          </div>

          {/* Emirate Filter */}
          <div>
            <select
              value={emirateFilter}
              onChange={(e) => setEmirateFilter(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              <option value="ALL">كافة الإمارات (دبي + الشارقة)</option>
              <option value="DUBAI">إمارة دبي فقط (DUBAI)</option>
              <option value="SHARJAH">إمارة الشارقة فقط (SHARJAH)</option>
            </select>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          <span className="text-slate-400 font-bold text-[11px]">فلاتر سريعة:</span>
          <button
            onClick={() => {
              setStatusFilter('ALL');
              setEmirateFilter('ALL');
              setMarketplaceOnly(false);
            }}
            className={`px-3 py-1 rounded-lg font-bold transition text-[11px] ${
              statusFilter === 'ALL' && emirateFilter === 'ALL' && !marketplaceOnly
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            الكل ({workshops.length})
          </button>

          <button
            onClick={() => setStatusFilter('UNDER_REVIEW')}
            className={`px-3 py-1 rounded-lg font-bold transition text-[11px] ${
              statusFilter === 'UNDER_REVIEW'
                ? 'bg-blue-600 text-white'
                : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
            }`}
          >
            قيد المراجعة ({workshops.filter((w) => ['SUBMITTED', 'UNDER_REVIEW'].includes(w.status)).length})
          </button>

          <button
            onClick={() => setStatusFilter('ACTIVE')}
            className={`px-3 py-1 rounded-lg font-bold transition text-[11px] ${
              statusFilter === 'ACTIVE'
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            الورش النشطة ({workshops.filter((w) => w.status === 'ACTIVE').length})
          </button>

          <button
            onClick={() => setStatusFilter('SUSPENDED')}
            className={`px-3 py-1 rounded-lg font-bold transition text-[11px] ${
              statusFilter === 'SUSPENDED'
                ? 'bg-rose-600 text-white'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
            }`}
          >
            الورش المعلقة ({workshops.filter((w) => w.status === 'SUSPENDED').length})
          </button>

          <button
            onClick={() => setMarketplaceOnly(!marketplaceOnly)}
            className={`px-3 py-1 rounded-lg font-bold transition text-[11px] border ${
              marketplaceOnly
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-50'
            }`}
          >
            🌐 المشاركة بسوق مفتاح فقط
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-2xl font-bold">
          {error}
        </div>
      )}

      {/* Table Container */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-slate-400 space-y-3">
            <div className="animate-spin inline-block w-8 h-8 border-4 border-slate-900 border-t-transparent rounded-full"></div>
            <p className="text-xs font-bold">جاري تحميل بيانات الورش...</p>
          </div>
        ) : filteredWorkshops.length === 0 ? (
          <div className="p-16 text-center text-slate-400 space-y-2">
            <div className="text-3xl">🔍</div>
            <p className="text-sm font-bold text-slate-700">لا توجد ورش مطابقة لمعايير البحث الحالية.</p>
            <p className="text-xs text-slate-400">جرب تغيير حالة الفلتر أو كتابة كلمة بحث أخرى.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-4">بيانات الورشة والاسم القانوني</th>
                  <th className="p-4">الإمارة والعنوان</th>
                  <th className="p-4">الحالة الرقابية</th>
                  <th className="p-4">سوق مفتاح (Marketplace)</th>
                  <th className="p-4">تاريخ الاعتماد</th>
                  <th className="p-4 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredWorkshops.map((w) => (
                  <tr key={w.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-4">
                      <div className="font-bold text-slate-900 text-sm">{w.displayNameAr || w.legalName}</div>
                      <div className="text-xs text-slate-500">{w.displayNameEn || w.legalName}</div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">{w.legalName}</div>
                    </td>
                    <td className="p-4 space-y-1">
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {w.emirate === 'DUBAI' ? '🇦🇪 دبي' : '🇦🇪 الشارقة'}
                      </span>
                      <p className="text-slate-600 line-clamp-1 text-[11px]">{w.addressText}</p>
                      <p className="text-slate-400 font-mono text-[10px]">{w.primaryPhone}</p>
                    </td>
                    <td className="p-4">
                      {getStatusBadge(w.status)}
                    </td>
                    <td className="p-4">
                      {w.marketplaceParticipation ? (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full font-bold text-[11px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          <span>مفعل ومؤهل</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 font-semibold">غير مشارك</span>
                      )}
                    </td>
                    <td className="p-4 font-mono text-slate-600 text-[11px]">
                      {w.verifiedAt ? new Date(w.verifiedAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => setSelectedWorkshop(w)}
                        className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-sm"
                      >
                        عرض وتدقيق الملف ←
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {selectedWorkshop && (
        <WorkshopDetailModal
          workshop={selectedWorkshop}
          onClose={() => setSelectedWorkshop(null)}
          onRefresh={loadWorkshops}
        />
      )}
    </div>
  );
};
