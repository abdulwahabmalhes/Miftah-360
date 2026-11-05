import React, { useState, useEffect } from 'react';
import { useI18n } from '../../context/i18n-context';
import { useAuth } from '../../context/auth-context';
import { workshopApi } from '../../api/workshop-client';
import { WorkshopStaffRole } from '@miftah/contracts';

export const StaffManager: React.FC = () => {
  const { t, language } = useI18n();
  const { isOwner } = useAuth();
  const [staffList, setStaffList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Invite Form
  const [inviteData, setInviteData] = useState({
    fullName: '',
    email: '',
    phone: '',
    role: WorkshopStaffRole.SERVICE_ADVISOR,
  });
  const [inviting, setInviting] = useState(false);

  const loadStaff = async () => {
    try {
      setLoading(true);
      setMessage(null);
      const data = await workshopApi.getStaff();
      setStaffList(data || []);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || t('common.error') });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaff();
  }, []);

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setInviting(true);
      setMessage(null);
      await workshopApi.inviteStaff(inviteData);
      setInviteModalOpen(false);
      setInviteData({
        fullName: '',
        email: '',
        phone: '',
        role: WorkshopStaffRole.SERVICE_ADVISOR,
      });
      await loadStaff();
      setMessage({ type: 'success', text: t('common.success') });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || t('common.error') });
    } finally {
      setInviting(false);
    }
  };

  const handleToggleStatus = async (staffId: string, currentActive: boolean) => {
    try {
      if (currentActive) {
        await workshopApi.disableStaff(staffId);
      } else {
        await workshopApi.enableStaff(staffId);
      }
      await loadStaff();
    } catch (err: any) {
      alert(err.message || t('common.error'));
    }
  };

  const handleChangeRole = async (staffId: string, newRole: WorkshopStaffRole) => {
    try {
      await workshopApi.updateStaffRole(staffId, newRole);
      await loadStaff();
    } catch (err: any) {
      alert(err.message || t('common.error'));
    }
  };

  const allowedRoles = [
    WorkshopStaffRole.WORKSHOP_OWNER,
    WorkshopStaffRole.SERVICE_ADVISOR,
    WorkshopStaffRole.RECEPTION,
    WorkshopStaffRole.TECHNICIAN,
  ];

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
          <h2 className="text-xl font-bold text-slate-900">{t('staff.title')}</h2>
          <p className="text-sm text-slate-500 mt-1">{t('staff.desc')}</p>
        </div>

        {isOwner && (
          <button
            onClick={() => setInviteModalOpen(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-sm shadow-sm transition"
          >
            + {t('staff.inviteBtn')}
          </button>
        )}
      </div>

      {!isOwner && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs font-semibold">
          {t('staff.ownerOnlyNotice')}
        </div>
      )}

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

      {/* Staff Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-semibold text-slate-500">
              <tr>
                <th className="px-6 py-4">{t('staff.name')}</th>
                <th className="px-6 py-4">{t('staff.role')}</th>
                <th className="px-6 py-4">{t('staff.contact')}</th>
                <th className="px-6 py-4">{t('staff.status')}</th>
                {isOwner && <th className="px-6 py-4 text-center">{t('staff.actions')}</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {staffList.map((member) => (
                <tr key={member.id} className="hover:bg-slate-50/50 transition">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-900">{member.fullName}</div>
                    <div className="text-xs text-slate-400 font-mono">ID: {member.id.substring(0, 8)}</div>
                  </td>
                  <td className="px-6 py-4">
                    {isOwner && member.role !== WorkshopStaffRole.WORKSHOP_OWNER ? (
                      <select
                        value={member.role}
                        onChange={(e) => handleChangeRole(member.id, e.target.value as WorkshopStaffRole)}
                        className="px-2.5 py-1 border border-slate-300 rounded text-xs font-semibold bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
                      >
                        {allowedRoles.map((r) => (
                          <option key={r} value={r}>
                            {t(`role.${r}`)}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-800 rounded font-semibold text-xs">
                        {t(`role.${member.role}`)}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-xs font-mono text-slate-600">
                    <div>{member.email || '-'}</div>
                    <div>{member.phone || '-'}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        member.isActive
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-rose-50 text-rose-800 border border-rose-200'
                      }`}
                    >
                      {member.isActive ? t('staff.active') : t('staff.inactive')}
                    </span>
                  </td>
                  {isOwner && (
                    <td className="px-6 py-4 text-center">
                      {member.role !== WorkshopStaffRole.WORKSHOP_OWNER ? (
                        <button
                          onClick={() => handleToggleStatus(member.id, member.isActive)}
                          className={`px-3 py-1 rounded text-xs font-semibold transition ${
                            member.isActive
                              ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {member.isActive ? t('staff.deactivate') : t('staff.activate')}
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400 font-medium">-</span>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Staff Modal */}
      {inviteModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">{t('staff.inviteBtn')}</h3>

            <form onSubmit={handleInviteSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('staff.name')} *
                </label>
                <input
                  type="text"
                  required
                  value={inviteData.fullName}
                  onChange={(e) => setInviteData({ ...inviteData, fullName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email (البريد الإلكتروني) *
                </label>
                <input
                  type="email"
                  required
                  value={inviteData.email}
                  onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Phone (رقم الهاتف)
                </label>
                <input
                  type="tel"
                  value={inviteData.phone}
                  onChange={(e) => setInviteData({ ...inviteData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('staff.role')} *
                </label>
                <select
                  value={inviteData.role}
                  onChange={(e) =>
                    setInviteData({ ...inviteData, role: e.target.value as WorkshopStaffRole })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                >
                  <option value={WorkshopStaffRole.SERVICE_ADVISOR}>
                    {t('role.SERVICE_ADVISOR')}
                  </option>
                  <option value={WorkshopStaffRole.RECEPTION}>{t('role.RECEPTION')}</option>
                  <option value={WorkshopStaffRole.TECHNICIAN}>{t('role.TECHNICIAN')}</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setInviteModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={inviting}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold shadow-sm disabled:opacity-50"
                >
                  {inviting ? t('common.saving') : t('staff.inviteBtn')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
