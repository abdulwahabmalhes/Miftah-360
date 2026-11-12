import React, { useState, useEffect } from 'react';
import { useI18n } from '../../context/i18n-context';
import { mobileApi } from '../../api/mobile-client';
import { VehicleResponseDto, VehicleStatus } from '@miftah/contracts';
import { UaePlateBadge } from '../../components/common/uae-plate';

const VEHICLE_PHOTOS: Record<string, string> = {
  'nissan': 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=600&q=80',
  'patrol': 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=600&q=80',
  'toyota': 'https://images.unsplash.com/photo-1594502184342-2e12f877aa73?auto=format&fit=crop&w=600&q=80',
  'land cruiser': 'https://images.unsplash.com/photo-1594502184342-2e12f877aa73?auto=format&fit=crop&w=600&q=80',
  'lexus': 'https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=600&q=80',
  'porsche': 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=600&q=80',
  'mercedes': 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=600&q=80',
  'bmw': 'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=600&q=80',
  'default': 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=600&q=80',
};

const getVehiclePhoto = (brandName?: string, modelName?: string): string => {
  const query = `${brandName || ''} ${modelName || ''}`.toLowerCase();
  for (const [key, url] of Object.entries(VEHICLE_PHOTOS)) {
    if (key !== 'default' && query.includes(key)) return url;
  }
  return VEHICLE_PHOTOS.default;
};

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
          className="px-3.5 py-1.5 bg-gradient-to-r from-[#0E7C86] to-[#0A4D56] hover:from-[#0A4D56] hover:to-[#061E23] text-white font-bold rounded-xl text-xs shadow-sm transition"
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
          <div className="animate-spin inline-block w-6 h-6 border-2 border-[#0E7C86] border-t-transparent rounded-full mb-2"></div>
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
              className="mt-4 px-4 py-2 bg-gradient-to-r from-[#0E7C86] to-[#0A4D56] hover:from-[#0A4D56] hover:to-[#061E23] text-white font-bold rounded-xl text-xs transition shadow-sm"
            >
              {t('garage.addVehicle')}
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3 pb-4">
          {displayedVehicles.map((vehicle) => {
            const photoUrl = getVehiclePhoto(vehicle.brand?.name, vehicle.model?.name);
            return (
              <div
                key={vehicle.id}
                onClick={() => onSelectVehicle(vehicle)}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-[#0E7C86] transition cursor-pointer overflow-hidden group flex flex-col"
              >
                {/* Vehicle Photo Banner */}
                <div className="h-32 w-full relative overflow-hidden bg-slate-100">
                  <img
                    src={photoUrl}
                    alt={`${vehicle.brand?.name || ''} ${vehicle.model?.name || ''}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10"></div>
                  
                  {/* Floating Plate on Top-Right */}
                  <div className="absolute top-2.5 right-2.5 shadow-md">
                    <UaePlateBadge
                      emirate={vehicle.emirate}
                      plateCode={vehicle.plateCode || ''}
                      plateNumber={vehicle.plateNumber || ''}
                    />
                  </div>

                  {/* Brand & Model Overlay on Bottom */}
                  <div className="absolute bottom-2 right-3 left-3 text-white">
                    <h3 className="text-base font-black leading-tight drop-shadow-md">
                      {vehicle.brand?.name || 'Vehicle'} {vehicle.model?.name || ''}
                    </h3>
                    <p className="text-[11px] text-[#4DD0E1] font-semibold drop-shadow">
                      {vehicle.year} {vehicle.trim ? `• ${vehicle.trim}` : ''}
                    </p>
                  </div>
                </div>

                {/* Mileage & Details Footer */}
                <div className="p-3 bg-white flex items-center justify-between text-xs">
                  <span className="px-2.5 py-1 bg-[#F2F5F7] rounded-lg text-slate-800 font-mono font-bold border border-slate-200">
                    🛣️ {t('garage.mileage')} {vehicle.mileage.toLocaleString()} km
                  </span>

                  {vehicle.registrationExpiry ? (
                    <span className="px-2.5 py-1 bg-[#0A4D56]/10 border border-[#0E7C86]/30 rounded-lg text-[#0A4D56] text-[11px] font-bold">
                      {language === 'ar' ? 'الملكية:' : 'Mulkiya:'}{' '}
                      {new Date(vehicle.registrationExpiry).toLocaleDateString()}
                    </span>
                  ) : (
                    <span className="text-[11px] text-[#0E7C86] font-bold flex items-center gap-1">
                      <span>عرض التفاصيل</span>
                      <span>←</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
