import React, { useState, useEffect } from 'react';
import { useI18n } from '../../context/i18n-context';
import { mobileApi } from '../../api/mobile-client';
import { VehicleResponseDto, VehicleStatus } from '@miftah/contracts';
import { UaePlateBadge } from '../../components/common/uae-plate';

interface GarageScreenProps {
  onAddVehicle: () => void;
  onSelectVehicle: (vehicle: VehicleResponseDto) => void;
}

export const GarageScreen: React.FC<GarageScreenProps> = ({
  onAddVehicle,
  onSelectVehicle,
}) => {
  const { t, language } = useI18n();
  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');
  const [vehicles, setVehicles] = useState<VehicleResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadVehicles = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await mobileApi.listVehicles(true);
      setVehicles(data || []);
    } catch (err: any) {
      if (err.status === 401 || err.message?.toLowerCase().includes('token') || err.message?.toLowerCase().includes('expired')) {
        localStorage.removeItem('miftah_mobile_user');
        localStorage.removeItem('miftah_mobile_token');
        window.location.reload();
        return;
      }
      setError(err.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVehicles();
  }, []);

  const displayedVehicles = vehicles.filter((v) =>
    activeTab === 'active'
      ? v.status !== VehicleStatus.ARCHIVED
      : v.status === VehicleStatus.ARCHIVED,
  );

  return (
    <div className="flex-1 p-4 flex flex-col space-y-4">
      {/* Top Header & Add Vehicle CTA */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">{t('garage.title')}</h2>
          <p className="text-xs text-slate-500">
            {language === 'ar' ? 'إدارة أسطولك ومركباتك الشخصية' : 'Manage your personal fleet'}
          </p>
        </div>

        <button
          onClick={onAddVehicle}
          className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs shadow-sm transition"
        >
          {t('garage.addVehicle')}
        </button>
      </div>

      {/* Active vs Archived Segmented Control */}
      <div className="flex bg-slate-200/80 p-1 rounded-xl">
        <button
          onClick={() => setActiveTab('active')}
          className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
            activeTab === 'active'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          {t('garage.activeTab')} ({vehicles.filter((v) => v.status !== VehicleStatus.ARCHIVED).length})
        </button>
        <button
          onClick={() => setActiveTab('archived')}
          className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
            activeTab === 'archived'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          {t('garage.archivedTab')} ({vehicles.filter((v) => v.status === VehicleStatus.ARCHIVED).length})
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl text-center">
          {error}
        </div>
      )}

      {/* Vehicle Cards List */}
      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-slate-400">
          <div className="animate-spin inline-block w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full mb-2"></div>
          <p className="text-xs">{t('common.loading')}</p>
        </div>
      ) : displayedVehicles.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <div className="text-4xl mb-3">🚗</div>
          <p className="text-sm font-semibold text-slate-700 mb-1">
            {activeTab === 'active' ? t('garage.emptyActive') : t('garage.emptyArchived')}
          </p>
          {activeTab === 'active' && (
            <button
              onClick={onAddVehicle}
              className="mt-4 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs transition shadow-sm"
            >
              {t('garage.addVehicle')}
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3 pb-4">
          {displayedVehicles.map((vehicle) => (
            <div
              key={vehicle.id}
              onClick={() => onSelectVehicle(vehicle)}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 hover:border-amber-400 transition cursor-pointer flex flex-col space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 leading-tight">
                    {vehicle.brand?.name || 'Vehicle'} {vehicle.model?.name || ''}
                  </h3>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">
                    {vehicle.year} {vehicle.trim ? `• ${vehicle.trim}` : ''}
                  </p>
                </div>

                <UaePlateBadge
                  emirate={vehicle.emirate}
                  plateCode={vehicle.plateCode || ''}
                  plateNumber={vehicle.plateNumber || ''}
                />
              </div>

              {/* Mileage & Expiry Pills */}
              <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 text-xs">
                <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-700 font-mono">
                  {t('garage.mileage')} {vehicle.mileage.toLocaleString()} km
                </span>

                {vehicle.registrationExpiry && (
                  <span className="px-2 py-0.5 bg-amber-50 border border-amber-200 rounded text-amber-800 text-[11px] font-medium">
                    {language === 'ar' ? 'الملكية:' : 'Mulkiya:'}{' '}
                    {new Date(vehicle.registrationExpiry).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
