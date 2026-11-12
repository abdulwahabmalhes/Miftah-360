import React, { useState, useEffect } from 'react';
import { useI18n } from '../../context/i18n-context';
import { mobileApi } from '../../api/mobile-client';
import { VehicleResponseDto, VehicleStatus } from '@miftah/contracts';
import { UaePlateBadge } from '../../components/common/uae-plate';

const VEHICLE_PHOTOS: Record<string, string> = {
  'nissan': 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=800&q=80',
  'patrol': 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=800&q=80',
  'toyota': 'https://images.unsplash.com/photo-1594502184342-2e12f877aa73?auto=format&fit=crop&w=800&q=80',
  'land cruiser': 'https://images.unsplash.com/photo-1594502184342-2e12f877aa73?auto=format&fit=crop&w=800&q=80',
  'lexus': 'https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=800&q=80',
  'porsche': 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80',
  'mercedes': 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=800&q=80',
  'bmw': 'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=800&q=80',
  'default': 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=800&q=80',
};

const getVehiclePhoto = (brandName?: string, modelName?: string): string => {
  const query = `${brandName || ''} ${modelName || ''}`.toLowerCase();
  for (const [key, url] of Object.entries(VEHICLE_PHOTOS)) {
    if (key !== 'default' && query.includes(key)) return url;
  }
  return VEHICLE_PHOTOS.default;
};

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
          className="text-xs font-bold text-[#0E7C86] hover:text-[#0A4D56] flex items-center gap-1"
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

      {/* Hero Vehicle Card with Photo */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-0">
        <div className="h-44 w-full relative overflow-hidden bg-slate-900">
          <img
            src={getVehiclePhoto(vehicle.brand?.name, vehicle.model?.name)}
            alt={`${vehicle.brand?.name || ''} ${vehicle.model?.name || ''}`}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20"></div>

          <div className="absolute top-3 right-3 shadow-lg">
            <UaePlateBadge
              emirate={vehicle.emirate}
              plateCode={vehicle.plateCode || ''}
              plateNumber={vehicle.plateNumber || ''}
            />
          </div>

          <div className="absolute bottom-3 right-4 left-4 text-white">
            <h2 className="text-xl font-black leading-tight drop-shadow-md">
              {vehicle.brand?.name || 'Vehicle'} {vehicle.model?.name || ''}
            </h2>
            <p className="text-xs text-[#4DD0E1] font-semibold drop-shadow">
              {vehicle.year} {vehicle.trim ? `• ${vehicle.trim}` : ''}
            </p>
          </div>
        </div>

        <div className="p-4 space-y-3">
          {/* Mileage with in-place edit */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-400 block">{t('garage.mileage')}</span>
              {!editingMileage ? (
                <span className="text-lg font-bold font-mono text-slate-900">
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
                    className="px-2 py-1 bg-[#0E7C86] rounded text-[11px] font-bold text-white shadow-xs"
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
                className="text-xs text-[#0E7C86] font-bold hover:underline"
              >
                {language === 'ar' ? 'تحديث العداد' : 'Update'}
              </button>
            )}
          </div>
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
            <div className="animate-spin inline-block w-4 h-4 border-2 border-[#0E7C86] border-t-transparent rounded-full mb-1"></div>
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
