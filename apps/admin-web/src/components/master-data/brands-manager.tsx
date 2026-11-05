import React, { useState, useEffect } from 'react';
import { useI18n } from '../../context/i18n-context';
import { adminApi } from '../../api/admin-client';

export const BrandsManager: React.FC = () => {
  const { language } = useI18n();
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedBrand, setSelectedBrand] = useState<any | null>(null);
  const [models, setModels] = useState<any[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);

  // New Brand modal
  const [newBrandCode, setNewBrandCode] = useState('');
  const [newBrandName, setNewBrandName] = useState('');
  const [creatingBrand, setCreatingBrand] = useState(false);
  const [showAddBrand, setShowAddBrand] = useState(false);

  // New Model modal
  const [newModelName, setNewModelName] = useState('');
  const [creatingModel, setCreatingModel] = useState(false);
  const [showAddModel, setShowAddModel] = useState(false);

  const loadBrands = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminApi.getBrands();
      setBrands(data || []);
      if (data && data.length > 0 && !selectedBrand) {
        selectBrand(data[0]);
      }
    } catch (err: any) {
      setError(err.message || 'فشل في تحميل الماركات');
    } finally {
      setLoading(false);
    }
  };

  const selectBrand = async (brand: any) => {
    setSelectedBrand(brand);
    try {
      setLoadingModels(true);
      const data = await adminApi.listModels(brand.id);
      setModels(data || []);
    } catch (err: any) {
      console.error('Failed to load models:', err);
    } finally {
      setLoadingModels(false);
    }
  };

  useEffect(() => {
    loadBrands();
  }, []);

  const filteredBrands = brands.filter((b) => {
    const q = search.toLowerCase();
    return (
      (b.name && b.name.toLowerCase().includes(q)) ||
      (b.code && b.code.toLowerCase().includes(q))
    );
  });

  const handleCreateBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBrandCode.trim() || !newBrandName.trim()) return;
    try {
      setCreatingBrand(true);
      await adminApi.createBrand({
        code: newBrandCode.trim().toUpperCase(),
        name: newBrandName.trim(),
      });
      setNewBrandCode('');
      setNewBrandName('');
      setShowAddBrand(false);
      await loadBrands();
    } catch (err: any) {
      alert(err.message || 'فشل إضافة الماركة');
    } finally {
      setCreatingBrand(false);
    }
  };

  const handleCreateModel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBrand || !newModelName.trim()) return;
    try {
      setCreatingModel(true);
      await adminApi.createModel(selectedBrand.id, {
        name: newModelName.trim(),
      });
      setNewModelName('');
      setShowAddModel(false);
      await selectBrand(selectedBrand);
    } catch (err: any) {
      alert(err.message || 'فشل إضافة الموديل');
    } finally {
      setCreatingModel(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-black text-slate-900">
              العلامات التجارية والموديلات المعتمدة (Master Brands & Models)
            </h2>
            <span className="px-2.5 py-0.5 bg-purple-100 text-purple-800 rounded-full text-xs font-black border border-purple-200">
              {brands.length} ماركة معتمدة
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            قاعدة البيانات المرجعية المعتمدة لمركبات العملاء وتخصصات الورش في منصة مفتاح 360.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowAddBrand(true)}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition shadow-sm"
          >
            + إضافة ماركة جديدة
          </button>
          <button
            onClick={loadBrands}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition"
          >
            🔄 تحديث
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs font-bold">
          {error}
        </div>
      )}

      {/* 2-Column Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left: Brands List */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-200">
            <input
              type="text"
              placeholder="بحث باسم الماركة (تويوتا، نيسان، BMW...)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          <div className="overflow-y-auto max-h-[550px] divide-y divide-slate-100">
            {loading ? (
              <div className="p-10 text-center text-slate-400 text-xs">جاري تحميل الماركات...</div>
            ) : filteredBrands.length === 0 ? (
              <div className="p-10 text-center text-slate-400 text-xs">لا توجد نتائج بحث.</div>
            ) : (
              filteredBrands.map((b) => (
                <button
                  key={b.id}
                  onClick={() => selectBrand(b)}
                  className={`w-full text-right p-4 flex items-center justify-between hover:bg-slate-50 transition ${
                    selectedBrand?.id === b.id ? 'bg-amber-50/70 border-r-4 border-r-amber-500 font-bold' : ''
                  }`}
                >
                  <div>
                    <div className="font-bold text-slate-900 text-sm">{b.name}</div>
                    <div className="text-[11px] text-slate-400 font-mono">{b.code}</div>
                  </div>
                  <span className="text-slate-400 text-xs">←</span>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right: Models List for Selected Brand */}
        <div className="md:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col">
          {selectedBrand ? (
            <div>
              <div className="border-b border-slate-200 pb-4 mb-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-black text-slate-900">{selectedBrand.name}</h3>
                    <span className="px-2 py-0.5 bg-slate-100 font-mono text-slate-700 rounded text-xs">
                      {selectedBrand.code}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    الموديلات المعتمدة للماركة في كراج العملاء
                  </p>
                </div>
                <button
                  onClick={() => setShowAddModel(true)}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
                >
                  + إضافة موديل لـ {selectedBrand.name}
                </button>
              </div>

              {loadingModels ? (
                <div className="p-12 text-center text-slate-400 text-xs">جاري تحميل الموديلات...</div>
              ) : models.length === 0 ? (
                <div className="p-12 text-center text-slate-400 space-y-2">
                  <p className="font-bold text-slate-700 text-xs">لا توجد موديلات مسجلة لهذه الماركة بعد.</p>
                  <p className="text-[11px]">يمكنك إضافة الموديلات الأولى بالضغط على الزر أعلاه.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {models.map((m) => (
                    <div
                      key={m.id}
                      className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between"
                    >
                      <div>
                        <p className="font-bold text-slate-900 text-xs">{m.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{selectedBrand.name}</p>
                      </div>
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px]">
                        معتمد
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="p-12 text-center text-slate-400 text-xs">
              اختر ماركة من القائمة الجانبية لعرض موديلاتها.
            </div>
          )}
        </div>
      </div>

      {/* Add Brand Modal */}
      {showAddBrand && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <h3 className="font-bold text-slate-900 text-sm">إضافة ماركة مركبة جديدة</h3>
            <form onSubmit={handleCreateBrand} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">كود الماركة الفريد (بالإنجليزية):</label>
                <input
                  type="text"
                  required
                  placeholder="GENESIS"
                  value={newBrandCode}
                  onChange={(e) => setNewBrandCode(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs uppercase font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">اسم الماركة الرسمي:</label>
                <input
                  type="text"
                  required
                  placeholder="Genesis"
                  value={newBrandName}
                  onChange={(e) => setNewBrandName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddBrand(false)}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={creatingBrand}
                  className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs"
                >
                  {creatingBrand ? 'جاري الحفظ...' : 'حفظ الماركة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Model Modal */}
      {showAddModel && selectedBrand && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <h3 className="font-bold text-slate-900 text-sm">إضافة موديل لـ {selectedBrand.name}</h3>
            <form onSubmit={handleCreateModel} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">اسم الموديل:</label>
                <input
                  type="text"
                  required
                  placeholder="GV80"
                  value={newModelName}
                  onChange={(e) => setNewModelName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModel(false)}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={creatingModel}
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs"
                >
                  {creatingModel ? 'جاري الحفظ...' : 'حفظ الموديل'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
