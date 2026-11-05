import React, { useState } from 'react';
import { useI18n } from '../../context/i18n-context';

interface EmployeeRecord {
  id: string;
  fullName: string;
  jobTitle: string;
  department: string;
  shift: 'MORNING' | 'EVENING' | 'FULL_DAY';
  emiratesIdExpiry: string;
  monthlySalaryAed: number;
  attendanceRate: string;
  status: 'ACTIVE' | 'ON_LEAVE';
}

export const HrManager: React.FC = () => {
  const { language } = useI18n();

  const [employees, setEmployees] = useState<EmployeeRecord[]>([
    {
      id: 'EMP-01',
      fullName: 'فهد المنصوري',
      jobTitle: 'كبير فنيي ميكانيك المحركات',
      department: 'قسم الميكانيك العام',
      shift: 'MORNING',
      emiratesIdExpiry: '2027-05-14',
      monthlySalaryAed: 7500,
      attendanceRate: '98%',
      status: 'ACTIVE',
    },
    {
      id: 'EMP-02',
      fullName: 'كريم عبد الله',
      jobTitle: 'فني صيانة دورية وسيرفس سريع',
      department: 'حارات السيرفس',
      shift: 'FULL_DAY',
      emiratesIdExpiry: '2026-12-01',
      monthlySalaryAed: 5200,
      attendanceRate: '95%',
      status: 'ACTIVE',
    },
    {
      id: 'EMP-03',
      fullName: 'طارق عزيز',
      jobTitle: 'فني تشخيص كهرباء ومكيفات سيارات',
      department: 'قسم الكهرباء والكمبيوتر',
      shift: 'EVENING',
      emiratesIdExpiry: '2027-09-20',
      monthlySalaryAed: 6800,
      attendanceRate: '99%',
      status: 'ACTIVE',
    },
    {
      id: 'EMP-04',
      fullName: 'سالم الشامسي',
      jobTitle: 'مستشار خدمة عملاء واستقبال',
      department: 'إدارة الاستقبال',
      shift: 'MORNING',
      emiratesIdExpiry: '2026-08-10',
      monthlySalaryAed: 6000,
      attendanceRate: '92%',
      status: 'ON_LEAVE',
    },
  ]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newDept, setNewDept] = useState('قسم الميكانيك العام');
  const [newShift, setNewShift] = useState<'MORNING' | 'EVENING' | 'FULL_DAY'>('MORNING');
  const [newSalary, setNewSalary] = useState(5500);
  const [newEid, setNewEid] = useState('2027-01-01');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName) return;
    const newEmp: EmployeeRecord = {
      id: `EMP-0${employees.length + 1}`,
      fullName: newName,
      jobTitle: newTitle,
      department: newDept,
      shift: newShift,
      emiratesIdExpiry: newEid,
      monthlySalaryAed: Number(newSalary),
      attendanceRate: '100%',
      status: 'ACTIVE',
    };
    setEmployees([...employees, newEmp]);
    setShowAddModal(false);
    setNewName('');
    setNewTitle('');
  };

  const totalPayroll = employees.reduce((acc, e) => acc + e.monthlySalaryAed, 0);

  return (
    <div className="space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="bg-gradient-to-r from-rose-950 to-slate-900 text-white p-6 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="px-2.5 py-1 bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-lg text-xs font-mono font-bold">
            HR & SHIFTS PACK (موديول شؤون الموظفين والورديات)
          </span>
          <h2 className="text-xl font-bold mt-2">إدارة الموظفين والورديات والرواتب (HR Workshop)</h2>
          <p className="text-xs text-slate-300 mt-1">
            جدولة ورديات العمل، متابعة الحضور، تجديد بطاقات العمل والإقامات، ومسيرات الرواتب
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow transition shrink-0 flex items-center gap-1.5"
        >
          <span>＋</span>
          <span>إضافة سجل موظف جديد</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-500 font-bold">إجمالي الكادر الفني والإداري</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{employees.length} موظفين</p>
          <p className="text-[10px] text-slate-400 mt-0.5">
            {employees.filter((e) => e.status === 'ACTIVE').length} على رأس العمل اليوم
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-500 font-bold">إجمالي مسير الرواتب الشهري</p>
          <p className="text-2xl font-black text-rose-700 mt-1">AED {totalPayroll.toLocaleString()}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">مستحق بنهاية الشهر</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-500 font-bold">متوسط نسبة الالتزام بالحضور</p>
          <p className="text-2xl font-black text-emerald-600 mt-1">96.5%</p>
          <p className="text-[10px] text-slate-400 mt-0.5">أداء منضبط وفق نظام البصمة</p>
        </div>
      </div>

      {/* Employees Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">سجل بيانات موظفي وفنيي الورشة ({employees.length})</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold">
              <tr>
                <th className="p-3">الرقم الوظيفي</th>
                <th className="p-3">اسم الموظف</th>
                <th className="p-3">المسمى الوظيفي</th>
                <th className="p-3">القسم</th>
                <th className="p-3">الوردية المعتمدة</th>
                <th className="p-3">انتهاء الهوية / الإقامة</th>
                <th className="p-3">الراتب الأساسي</th>
                <th className="p-3">نسبة الحضور</th>
                <th className="p-3">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {employees.map((e) => (
                <tr key={e.id} className="hover:bg-slate-50/60 transition">
                  <td className="p-3 font-mono font-bold text-rose-800">{e.id}</td>
                  <td className="p-3 font-bold text-slate-900">{e.fullName}</td>
                  <td className="p-3 text-slate-700">{e.jobTitle}</td>
                  <td className="p-3 text-slate-600">{e.department}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-800 rounded text-[10px] font-bold">
                      {e.shift === 'MORNING' ? 'صباحية (08:00 - 16:00)' : e.shift === 'EVENING' ? 'مسائية (14:00 - 22:00)' : 'شامل (08:00 - 18:00)'}
                    </span>
                  </td>
                  <td className="p-3 font-mono text-slate-700">{e.emiratesIdExpiry}</td>
                  <td className="p-3 font-mono font-bold text-slate-900">AED {e.monthlySalaryAed.toLocaleString()}</td>
                  <td className="p-3 font-bold text-emerald-700">{e.attendanceRate}</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        e.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {e.status === 'ACTIVE' ? 'نشط بالعمل' : 'في إجازة'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Employee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900 text-sm">تسجيل موظف أو فني جديد بالورشة</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">اسم الموظف الكامل *</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="الاسم مطابق لبطاقة الهوية"
                  className="w-full px-3 py-2 border rounded-xl text-xs focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">المسمى الوظيفي *</label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="مثال: فني ميزان وترصيص"
                    className="w-full px-3 py-2 border rounded-xl text-xs focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">القسم</label>
                  <select
                    value={newDept}
                    onChange={(e) => setNewDept(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-xs bg-white"
                  >
                    <option value="قسم الميكانيك العام">قسم الميكانيك العام</option>
                    <option value="حارات السيرفس السريع">حارات السيرفس السريع</option>
                    <option value="قسم الكهرباء والكمبيوتر">قسم الكهرباء والكمبيوتر</option>
                    <option value="قسم السمكرة والدهان">قسم السمكرة والدهان</option>
                    <option value="إدارة الاستقبال">إدارة الاستقبال</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">الوردية</label>
                  <select
                    value={newShift}
                    onChange={(e: any) => setNewShift(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-xs bg-white"
                  >
                    <option value="MORNING">صباحية (08:00 - 16:00)</option>
                    <option value="EVENING">مسائية (14:00 - 22:00)</option>
                    <option value="FULL_DAY">شامل (08:00 - 18:00)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">الراتب الشهري (AED)</label>
                  <input
                    type="number"
                    min="1000"
                    step="500"
                    value={newSalary}
                    onChange={(e) => setNewSalary(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-xl text-xs focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">تاريخ انتهاء الهوية الإماراتية</label>
                <input
                  type="date"
                  value={newEid}
                  onChange={(e) => setNewEid(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-xs"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border rounded-xl text-xs font-bold text-slate-700"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow"
                >
                  حفظ السجل
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

