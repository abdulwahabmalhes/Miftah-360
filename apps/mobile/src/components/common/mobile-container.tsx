import React, { useState } from 'react';
import { useI18n } from '../../context/i18n-context';

interface MobileContainerProps {
  children: React.ReactNode;
  headerTitle?: string;
  onBack?: () => void;
  showLanguageToggle?: boolean;
}

export const MobileContainer: React.FC<MobileContainerProps> = ({
  children,
  headerTitle,
  onBack,
  showLanguageToggle = true,
}) => {
  const { language, setLanguage, direction, t } = useI18n();
  const [isFullscreen, setIsFullscreen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-0 sm:p-4">
      {/* Floating Device Mode Switcher */}
      <div className="hidden sm:flex items-center gap-2 mb-3 bg-slate-900 border border-slate-800 p-1.5 rounded-2xl shadow-lg text-xs font-bold">
        <button
          onClick={() => setIsFullscreen(false)}
          className={`px-3 py-1 rounded-xl transition ${
            !isFullscreen ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
          }`}
        >
          📱 وضع إطار الهاتف (Mobile Shell)
        </button>
        <button
          onClick={() => setIsFullscreen(true)}
          className={`px-3 py-1 rounded-xl transition ${
            isFullscreen ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
          }`}
        >
          🖥️ وضع الشاشة المتجاوب (Responsive)
        </button>
      </div>

      {/* Device Shell simulating Android / iOS device or Fullscreen */}
      <div
        className={`w-full ${
          isFullscreen ? 'max-w-4xl h-screen sm:h-[880px] sm:rounded-3xl' : 'max-w-[430px] h-screen sm:h-[844px] sm:rounded-[42px]'
        } bg-slate-50 flex flex-col overflow-hidden shadow-2xl border-0 sm:border-8 sm:border-slate-800 transition-all duration-300 ${
          direction === 'rtl' ? 'rtl' : 'ltr'
        }`}
      >
        {/* Device Status Bar */}
        <div className="bg-slate-900 text-white px-6 pt-2 pb-1 text-[11px] font-semibold flex items-center justify-between shrink-0 select-none">
          <span>09:41</span>
          <div className="w-20 h-4 bg-slate-950 rounded-full mx-auto hidden sm:block"></div>
          <div className="flex items-center gap-1.5 font-mono">
            <span>5G</span>
            <span>100%</span>
          </div>
        </div>

        {/* Top App Header */}
        <div className="bg-white px-4 py-3 border-b border-slate-200 flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-2">
            {onBack && (
              <button
                onClick={onBack}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 hover:bg-slate-200 transition"
              >
                {direction === 'rtl' ? '→' : '←'}
              </button>
            )}
            <h1 className="text-base font-bold text-slate-900 truncate">
              {headerTitle || t('app.name')}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {showLanguageToggle && (
              <button
                onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
                className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
              >
                {language === 'ar' ? 'EN' : 'عربي'}
              </button>
            )}
          </div>
        </div>

        {/* Screen Content Scroll Area */}
        <div className="flex-1 overflow-y-auto flex flex-col">{children}</div>
      </div>
    </div>
  );
};
