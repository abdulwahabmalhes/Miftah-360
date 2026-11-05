import React from 'react';
import { useI18n } from '../../context/i18n-context';

export type MobileTab = 'garage' | 'requests' | 'profile';

interface BottomNavigationProps {
  currentTab: MobileTab;
  onTabChange: (tab: MobileTab) => void;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({ currentTab, onTabChange }) => {
  const { t } = useI18n();

  const tabs: { id: MobileTab; labelKey: string; icon: string; isPlaceholder?: boolean }[] = [
    { id: 'garage', labelKey: 'nav.garage', icon: '🚗' },
    { id: 'requests', labelKey: 'nav.requests', icon: '📋', isPlaceholder: true },
    { id: 'profile', labelKey: 'nav.profile', icon: '👤' },
  ];

  return (
    <nav className="h-16 bg-white border-t border-slate-200 flex items-center justify-around px-2 shrink-0 shadow-lg">
      {tabs.map((tab) => {
        const active = currentTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition ${
              active ? 'text-amber-600 font-bold' : 'text-slate-400 hover:text-slate-600 font-medium'
            }`}
          >
            <span className="text-xl mb-0.5">{tab.icon}</span>
            <span className="text-[11px] leading-tight">{t(tab.labelKey)}</span>
          </button>
        );
      })}
    </nav>
  );
};

