import React, { useState } from 'react';
import { I18nProvider, useI18n } from './context/i18n-context';
import { AuthProvider, useAuth } from './context/auth-context';
import { MobileContainer } from './components/common/mobile-container';
import { BottomNavigation, MobileTab } from './components/common/bottom-navigation';
import { BrandIntro } from './components/common/brand-intro';
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

  // Brand Intro State
  const [showIntro, setShowIntro] = useState(() => {
    return !sessionStorage.getItem('miftah_mobile_intro_seen');
  });

  const handleFinishIntro = () => {
    sessionStorage.setItem('miftah_mobile_intro_seen', 'true');
    setShowIntro(false);
  };

  if (showIntro) {
    return (
      <BrandIntro
        onFinish={handleFinishIntro}
        systemNameAr="تطبيق ملاك السيارات الذكي"
        systemNameEn="Smart Automotive Platform"
      />
    );
  }

  if (isLoading) {
    return (
      <MobileContainer>
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin inline-block w-8 h-8 border-4 border-[#0E7C86] border-t-transparent rounded-full"></div>
        </div>
      </MobileContainer>
    );
  }

  if (!isAuthenticated) {
    return (
      <MobileContainer onReplayIntro={() => setShowIntro(true)}>
        <LoginScreen onReplayIntro={() => setShowIntro(true)} />
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
      onReplayIntro={() => setShowIntro(true)}
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
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-[#0E7C86]/10 flex items-center justify-center text-3xl border border-[#0E7C86]/20">
              🚗
            </div>
            <h3 className="text-base font-black text-[#2B2E34]">
              {language === 'ar' ? 'سوق خدمات مفتاح 360 الذكي' : 'Miftah 360 Smart Marketplace'}
            </h3>
            <p className="text-xs text-slate-500 max-w-[280px] leading-relaxed">
              {language === 'ar'
                ? 'استكشف الورش المعتمدة، طلب عروض الأسعار الذرية، وحجز مواعيد الصيانة بنقرة واحدة.'
                : 'Browse certified workshops, request atomic quotes, and book service appointments instantly.'}
            </p>
            <button
              onClick={() => setShowIntro(true)}
              className="px-4 py-2 bg-gradient-to-r from-[#0A4D56] to-[#0E7C86] text-white text-xs font-bold rounded-xl shadow-md"
            >
              ✨ مشاهدة هوية البراند ومقدمة التطبيق
            </button>
          </div>
        )}

        {screen.name === 'profile' && <ProfileScreen onReplayIntro={() => setShowIntro(true)} />}
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
