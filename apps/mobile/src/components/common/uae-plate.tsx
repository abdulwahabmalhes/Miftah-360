import React from 'react';

interface UaePlateProps {
  emirate?: string;
  plateCode?: string;
  plateNumber?: string;
}

export const UaePlateBadge: React.FC<UaePlateProps> = ({
  emirate = 'DUBAI',
  plateCode = '',
  plateNumber = '',
}) => {
  if (!plateNumber) {
    return (
      <span className="text-[10px] text-slate-400 italic bg-slate-100 px-2 py-0.5 rounded">
        بدون لوحة
      </span>
    );
  }

  const isDubai = emirate?.toUpperCase() === 'DUBAI';
  const isSharjah = emirate?.toUpperCase() === 'SHARJAH';

  return (
    <div
      dir="ltr"
      className="inline-flex items-stretch border-2 border-slate-900 rounded-lg overflow-hidden bg-white shadow-sm font-sans tracking-wider"
      style={{ minWidth: '100px', height: '34px' }}
    >
      {/* Emirate Banner */}
      <div
        className={`px-2 flex flex-col items-center justify-center text-[8px] font-black uppercase text-white ${
          isDubai ? 'bg-blue-800' : isSharjah ? 'bg-amber-600' : 'bg-slate-800'
        }`}
      >
        <span>{isDubai ? 'DUBAI' : isSharjah ? 'SHARJAH' : emirate}</span>
        <span className="text-[7px] opacity-90">{isDubai ? 'دبي' : isSharjah ? 'الشارقة' : ''}</span>
      </div>

      {/* Plate Code */}
      {plateCode && (
        <div className="px-2 flex items-center justify-center font-black text-slate-900 text-sm border-r-2 border-slate-300 bg-slate-50">
          {plateCode}
        </div>
      )}

      {/* Plate Number */}
      <div className="px-3 flex items-center justify-center font-black text-slate-950 text-base font-mono">
        {plateNumber}
      </div>
    </div>
  );
};

