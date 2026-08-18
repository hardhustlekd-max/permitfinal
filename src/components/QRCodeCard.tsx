import React, { useState, useRef, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { MotorcycleRegistration, Language } from '../types';
import { SmartImage } from './SmartImage';

interface QRCodeCardProps {
  registration: Partial<MotorcycleRegistration>;
  lang: Language;
}

export const autoCapitalize = (str?: string): string => {
  if (!str) return '';
  return str
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

export const QRCodeCard: React.FC<QRCodeCardProps> = ({ registration, lang }) => {
  const isAmharic = lang === 'am';
  const [printError, setPrintError] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [standaloneFitScale, setStandaloneFitScale] = useState<number>(1);
  const [isInZoomable, setIsInZoomable] = useState<boolean>(false);

  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        if (containerRef.current.closest('[data-zoomable-container="true"]')) {
          setStandaloneFitScale(1);
          setIsInZoomable(true);
          return;
        }
        setIsInZoomable(false);
        const parentWidth = containerRef.current.parentElement?.clientWidth || window.innerWidth;
        const available = Math.min(parentWidth - 16, 580);
        if (available > 0 && available < 580) {
          setStandaloneFitScale(Number((available / 580).toFixed(3)));
        } else {
          setStandaloneFitScale(1);
        }
      }
    };
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  const regId = registration.id || '';
  const name = registration.fullName ? autoCapitalize(registration.fullName) : '—';
  const plate = registration.plateNumber || '—';
  const chassis = registration.engineOrSerialNo || (registration as any).chassisNo || (registration as any).chasisNo || 'N/A';

  // Format Motor Model as Brand + Model from DB
  const getMotorBrandAndModel = () => {
    const brand = (registration.motorBrand || '').trim();
    const model = (registration.motorModel || '').trim();
    if (brand && model) {
      if (model.toLowerCase().startsWith(brand.toLowerCase())) {
        return model.toUpperCase();
      }
      return `${brand} ${model}`.toUpperCase();
    }
    if (brand) return brand.toUpperCase();
    if (model) return model.toUpperCase();
    return '—';
  };
  const motorBrandAndModel = getMotorBrandAndModel();

  const phone = registration.phone || '—';

  // Format Subcity: If matches known Bahir Dar subcities, translate if needed, otherwise display raw subcity
  const formatSubCity = (rawSubCity?: string) => {
    if (!rawSubCity) return isAmharic ? 'በላይ ዘለቀ' : 'Belay Zeleke';
    
    const clean = rawSubCity.trim().toLowerCase();
    const bahirDarMap: Record<string, { en: string; am: string }> = {
      'belay zeleke': { en: 'Belay Zeleke', am: 'በላይ ዘለቀ' },
      'በላይ ዘለቀ': { en: 'Belay Zeleke', am: 'በላይ ዘለቀ' },
      'atse tewodros': { en: 'Atse Tewodros', am: 'አፄ ቴዎድሮስ' },
      'አፄ ቴዎድሮስ': { en: 'Atse Tewodros', am: 'አፄ ቴዎድሮስ' },
      'dagmawi minilik': { en: 'Dagmawi Minilik', am: 'ዳግማዊ ሚኒሊክ' },
      'ዳግማዊ ሚኒሊክ': { en: 'Dagmawi Minilik', am: 'ዳግማዊ ሚኒሊክ' },
      'fasilo': { en: 'Fasilo', am: 'ፋሲሎ' },
      'ፋሲሎ': { en: 'Fasilo', am: 'ፋሲሎ' },
      'hagre selam': { en: 'Hagre Selam', am: 'ሀገረ ሰላም' },
      'ሀገረ ሰላም': { en: 'Hagre Selam', am: 'ሀገረ ሰላም' },
      'shume abo': { en: 'Shume Abo', am: 'ሹሜ አቦ' },
      'ሹሜ አቦ': { en: 'Shume Abo', am: 'ሹሜ አቦ' },
      'tana': { en: 'Tana', am: 'ጣና' },
      'ጣና': { en: 'Tana', am: 'ጣና' },
      'gish abay': { en: 'Gish Abay', am: 'ግሽ ዓባይ' },
      'ግሽ ዓባይ': { en: 'Gish Abay', am: 'ግሽ ዓባይ' },
      'sefene selam': { en: 'Sefene Selam', am: 'ሰፈነ ሰላም' },
      'ሰፈነ ሰላም': { en: 'Sefene Selam', am: 'ሰፈነ ሰላም' },
    };

    if (bahirDarMap[clean]) {
      return isAmharic ? bahirDarMap[clean].am : bahirDarMap[clean].en;
    }

    const foundKey = Object.keys(bahirDarMap).find(k => clean.includes(k) || k.includes(clean));
    if (foundKey) {
      return isAmharic ? bahirDarMap[foundKey].am : bahirDarMap[foundKey].en;
    }

    return rawSubCity;
  };

  const subCity = formatSubCity(registration.subCity);
  const issueDate = registration.registrationDate || new Date().toISOString().split('T')[0];
  
  // Calculate dynamic 1-year expiry date from registration date
  const computeExpiryDate = () => {
    try {
      const regD = new Date(issueDate);
      if (!isNaN(regD.getTime())) {
        regD.setFullYear(regD.getFullYear() + 1);
        return regD.toISOString().split('T')[0];
      }
    } catch {}
    return '2027-08-17';
  };
  const expiryDate = computeExpiryDate();
  const portraitPhoto = registration.userPortraitPhoto || registration.nationalIdPhoto;

  // Vehicle Category formatted from DB
  const getCategoryDisplay = () => {
    if (!registration.vehicleCategory) {
      return isAmharic ? 'ኤሌክትሪክ' : 'Electric';
    }
    if (registration.vehicleCategory === 'electric') {
      return isAmharic ? 'ኤሌክትሪክ' : 'Electric';
    }
    if (registration.vehicleCategory === 'gas_under_110cc' || registration.vehicleCategory === 'gasoline') {
      return isAmharic ? 'ቤንዚን' : 'Gasoline';
    }
    return String(registration.vehicleCategory);
  };
  const categoryDisplay = getCategoryDisplay();

  const qrVal = registration.qrCodeData || `https://enforcement.gov.et/verify/${regId || plate}`;

  return (
    <div
      ref={containerRef}
      className={isInZoomable ? "shrink-0 flex flex-col items-center font-ethiopic py-1" : "w-full flex flex-col items-center font-ethiopic py-1 max-w-full overflow-hidden"}
    >
      <div
        style={{
          width: standaloneFitScale < 1 ? `${580 * standaloneFitScale}px` : '580px',
          height: standaloneFitScale < 1 ? `${(366 + 48) * standaloneFitScale}px` : 'auto',
        }}
        className="flex flex-col items-center gap-3 shrink-0 mx-auto relative origin-top"
      >
        <div
          style={{
            transform: standaloneFitScale < 1 ? `scale(${standaloneFitScale})` : 'none',
            transformOrigin: 'top center',
          }}
          className="flex flex-col items-center gap-3 w-[580px] shrink-0"
        >
        
        {/* Quick Print Action Button (only shown when standalone) */}
        {!isInZoomable && (
          <div className="no-print flex flex-col gap-2 w-[580px]">
            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={() => {
                  setPrintError(false);
                  document.body.setAttribute('data-print-target', 'id-card');
                  window.focus();
                  setTimeout(() => {
                    try {
                      window.print();
                    } catch (e: any) {
                      console.warn("Direct print call was blocked or failed:", e);
                      setPrintError(true);
                    } finally {
                      document.body.removeAttribute('data-print-target');
                    }
                  }, 100);
                }}
                className="bg-primary hover:bg-primary-hover text-white font-bold py-2 px-4 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              >
                <span className="material-symbols-outlined text-[18px]">print</span>
                <span>{isAmharic ? 'መታወቂያውን አትም (Print ID)' : 'Print ID Card'}</span>
              </button>
            </div>

            {printError && (
              <div className="bg-amber-50 dark:bg-amber-950/25 border border-amber-200 dark:border-amber-800/40 text-amber-900 dark:text-amber-200 p-3 rounded-xl text-xs w-full flex items-start gap-2.5 shadow-sm animate-fadeIn">
                <span className="material-symbols-outlined text-amber-500 shrink-0 text-[18px] mt-0.5">warning</span>
                <div>
                  <p className="font-bold mb-1">
                    {isAmharic ? 'የአታሚ ስህተት ማስታወቂያ (Sandbox Restricted)' : 'Browser Printing Restricted'}
                  </p>
                  <p className="leading-relaxed opacity-90">
                    {isAmharic 
                      ? 'ይህ አፕሊኬሽን በደህንነት ማእቀፍ (Sandbox) ውስጥ ስለሚገኝ በቀጥታ ማተም አይቻልም። ለማተም እባክዎ በቀኝ በኩል ከላይ ያለውን "በአዲስ ታብ ክፈት" (Open in New Tab) የሚለውን በተን ይጫኑ እና እዚያ ላይ ማተሚያውን ይጫኑ።'
                      : 'Because this preview is running inside a secure iframe sandbox, direct printing is blocked by your browser. Please click the "Open in New Tab" icon in the top-right corner of the application to print your card perfectly from a standalone window.'}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Exact Replica of Movement Permit ID Card - Width ~ 580px, Height ~ 366px (Standard PVC Ratio) */}
        <div id="pvc-card-container" className="printable-id-card w-[580px] h-[366px] bg-[#e4f2f7] rounded-xl shadow-2xl border border-sky-200 overflow-hidden text-slate-900 relative shrink-0 select-none font-ethiopic flex flex-col justify-between">
          
          {/* Background Decorative Waves & Fine Radial Arches */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
            {/* Upper Right Concentric Wave Arches */}
            <svg
              className="absolute -top-10 right-10 w-[480px] h-[200px] opacity-35"
              viewBox="0 0 480 200"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <ellipse cx="400" cy="20" rx="360" ry="140" stroke="#0284c7" strokeWidth="1" fill="none" strokeDasharray="3 3"/>
              <ellipse cx="400" cy="20" rx="330" ry="125" stroke="#38bdf8" strokeWidth="1" fill="none"/>
              <ellipse cx="400" cy="20" rx="300" ry="110" stroke="#0284c7" strokeWidth="1" fill="none"/>
              <ellipse cx="400" cy="20" rx="270" ry="95" stroke="#38bdf8" strokeWidth="1" fill="none" strokeDasharray="4 2"/>
              <ellipse cx="400" cy="20" rx="240" ry="80" stroke="#0284c7" strokeWidth="1" fill="none"/>
            </svg>
 
            {/* Bottom Right Layered Blue Fluid Waves */}
            <svg
              className="absolute right-0 bottom-0 w-[520px] h-[240px]"
              viewBox="0 0 520 240"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M-50 240 C100 190, 260 220, 390 140 C450 100, 490 50, 520 0 V240 H-50 Z"
                fill="#82d6f7"
                fillOpacity="0.55"
              />
              <path
                d="M30 240 C160 210, 290 180, 410 110 C470 70, 500 30, 520 0 V240 H30 Z"
                fill="#38bdf8"
                fillOpacity="0.65"
              />
              <path
                d="M120 240 C240 220, 340 170, 430 110 C480 75, 505 35, 520 10 V240 H120 Z"
                fill="#0284c7"
                fillOpacity="0.45"
              />
            </svg>
          </div>
 
          {/* Foreground Card Content */}
          <div className="relative z-10 p-3.5 pb-0 flex flex-col justify-between flex-1 overflow-hidden">
            
            {/* Header Section */}
            <div className="flex justify-between items-start mb-2">
              {/* Left Logo + Agency Title */}
              <div className="flex items-center gap-3">
                {/* TMA Logo Emblem */}
                <div className="w-12 h-12 rounded-full bg-white border-2 border-sky-400 shadow-sm flex items-center justify-center shrink-0 p-0.5">
                  <div className="w-full h-full rounded-full bg-[#0088cc] flex items-center justify-center relative overflow-hidden">
                    {/* Stylized Logo Icon */}
                    <svg className="w-8 h-8 text-white" viewBox="0 0 40 40" fill="none">
                      <circle cx="20" cy="20" r="18" fill="#0088cc" />
                      <path d="M12 28 C12 20, 18 12, 28 12 C24 18, 22 24, 22 28 Z" fill="#ffffff" />
                      <path d="M10 22 C14 14, 22 10, 28 8" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" />
                      <circle cx="28" cy="8" r="2.5" fill="#f59e0b" />
                    </svg>
                  </div>
                </div>

                <div className="leading-tight">
                  <h3 className="text-[14.5px] font-black text-slate-950 tracking-tight leading-snug">
                    የባህርዳር ሞተረኛች ኃ/የተ/የግ/ማህበር
                  </h3>
                </div>
              </div>

              {/* Right Permit Badge & Amharic Subtitle */}
              <div className="text-right flex flex-col items-end">
                <div className="bg-[#b777de] text-slate-950 font-black text-[13px] px-3.5 py-1 rounded-md tracking-wider uppercase inline-block shadow-xs border border-purple-300">
                  MOVEMENT PERMIT
                </div>
                <p className="text-[14px] font-black text-slate-950 mt-0.5 pr-0.5">
                  የመንቀሳቀሻ ፍቃድ
                </p>
                {/* Highlighted Permit ID Display */}
                <div id="pvc-card-id" className="mt-0.5 font-mono font-black text-[12px] text-purple-950 bg-purple-100/90 border border-purple-200/95 px-2 py-0.5 rounded-sm inline-block">
                  No: {regId}
                </div>
              </div>
            </div>

            {/* Main Content Grid: 3 Sections */}
            <div className="flex items-start justify-between gap-3 pt-0.5">
              
              {/* LEFT SECTION: Official Standard Digital ID Portrait Photo */}
              <div className="w-[82px] shrink-0 flex flex-col items-center">
                <div
                  id="pvc-card-portrait"
                  className="w-[80px] h-[105px] rounded-[6px] border-2 border-white ring-1 ring-sky-300 shadow-sm overflow-hidden bg-slate-100 flex items-center justify-center relative shrink-0"
                  title="Official ID Portrait Photo"
                >
                  <SmartImage
                    src={portraitPhoto}
                    alt="Portrait"
                    fallbackIcon="person"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* CENTER COLUMN: Plate, Chassis, Name, Subcity, Issued Date */}
              <div className="flex-1 space-y-1.5 min-w-0 pr-1">
                {/* Plate Number */}
                <div className="flex items-baseline justify-between gap-1">
                  <span className="text-[12.5px] font-black text-[#176e99]">የሰሌዳ ቁጥር</span>
                  <span id="pvc-card-plate" className="font-mono font-black text-[16px] text-slate-950 tracking-wider">
                    {plate}
                  </span>
                </div>

                {/* Chassis Number */}
                <div className="flex items-baseline justify-between gap-1">
                  <span className="text-[12.5px] font-black text-[#176e99]">የቻሲስ ቁጥር</span>
                  <span id="pvc-card-chassis" className="font-mono font-bold text-[12.5px] text-slate-950 truncate max-w-[140px]">
                    {chassis}
                  </span>
                </div>

                {/* Owner Name */}
                <div className="flex items-baseline justify-between gap-1">
                  <span className="text-[12.5px] font-black text-[#176e99]">የባለቤት ስም</span>
                  <span id="pvc-card-name" className="font-bold text-[12.5px] text-slate-950 truncate max-w-[140px]">
                    {name}
                  </span>
                </div>

                {/* Sub City - Fetched from DB (Defaults to በላይ ዘለቀ if not in Bahir Dar) */}
                <div className="flex items-baseline justify-between gap-1">
                  <span className="text-[12.5px] font-black text-[#176e99]">ክፍለ ከተማ</span>
                  <span id="pvc-card-subcity" className="font-bold text-[12.5px] text-slate-950">
                    {subCity}
                  </span>
                </div>

                {/* Issued Date */}
                <div className="flex items-baseline justify-between gap-1">
                  <span className="text-[12.5px] font-black text-[#176e99]">የተሰጠበት ቀን</span>
                  <span id="pvc-card-issuedate" className="font-bold text-[12.5px] text-slate-950 font-mono">
                    {issueDate}
                  </span>
                </div>
              </div>

              {/* RIGHT COLUMN: Motor Model, Phone, Category, Expiry Date, QR Code */}
              <div className="w-[220px] shrink-0 space-y-1.5 pl-1">
                {/* Motor Model (Brand + Model from DB) */}
                <div className="flex items-baseline justify-between gap-1">
                  <span className="text-[12.5px] font-black text-[#176e99]">የሞተር ሞዴል</span>
                  <span id="pvc-card-motormodel" className="font-bold text-[12.5px] text-slate-950 uppercase truncate max-w-[130px]">
                    {motorBrandAndModel}
                  </span>
                </div>

                {/* Owner Phone */}
                <div className="flex items-baseline justify-between gap-1">
                  <span className="text-[12.5px] font-black text-[#176e99]">የባለቤት ስልክ</span>
                  <span id="pvc-card-phone" className="font-mono font-bold text-[12.5px] text-slate-950">
                    {phone}
                  </span>
                </div>

                {/* Vehicle Category / የሞተር ሳይክሉ አይነት - Fetched from DB */}
                <div className="flex items-baseline justify-between gap-1">
                  <span className="text-[12.5px] font-black text-[#176e99]">የሞተር ሳይክሉ አይነት</span>
                  <span id="pvc-card-vehiclecategory" className="font-bold text-[12.5px] text-slate-950">
                    {categoryDisplay}
                  </span>
                </div>

                {/* Expiry Date (Highlighted Red Box) */}
                <div className="flex items-center justify-between gap-1 pt-0.5">
                  <span className="text-[12.5px] font-black text-[#176e99]">የሚያበቃበት ቀን</span>
                  <div id="pvc-card-expirydate" className="bg-[#ea0000] text-white px-2 py-0.5 rounded-[3px] font-black text-[12.5px] tracking-wider shadow-xs font-mono">
                    {expiryDate}
                  </div>
                </div>

                {/* QR Code Container */}
                <div className="flex items-center justify-end pt-0.5">
                  <div id="pvc-card-qrcode" className="bg-white p-1 rounded-lg border border-slate-300 shadow-xs shrink-0 flex items-center justify-center">
                    <QRCodeSVG value={qrVal} size={84} level="M" />
                  </div>
                </div>
              </div>
            </div>

            {/* Issuer Signature Row Positioned Above the Divider Line */}
            <div className="mt-1 flex items-center justify-between px-1 pb-0.5">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-black text-[#176e99]">የሰጪ ፊርማ:</span>
                <svg className="w-18 h-4 text-slate-950" viewBox="0 0 100 30" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M5 22 Q15 5 25 18 T45 12 T65 24 T85 10 T95 20" />
                  <path d="M15 25 C30 28, 50 15, 75 22" strokeWidth="1.5" />
                </svg>
              </div>
              <span className="text-[9.5px] font-bold text-slate-700 italic">
                {isAmharic ? 'ኦፊሴላዊ ማህተም እና ፊርማ' : 'Official Seal & Signature'}
              </span>
            </div>

            {/* Amharic Disclaimer Banner */}
            <div className="bg-[#50c3f5] text-slate-950 px-2.5 py-1 rounded-xs text-[9.5px] font-bold leading-tight text-justify border-t border-sky-400">
              <p>ይህንን የመንቀሳቀሻ ፍቃድ የያዘ ማንኛውም አካል ህጋዊነቱ የተጠበቀ ሲሆን ለተጨማሪ ማረጋገጫ በዚህ መታወቂያ ላይ የታተመውን ኪው አር ኮድ በማንበብ ያረጋግጡ።</p>
              <p className="mt-0.5">በንባብ ሂደት መረጃ የማያገኝ ከሆነ ወይም ካርዱ የታተመው መረጃ እና በኦንላይን የሚገኘው መረጃ መካከል ልዩነት ካለ ይህ ፍቃድ ህጋዊ አለመሆኑን እናረጋግጣለን።</p>
            </div>
          </div>

          {/* Solid Purple Bottom Edge Accent Bar */}
          <div className="h-2 bg-[#9a42be] w-full shrink-0" />
        </div>

        </div>
      </div>
    </div>
  );
};
