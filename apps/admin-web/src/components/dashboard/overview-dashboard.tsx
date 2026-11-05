import React, { useState, useEffect } from 'react';
import { useI18n } from '../../context/i18n-context';
import { adminApi } from '../../api/admin-client';
import { WorkshopDetailModal } from '../workshops/workshop-detail-modal';
import { AdminView } from '../layout/admin-layout';

interface OverviewDashboardProps {
  onNavigate: (view: AdminView) => void;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({ onNavigate }) => {
  const { t, language } = useI18n();
  const [workshops, setWorkshops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedWorkshop, setSelectedWorkshop] = useState<any | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminApi.getWorkshops();
      setWorkshops(data || []);
    } catch (err: any) {
      setError(err.message || 'فشل في تحميل الإحصائيات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const total = workshops.length;
  const pending = workshops.filter((w) =>
    ['SUBMITTED', 'UNDER_REVIEW', 'CHANGES_REQUESTED'].includes(w.status),
  ).length;
  const active = workshops.filter((w) => w.status === 'ACTIVE').length;
  const suspended = workshops.filter((w) => w.status === 'SUSPENDED').length;
  const marketplace = workshops.filter((w) => w.marketplaceParticipation).length;
  const dubaiCount = workshops.filter((w) => w.emirate === 'DUBAI').length;
  const sharjahCount = workshops.filter((w) => w.emirate === 'SHARJAH').length;

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white p-6 rounded-2xl shadow-lg border border-slate-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full text-xs font-bold mb-2">
              🛡️ لوحة الحوكمة والتحكم المركزي V1
            </div>
            <h2 className="text-2xl font-black tracking-tight">نظرة عامة على شبكة ورش مفتاح 360</h2>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              إدارة طلبات اعتماد الورش المستقلة في إمارتي دبي والشارقة، ومراقبة الالتزام بمعايير الجودة وتفعيل باقات سوق مفتاح (Marketplace Pack) وتصنيف الخدمات المعتمد.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onNavigate('queue')}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs transition shadow-md flex items-center gap-1.5"
            >
              <span>📋 قائمة التحقق</span>
              {pending > 0 && (
                <span className="bg-slate-950 text-amber-400 px-2 py-0.5 rounded-full text-[10px] font-black">
                  {pending}
                </span>
              )}
            </button>
            <button
              onClick={loadData}
              className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold border border-slate-600 transition"
              title="تحديث البيانات"
            >
              🔄
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Total Workshops */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-2">
            <span>إجمالي الورش</span>
            <span className="text-lg">🏢</span>
          </div>
          <div className="text-2xl font-black text-slate-900">{total}</div>
          <div className="text-[11px] text-slate-400 mt-1">مسجلة في النظام</div>
        </div>

        {/* Pending Review */}
        <div
          onClick={() => onNavigate('queue')}
          className="bg-amber-50/60 p-4 rounded-xl border border-amber-200 shadow-sm cursor-pointer hover:border-amber-400 transition"
        >
          <div className="flex items-center justify-between text-amber-800 text-xs font-bold mb-2">
            <span>قيد المراجعة</span>
            <span className="text-lg">⏳</span>
          </div>
          <div className="text-2xl font-black text-amber-600">{pending}</div>
          <div className="text-[11px] text-amber-700 mt-1">بحاجة لقرار المشرف</div>
        </div>

        {/* Active Workshops */}
        <div
          onClick={() => onNavigate('workshops')}
          className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-200 shadow-sm cursor-pointer hover:border-emerald-400 transition"
        >
          <div className="flex items-center justify-between text-emerald-800 text-xs font-bold mb-2">
            <span>ورش نشطة</span>
            <span className="text-lg">✅</span>
          </div>
          <div className="text-2xl font-black text-emerald-600">{active}</div>
          <div className="text-[11px] text-emerald-700 mt-1">مفعلة وتعمل كلياً</div>
        </div>

        {/* Suspended Workshops */}
        <div
          onClick={() => onNavigate('workshops')}
          className="bg-rose-50/60 p-4 rounded-xl border border-rose-200 shadow-sm cursor-pointer hover:border-rose-400 transition"
        >
          <div className="flex items-center justify-between text-rose-800 text-xs font-bold mb-2">
            <span>ورش معلقة</span>
            <span className="text-lg">🛑</span>
          </div>
          <div className="text-2xl font-black text-rose-600">{suspended}</div>
          <div className="text-[11px] text-rose-700 mt-1">إيقاف مؤقت / رخص</div>
        </div>

        {/* Marketplace Participating */}
        <div
          onClick={() => onNavigate('modules')}
          className="bg-indigo-50/60 p-4 rounded-xl border border-indigo-200 shadow-sm cursor-pointer hover:border-indigo-400 transition"
        >
          <div className="flex items-center justify-between text-indigo-800 text-xs font-bold mb-2">
            <span>سوق مفتاح</span>
            <span className="text-lg">🌐</span>
          </div>
          <div className="text-2xl font-black text-indigo-600">{marketplace}</div>
          <div className="text-[11px] text-indigo-700 mt-1">مؤهلة لاستقبال الطلبات</div>
        </div>

        {/* Canonical Services */}
        <div
          onClick={() => onNavigate('taxonomy')}
          className="bg-blue-50/60 p-4 rounded-xl border border-blue-200 shadow-sm cursor-pointer hover:border-blue-400 transition"
        >
          <div className="flex items-center justify-between text-blue-800 text-xs font-bold mb-2">
            <span>الخدمات المعتمدة</span>
            <span className="text-lg">🔧</span>
          </div>
          <div className="text-2xl font-black text-blue-600">25</div>
          <div className="text-[11px] text-blue-700 mt-1">موزعة على 6 فئات</div>
        </div>
      </div>

      {/* Emirate Distribution + Governance Notice */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Emirate Split */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 text-sm flex items-center justify-between">
            <span>التوزيع الجغرافي (دبي والشارقة)</span>
            <span className="text-xs text-slate-400">Phase 1 Target</span>
          </h3>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="flex items-center gap-1.5 text-slate-800">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block"></span>
                  إمارة دبي (DUBAI)
                </span>
                <span className="font-mono text-slate-700">{dubaiCount} ورشة</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: total > 0 ? `${(dubaiCount / total) * 100}%` : '0%' }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="flex items-center gap-1.5 text-slate-800">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
                  إمارة الشارقة (SHARJAH)
                </span>
                <span className="font-mono text-slate-700">{sharjahCount} ورشة</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-amber-500 h-2 rounded-full"
                  style={{ width: total > 0 ? `${(sharjahCount / total) * 100}%` : '0%' }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Governance Links */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <h3 className="font-bold text-slate-900 text-sm">أدوات الحوكمة السريعة</h3>
          <div className="grid grid-cols-1 gap-2 text-xs">
            <button
              onClick={() => onNavigate('modules')}
              className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition text-right"
            >
              <div className="flex items-center gap-2">
                <span className="text-base">🧩</span>
                <div>
                  <p className="font-bold text-slate-800">مصفوفة تفعيل الباقات</p>
                  <p className="text-[11px] text-slate-400">إدارة باقات الورش وسوق مفتاح</p>
                </div>
              </div>
              <span className="text-slate-400">←</span>
            </button>

            <button
              onClick={() => onNavigate('taxonomy')}
              className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition text-right"
            >
              <div className="flex items-center gap-2">
                <span className="text-base">🔧</span>
                <div>
                  <p className="font-bold text-slate-800">تصنيف الخدمات المعتمد (V1)</p>
                  <p className="text-[11px] text-slate-400">الـ 25 خدمة القانونية وسياسات الفحص</p>
                </div>
              </div>
              <span className="text-slate-400">←</span>
            </button>

            <button
              onClick={() => onNavigate('brands')}
              className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition text-right"
            >
              <div className="flex items-center gap-2">
                <span className="text-base">🚗</span>
                <div>
                  <p className="font-bold text-slate-800">الماركات والموديلات</p>
                  <p className="text-[11px] text-slate-400">إدارة قاعدة بيانات السيارات المعتمدة</p>
                </div>
              </div>
              <span className="text-slate-400">←</span>
            </button>
          </div>
        </div>

        {/* Rules & Invariants Notice */}
        <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-sm space-y-3">
          <h3 className="font-bold text-amber-400 text-sm flex items-center gap-2">
            <span>⚖️</span>
            <span>محددات الحوكمة الرقابية المعتمدة</span>
          </h3>
          <ul className="text-xs text-slate-300 space-y-2 leading-relaxed">
            <li className="flex items-start gap-2">
              <span className="text-amber-400 font-bold">•</span>
              <span><strong>المشرف فقط:</strong> هو المخول حصراً بتعديل حالة الورش، والموافقة على السوق المفتوح، وتعديل الموديولات.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-400 font-bold">•</span>
              <span><strong>منع الموافقة بالنيابة:</strong> لا يحق للمشرف أبداً قبول عروض الأسعار نيابة عن مالك السيارة.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-400 font-bold">•</span>
              <span><strong>التدقيق الإلزامي:</strong> كل إجراء حساس (تعليق، رفض، تعديل باقة) يسجل فوراً في سجل التدقيق الرقابي مع إثبات السبب.</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Recent Workshops List Preview */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm">أحدث الورش المسجلة في النظام</h3>
          <button
            onClick={() => onNavigate('workshops')}
            className="text-xs text-blue-600 hover:text-blue-800 font-bold"
          >
            عرض كافة الورش ({total}) ←
          </button>
        </div>

        {loading ? (
          <div className="p-10 text-center text-slate-400 text-xs">جاري تحميل بيانات الورش...</div>
        ) : workshops.length === 0 ? (
          <div className="p-10 text-center text-slate-400 text-xs">لا توجد ورش مسجلة حالياً.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">اسم الورشة</th>
                  <th className="p-3">الإمارة</th>
                  <th className="p-3">الحالة الرقابية</th>
                  <th className="p-3">سوق مفتاح</th>
                  <th className="p-3">تاريخ الاعتماد</th>
                  <th className="p-3 text-center">الإجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {workshops.slice(0, 5).map((w) => (
                  <tr key={w.id} className="hover:bg-slate-50/70 transition">
                    <td className="p-3">
                      <p className="font-bold text-slate-900">{w.displayNameAr || w.legalName}</p>
                      <p className="text-[11px] text-slate-400 font-mono">{w.legalName}</p>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700">
                        {w.emirate === 'DUBAI' ? '🇦🇪 دبي' : '🇦🇪 الشارقة'}
                      </span>
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          w.status === 'ACTIVE'
                            ? 'bg-emerald-100 text-emerald-800'
                            : w.status === 'PENDING_VERIFICATION' || w.status === 'SUBMITTED'
                            ? 'bg-amber-100 text-amber-800'
                            : w.status === 'SUSPENDED'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {w.status}
                      </span>
                    </td>
                    <td className="p-3">
                      {w.marketplaceParticipation ? (
                        <span className="text-emerald-700 font-bold flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                          مشارك
                        </span>
                      ) : (
                        <span className="text-slate-400 font-medium">غير مشارك</span>
                      )}
                    </td>
                    <td className="p-3 font-mono text-slate-600">
                      {w.verifiedAt ? new Date(w.verifiedAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => setSelectedWorkshop(w)}
                        className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition"
                      >
                        عرض وتدقيق
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Workshop Detail Modal */}
      {selectedWorkshop && (
        <WorkshopDetailModal
          workshop={selectedWorkshop}
          onClose={() => setSelectedWorkshop(null)}
          onRefresh={loadData}
        />
      )}
    </div>
  );
};

