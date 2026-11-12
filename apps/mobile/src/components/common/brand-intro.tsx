import React, { useEffect, useState } from 'react';

interface BrandIntroProps {
  onFinish?: () => void;
  onComplete?: () => void;
  autoCloseMs?: number;
  showSkip?: boolean;
  systemNameAr?: string;
  systemNameEn?: string;
}

export const BrandIntro: React.FC<BrandIntroProps> = ({
  onFinish,
  onComplete,
  autoCloseMs = 2800,
  showSkip = true,
  systemNameAr = 'تطبيق ملاك السيارات الذكي',
  systemNameEn = 'Smart Automotive Platform',
}) => {
  const [progress, setProgress] = useState(0);
  const [fadingOut, setFadingOut] = useState(false);

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.floor((elapsed / autoCloseMs) * 100));
      setProgress(pct);

      if (elapsed >= autoCloseMs) {
        clearInterval(interval);
        handleClose();
      }
    }, 40);

    return () => clearInterval(interval);
  }, [autoCloseMs]);

  const handleClose = () => {
    setFadingOut(true);
    setTimeout(() => {
      if (onFinish) onFinish();
      if (onComplete) onComplete();
    }, 400);
  };

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-between p-6 bg-[#061E23] text-white select-none transition-opacity duration-500 ${
        fadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{
        backgroundImage: `radial-gradient(circle at 50% 35%, rgba(14, 124, 134, 0.35) 0%, rgba(6, 30, 35, 0.95) 70%, #061E23 100%), url('/brand/splash-hero.jpg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundBlendMode: 'overlay',
      }}
    >
      {/* Top Bar with Brand Badge & Skip button */}
      <div className="w-full max-w-md flex items-center justify-between pt-2">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#4DD0E1] animate-ping"></span>
          <span className="text-[11px] font-bold text-[#4DD0E1] uppercase tracking-wider">
            MIFTAH 360 OS
          </span>
        </div>

        {showSkip && (
          <button
            onClick={handleClose}
            className="px-3.5 py-1.5 rounded-full bg-slate-900/60 hover:bg-[#0E7C86] text-white/90 hover:text-white text-xs font-bold border border-slate-700/60 transition backdrop-blur-md shadow-lg"
          >
            تخطي ➔
          </button>
        )}
      </div>

      {/* Center Cinematic Hero Area */}
      <div className="flex flex-col items-center text-center max-w-sm px-4 space-y-6">
        {/* Glowing Logo Frame */}
        <div className="relative group">
          <div className="absolute -inset-4 bg-gradient-to-r from-[#0A4D56] via-[#4DD0E1] to-[#0E7C86] rounded-3xl blur-xl opacity-60 group-hover:opacity-100 animate-pulse transition duration-1000"></div>
          <div className="relative w-32 h-32 rounded-3xl bg-slate-950/80 p-2 border border-[#4DD0E1]/50 shadow-2xl flex items-center justify-center overflow-hidden backdrop-blur-xl">
            <img
              src="/brand/logo.jpg"
              alt="Miftah 360 Logo"
              className="w-full h-full object-contain rounded-2xl transform transition-transform duration-700 group-hover:scale-105"
            />
          </div>
        </div>

        {/* Brand Names & Slogan */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-3xl font-black tracking-wider text-white">
              MIFTAH <span className="text-[#4DD0E1]">360</span>
            </h1>
          </div>
          <p className="text-xl font-black text-white/95">
            مـفـتـاح <span className="text-[#4DD0E1]">360</span>
          </p>

          <div className="pt-2 border-t border-white/10 space-y-1">
            <p className="text-xs font-bold tracking-[0.2em] text-[#4DD0E1] uppercase">
              YOUR CAR. A SMARTER WAY.
            </p>
            <p className="text-xs font-bold text-slate-300">
              سيارتك . بطريقة أذكى
            </p>
          </div>

          <p className="text-[11px] font-semibold text-slate-400 pt-1">
            {systemNameAr} • {systemNameEn}
          </p>
        </div>
      </div>

      {/* Bottom Progress Loading Bar */}
      <div className="w-full max-w-xs space-y-2.5 pb-4 text-center">
        <div className="w-full h-2 bg-slate-900/80 rounded-full overflow-hidden border border-slate-700/50 p-0.5 backdrop-blur-md">
          <div
            className="h-full bg-gradient-to-r from-[#0A4D56] via-[#0E7C86] to-[#4DD0E1] rounded-full transition-all duration-100 shadow-[0_0_12px_rgba(77,208,225,0.7)]"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono px-1">
          <span>جاري التحميل...</span>
          <span className="text-[#4DD0E1] font-bold">{progress}%</span>
        </div>
      </div>
    </div>
  );
};

