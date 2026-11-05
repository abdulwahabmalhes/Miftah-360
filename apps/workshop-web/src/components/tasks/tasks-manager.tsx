import React, { useState } from 'react';
import { useI18n } from '../../context/i18n-context';

interface TaskItem {
  id: string;
  titleAr: string;
  vehiclePlate: string;
  technicianName: string;
  bayNumber: string;
  priority: 'HIGH' | 'MEDIUM' | 'NORMAL';
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  estimatedHours: number;
}

export const TasksManager: React.FC = () => {
  const { language } = useI18n();

  const [tasks, setTasks] = useState<TaskItem[]>([
    {
      id: 'TSK-101',
      titleAr: 'فحص وتبديل أقمشة الفرامل الأمامية مع خرط الهوبات',
      vehiclePlate: 'Dubai B-44219',
      technicianName: 'فهد المنصوري (فني ميكانيك)',
      bayNumber: 'حارة 2',
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      estimatedHours: 1.5,
    },
    {
      id: 'TSK-102',
      titleAr: 'صيانة دورية 40,000 كم (زيوت وفلاتر وبواجي)',
      vehiclePlate: 'Abu Dhabi 12-88710',
      technicianName: 'كريم عبد الله (فني صيانة)',
      bayNumber: 'حارة 4',
      priority: 'MEDIUM',
      status: 'TODO',
      estimatedHours: 2.0,
    },
    {
      id: 'TSK-103',
      titleAr: 'فحص تسريب غاز المكيف وضغط الكمبروسر',
      vehiclePlate: 'Sharjah C-19823',
      technicianName: 'طارق عزيز (فني تكييف وكهرباء)',
      bayNumber: 'حارة 1',
      priority: 'NORMAL',
      status: 'DONE',
      estimatedHours: 1.0,
    },
  ]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newPlate, setNewPlate] = useState('');
  const [newTech, setNewTech] = useState('فهد المنصوري (فني ميكانيك)');
  const [newBay, setNewBay] = useState('حارة 3');
  const [newPriority, setNewPriority] = useState<'HIGH' | 'MEDIUM' | 'NORMAL'>('NORMAL');
  const [newHours, setNewHours] = useState(1.5);

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newPlate) return;
    const newTask: TaskItem = {
      id: `TSK-${Math.floor(100 + Math.random() * 900)}`,
      titleAr: newTitle,
      vehiclePlate: newPlate,
      technicianName: newTech,
      bayNumber: newBay,
      priority: newPriority,
      status: 'TODO',
      estimatedHours: Number(newHours),
    };
    setTasks([newTask, ...tasks]);
    setShowAddModal(false);
    setNewTitle('');
    setNewPlate('');
  };

  const updateStatus = (id: string, newStatus: 'TODO' | 'IN_PROGRESS' | 'DONE') => {
    setTasks(tasks.map((t) => (t.id === id ? { ...t, status: newStatus } : t)));
  };

  return (
    <div className="space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-900 to-slate-900 text-white p-6 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="px-2.5 py-1 bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-lg text-xs font-mono font-bold">
            TASKS PACK (موديول المهام والجدولة)
          </span>
          <h2 className="text-xl font-bold mt-2">جدولة المهام وتوزيع أعمال الفنيين</h2>
          <p className="text-xs text-slate-300 mt-1">
            إدارة وتعيين أوامر الشغل على الفنيين وحارات الصيانة ومتابعة الإنجاز لحظياً
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs rounded-xl shadow transition shrink-0 flex items-center gap-1.5"
        >
          <span>＋</span>
          <span>إسناد مهمة عمل جديدة</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-500 font-bold">قيد التنفيذ الآن</p>
          <p className="text-2xl font-black text-amber-600 mt-1">
            {tasks.filter((t) => t.status === 'IN_PROGRESS').length}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">في حارات الصيانة</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-500 font-bold">بانتظار البدء</p>
          <p className="text-2xl font-black text-slate-800 mt-1">
            {tasks.filter((t) => t.status === 'TODO').length}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">في قائمة الانتظار</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-500 font-bold">مكتمل وجاهز للتسليم</p>
          <p className="text-2xl font-black text-emerald-600 mt-1">
            {tasks.filter((t) => t.status === 'DONE').length}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">تم الفحص النهائي</p>
        </div>
      </div>

      {/* Tasks Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">أوامر الشغل والمهام الحالية ({tasks.length})</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold">
              <tr>
                <th className="p-3">رقم المهمة</th>
                <th className="p-3">وصف العمل</th>
                <th className="p-3">رقم اللوحة</th>
                <th className="p-3">الفني المسؤول</th>
                <th className="p-3">الحارة</th>
                <th className="p-3">الوقت المقدر</th>
                <th className="p-3">الأولوية</th>
                <th className="p-3">الحالة</th>
                <th className="p-3 text-center">تحديث الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tasks.map((task) => (
                <tr key={task.id} className="hover:bg-slate-50/60 transition">
                  <td className="p-3 font-mono font-bold text-cyan-800">{task.id}</td>
                  <td className="p-3 font-bold text-slate-900 max-w-xs">{task.titleAr}</td>
                  <td className="p-3 font-mono font-bold text-slate-700">{task.vehiclePlate}</td>
                  <td className="p-3 text-slate-700">{task.technicianName}</td>
                  <td className="p-3 text-slate-600 font-semibold">{task.bayNumber}</td>
                  <td className="p-3 font-mono">{task.estimatedHours} ساعة</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        task.priority === 'HIGH'
                          ? 'bg-red-100 text-red-700'
                          : task.priority === 'MEDIUM'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {task.priority === 'HIGH' ? 'عاجل' : task.priority === 'MEDIUM' ? 'متوسط' : 'عادي'}
                    </span>
                  </td>
                  <td className="p-3">
                    <span
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-black ${
                        task.status === 'DONE'
                          ? 'bg-emerald-100 text-emerald-800'
                          : task.status === 'IN_PROGRESS'
                          ? 'bg-blue-100 text-blue-800 animate-pulse'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {task.status === 'DONE' ? '✅ مكتمل' : task.status === 'IN_PROGRESS' ? '⚙️ قيد العمل' : '⏳ بانتظار'}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {task.status !== 'IN_PROGRESS' && (
                        <button
                          onClick={() => updateStatus(task.id, 'IN_PROGRESS')}
                          className="px-2 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded text-[10px] font-bold"
                        >
                          بدء العمل
                        </button>
                      )}
                      {task.status !== 'DONE' && (
                        <button
                          onClick={() => updateStatus(task.id, 'DONE')}
                          className="px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded text-[10px] font-bold"
                        >
                          إكمال
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900 text-sm">إسناد مهمة صيانة جديدة للفنيين</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">وصف المهمة / أمر الشغل *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="مثال: فحص وتغيير زيت القير وفلتر الهواء"
                  className="w-full px-3 py-2 border rounded-xl text-xs focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">رقم لوحة المركبة *</label>
                  <input
                    type="text"
                    required
                    value={newPlate}
                    onChange={(e) => setNewPlate(e.target.value)}
                    placeholder="Dubai A-12345"
                    className="w-full px-3 py-2 border rounded-xl text-xs focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">حارة الصيانة</label>
                  <select
                    value={newBay}
                    onChange={(e) => setNewBay(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-xs bg-white"
                  >
                    <option value="حارة 1 (كهرباء وتكييف)">حارة 1 (كهرباء وتكييف)</option>
                    <option value="حارة 2 (ميكانيك وسفايف)">حارة 2 (ميكانيك وسفايف)</option>
                    <option value="حارة 3 (سيرفس سريع وزيوت)">حارة 3 (سيرفس سريع وزيوت)</option>
                    <option value="حارة 4 (ميزان وإطارات)">حارة 4 (ميزان وإطارات)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">الفني المسؤول</label>
                  <select
                    value={newTech}
                    onChange={(e) => setNewTech(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-xs bg-white"
                  >
                    <option value="فهد المنصوري (فني ميكانيك)">فهد المنصوري (فني ميكانيك)</option>
                    <option value="كريم عبد الله (فني صيانة)">كريم عبد الله (فني صيانة)</option>
                    <option value="طارق عزيز (فني تكييف وكهرباء)">طارق عزيز (فني تكييف وكهرباء)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">الأولوية</label>
                  <select
                    value={newPriority}
                    onChange={(e: any) => setNewPriority(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-xs bg-white"
                  >
                    <option value="NORMAL">عادي</option>
                    <option value="MEDIUM">متوسط</option>
                    <option value="HIGH">عاجل جداً</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">الوقت المقدر (ساعات)</label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  value={newHours}
                  onChange={(e) => setNewHours(Number(e.target.value))}
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
                  className="flex-1 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold shadow"
                >
                  تأكيد وإسناد المهمة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

