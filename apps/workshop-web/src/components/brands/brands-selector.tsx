import React, { useState, useEffect } from 'react';
import { useI18n } from '../../context/i18n-context';
import { workshopApi } from '../../api/workshop-client';

export const BrandsSelector: React.FC = () => {
  const { t, language } = useI18n();
  const [masterBrands, setMasterBrands] = useState<any[]>([]);
  const [allBrands, setAllBrands] = useState(false);
  const [selectedBrandIds, setSelectedBrandIds] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setMessage(null);
      const [brandsList, currentConfig] = await Promise.all([
        workshopApi.getMasterBrands(),
        workshopApi.getBrands(),
      ]);
      setMasterBrands(brandsList || []);
      setAllBrands(currentConfig?.allBrands || false);
      setSelectedBrandIds(currentConfig?.supportedBrands || []);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || t('common.error') });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleBrand = (brandId: string) => {
    setSelectedBrandIds((prev) =>
      prev.includes(brandId) ? prev.filter((id) => id !== brandId) : [...prev, brandId],
    );
  };

  const handleSelectAllInList = () => {
    const allIds = masterBrands.map((b) => b.id);
    setSelectedBrandIds(allIds);
  };

  const handleClearSelection = () => {
    setSelectedBrandIds([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setMessage(null);
      await workshopApi.updateBrands({
        allBrands,
        brandIds: allBrands ? [] : selectedBrandIds,
      });
      setMessage({ type: 'success', text: t('common.success') });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || t('common.error') });
    } finally {
      setSaving(false);
    }
  };

  const filteredBrands = masterBrands.filter((b) => {
    const q = search.toLowerCase();
    return (
      (b.name && b.name.toLowerCase().includes(q)) ||
      (b.code && b.code.toLowerCase().includes(q))
    );
  });

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
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">{t('brands.title')}</h2>
          <p className="text-sm text-slate-500 mt-1">{t('brands.desc')}</p>
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

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* All Brands Toggle Card */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={allBrands}
              onChange={(e) => setAllBrands(e.target.checked)}
              className="mt-1 w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500"
            />
            <div>
              <span className="text-base font-bold text-slate-900 block">
                {t('brands.allBrandsToggle')}
              </span>
              <p className="text-xs text-slate-500 mt-0.5">
                {language === 'ar'
                  ? 'عند التفعيل، ستكون الورشة مؤهلة لاستقبال طلبات الصيانة لأي مركبة أياً كانت علامتها التجارية.'
                  : 'When enabled, the workshop is eligible to receive service requests for all vehicle makes without restriction.'}
              </p>
            </div>
          </label>
        </div>

        {/* Specific Brands Picker (Disabled if All Brands is selected) */}
        <div
          className={`bg-white rounded-xl border border-slate-200 shadow-sm p-6 transition ${
            allBrands ? 'opacity-40 pointer-events-none' : ''
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-slate-700">
                {t('brands.selectedCount')}{' '}
                <span className="text-emerald-700 font-bold">{selectedBrandIds.length}</span> /{' '}
                {masterBrands.length}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSelectAllInList}
                className="px-3 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 rounded text-slate-700 font-medium"
              >
                {language === 'ar' ? 'تحديد الكل' : 'Select All'}
              </button>
              <button
                type="button"
                onClick={handleClearSelection}
                className="px-3 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 rounded text-slate-700 font-medium"
              >
                {language === 'ar' ? 'إلغاء التحديد' : 'Clear'}
              </button>
            </div>
          </div>

          <div className="mb-4">
            <input
              type="text"
              placeholder={language === 'ar' ? 'بحث عن ماركة سيارة...' : 'Search brand...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[400px] overflow-y-auto p-1">
            {filteredBrands.map((brand) => {
              const selected = selectedBrandIds.includes(brand.id);
              return (
                <button
                  type="button"
                  key={brand.id}
                  onClick={() => handleToggleBrand(brand.id)}
                  className={`p-3 rounded-lg border text-left flex items-center justify-between transition ${
                    selected
                      ? 'bg-emerald-50 border-emerald-400 text-emerald-950 shadow-sm'
                      : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <div>
                    <div className="font-semibold text-sm">
                      {brand.name}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      {brand.code}
                    </div>
                  </div>
                  <div
                    className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      selected ? 'bg-emerald-600 text-white' : 'border border-slate-300'
                    }`}
                  >
                    {selected ? '✓' : ''}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-sm shadow-sm transition disabled:opacity-50"
          >
            {saving ? t('common.saving') : t('brands.saveBtn')}
          </button>
        </div>
      </form>
    </div>
  );
};
