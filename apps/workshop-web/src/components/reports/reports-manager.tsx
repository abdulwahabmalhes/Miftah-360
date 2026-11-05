import React, { useState } from 'react';
import { useI18n } from '../../context/i18n-context';

export const ReportsManager: React.FC = () => {
  const { language } = useI18n();
  const [selectedPeriod, setSelectedPeriod] = useState<'THIS_MONTH' | 'LAST_MONTH' | 'QUARTER'>('THIS_MONTH');

  return (
    <div className="space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-indigo-950 text-white p-6 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-mono font-bold">
            ADVANCED REPORTS PACK (موديول التقارير والذكاء المالي)
          </span>
          <h2 className="text-xl font-bold mt-2">التقارير التحليلية والذكاء المالي للورشة</h2>
          <p className="text-xs text-slate-300 mt-1">
            تحليل الإيرادات، هوامش أرباح قطع الغيار وأجور اليد، وتقارير ضريبة القيمة المضافة (5% UAE VAT)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedPeriod}
            onChange={(e: any) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 bg-slate-800 text-white border border-slate-700 rounded-xl text-xs font-bold"
          >
            <option value="THIS_MONTH">الشهر الحالي (نوفمبر 2026)</option>
            <option value="LAST_MONTH">الشهر السابق (أكتوبر 2026)</option>
            <option value="QUARTER">الربع الرابع (Q4 2026)</option>
          </select>

          <button
            onClick={() => alert('تم تصدير تقرير الورشة المالي الشامل بصيغة PDF بنجاح!')}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow transition shrink-0"
          >
            تصدير تقرير PDF ⬇
          </button>
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-500 font-bold">إجمالي دخل الورشة</p>
          <p className="text-2xl font-black text-slate-900 mt-1">AED 148,250</p>
          <p className="text-[10px] text-emerald-600 font-bold mt-0.5">▲ +14% مقارنة بالشهر الماضي</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-500 font-bold">صافي الأرباح التشغيلية</p>
          <p className="text-2xl font-black text-emerald-600 mt-1">AED 56,800</p>
          <p className="text-[10px] text-slate-400 mt-0.5">هامش ربح إجمالي 38.3%</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-500 font-bold">ضريبة القيمة المضافة (5% VAT)</p>
          <p className="text-2xl font-black text-indigo-700 mt-1">AED 7,412.50</p>
          <p className="text-[10px] text-slate-400 mt-0.5">جاهزة للإقرار الضريبي للهيئة</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-500 font-bold">متوسط الفاتورة لكل مركبة</p>
          <p className="text-2xl font-black text-amber-600 mt-1">AED 860</p>
          <p className="text-[10px] text-slate-400 mt-0.5">من أصل 172 أمر شغل منجز</p>
        </div>
      </div>

      {/* Analytics Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Distribution */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 border-b pb-2">توزيع مصادر الدخل والأرباح</h3>
          
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span>مبيعات قطع الغيار والزيوت (Parts & Consumables)</span>
                <span className="font-mono text-slate-900">AED 88,950 (60%)</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div className="bg-indigo-600 h-full rounded-full" style={{ width: '60%' }}></div>
              </div>
              <span className="text-[10px] text-slate-400">متوسط هامش الربح: 28%</span>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span>أجور اليد والمصنعية والتشخيص (Labor Fees)</span>
                <span className="font-mono text-slate-900">AED 59,300 (40%)</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div className="bg-emerald-600 h-full rounded-full" style={{ width: '40%' }}></div>
              </div>
              <span className="text-[10px] text-slate-400">هامش الربح الصافي: 82%</span>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border text-[11px] text-slate-600 space-y-1">
            <p className="font-bold text-slate-800">💡 مؤشر الأداء الذكي من مفتاح 360:</p>
            <p>
              زيادة نسبة خدمات الصيانة الميكانيكية التخصصية هذا الشهر رفعت هامش الربح الصافي بنسبة 4.2% مقارنة بالصيانة السريعة للزيوت فقط.
            </p>
          </div>
        </div>

        {/* Top Requested Services */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 border-b pb-2">الخدمات الأكثر طلباً وتحقيقاً للإيراد</h3>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
              <div>
                <p className="font-bold text-slate-900">صيانة دورية وتغيير زيوت وفلاتر</p>
                <p className="text-[10px] text-slate-500">68 مركبة • نسبة الرضا 98%</p>
              </div>
              <span className="font-mono font-bold text-emerald-700">AED 34,000</span>
            </div>

            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
              <div>
                <p className="font-bold text-slate-900">تبديل أقمشة وهوبات الفرامل</p>
                <p className="text-[10px] text-slate-500">42 مركبة • مع ضمان 6 أشهر</p>
              </div>
              <span className="font-mono font-bold text-emerald-700">AED 29,400</span>
            </div>

            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
              <div>
                <p className="font-bold text-slate-900">صيانة وتعبئة غاز مكيف السيارات</p>
                <p className="text-[10px] text-slate-500">31 مركبة • فحص تسريب إلكتروني</p>
              </div>
              <span className="font-mono font-bold text-emerald-700">AED 18,600</span>
            </div>

            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
              <div>
                <p className="font-bold text-slate-900">ميزان ليزر وترصيص أرضي</p>
                <p className="text-[10px] text-slate-500">31 مركبة</p>
              </div>
              <span className="font-mono font-bold text-emerald-700">AED 9,300</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

