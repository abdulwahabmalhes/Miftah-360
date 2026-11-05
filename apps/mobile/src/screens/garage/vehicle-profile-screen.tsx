import React, { useState, useEffect } from 'react';
import { useI18n } from '../../context/i18n-context';
import { mobileApi } from '../../api/mobile-client';
import { VehicleResponseDto, VehicleStatus } from '@miftah/contracts';
import { UaePlateBadge } from '../../components/common/uae-plate';

interface VehicleProfileScreenProps {
  vehicle: VehicleResponseDto;
  onBack: () => void;
  onRefresh: () => void;
}

export const VehicleProfileScreen: React.FC<VehicleProfileScreenProps> = ({
  vehicle,
  onBack,
  onRefresh,
}) => {
  const { t, language } = useI18n();
  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mileage Update state
  const [editingMileage, setEditingMileage] = useState(false);
  const [newMileage, setNewMileage] = useState(vehicle.mileage);

  const isArchived = vehicle.status === VehicleStatus.ARCHIVED;

  useEffect(() => {
    const loadHistory = async () => {
      try {
        setLoadingHistory(true);
        const data = await mobileApi.getVehicleHistory(vehicle.id);
        setHistory(data || []);
      } catch (err: any) {
        // Safe placeholder
        setHistory([]);
      } finally {
        setLoadingHistory(false);
      }
    };
    loadHistory();
  }, [vehicle.id]);

  const handleToggleArchive = async () => {
    if (!isArchived) {
      if (!confirm(t('vehicle.archiveConfirm'))) return;
    }

    try {
      setActionLoading(true);
      setError(null);
      if (isArchived) {
        await mobileApi.unarchiveVehicle(vehicle.id);
      } else {
        await mobileApi.archiveVehicle(vehicle.id);
      }
      onRefresh();
      onBack();
    } catch (err: any) {
      setError(err.message || t('common.error'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveMileage = async () => {
    try {
      setActionLoading(true);
      setError(null);
      await mobileApi.updateVehicle(vehicle.id, {
        mileage: Number(newMileage),
      });
      setEditingMileage(false);
      onRefresh();
    } catch (err: any) {
      setError(err.message || t('common.error'));
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="flex-1 p-4 flex flex-col space-y-4 pb-8">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="text-xs font-semibold text-amber-600 hover:text-amber-700 flex items-center gap-1"
        >
          <span>←</span>
          <span>{t('garage.title')}</span>
        </button>

        <span
          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
            isArchived
              ? 'bg-rose-100 text-rose-800 border border-rose-200'
              : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
          }`}
        >
          {isArchived ? t('garage.archivedTab') : t('garage.activeTab')}
        </span>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl text-center">
          {error}
        </div>
      )}

      {/* Hero Vehicle Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-900 leading-tight">
              {vehicle.brand?.name || 'Vehicle'} {vehicle.model?.name || ''}
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {vehicle.year} {vehicle.trim ? `• ${vehicle.trim}` : ''}
            </p>
          </div>

          <UaePlateBadge
            emirate={vehicle.emirate}
            plateCode={vehicle.plateCode || ''}
            plateNumber={vehicle.plateNumber || ''}
          />
        </div>

        {/* Mileage with in-place edit */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 block">{t('garage.mileage')}</span>
            {!editingMileage ? (
              <span className="text-base font-bold font-mono text-slate-900">
                {vehicle.mileage.toLocaleString()} km
              </span>
            ) : (
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="number"
                  min={0}
                  step={100}
                  value={newMileage}
                  onChange={(e) => setNewMileage(Number(e.target.value))}
                  className="w-28 px-2 py-1 border border-slate-300 rounded text-xs font-mono"
                />
                <button
                  onClick={handleSaveMileage}
                  disabled={actionLoading}
                  className="px-2 py-1 bg-amber-500 rounded text-[11px] font-bold text-slate-950"
                >
                  ✓
                </button>
                <button
                  onClick={() => setEditingMileage(false)}
                  className="px-2 py-1 bg-slate-100 rounded text-[11px] text-slate-600"
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          {!editingMileage && (
            <button
              onClick={() => {
                setNewMileage(vehicle.mileage);
                setEditingMileage(true);
              }}
              className="text-xs text-amber-600 font-semibold hover:underline"
            >
              {language === 'ar' ? 'تحديث العداد' : 'Update'}
            </button>
          )}
        </div>
      </div>

      {/* Specifications Grid */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
          {t('vehicle.specs')}
        </h3>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-2.5 bg-slate-50 rounded-xl">
            <span className="text-[10px] text-slate-400 block">{t('vehicle.fuelType')}</span>
            <span className="font-semibold text-slate-800">{vehicle.fuelType || 'PETROL'}</span>
          </div>

          <div className="p-2.5 bg-slate-50 rounded-xl">
            <span className="text-[10px] text-slate-400 block">{t('vehicle.transmission')}</span>
            <span className="font-semibold text-slate-800">
              {vehicle.transmission || 'AUTOMATIC'}
            </span>
          </div>

          <div className="p-2.5 bg-slate-50 rounded-xl col-span-2">
            <span className="text-[10px] text-slate-400 block">{t('vehicle.vin')}</span>
            <span className="font-mono font-semibold text-slate-800">
              {vehicle.vin || (language === 'ar' ? 'غير مسجل' : 'Not recorded')}
            </span>
          </div>

          {vehicle.registrationExpiry && (
            <div className="p-2.5 bg-slate-50 rounded-xl">
              <span className="text-[10px] text-slate-400 block">
                {t('vehicle.registrationExpiry')}
              </span>
              <span className="font-mono font-semibold text-slate-800">
                {new Date(vehicle.registrationExpiry).toLocaleDateString()}
              </span>
            </div>
          )}

          {vehicle.insuranceExpiry && (
            <div className="p-2.5 bg-slate-50 rounded-xl">
              <span className="text-[10px] text-slate-400 block">
                {t('vehicle.insuranceExpiry')}
              </span>
              <span className="font-mono font-semibold text-slate-800">
                {new Date(vehicle.insuranceExpiry).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Maintenance History & Invoices */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            {t('vehicle.maintenanceHistory')}
          </h3>
          <span className="text-[11px] font-mono text-slate-400">{history.length} records</span>
        </div>

        {loadingHistory ? (
          <div className="p-6 text-center text-slate-400 text-xs">
            <div className="animate-spin inline-block w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full mb-1"></div>
            <p>{t('common.loading')}</p>
          </div>
        ) : history.length === 0 ? (
          <div className="p-4 bg-slate-50 rounded-xl text-center space-y-1">
            <p className="text-xs font-medium text-slate-600">{t('vehicle.noHistory')}</p>
            <p className="text-[10px] text-slate-400">{t('vehicle.historyNotice')}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {history.map((record, index) => (
              <div
                key={record.id || index}
                className="p-3 bg-slate-50 rounded-xl flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-semibold text-slate-900">{record.serviceName}</div>
                  <div className="text-[10px] text-slate-400">{record.workshopName}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-slate-900">{record.totalAmount} AED</div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    {new Date(record.date).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions (Archive / Unarchive) */}
      <div className="pt-2">
        <button
          onClick={handleToggleArchive}
          disabled={actionLoading}
          className={`w-full py-2.5 rounded-xl text-xs font-bold border transition ${
            isArchived
              ? 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100'
              : 'bg-rose-50 border-rose-300 text-rose-800 hover:bg-rose-100'
          }`}
        >
          {actionLoading
            ? t('common.loading')
            : isArchived
            ? t('vehicle.unarchiveBtn')
            : t('vehicle.archiveBtn')}
        </button>
      </div>
    </div>
  );
};
