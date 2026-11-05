import React, { useState, useEffect } from 'react';
import { useI18n } from '../../context/i18n-context';
import { workshopApi } from '../../api/workshop-client';

interface WorkshopServiceConfig {
  serviceCode: string;
  isEnabled: boolean;
  startingPrice?: number;
}

export const ServicesCatalog: React.FC = () => {
  const { t, language } = useI18n();
  const [canonicalServices, setCanonicalServices] = useState<any[]>([]);
  const [serviceConfigs, setServiceConfigs] = useState<Record<string, WorkshopServiceConfig>>({});
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const categories = [
    { key: 'ALL', labelEn: 'All Services', labelAr: 'كافة الخدمات' },
    { key: 'MECH', labelEn: 'Mechanical (MECH)', labelAr: 'ميكانيكا' },
    { key: 'ELEC', labelEn: 'Electrical (ELEC)', labelAr: 'كهرباء' },
    { key: 'AC', labelEn: 'AC & Climate (AC)', labelAr: 'تكييف' },
    { key: 'MAINT', labelEn: 'Maintenance (MAINT)', labelAr: 'صيانة دورية' },
    { key: 'TYRE', labelEn: 'Tyres & Brakes (TYRE)', labelAr: 'إطارات وفرامل' },
    { key: 'CARE', labelEn: 'Car Care (CARE)', labelAr: 'عناية وتجميل' },
  ];

  const loadData = async () => {
    try {
      setLoading(true);
      setMessage(null);
      const [taxonomy, currentServices] = await Promise.all([
        workshopApi.getTaxonomy(),
        workshopApi.getServices(),
      ]);
      setCanonicalServices(taxonomy || []);

      const configs: Record<string, WorkshopServiceConfig> = {};
      (currentServices || []).forEach((s: any) => {
        const code = s.service?.code || s.serviceCode;
        if (code) {
          configs[code] = {
            serviceCode: code,
            isEnabled: s.enabled ?? s.isEnabled ?? true,
            startingPrice: s.startingPriceAmount ? Number(s.startingPriceAmount) : s.startingPrice,
          };
        }
      });
      setServiceConfigs(configs);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || t('common.error') });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleService = (code: string) => {
    setServiceConfigs((prev) => {
      const current = prev[code] || { serviceCode: code, isEnabled: false };
      return {
        ...prev,
        [code]: { ...current, isEnabled: !current.isEnabled },
      };
    });
  };

  const handlePriceChange = (code: string, priceStr: string) => {
    const val = priceStr === '' ? undefined : Number(priceStr);
    setServiceConfigs((prev) => {
      const current = prev[code] || { serviceCode: code, isEnabled: true };
      return {
        ...prev,
        [code]: { ...current, startingPrice: val },
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setMessage(null);
      // Update each canonical service that has a configuration or state
      const updatePromises = canonicalServices.map((srv) => {
        const conf = serviceConfigs[srv.code];
        if (!conf) return Promise.resolve();
        return workshopApi.updateService(srv.id, {
          enabled: conf.isEnabled,
          startingPriceAmount: conf.startingPrice,
          currency: 'AED',
        });
      });
      await Promise.all(updatePromises);
      setMessage({ type: 'success', text: t('common.success') });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || t('common.error') });
    } finally {
      setSaving(false);
    }
  };

  const filteredServices = canonicalServices.filter((s) => {
    const catCode = typeof s.category === 'object' ? s.category?.code : s.category;
    const categoryMatch = selectedCategory === 'ALL' || catCode === selectedCategory;
    const nameMatch =
      s.nameEn.toLowerCase().includes(search.toLowerCase()) ||
      s.nameAr.includes(search) ||
      s.code.toLowerCase().includes(search.toLowerCase());
    return categoryMatch && nameMatch;
  });

  const enabledCount = Object.values(serviceConfigs).filter((c) => c.isEnabled).length;

  if (loading) {
    return (
      <div className="bg-white p-12 rounded-xl border border-slate-200 text-center">
        <div className="animate-spin inline-block w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full mb-3"></div>
        <p className="text-sm text-slate-500">{t('common.loading')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-slate-900">{t('services.title')}</h2>
            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-full text-xs font-bold border border-emerald-200">
              {enabledCount} / {canonicalServices.length} {t('services.enabled')}
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">{t('services.desc')}</p>
        </div>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl text-sm font-medium border ${
            message.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Categories & Search */}
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat.key}
              type="button"
              onClick={() => setSelectedCategory(cat.key)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                selectedCategory === cat.key
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {language === 'ar' ? cat.labelAr : cat.labelEn}
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder={language === 'ar' ? 'بحث باسم الخدمة أو الرمز...' : 'Search service name or code...'}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
        />
      </div>

      {/* Services Table */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-semibold text-slate-500">
              <tr>
                <th className="px-6 py-4">{language === 'ar' ? 'تفعيل' : 'Enabled'}</th>
                <th className="px-6 py-4">{language === 'ar' ? 'رمز الخدمة' : 'Code'}</th>
                <th className="px-6 py-4">{language === 'ar' ? 'اسم الخدمة' : 'Service Name'}</th>
                <th className="px-6 py-4">{language === 'ar' ? 'التصنيف' : 'Category'}</th>
                <th className="px-6 py-4">{t('services.startingPrice')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredServices.map((srv) => {
                const conf = serviceConfigs[srv.code] || { serviceCode: srv.code, isEnabled: false };
                const isEnabled = conf.isEnabled;

                return (
                  <tr
                    key={srv.code}
                    className={`transition ${isEnabled ? 'bg-white' : 'bg-slate-50/50 opacity-60'}`}
                  >
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={isEnabled}
                        onChange={() => handleToggleService(srv.code)}
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      />
                    </td>
                    <td className="px-6 py-4 font-mono text-xs font-bold text-slate-900">
                      {srv.code}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-900">
                      <div>{language === 'ar' ? srv.nameAr : srv.nameEn}</div>
                      <div className="text-xs text-slate-400">
                        {language === 'ar' ? srv.nameEn : srv.nameAr}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
                        {typeof srv.category === 'object'
                          ? (language === 'ar' ? srv.category?.nameAr || srv.category?.code : srv.category?.nameEn || srv.category?.code)
                          : srv.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min="0"
                          step="1"
                          placeholder="AED"
                          value={conf.startingPrice !== undefined ? conf.startingPrice : ''}
                          disabled={!isEnabled}
                          onChange={(e) => handlePriceChange(srv.code, e.target.value)}
                          className="w-28 px-3 py-1.5 border border-slate-300 rounded text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-600 disabled:bg-slate-100 disabled:text-slate-400"
                        />
                        <span className="text-xs font-bold text-slate-500">AED</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-sm shadow-sm transition disabled:opacity-50"
          >
            {saving ? t('common.saving') : t('services.saveBtn')}
          </button>
        </div>
      </form>
    </div>
  );
};
