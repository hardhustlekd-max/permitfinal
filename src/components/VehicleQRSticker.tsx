import React, { useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { MotorcycleRegistration, Language } from '../types';

interface VehicleQRStickerProps {
  registration: Partial<MotorcycleRegistration>;
  lang: Language;
  onClose?: () => void;
  autoPrint?: boolean;
}

export const VehicleQRSticker: React.FC<VehicleQRStickerProps> = ({
  registration,
  lang,
  onClose,
  autoPrint = false,
}) => {
  const isAmharic = lang === 'am';

  const regId = registration.id || 'AA-2026-98414';
  const userRegNo = registration.id || registration.plateNumber || 'AA-2026-98414';
  const qrVal = registration.qrCodeData || `https://enforcement.gov.et/verify/${regId}`;

  // Format valid until date e.g. "30 JUN 2026" or derived from registration
  const expiryDateFormatted = '30 JUN 2026';

  const handlePrint = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    document.body.setAttribute('data-print-target', 'sticker');
    window.focus();

    const cleanup = () => {
      document.body.removeAttribute('data-print-target');
      window.removeEventListener('afterprint', cleanup);
    };

    window.addEventListener('afterprint', cleanup);

    setTimeout(() => {
      window.print();
      setTimeout(cleanup, 1200);
    }, 100);
  };

  useEffect(() => {
    if (autoPrint) {
      const timer = setTimeout(() => {
        handlePrint();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [autoPrint]);

  return (
    <div id="vehicle-qr-sticker-container" className="w-full font-sans flex flex-col items-center select-none py-2">
      {/* Sleek Modal Wrapper Card */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-3xl p-5 sm:p-6 shadow-2xl w-full max-w-[440px] space-y-4 relative overflow-hidden my-auto">
        
        {/* Top Header Bar (No-Print) */}
        <div className="no-print flex items-center justify-between border-b border-outline-variant/60 pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <span className="material-symbols-outlined text-[20px]">qr_code_2</span>
            </div>
            <div>
              <h3 className="font-bold text-sm text-on-surface leading-tight">
                {isAmharic ? 'የደህንነት QR ኮድ ተለጣፊ' : 'Official Security QR Sticker'}
              </h3>
              <p className="text-[11px] font-mono text-secondary font-medium">
                {isAmharic ? 'ተከታታይ ቁጥር፡' : 'Reg No:'} <span className="text-primary font-bold">{userRegNo}</span>
              </p>
            </div>
          </div>

          {onClose && (
            <button
              id="close-sticker-btn"
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-surface-container hover:bg-surface-container-high text-secondary hover:text-on-surface flex items-center justify-center cursor-pointer transition-colors"
              title={isAmharic ? 'ዝጋ' : 'Close'}
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          )}
        </div>

        {/* PRINTABLE STICKER CARD FRAME */}
        <div className="flex justify-center py-1">
          <div className="printable-sticker w-[380px] h-[380px] bg-[#e5e7eb] rounded-[32px] p-3.5 shadow-2xl relative overflow-hidden font-sans flex flex-col items-center justify-center ring-1 ring-black/10">
            
            {/* Outer Silver Security Pattern Border Background */}
            <div className="absolute inset-0 bg-[radial-gradient(#d1d5db_1px,transparent_1px)] [background-size:6px_6px] rounded-[32px] opacity-70 pointer-events-none" />

            {/* Main Navy Inner Frame Container */}
            <div className="relative z-10 w-full h-full bg-white rounded-[24px] border-[5px] border-[#133072] flex flex-col justify-between overflow-hidden shadow-inner">
              
              {/* Top Yellow Header Section */}
              <div className="bg-[#ffdd00] border-b-[3px] border-[#133072] px-3 py-2 flex items-center gap-2.5 text-black shrink-0">
                
                {/* System Seal Emblem */}
                <div className="w-13 h-13 rounded-full bg-white border-2 border-sky-400 flex items-center justify-center shrink-0 p-0.5 shadow-sm relative">
                  <div className="w-full h-full rounded-full bg-[#0088cc] flex items-center justify-center relative overflow-hidden">
                    <svg className="w-8 h-8 text-white" viewBox="0 0 40 40" fill="none">
                      <circle cx="20" cy="20" r="18" fill="#0088cc" />
                      <path d="M12 28 C12 20, 18 12, 28 12 C24 18, 22 24, 22 28 Z" fill="#ffffff" />
                      <path d="M10 22 C14 14, 22 10, 28 8" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" />
                      <circle cx="28" cy="8" r="2.5" fill="#f59e0b" />
                    </svg>
                  </div>
                </div>

                {/* Header System Title Text Block */}
                <div className="flex-1 text-center font-sans leading-none text-[#000000]">
                  <div className="text-[14px] font-black tracking-tight mb-1 font-sans">
                    Temporary Manegment system
                  </div>
                  <div className="text-[12px] font-extrabold tracking-tight text-black uppercase">
                    Movement Permit Sticker
                  </div>
                </div>
              </div>

              {/* Middle Area: Centered QR Code */}
              <div className="flex-1 bg-white flex flex-col items-center justify-center p-2 relative">
                <div className="bg-white p-2 rounded-lg">
                  <QRCodeSVG 
                    value={qrVal} 
                    size={175} 
                    level="H" 
                    includeMargin={false}
                  />
                </div>
              </div>

              {/* Bottom Area: Validity & Serial Number */}
              <div className="bg-white text-center pb-3 pt-1 relative shrink-0">
                
                {/* Validity Label */}
                <div className="text-[13px] font-extrabold tracking-wider text-slate-900 uppercase font-sans">
                  VALID UNTIL: {expiryDateFormatted}
                </div>

                {/* Registration Number Display */}
                <div className="text-[26px] font-black tracking-wider text-slate-950 font-mono leading-none mt-1">
                  {userRegNo}
                </div>

                {/* Bottom Corner Red Security Triangles */}
                {/* Left Bottom Corner Triangle */}
                <div 
                  className="absolute bottom-0 left-0 w-12 h-12 bg-[#dc2626] pointer-events-none z-10"
                  style={{ clipPath: 'polygon(0 100%, 0 0, 100% 100%)' }}
                />

                {/* Right Bottom Corner Triangle */}
                <div 
                  className="absolute bottom-0 right-0 w-12 h-12 bg-[#dc2626] pointer-events-none z-10"
                  style={{ clipPath: 'polygon(100% 100%, 100% 0, 0 100%)' }}
                />
              </div>

            </div>
          </div>
        </div>

        {/* Modal Action Footer Bar (No-Print) */}
        <div className="no-print flex items-center justify-between gap-3 pt-2 border-t border-outline-variant/60">
          <div className="text-[11px] font-semibold text-secondary flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{isAmharic ? 'የተረጋገጠ ኦፊሴላዊ ተለጣፊ' : 'Official Validated Sticker'}</span>
          </div>

          <div className="flex items-center gap-2">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-surface-container hover:bg-surface-container-high text-on-surface transition-colors cursor-pointer"
              >
                {isAmharic ? 'ዝጋ' : 'Close'}
              </button>
            )}

            <button
              id="print-sticker-btn"
              type="button"
              onClick={handlePrint}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-4 rounded-xl text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">print</span>
              <span>{isAmharic ? 'ስቲከሩን አትም' : 'Print Sticker'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

