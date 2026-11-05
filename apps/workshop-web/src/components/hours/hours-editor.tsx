import React, { useState, useEffect } from 'react';
import { useI18n } from '../../context/i18n-context';
import { workshopApi } from '../../api/workshop-client';

interface DaySchedule {
  weekday: number;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
}

const DEFAULT_SCHEDULE: DaySchedule[] = [
  { weekday: 0, openTime: '08:00', closeTime: '18:00', isClosed: false }, // Sunday
  { weekday: 1, openTime: '08:00', closeTime: '18:00', isClosed: false }, // Monday
  { weekday: 2, openTime: '08:00', closeTime: '18:00', isClosed: false }, // Tuesday
  { weekday: 3, openTime: '08:00', closeTime: '18:00', isClosed: false }, // Wednesday
  { weekday: 4, openTime: '08:00', closeTime: '18:00', isClosed: false }, // Thursday
  { weekday: 5, openTime: '08:00', closeTime: '12:00', isClosed: true },  // Friday
  { weekday: 6, openTime: '08:00', closeTime: '18:00', isClosed: false }, // Saturday
];

export const HoursEditor: React.FC = () => {
  const { t, language } = useI18n();
  const [schedule, setSchedule] = useState<DaySchedule[]>(DEFAULT_SCHEDULE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const dayNames: Record<number, { ar: string; en: string }> = {
    0: { ar: 'الأحد', en: 'Sunday' },
    1: { ar: 'الاثنين', en: 'Monday' },
    2: { ar: 'الثلاثاء', en: 'Tuesday' },
    3: { ar: 'الأربعاء', en: 'Wednesday' },
    4: { ar: 'الخميس', en: 'Thursday' },
    5: { ar: 'الجمعة', en: 'Friday' },
    6: { ar: 'السبت', en: 'Saturday' },
  };

  const loadHours = async () => {
    try {
      setLoading(true);
      setMessage(null);
      const data = await workshopApi.getHours();
      if (data && data.length > 0) {
        // Merge with full 7-day schedule
        const merged = DEFAULT_SCHEDULE.map((def) => {
          const found = data.find((d: any) => d.weekday === def.weekday || d.dayOfWeek === def.weekday);
          return found
            ? {
                weekday: def.weekday,
                openTime: found.openTime || def.openTime,
                closeTime: found.closeTime || def.closeTime,
                isClosed: found.isClosed ?? def.isClosed,
              }
            : def;
        });
        setSchedule(merged);
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || t('common.error') });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHours();
  }, []);

  const handleDayChange = (weekday: number, field: keyof DaySchedule, value: any) => {
    setSchedule((prev) =>
      prev.map((d) => (d.weekday === weekday ? { ...d, [field]: value } : d)),
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setMessage(null);
      await workshopApi.updateHours({ hours: schedule });
      setMessage({ type: 'success', text: t('common.success') });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || t('common.error') });
    } finally {
      setSaving(false);
    }
  };

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
          <h2 className="text-xl font-bold text-slate-900">{t('hours.title')}</h2>
          <p className="text-sm text-slate-500 mt-1">{t('hours.desc')}</p>
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

      {/* Quick Action: Copy to weekdays */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between">
        <p className="text-xs text-slate-600 font-bold">
          ⚡ اختصار سريع: تطبيق ساعات عمل يوم الأحد على كافة أيام العمل (الأحد - الخميس)
        </p>
        <button
          type="button"
          onClick={() => {
            const sunday = schedule.find((d) => d.weekday === 0);
            if (sunday) {
              setSchedule((prev) =>
                prev.map((d) =>
                  d.weekday >= 0 && d.weekday <= 4
                    ? { ...d, openTime: sunday.openTime, closeTime: sunday.closeTime, isClosed: sunday.isClosed }
                    : d,
                ),
              );
            }
          }}
          className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition shadow-sm"
        >
          نسخ لباقي الأسبوع
        </button>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="divide-y divide-slate-100">
          {schedule.map((item) => {
            const dayMeta = dayNames[item.weekday];
            return (
              <div
                key={item.weekday}
                className={`p-4 flex flex-wrap items-center justify-between gap-4 transition ${
                  item.isClosed ? 'bg-slate-50 opacity-70' : 'hover:bg-slate-50/50'
                }`}
              >
                <div className="w-36 font-semibold text-sm text-slate-900">
                  {language === 'ar' ? dayMeta.ar : dayMeta.en}
                </div>

                <div className="flex items-center gap-6">
                  {/* Closed Toggle */}
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                    <input
                      type="checkbox"
                      checked={item.isClosed}
                      onChange={(e) =>
                        handleDayChange(item.weekday, 'isClosed', e.target.checked)
                      }
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>{t('hours.isClosed')}</span>
                  </label>

                  {/* Open / Close Time inputs */}
                  {!item.isClosed ? (
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-slate-500">{t('hours.open')}:</span>
                        <input
                          type="time"
                          value={item.openTime}
                          onChange={(e) =>
                            handleDayChange(item.weekday, 'openTime', e.target.value)
                          }
                          className="px-2.5 py-1.5 border border-slate-300 rounded text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-600"
                        />
                      </div>
                      <span className="text-slate-400 text-xs">→</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-slate-500">{t('hours.close')}:</span>
                        <input
                          type="time"
                          value={item.closeTime}
                          onChange={(e) =>
                            handleDayChange(item.weekday, 'closeTime', e.target.value)
                          }
                          className="px-2.5 py-1.5 border border-slate-300 rounded text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-600"
                        />
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs font-semibold text-rose-600 bg-rose-50 px-2.5 py-1 rounded border border-rose-200">
                      {language === 'ar' ? 'مغلق طوال اليوم' : 'Closed All Day'}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-sm shadow-sm transition disabled:opacity-50"
          >
            {saving ? t('common.saving') : t('hours.saveBtn')}
          </button>
        </div>
      </form>
    </div>
  );
};
