import React, { useState } from 'react';
import { I18nProvider, useI18n } from './context/i18n-context';
import { AuthProvider, useAuth } from './context/auth-context';
import { MobileContainer } from './components/common/mobile-container';
import { BottomNavigation, MobileTab } from './components/common/bottom-navigation';
import { LoginScreen } from './screens/auth/login-screen';
import { GarageScreen } from './screens/garage/garage-screen';
import { AddVehicleScreen } from './screens/garage/add-vehicle-screen';
import { VehicleProfileScreen } from './screens/garage/vehicle-profile-screen';
import { ProfileScreen } from './screens/profile/profile-screen';
import { VehicleResponseDto } from '@miftah/contracts';

type ScreenState =
  | { name: 'garage' }
  | { name: 'add-vehicle' }
  | { name: 'vehicle-profile'; vehicle: VehicleResponseDto }
  | { name: 'requests' }
  | { name: 'profile' };

const MainContent: React.FC = () => {
  const { t, language } = useI18n();
  const { isAuthenticated, isLoading } = useAuth();
  const [screen, setScreen] = useState<ScreenState>({ name: 'garage' });
  const [refreshKey, setRefreshKey] = useState(0);

  if (isLoading) {
    return (
      <MobileContainer>
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin inline-block w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full"></div>
        </div>
      </MobileContainer>
    );
  }

  if (!isAuthenticated) {
    return (
      <MobileContainer>
        <LoginScreen />
      </MobileContainer>
    );
  }

  const currentTab: MobileTab =
    screen.name === 'requests'
      ? 'requests'
      : screen.name === 'profile'
      ? 'profile'
      : 'garage';

  const handleTabChange = (tab: MobileTab) => {
    if (tab === 'garage') setScreen({ name: 'garage' });
    else if (tab === 'requests') setScreen({ name: 'requests' });
    else if (tab === 'profile') setScreen({ name: 'profile' });
  };

  const getHeaderTitle = () => {
    switch (screen.name) {
      case 'garage':
        return t('garage.title');
      case 'add-vehicle':
        return t('vehicle.addTitle');
      case 'vehicle-profile':
        return `${screen.vehicle.brand} ${screen.vehicle.model}`;
      case 'requests':
        return t('nav.requests');
      case 'profile':
        return t('nav.profile');
    }
  };

  const getBackButtonAction = () => {
    if (screen.name === 'add-vehicle' || screen.name === 'vehicle-profile') {
      return () => setScreen({ name: 'garage' });
    }
    return undefined;
  };

  return (
    <MobileContainer
      headerTitle={getHeaderTitle()}
      onBack={getBackButtonAction()}
      showLanguageToggle={screen.name === 'garage'}
    >
      <div className="flex-1 flex flex-col overflow-y-auto">
        {screen.name === 'garage' && (
          <GarageScreen
            key={refreshKey}
            onAddVehicle={() => setScreen({ name: 'add-vehicle' })}
            onSelectVehicle={(vehicle) => setScreen({ name: 'vehicle-profile', vehicle })}
          />
        )}

        {screen.name === 'add-vehicle' && (
          <AddVehicleScreen
            onSuccess={() => {
              setRefreshKey((k) => k + 1);
              setScreen({ name: 'garage' });
            }}
            onCancel={() => setScreen({ name: 'garage' })}
          />
        )}

        {screen.name === 'vehicle-profile' && (
          <VehicleProfileScreen
            vehicle={screen.vehicle}
            onBack={() => setScreen({ name: 'garage' })}
            onRefresh={() => setRefreshKey((k) => k + 1)}
          />
        )}

        {screen.name === 'requests' && (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-3">
            <div className="text-4xl">🛠️</div>
            <h3 className="text-sm font-bold text-slate-800">
              {language === 'ar' ? 'طلبات الصيانة وسوق مفتاح 360' : 'Service Requests & Marketplace'}
            </h3>
            <p className="text-xs text-slate-400 max-w-[260px]">
              {language === 'ar'
                ? 'ميزة طلب عروض الأسعار وتصنيف الأعطال بالذكاء الاصطناعي والمطابقة ستتوفر في الموجة القادمة (Wave 3).'
                : 'Service requests, AI classification, and workshop matching will be activated in Wave 3.'}
            </p>
          </div>
        )}

        {screen.name === 'profile' && <ProfileScreen />}
      </div>

      <BottomNavigation currentTab={currentTab} onTabChange={handleTabChange} />
    </MobileContainer>
  );
};

export const App: React.FC = () => {
  return (
    <I18nProvider>
      <AuthProvider>
        <MainContent />
      </AuthProvider>
    </I18nProvider>
  );
};

export default App;

