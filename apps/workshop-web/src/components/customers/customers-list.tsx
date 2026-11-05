import React, { useState, useEffect } from 'react';
import { useI18n } from '../../context/i18n-context';
import { workshopApi } from '../../api/workshop-client';

export const CustomersList: React.FC = () => {
  const { t, language } = useI18n();
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await workshopApi.getCustomers();
      setCustomers(data || []);
    } catch (err: any) {
      setError(err.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const filteredCustomers = customers.filter((c) => {
    const q = search.toLowerCase();
    const nameMatch = c.fullName?.toLowerCase().includes(q);
    const phoneMatch = c.phone?.includes(q);
    const emailMatch = c.email?.toLowerCase().includes(q);
    return nameMatch || phoneMatch || emailMatch;
  });

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">{t('customers.title')}</h2>
          <p className="text-sm text-slate-500 mt-1">{t('customers.desc')}</p>
        </div>

        <button
          onClick={loadCustomers}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-lg transition"
        >
          {language === 'ar' ? 'تحديث' : 'Refresh'}
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <input
          type="text"
          placeholder={language === 'ar' ? 'بحث بالاسم، رقم الهاتف أو البريد...' : 'Search customer by name, phone or email...'}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
        />
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <div className="animate-spin inline-block w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full mb-3"></div>
            <p className="text-sm">{t('common.loading')}</p>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <div className="text-4xl mb-3">👥</div>
            <p className="text-base font-semibold text-slate-600">{t('customers.noData')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-semibold text-slate-500">
                <tr>
                  <th className="px-6 py-4">{language === 'ar' ? 'العميل' : 'Customer'}</th>
                  <th className="px-6 py-4">{language === 'ar' ? 'الاتصال' : 'Contact'}</th>
                  <th className="px-6 py-4">{language === 'ar' ? 'المركبات المسجلة' : 'Registered Vehicles'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCustomers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-4 font-semibold text-slate-900">{c.fullName}</td>
                    <td className="px-6 py-4 text-xs font-mono text-slate-600">
                      <div>{c.phone || '-'}</div>
                      <div>{c.email || '-'}</div>
                    </td>
                    <td className="px-6 py-4">
                      {c.vehicles && c.vehicles.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {c.vehicles.map((v: any) => (
                            <span
                              key={v.id}
                              className="px-2 py-1 bg-slate-100 text-slate-800 rounded text-xs font-medium"
                            >
                              {v.brand} {v.model} ({v.year})
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">-</span>
                      )}
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

