import React, { useState, useEffect } from 'react';
import { useI18n } from '../../context/i18n-context';
import { adminApi } from '../../api/admin-client';

export const TaxonomyManager: React.FC = () => {
  const { language } = useI18n();
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  const loadTaxonomy = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminApi.getTaxonomy();
      setServices(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch taxonomy');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTaxonomy();
  }, []);

  const categories = [
    { key: 'ALL', labelEn: 'All Categories', labelAr: 'جميع التصنيفات' },
    { key: 'MECH', labelEn: 'Mechanical (MECH)', labelAr: 'ميكانيكا' },
    { key: 'ELEC', labelEn: 'Electrical (ELEC)', labelAr: 'كهرباء' },
    { key: 'AC', labelEn: 'AC & Climate (AC)', labelAr: 'مكيف وهواء' },
    { key: 'MAINT', labelEn: 'Periodic Maint (MAINT)', labelAr: 'صيانة دورية' },
    { key: 'TYRE', labelEn: 'Tyres & Brakes (TYRE)', labelAr: 'إطارات وفرامل' },
    { key: 'CARE', labelEn: 'Car Care & Body (CARE)', labelAr: 'عناية وتجميل' },
  ];

  const filteredServices = services.filter((s) => {
    if (categoryFilter === 'ALL') return true;
    const catCode = typeof s.category === 'object' ? s.category?.code : s.category;
    return catCode === categoryFilter;
  });

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-slate-900">
              {language === 'ar' ? 'التصنيف المعتمد لخدمات السيارات (Taxonomy V1)' : 'Approved Service Taxonomy V1'}
            </h2>
            <span className="px-2.5 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold border border-blue-200">
              {services.length} {language === 'ar' ? 'خدمة معتمدة' : 'Canonical Services'}
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            {language === 'ar'
              ? 'دليل الخدمات المركزي غير القابل للتعديل من قبل الورش. جميع طلبات وعروض الأسعار ملزمة بهذا الدليل.'
              : 'Centrally governed canonical services dictionary. Workshops select from this list only; no custom services allowed in Phase 1.'}
          </p>
        </div>

        <button
          onClick={loadTaxonomy}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-lg transition"
        >
          {language === 'ar' ? 'تحديث الدليل' : 'Refresh'}
        </button>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setCategoryFilter(cat.key)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${
              categoryFilter === cat.key
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {language === 'ar' ? cat.labelAr : cat.labelEn}
          </button>
        ))}
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <div className="animate-spin inline-block w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full mb-2"></div>
            <p className="text-sm">{language === 'ar' ? 'جارٍ تحميل الخدمات...' : 'Loading services...'}</p>
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <p className="text-base font-semibold">{language === 'ar' ? 'لا توجد خدمات في هذا التصنيف' : 'No services found'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-semibold text-slate-500">
                <tr>
                  <th className="px-6 py-4">#</th>
                  <th className="px-6 py-4">{language === 'ar' ? 'رمز الخدمة' : 'Code'}</th>
                  <th className="px-6 py-4">{language === 'ar' ? 'التصنيف' : 'Category'}</th>
                  <th className="px-6 py-4">{language === 'ar' ? 'الاسم بالإنجليزية' : 'Name (EN)'}</th>
                  <th className="px-6 py-4">{language === 'ar' ? 'الاسم بالعربية' : 'Name (AR)'}</th>
                  <th className="px-6 py-4 text-center">{language === 'ar' ? 'الحالة' : 'Status'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredServices.map((s, index) => (
                  <tr key={s.id || s.code} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4 text-xs text-slate-400 font-mono">{index + 1}</td>
                    <td className="px-6 py-4 font-mono font-bold text-slate-900 text-xs">{s.code}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700">
                        {typeof s.category === 'object' && s.category
                          ? (language === 'ar' ? s.category.nameAr || s.category.code : s.category.nameEn || s.category.code)
                          : s.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-800">{s.nameEn}</td>
                    <td className="px-6 py-4 font-medium text-slate-800" dir="rtl">{s.nameAr}</td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {s.isActive ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
